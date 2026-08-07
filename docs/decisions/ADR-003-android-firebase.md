# ADR-003: Empaquetado Android (Capacitor) + backend en la nube (Firebase Auth + Firestore)

**Fecha:** 2026-08-03
**Estado:** Aceptado
**Decidido por:** Arquitecto (con consulta previa a Seguridad — veredicto ⚠️ Condicionado incorporado)

---

## Contexto

"Repasos de Primaria" deja de ser una web con URL pública para convertirse en una
**aplicación instalable en Android** (posible iOS después), con **cuenta del tutor**
y **guardado del progreso en la nube**. Este cambio invalida dos premisas del ADR-001
("sin backend, sin login" y "nada sale del dispositivo") y desplaza el canal de
distribución de GitHub Pages a Google Play. El modelo multi-curso del ADR-002
(`courses[curso] → CourseState`, serializable y plano) se diseñó para no estorbar
esta migración; aquí se materializa.

El usuario ha decidido la **Opción A — "todo de una vez"**: no se hace por fases, sino
que este trabajo entrega el conjunto completo:

- **Empaquetado nativo Android** sobre el frontend web existente (Vite + React + TS).
- **Autenticación del tutor** por email/contraseña con **verificación de email
  obligatoria**.
- **Base de datos en la nube** con **residencia europea** y funcionamiento
  **offline-first**.
- **Migración del progreso local existente** (`localStorage` v2 del ADR-002) a la
  cuenta del tutor la primera vez que inicia sesión.
- **CI que genera APK en cada PR** (debug firmado con un keystore de desarrollo
  fijo y versionado, credenciales públicas estándar de Android — huella SHA
  estable para Google Sign-In) y **release firmado sólo en `main`/tag** vía Play
  App Signing.
- **Corrección del copy legal** sobre privacidad en el mismo cambio (el README y los
  textos que aún afirman "nada sale del dispositivo" dejan de ser ciertos).
- **DPIA (Evaluación de Impacto de Protección de Datos)** como entregable, dado que
  se tratan datos de menores.

Modelo de cuenta acordado: **una cuenta = un tutor adulto**; el tutor crea uno o
varios **perfiles de hijo** bajo su cuenta. El niño no tiene cuenta propia ni email.

**Guardián del diseño — consulta previa a Seguridad.** Antes de cerrar este ADR se
consultó a Seguridad (coordinación Arquitecto ↔ Seguridad del CLAUDE.md, previa al
diseño de autenticación/autorización). Su veredicto fue **⚠️ Condicionado**. Las
condiciones **críticas** están resueltas dentro de este diseño (secciones 3, 4 y 5);
las **altas** quedan como requisitos explícitos de la fase de implementación
(sección 8); las **medias** como notas de implementación (sección 9). Este ADR no se
considera aceptado sin ellas.

## Decisión

### 1. Empaquetado: **Capacitor** sobre el frontend web actual

Adoptaremos **Capacitor** para empaquetar la app web existente como aplicación
Android nativa, **reutilizando el frontend Vite + React + TS sin reescribirlo**. Los
assets se sirven **localmente desde el propio APK** (bundle empaquetado), nunca desde
una URL remota.

- La lógica de quiz, i18n, catálogo y la vista imprimible se conservan tal cual.
- Capacitor Preferences (almacenamiento seguro del dispositivo) sustituye/complementa
  a `localStorage` para lo que debe quedarse en el dispositivo (ver §4, PIN local).
- No se usa `server.url` remoto (ver §7, endurecimiento de WebView).

### 2. Autenticación: **Firebase Authentication** (email/contraseña del tutor)

Adoptaremos **Firebase Auth** con proveedor **email/contraseña** para la cuenta del
**tutor adulto**. El niño **no** se autentica: opera dentro de la sesión del tutor a
través de un perfil de hijo.

- **Verificación de email obligatoria.** Tras el registro se envía el correo de
  verificación; hasta que `email_verified == true`, la cuenta **no puede escribir en
  Firestore** (se refuerza en las reglas de seguridad, §3). Tras verificar, se fuerza
  un **refresh del ID token** para que el claim `email_verified` se propague sin
  reinstalar sesión.
