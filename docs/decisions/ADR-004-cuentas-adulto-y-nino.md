# ADR-004: Coexistencia de dos tipos de cuenta — tutor adulto y niño con cuenta propia (Google/Family Link)

**Fecha:** 2026-08-04
**Estado:** Propuesto
**Decidido por:** Arquitecto (con consulta previa a Seguridad y a Abogado — sus veredictos e implicaciones se incorporan abajo)

> **Relación con ADR-003.** Este ADR **extiende** [`ADR-003`](./ADR-003-android-firebase.md);
> no lo contradice. El modelo "una cuenta = un tutor adulto, con perfiles de hijo"
> de ADR-003 **se conserva íntegro**. Aquí se **añade** un segundo tipo de cuenta —
> un niño que inicia sesión con su propia cuenta de Google (idealmente supervisada
> por Family Link) — que **coexiste** con el del tutor. Ambas rutas deben funcionar.
> Aterriza en el **Incremento 3** (Firestore + perfiles + reglas), aún sin empezar.

---

## Contexto

ADR-003 fijó un único modelo de cuenta: **el tutor adulto es la raíz**, se autentica
por email/contraseña, y crea uno o varios **perfiles de hijo** debajo (sin login
propio, con un **PIN local** que actúa de pestillo entre hermanos en el mismo
dispositivo). En sus alternativas, ADR-003 **descartó explícitamente** la "cuenta por
niño" (Alternativa 4: "los usuarios finales son niños de primaria sin email ni
capacidad legal para consentir").

El usuario ahora pide **admitir también** un segundo escenario, **sin sustituir** el
primero:

- **Cuenta de adulto** (la de ADR-003): gestiona uno o varios perfiles de hijo. Con
  más de un hijo, un selector "cambiar de niño" protegido por **PIN-pestillo**; tras
  elegir niño → elegir curso.
- **Cuenta de niño**: un niño **con su propia cuenta de Gmail**, idealmente
  **supervisada por los padres vía Family Link**, que inicia sesión él mismo con
  **Google Sign-In**. Es una **segunda identidad real de Firebase Auth**, no un perfil
  bajo el tutor. Aquí **no hay selector de niño ni PIN** (la cuenta ya es de ese niño):
  acceso directo a **elegir/cambiar de curso**.

Esto reabre —de forma acotada— la Alternativa 4 que ADR-003 rechazó. Lo que cambia el
cálculo respecto a entonces:

1. **Coexistencia, no reemplazo.** El modelo tutor+perfiles (donde reside el
   consentimiento y el control del adulto) sigue siendo el camino principal y el
   recomendado. La cuenta de niño es una vía adicional para el caso concreto de un
   niño que **ya tiene** una cuenta Google supervisada.
2. **Supervisión parental externa.** Family Link aporta una capa de control parental
   a nivel de cuenta Google/SO que en ADR-003 no existía. **No sustituye** el
   consentimiento que ESTA app necesita como responsable de tratamiento propio (ver
   §4), pero es una señal adicional relevante.

El principio rector de ADR-003 se mantiene y se **extiende explícitamente** al nuevo
caso: **minimizar PII al máximo** — si un dato no hace falta, no se guarda; de la
cuenta solo se persiste el `uid`.

**Guardián del diseño.** Por la regla del CLAUDE.md (Arquitecto ↔ Seguridad antes de
diseñar autenticación/autorización, y Abogado por tratar la autenticación de un
menor), este ADR incorpora la **consulta previa a Seguridad** (§7) y los **puntos
legales del Abogado** (§4 y §5). No se considera aceptado sin ellos, y **queda en
estado _Propuesto_ hasta que el usuario confirme el diseño**; Inc. 3 no lo implementa
antes de esa confirmación.

---

## Decisión

### 1. Cómo se distingue una cuenta de adulto de una de niño

**Decisión: un campo de rol explícito e inmutable en el documento de usuario, fijado
en el alta, con el proveedor de autenticación como verificación cruzada en las reglas
de seguridad (defensa en profundidad para esta fase).**

- El documento `users/{uid}` lleva `role: "tutor" | "kid"`, escrito **una sola vez en
  la creación** y **rechazado en toda actualización** por las reglas (inmutable, igual
  que `consentimiento` y `createdAt` en ADR-003 §3/§9).
- El **flujo de alta** decide el valor: la ruta **email/contraseña** crea `role:"tutor"`;
  la ruta **Google Sign-In** crea `role:"kid"`.