- **Protección de enumeración de cuentas (condición crítica de Seguridad):** se
  **activa el flag "Email Enumeration Protection"** de Firebase Auth. Los flujos de
  **login, registro y recuperación de contraseña devuelven errores genéricos** (no
  distinguen "email no existe" de "contraseña incorrecta"), de modo que no se pueda
  inferir qué correos están registrados.
- **Dominios autorizados** de los action links (verificación, reset) restringidos a
  los dominios propios del proyecto en la consola de Firebase.

### 3. Datos: **Cloud Firestore** (región europea, offline-first) — esquema corregido

Adoptaremos **Cloud Firestore** con la instancia en **región europea**
(`eur3`/`europe-west*`, la que ofrezca multi-región EU) y **persistencia offline
habilitada** (offline-first: el niño juega sin conexión y sincroniza al reconectar).

**Principio rector (condición crítica de Seguridad): minimizar PII en Firestore y en
su caché offline.** El email del tutor y el PIN del hijo **no** viven en Firestore
(ver justificación en §4). El esquema queda así:

```
users/{uid}                         ← documento del tutor (uid = Firebase Auth uid)
  displayName?: string              ← opcional, elegido por el tutor; NO se usa el email
  locale: "en" | "es"
  childrenCount: number             ← contador transaccional (tope de hijos, §5)
  consentimiento: { … }             ← INMUTABLE tras la creación (§9)
  createdAt: timestamp              ← INMUTABLE
  # NO existe campo `email`: la identidad del tutor se deriva de
  #   request.auth.token.email / request.auth.token.email_verified (Firebase Auth).
  #   Fuente de verdad única = Firebase Auth, no duplicada en Firestore ni en su caché.

  children/{childId}                ← subcolección: perfiles de hijo
    mote: string                    ← apodo del niño (validado, §9). NO es dato identificativo del adulto
    avatar: string                  ← id de avatar del catálogo local
    currentCourse: "1".."6"
    createdAt: timestamp
    # NO existe `pinHash`: el PIN es control de acceso LOCAL del dispositivo (§4),
    #   fuera de Firestore por completo.

    courses/{curso}                 ← subcolección: un documento por curso "1".."6"
      # CourseState del ADR-002, serializado tal cual:
      streak, stars, medals, dailyMission, progress, profile…
```

**Fuente de verdad única del email del tutor (resuelve la contradicción detectada por
Seguridad):** el email **sólo** existe en Firebase Auth. En las reglas y en la app se
usa `request.auth.token.email`; **no se copia** a `users/{uid}`. Así el email no entra
en Firestore ni en la caché offline sin cifrar del dispositivo, y hay un único lugar
donde reside y se actualiza.

**Reglas de seguridad Firestore (líneas maestras):**

- Acceso a `users/{uid}` y toda su subárbol **sólo** si
  `request.auth != null && request.auth.uid == uid && request.auth.token.email_verified == true`.
- Un tutor **no** puede leer ni escribir el árbol de otro `uid`.
- `consentimiento` y `createdAt` son **inmutables** tras la creación; se **rechazan
  campos desconocidos** en cada documento (allowlist de campos) — ver §9.
- Las reglas **no pueden contar** documentos de subcolección; el tope de hijos se
  resuelve con el contador transaccional de §5.

### 4. PIN del hijo y email del tutor: **fuera de Firestore, control local**

Resuelve las dos contradicciones críticas señaladas por Seguridad:

- **PIN del hijo → almacenamiento seguro LOCAL del dispositivo** (Capacitor
  Preferences / secure storage), **nunca** en Firestore. El PIN sólo evita que un
  hermano abra el perfil equivocado en ese dispositivo; es control de acceso local,
  no una credencial de servidor. No aparece en el esquema de datos de la nube.
- **Email del tutor → sólo Firebase Auth** (§3). No se duplica en el documento
  Firestore del tutor.
- **"Puerta parental" (condición crítica):** el PIN del niño **no** es suficiente para
  acciones sensibles. Toda **acción destructiva o de cuenta** — borrar un hijo, borrar
  progreso, cambiar email o contraseña, entrar en ajustes de cuenta — exige un
  **gate del adulto**: **re-autenticación** de Firebase (`reauthenticateWithCredential`)
  para las operaciones de cuenta/credenciales, y como mínimo un **reto de adulto**
  (p. ej. una operación aritmética simple que un niño de primaria no resuelve de
  memoria) para las destructivas locales. El PIN protege "abrir el perfil"; la puerta
  parental protege "romper la cuenta".

### 5. Tope de hijos y borrado en cascada: **contador transaccional + Cloud Functions**

Las reglas de Firestore no pueden contar documentos de una subcolección; por tanto:

- **Tope de nº de hijos por cuenta:** se mantiene `users/{uid}.childrenCount` como
  **contador transaccional**. La creación de un hijo se hace en una **transacción**
  que incrementa el contador y **rechaza** si supera el tope (valor concreto a fijar
  en implementación, p. ej. 6). La regla de seguridad valida que `childrenCount` no
  exceda el tope y que su incremento sea coherente con la creación. Alternativa
  equivalente: una **Cloud Function** que cree el hijo y gestione el contador de forma
  atómica; se elige el contador transaccional por simplicidad, reservando la Function
  si aparece lógica de servidor adicional.
- **Borrado de cuenta en cascada (derecho de supresión RGPD):** Firestore **no** borra
  subcolecciones al borrar un documento. La supresión de cuenta se implementa con una
  **Cloud Function** que hace **recursive delete** de `users/{uid}` y todo su árbol
  (`children/*`, `courses/*`) y elimina el usuario de Firebase Auth. **Coordina con
  Abogado** (derecho de supresión, plazos y evidencia de borrado) — el Abogado ya está
  al tanto.

### 6. Migración del progreso local existente

La primera vez que un usuario con progreso en `localStorage` (esquema v2 del ADR-002)
inicia sesión y verifica el email, la app **sube su estado local a la cuenta del
tutor**:

- Se crea un perfil de hijo por defecto y se **mapea cada `CourseState` a
  `users/{uid}/children/{childId}/courses/{curso}`** (el modelo v2 ya es serializable
  y plano, por diseño del ADR-002 — no hay rediseño de dominio).
- Las **preferencias globales** (idioma, sonido, movimiento reducido) permanecen como
  ajuste del dispositivo/tutor.
- La migración es **idempotente y no destructiva**: no se pisa progreso ya existente en
  la nube; ante conflicto, prevalece el estado más avanzado por curso (regla de
  reconciliación a detallar por Frontend/Backend). El `localStorage` local se conserva
  hasta confirmar la subida.

### 7. CI de APK y firma — con los refuerzos de Seguridad

**Patrón de build:**

- **En cada PR:** el workflow (`on: pull_request`) construye un **APK debug sin
  firma**. **Prohibido `pull_request_target`** en los jobs de build (condición de
  Seguridad): expondría secretos al código de la PR. Sólo `pull_request`.
- **En `main` y en tags:** se genera el **release firmado** vía **Play App Signing**
  (Google custodia la clave de firma de la app; el repositorio sólo maneja la *upload
  key*). Los **secretos de firma viven detrás de un GitHub Environment protegido** (con
  aprobadores/branch protection), nunca en secrets de repositorio accesibles desde
  cualquier workflow.

**Endurecimiento de los workflows (condiciones de Seguridad):**

- `permissions: contents: read` **mínimo** en cada workflow (elevar sólo el job que lo
  necesite, de forma explícita).
- **Actions de terceros fijadas por SHA de commit completo**, nunca por tag móvil
  (`@v4`).
- Secretos de firma sólo inyectados en el job de release, dentro del Environment
  protegido; jamás en el job que corre sobre código de una PR.

**Endurecimiento de la app en release (condiciones de Seguridad):**