- **Verificación cruzada en reglas (defensa en profundidad):** Firestore expone el
  proveedor real y no falsificable en `request.auth.token.firebase.sign_in_provider`.
  Las reglas exigen la coherencia `role=="tutor" ⇔ provider=="password"` y
  `role=="kid" ⇔ provider=="google.com"` **en la creación**. Así, aunque un cliente
  manipulado intente crear un documento con el rol equivocado, la regla lo rechaza.

**Por qué un campo explícito y no derivar el rol del proveedor a secas** (que sería
más corto): el proveedor es un *método de autenticación*, no un *rol semántico*.
Acoplar permanentemente "rol = proveedor" ataría el modelo a esa equivalencia; el día
que se quisiera, por ejemplo, permitir a un adulto entrar con Google por comodidad, el
modelo se rompería y exigiría migración de datos. Con el rol como campo estable, la
app y las reglas ramifican sobre un valor semántico; la verificación cruzada con el
proveedor es una **restricción de esta fase** que puede relajarse en el futuro sin
tocar los datos. Es el punto de equilibrio entre lo más simple y lo más robusto:
**no añade Cloud Functions ni custom claims** (que serían la alternativa "de libro"
pero más pesada — ver Alternativas), y aun así el rol no es falsificable porque las
reglas lo anclan al proveedor.

> **Nota de seguridad importante (Seguridad).** El rol **solo determina la _forma_ del
> documento** (tutor con subcolección de hijos vs. niño con cursos directos), **no la
> _frontera_ de acceso**. La frontera sigue siendo, exactamente como en ADR-003:
> `request.auth.uid == uid` **y** `email_verified == true`. Un rol mal puesto nunca
> permitiría a nadie leer o escribir el árbol de otro `uid`. Esto acota el impacto de
> cualquier fallo en la distinción de tipo de cuenta.

### 2. Esquema de Firestore unificado para los dos propietarios

**Decisión: una única colección `users/{uid}` con el campo `role`; la _forma_ del
subárbol depende del rol. Se descarta partir en `tutors/` + `kids/`.**

```
users/{uid}                          ← raíz, uid = Firebase Auth uid
  role: "tutor" | "kid"              ← INMUTABLE, fijado en la creación (§1)
  locale: "en" | "es"
  consentimiento: { … }              ← INMUTABLE tras la creación (ADR-003 §9)
  createdAt: timestamp               ← INMUTABLE
  # NUNCA: email, displayName, photoURL, nombre real, fecha de nacimiento, PIN.

  ── si role == "tutor" (modelo ADR-003, intacto) ──
  displayName?: string               ← opcional, elegido por el tutor; NO el email
  childrenCount: number              ← contador transaccional (tope de hijos, ADR-003 §5)
  children/{childId}                 ← subcolección: perfiles de hijo
    mote, avatar, currentCourse, createdAt
    courses/{curso}                  ← CourseState (ADR-002) serializado

  ── si role == "kid" (nuevo) ──
  mote: string                       ← apodo de catálogo/validado (NO viene de Google)
  avatar: string                     ← id de avatar del catálogo cerrado (NO la foto de Google)
  currentCourse: "1".."6"
  courses/{curso}                    ← CourseState (ADR-002) serializado, MISMA forma que arriba
```

Claves del diseño:

- **El documento hoja `courses/{curso}` es idéntico** viva donde viva: bajo
  `users/{uid}/children/{childId}/courses/{curso}` (hijo del tutor) o bajo
  `users/{uid}/courses/{curso}` (niño-raíz). Es el `CourseState` de ADR-002 serializado
  tal cual. **La capa de acceso a datos y el mapeo Firestore↔CourseState se reutilizan;
  solo cambia la ruta del padre.** No hay rediseño de dominio (requisito cumplido).
- **La cuenta de niño funde "documento de cuenta" + "un perfil de hijo" en un solo
  documento raíz**, porque para un niño-raíz no hay separación entre dueño de la cuenta
  y perfil: él es ambos. Por eso `mote`/`avatar`/`currentCourse` viven en su
  `users/{uid}`, donde para el tutor vivirían en `children/{childId}`.
- **Continuidad con ADR-003.** El documento del tutor **no cambia**: sigue siendo el de
  ADR-003 §3 (se le añade únicamente el campo `role:"tutor"`, que documenta lo que ya
  era implícito). Se **añade** la variante `kid` de la misma colección; no se renombra
  ni se migra nada de lo ya diseñado en Inc. 2.

**Por qué no `tutors/` + `kids/` separadas:** bifurcaría reglas y capa de datos en dos
árboles casi idénticos (ambos terminan en `courses/{curso}` con el mismo `CourseState`),
rompería la continuidad con `users/{uid}` de ADR-003, y no aporta aislamiento adicional
—el aislamiento ya lo da el `uid`—. Una sola colección con rol es más simple de razonar,
de reglar y de mantener.

**Reglas de seguridad (líneas maestras, sobre las de ADR-003 §3):**

- Frontera intacta: acceso a `users/{uid}` y todo su subárbol **solo** si
  `request.auth.uid == uid && request.auth.token.email_verified == true`. (En Google
  Sign-In, `email_verified` es `true` por construcción para cuentas Google.)
- `role`, `consentimiento` y `createdAt` **inmutables**; **allowlist de campos** por
  documento (se rechazan campos desconocidos) — se extiende la allowlist de ADR-003 §9
  a la forma `kid`.
- **Ramificación por rol:** bajo un `users/{uid}` con `role=="tutor"` se permite la
  subcolección `children/{childId}/courses/{curso}` y **se prohíbe** `courses/{curso}`
  directo en la raíz; con `role=="kid"` se permite `courses/{curso}` directo y **se
  prohíbe** la subcolección `children`. Así ninguna cuenta adopta la forma de la otra.
- **Prohibición de PII reforzada** para la forma `kid`: las reglas rechazan la escritura
  de `email`, `displayName`, `photoURL`, nombre o fecha de nacimiento (igual que ya
  rechazan el email del tutor y el PIN en ADR-003 §3).
- El tope de hijos (`childrenCount`, ADR-003 §5) **solo aplica a `role=="tutor"`**; una
  cuenta `kid` no tiene hijos ni contador.

### 3. Minimización de datos de Google Sign-In

**Decisión: de la cuenta de niño se persiste en Firestore únicamente el `uid` (que es
el ID del documento, ni siquiera un campo). Todo lo demás que devuelve Google se
descarta.**

Google Sign-In entrega en el perfil, típicamente: **`email`, `displayName`, `photoURL`**
(y el `uid`). De todo eso:

- **`uid`** → es el identificador del documento `users/{uid}`. Se usa; no es PII por sí
  solo.
- **`email`** → **NO se persiste** en Firestore. Mismo principio que el email del tutor
  en ADR-003 §3: si algún día se necesitara, se lee de `request.auth.token.email`, nunca
  se copia a Firestore ni a su caché offline.
- **`displayName`** → **NO se persiste.** El nombre para mostrar del niño es su **`mote`**
  elegido de un **catálogo cerrado / validado** (sin texto libre identificante), igual
  que el `mote` de los perfiles de hijo bajo cuenta de adulto (ADR-003 §9).
- **`photoURL`** → **NO se persiste.** El avatar es un **`avatar` de catálogo cerrado**
  (id local), nunca la foto real de la cuenta de Google.

En el cliente, tras Google Sign-In, **no se escribe el objeto de perfil de Google en
ningún sitio**: solo se toma el `uid`. El `mote`/`avatar` se piden en un alta mínima
(catálogo cerrado), como para los perfiles de hijo.

> **Límite honesto (para Abogado, §4).** Firebase Auth **sí** guarda internamente el
> perfil del proveedor (email, nombre, foto de Google) en el registro de usuario de
> Auth — igual que guarda el email del tutor. Esto **no** lo evita la minimización en
> Firestore: es la misma situación que el "punto legal abierto de residencia de datos
> de Auth" de ADR-003, **ahora aplicada a datos de un menor** (su email/nombre/foto de
> Google residen en la infraestructura global de Auth). Se traslada al Abogado como
> extensión de ese punto abierto.

### 4. Consentimiento — requisito legal (Abogado), pendiente de especificar en UI

**Problema.** Family Link resuelve la supervisión a nivel de cuenta Google/SO, pero
**no sustituye el consentimiento que ESTA app necesita** como responsable de tratamiento
**distinto de Google** bajo el RGPD. Si el niño inicia sesión él mismo, hay que capturar
igualmente el consentimiento del adulto responsable para el tratamiento del progreso que
hace esta app.