- `android:usesCleartextTraffic="false"`.
- `webContentsDebuggingEnabled=false` en release.
- `allowNavigation` **restringido** (allowlist mínima; sin comodines abiertos).
- Assets **locales** en el APK; **nunca `server.url` remoto** en la configuración de
  Capacitor.

### 8. Restricción de la API key de Firebase

La API key de Firebase (embebida en el cliente, no secreta pero abusable) se
**restringe en GCP** por **aplicación Android + huella SHA-256** del certificado de
firma, de modo que sólo el APK legítimo pueda usarla. Requisito explícito de
implementación (condición alta de Seguridad).

### 9. Notas de implementación futura (medias — no bloquean este ADR)

Se registran como requisitos de la fase de implementación, sin detalle cerrado aquí:

- **Inmutabilidad** de `consentimiento` y `createdAt` en las reglas + **rechazo de
  campos desconocidos** (allowlist de campos por documento).
- **App Check**: rollout en modo **monitor → enforce**, con **plan de debug tokens**
  para desarrollo/CI. Implementado en modo monitor con `ReCaptchaV3Provider` como
  proveedor interino — Play Integrity (el proveedor originalmente previsto aquí) no
  es viable hasta que existan keystore de release + acceso a Play Console + plugin
  nativo de Capacitor. Ver [`ADR-005`](./ADR-005-app-check-recaptcha-interino.md).
- **Refresh del ID token** tras verificar email (para propagar `email_verified`).
- **Auditoría de dependencias en CI** (se suma a la política de dependencias del
  CLAUDE.md).
- **Validación del campo `mote`** (longitud, caracteres, sin PII del adulto).
- **Política de contraseña del tutor** (longitud/robustez mínimas).
- **Dominios autorizados** en los action links de Firebase Auth (ver §2).
- **Google Sign-In dentro del WebView nativo**: `signInWithPopup` no es fiable en un
  WebView de Capacitor (confirmado en dispositivo real). Resuelto con un puente nativo
  (`@capacitor-firebase/authentication`, modo `skipNativeAuth`) — ver
  [`ADR-006`](./ADR-006-google-signin-nativo.md).

### 10. Versionado (SemVer)

Este trabajo se numera **0.6.0**. Seguimos en fase **`0.y.z`**: pese a ser un cambio
de arquitectura mayor (backend, login, empaquetado), la fase de desarrollo no garantiza
estabilidad y saltar a 1.0.0 señalaría lo contrario. **`1.0.0` se reserva para el
lanzamiento real en Google Play**, no para este merge. Documentación propone el número
y actualiza el manifiesto; DevOps crea el tag `v0.6.0` con confirmación del Jefe cuando
la implementación (flujo de Nueva Feature que orquestará el Jefe) se integre.

## Consecuencias

**Positivas:**

- El progreso deja de perderse al borrar el navegador: viaja con la cuenta del tutor y
  se sincroniza entre dispositivos.
- Región europea + PII minimizada (email sólo en Auth, PIN sólo local) reducen la
  superficie de datos personales en la nube y encajan con el RGPD desde el diseño.
- Offline-first mantiene la experiencia sin fricción del ADR-001 (el niño juega sin
  conexión), ahora con respaldo en la nube.
- El modelo multi-curso del ADR-002 se reutiliza sin rediseño: `CourseState` mapea 1:1
  a documentos Firestore.
- Firma vía Play App Signing + CI endurecido: la clave de firma la custodia Google y
  los secretos nunca se exponen al código de una PR.

**Negativas / trade-offs:**

- Se introduce **backend gestionado** (Firebase): coste operativo potencial, cuota
  gratuita a vigilar, y dependencia de proveedor (**vendor lock-in de Google**). Se
  acepta por el ahorro de construir y operar auth + base de datos propios.
- Aparece **tratamiento de datos personales de menores**: obliga a DPIA, textos
  legales, consentimiento y flujos de supresión. Es intrínseco al cambio de producto,
  no un añadido evitable.