**Decisión (requisito, no flujo de UI cerrado).** La primera vez que una cuenta de niño
toca la app —**antes de cualquier escritura en la nube**— se exige un **paso único
"pásaselo a un adulto"**, análogo a la **puerta parental** de ADR-003 §4:

1. Un **reto de adulto** (la operación aritmética simple de ADR-003 §4, que un niño de
   primaria no resuelve de memoria) abre el acceso al texto de consentimiento.
2. El adulto lee el consentimiento en lenguaje claro (**mismo contenido** que el del
   tutor: qué se guarda —progreso sin PII—, qué no, enlace a la política de privacidad)
   y lo acepta.
3. Se registra `consentimiento: { version, acceptedAt }` (INMUTABLE) en `users/{uid}`,
   con el **mismo mecanismo y las mismas reglas** que el consentimiento del tutor
   (ADR-003 §9).
4. **Hasta que el consentimiento esté registrado, la cuenta de niño opera solo en local**
   (sin escrituras en Firestore), exactamente como el tutor antes de consentir
   (spec 07, US-B2: "la app sigue usable en local").

**Puntos que el Abogado marca como pendientes de su gate y de revisión legal humana:**

- **RGPD Art. 8 + LOPDGDD.** El consentimiento parental es exigible por debajo del umbral
  de edad (16 en la línea base del RGPD; **España lo fija en 14** vía LOPDGDD). Una cuenta
  de niño que se autentica sola es precisamente el caso delicado: **no podemos verificar
  con certeza que quien pasa el reto de adulto es realmente el progenitor**. El reto de
  adulto es una **medida de esfuerzo razonable**, no una verificación fuerte. La
  supervisión de Family Link es una **señal adicional** (la cuenta Google está bajo
  control parental), **no una base jurídica por sí sola** para el tratamiento de esta app.
- **Aseguramiento de edad (age assurance).** La app no conoce la edad del niño; el
  adult-gate + consentimiento es la mitigación. El Abogado debe valorar si basta para el
  perfil de riesgo (datos de progreso, sin PII directa).
- **Continuidad.** El consentimiento cubre el mismo tratamiento descrito para el tutor y
  enlaza a la misma política de privacidad ya entregada en Inc. 6.

> El **flujo de UI concreto** (pantallas, textos exactos) se especifica más adelante
> (Inc. 3 o posterior), **no es parte de esta tarea de diseño**. Aquí queda como
> **requisito documentado**.

### 5. Cumplimiento de Google Play Families Policy (Abogado + DevOps)

Permitir "Iniciar sesión con Google" a cuentas supervisadas por Family Link convierte a
la app, sin ambigüedad, en una app **dirigida a menores**, sujeta a la **Play Families
Policy** de Google. Implicaciones que el Abogado señala como **requisitos previos a la
publicación en Play**:

- **Declaración de público objetivo / "Designed for Families".** En Play Console habrá
  que declarar que el público incluye a menores y, muy probablemente, **inscribirse en el
  programa "Designed for Families"**, con **revisión adicional** de Google.
- **Restricciones de SDKs, publicidad y datos.** Solo SDKs autocertificados para
  familias; publicidad nula o family-safe; prácticas de datos conformes con Families.
  **Ventaja del proyecto:** la app **ya no usa publicidad ni tracking de terceros**
  (ADR-001, reafirmado en el pivote: solo Firebase Auth/Firestore, **sin Analytics ni
  AdMob**). Eso hace el cumplimiento **notablemente más simple** que el de una app
  monetizada, pero **debe verificarse y declararse explícitamente**, no darse por hecho.
- **Coherencia con lo ya entregado en Inc. 6:** política de privacidad publicada en URL
  pública, formulario **Data Safety** de Play, y la **revisión legal humana** ya listada
  en `.claude/pending-actions.md` — el tratamiento de datos de menores autenticándose
  directamente **refuerza** la necesidad de esa revisión humana.

> **Riesgo técnico a validar (DevOps/Arquitectura), no solo legal.** Debe confirmarse
> que una cuenta de niño **supervisada por Family Link puede completar Google Sign-In
> hacia una app de terceros** sin bloqueos ni pasos de aprobación parental adicionales
> que rompan el flujo. Si Google exige que la app esté aprobada en el programa de
> familias **antes** de permitir el sign-in de cuentas supervisadas, entonces la
> inscripción en Families deja de ser un paso "de publicación" y pasa a ser
> **prerrequisito de la propia funcionalidad** de cuenta de niño. Este supuesto **no es
> verificable desde el entorno de desarrollo** y se registra como acción pendiente.

### 6. PIN — solo en la cuenta de adulto con varios hijos

**Decisión (confirmación explícita).** El **PIN local (pestillo)** de ADR-003 §4 aplica
**únicamente** al escenario de **cuenta de adulto con más de un hijo**, para que un
hermano no abra el perfil de otro en el mismo dispositivo. En el escenario de **cuenta
de niño no hay PIN**: la cuenta ya es de ese niño, no hay nada que "pestillar"; el flujo
va directo a **elegir/cambiar de curso**. El PIN sigue siendo, como en ADR-003, control
de acceso **local** (Capacitor Preferences / secure storage), **nunca en Firestore**.

### 7. Consulta previa a Seguridad — veredicto incorporado

Consulta previa a Seguridad (coordinación Arquitecto ↔ Seguridad del CLAUDE.md).
**Veredicto: ⚠️ Condicionado**, con las condiciones **ya incorporadas** en las secciones
anteriores:

- **(Crítica) La frontera de acceso no cambia con el rol.** El rol determina forma, no
  alcance; la frontera sigue siendo `uid` + `email_verified` (§1, §2). ✔ Incorporado.
- **(Crítica) `role` inmutable y anclado al proveedor en las reglas** para que no se
  pueda crear una cuenta con forma cruzada (§1). ✔ Incorporado.
- **(Crítica) Prohibición de PII en la forma `kid`** en las reglas: se rechazan `email`,
  `displayName`, `photoURL`, nombre, fecha de nacimiento (§2, §3), igual que se rechaza
  el email del tutor y el PIN en ADR-003. ✔ Incorporado.
- **(Alta) Sin escrituras en la nube antes del consentimiento** también para la cuenta de
  niño (§4). ✔ Incorporado como requisito.
- **(Alta) Google Sign-In hereda el endurecimiento de ADR-003 §7/§8:** App Check en la
  ruta de Google, dominios autorizados de los action links, y **la restricción de la API
  key por app Android + SHA-256** cubre también el flujo de Google Sign-In. ✔ Se aplican
  las mismas condiciones de ADR-003; el añadir un proveedor no relaja ninguna.
- **(Media) Tests de reglas en el emulador** que cubran, además de los de ADR-003, los
  casos nuevos: acceso cruzado entre una cuenta `kid` y una `tutor` (denegado), intento de
  crear forma cruzada (denegado), intento de escribir PII de Google en la forma `kid`
  (denegado). Queda como requisito de Inc. 3.

Seguridad **no bloquea** el diseño; sus condiciones críticas están resueltas y las altas
son requisitos explícitos de la implementación de Inc. 3.

---

## Consecuencias

**Positivas:**

- **Dos vías de entrada sin duplicar dominio.** Una sola colección `users/{uid}` y un
  único `CourseState` sirven a ambos tipos de cuenta; la app y las reglas ramifican por
  un campo de rol, no por dos árboles paralelos.
- **Continuidad total con ADR-003.** El modelo tutor+perfiles queda intacto; la cuenta de
  niño se añade encima sin migrar nada de Inc. 2.
- **PII minimizada también para el niño.** En Firestore solo vive el `uid` + `mote`/`avatar`
  de catálogo cerrado; email, nombre y foto de Google se descartan.
- **Aprovecha la supervisión de Family Link** como capa parental adicional para el caso de
  niños que ya tienen cuenta Google gestionada por sus padres.

**Negativas / trade-offs:**

- **Reintroduce —acotada— una alternativa que ADR-003 descartó.** Añade superficie de
  producto y de cumplimiento (un segundo proveedor de Auth, un segundo camino de
  consentimiento, la Play Families Policy) frente al modelo único, más simple, de ADR-003.
- **El consentimiento del niño-cuenta es intrínsecamente más débil de verificar** que el
  del tutor: no podemos garantizar que quien pasa el adult-gate es el progenitor. Es una
  medida de esfuerzo razonable, no una verificación fuerte.
- **Añade dependencia del programa de familias de Google Play** y de que Google permita el
  sign-in de cuentas supervisadas a una app de terceros — un supuesto externo no
  controlable desde el proyecto.

**Riesgos:**

- **Bloqueo funcional externo (§5):** si Google exige inscripción en Families **antes** de
  permitir Google Sign-In de cuentas supervisadas, la cuenta de niño no funciona hasta
  resolver un trámite de publicación. Mitigación: validarlo pronto; la vía del tutor
  funciona sin depender de esto.