- El copy de privacidad ("nada sale del dispositivo") deja de ser cierto y debe
  corregirse en el mismo cambio.
- Se añaden **Cloud Functions** (borrado en cascada, y posiblemente contador) — más
  piezas que mantener y desplegar.

**Riesgos:**

- **Residencia de datos de Firebase Auth:** el email del tutor vive en la
  **infraestructura global de Google (Auth), no fijable a región EU** como Firestore.
  Esto implica una **transferencia internacional** que **el Abogado debe confirmar**
  (DPA/SCCs de Google, base de licitud). **No se resuelve en este ADR**; se señala como
  punto legal abierto.
- **Datos de menores:** cualquier fallo de control de acceso es especialmente sensible.
  Mitigación: reglas estrictas por `uid` + `email_verified`, puerta parental, App Check.
- **Enumeración de cuentas / abuso de la API key:** mitigado por el flag de enumeración
  y la restricción de API key por SHA-256, pero requiere verificación en QA/Seguridad.
- **Coste inesperado** si el uso crece: vigilar cuotas de Firestore/Functions;
  coordinar con DevOps un presupuesto y alertas.

## Punto legal abierto para el Abogado (no lo resuelve el Arquitecto)

- **Transferencias internacionales por Firebase Auth:** el email del tutor reside en
  infraestructura global de Google. El Abogado confirma DPA/SCCs de Google y la base de
  licitud, e integra este punto y la **DPIA** (tratamiento de datos de menores) en el
  gate legal. Coordinado también con el borrado en cascada (derecho de supresión, §5).

## Alternativas consideradas

### Alternativa 1 — Migración por fases (primero empaquetar, luego login, luego nube)
**Por qué se descarta:** el usuario eligió explícitamente "todo de una vez". Fasearlo
alargaría el tiempo hasta un producto usable en Android con cuenta y multiplicaría los
estados intermedios inconsistentes (app instalada pero sin persistencia en nube). El
riesgo de hacerlo junto es asumible porque el modelo de datos (ADR-002) ya está
preparado.

### Alternativa 2 — App nativa (Kotlin/Jetpack Compose) en vez de Capacitor
**Por qué se descarta:** reescribiría desde cero el frontend web ya construido y
probado (quiz, i18n, catálogo, impresión). Capacitor reutiliza ese frontend íntegro y
da acceso nativo (almacenamiento seguro, empaquetado Play) con coste marginal. La app
no tiene requisitos de rendimiento o hardware que justifiquen ir nativo puro.

### Alternativa 3 — Backend propio (p. ej. Node + Postgres) en vez de Firebase
**Por qué se descarta:** exigiría construir y **operar** autenticación, base de datos,
sincronización offline y servidor — justo lo que un proyecto personal mantenido en
veranos sucesivos no quiere cargar. Firebase da Auth + Firestore + offline + reglas de
seguridad gestionados. Se acepta el lock-in a cambio de coste operativo casi nulo. El
modelo serializable del ADR-002 deja la puerta abierta a migrar si algún día se
justificara.

### Alternativa 4 — Cuenta por niño (cada niño con su login)
**Por qué se descarta:** los usuarios finales son niños de primaria sin email ni
capacidad legal para consentir. El modelo **una cuenta = un tutor adulto, con perfiles
de hijo** sitúa el consentimiento y el control (puerta parental) en el adulto, como
exige el tratamiento de datos de menores.

### Alternativa 5 — Guardar email/PIN en Firestore (esquema inicial, antes de la revisión de Seguridad)
**Por qué se descarta:** duplicaba PII (email) en Firestore y en su caché offline sin
cifrar, y trataba el PIN del niño como si fuera una credencial de servidor. Seguridad lo
señaló como contradicción crítica. El diseño final deja el **email sólo en Firebase
Auth** y el **PIN sólo en el dispositivo** (§4), minimizando PII en la nube.

---
<!-- Copiar este archivo como docs/decisions/ADR-NNN-titulo-en-kebab-case.md -->
<!-- Nunca reutilizar un número, aunque el ADR se deprece -->