- **PII de menor en Auth (§3):** email/nombre/foto de Google del niño residen en la
  infraestructura global de Firebase Auth. Extiende a datos de menor el punto abierto de
  residencia de datos de Auth de ADR-003. Mitigación: nada en Firestore; el Abogado
  confirma DPA/SCCs/DPF y la base de licitud (mismo circuito que ADR-003 + Inc. 6).
- **Confusión de rol en el alta:** un adulto que por error entrase con Google quedaría
  como cuenta de niño (sin perfiles de hijo). Mitigación: la UI del alta debe separar
  claramente las dos rutas (a especificar en Inc. 3); el ancla rol⇔proveedor evita
  formas de documento inconsistentes, pero no evita que un humano elija la ruta
  equivocada.

## Puntos que salen de este ADR (no los resuelve el Arquitecto)

- **Abogado (gate + revisión humana):** suficiencia del adult-gate como consentimiento
  parental bajo RGPD Art. 8 / LOPDGDD (umbral de 14 en España) para una cuenta de niño
  autoautenticada; PII de menor en Firebase Auth; Play Families Policy y Data Safety. Se
  integran en el gate legal de Inc. 3 y refuerzan la revisión legal humana ya pendiente
  (Inc. 6, `pending-actions.md`).
- **DevOps/Abogado (pre-publicación):** inscripción en "Designed for Families",
  verificación de que Google Sign-In funciona para cuentas supervisadas de Family Link, y
  declaración de público objetivo en Play Console. Registrado en `.claude/pending-actions.md`.
- **UI del consentimiento del niño-cuenta:** flujo concreto de pantallas y textos —
  Analista Funcional / UX-UI en Inc. 3 o posterior.

## Alternativas consideradas

### Alternativa 1 — Derivar el rol directamente del proveedor, sin campo explícito
Leer el tipo de cuenta en cada punto desde `sign_in_provider` (Google = niño,
password = adulto), sin guardar `role`. **Por qué se descarta:** ata el modelo de forma
permanente a "proveedor = rol". El día que se quisiera otra combinación (p. ej. un adulto
que entra con Google) obligaría a migrar datos y reescribir reglas. El campo `role`
explícito e inmutable da un ancla semántica estable; el proveedor se usa solo como
verificación cruzada de esta fase, relajable después sin tocar datos.

### Alternativa 2 — Rol en un custom claim fijado por Cloud Function en el alta
Poner el rol en el token (custom claim) vía Admin SDK. **Por qué se descarta (por ahora):**
es la opción "de libro" para roles no falsificables, pero exige una Cloud Function en el
alta y gestión de propagación/refresh del claim — más piezas que mantener. El objetivo de
robustez ya se logra con `role` inmutable + verificación cruzada contra el proveedor en las
reglas, **sin** Cloud Function. Si en el futuro aparecen más roles o lógica de servidor en
el alta, migrar a custom claims es un cambio acotado.

### Alternativa 3 — Colecciones separadas `tutors/{uid}` y `kids/{uid}`
**Por qué se descarta:** bifurca reglas y capa de datos en dos árboles casi idénticos que
terminan ambos en `courses/{curso}` con el mismo `CourseState`, rompe la continuidad con
`users/{uid}` de ADR-003 y no aporta aislamiento adicional (el `uid` ya aísla). Una sola
colección con `role` es más simple de reglar y mantener.

### Alternativa 4 — No admitir cuenta de niño; mantener solo el modelo tutor+perfiles
Es lo que decidió ADR-003. **Por qué no se elige aquí:** el usuario pide explícitamente la
coexistencia para el caso de niños que **ya tienen** cuenta Google supervisada por Family
Link. Se conserva el modelo del tutor como principal y se **añade** —no se reemplaza— la
vía del niño, asumiendo su coste de cumplimiento a cambio de esa cobertura.

### Alternativa 5 — Guardar el perfil de Google (email/nombre/foto) del niño en Firestore
**Por qué se descarta:** metería PII de un menor en Firestore y en su caché offline, justo
lo contrario del principio rector. Solo se persiste el `uid`; `mote`/`avatar` salen de
catálogo cerrado (§3).

---
<!-- Copiar este archivo como docs/decisions/ADR-NNN-titulo-en-kebab-case.md -->
<!-- Nunca reutilizar un número, aunque el ADR se deprece -->
