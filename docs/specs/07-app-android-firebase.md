# Specs — App Android + login del tutor + datos en la nube (Firebase)

> Especificación funcional del pivote decidido en
> [`ADR-003`](../decisions/ADR-003-android-firebase.md). El ADR es la fuente de
> verdad de las decisiones técnicas y las restricciones legales/seguridad; este
> documento traduce esas decisiones a **user stories y criterios de aceptación**
> y define el **plan de entrega en incrementos**.
> Leyenda de prioridad: **P0** = imprescindible · **P1** = deseable · **P2** = posterior.

---

## Roles

- **Tutor**: adulto responsable (madre/padre/docente). Es el **único** que tiene
  cuenta y login. Gestiona los perfiles de hijo, el consentimiento y la cuenta.
- **Niño**: usa la app dentro de un **perfil de hijo** creado por el tutor. **No
  tiene login, ni email, ni PII.** Puede tener un **PIN local** (pestillo entre
  hermanos), que nunca sale del dispositivo.

---

## Plan de entrega (incrementos técnicos)

Producto "todo de una vez"; ingeniería troceada en PRs revisables.

| Inc. | Alcance | Depende de |
|---|---|---|
| **1** | Shell Capacitor + empaquetado Android + CI de APK debug + retirada de GitHub Pages | — |
| **2** | Firebase Auth + alta/consentimiento del tutor (contra emulador) | 1 |
| **3** | Firestore + perfiles de hijo + reglas de seguridad | 2 |
| **4** | Migración del progreso `localStorage` a la nube | 3 |
| **5** | Puerta parental + endurecimiento | 3 |
| **6** | Copy legal + política de privacidad + DPIA (viaja con Inc. 2/3) | 2 |
| **7** | Retirada final de GitHub Pages (cubierta ya en Inc. 1) | 1 |

---

## Épica A — La app es instalable en Android (Incremento 1)

### US-A1 (P0) — La misma app, ahora empaquetada como app nativa
**Como** usuario
**Quiero** poder instalar la app en una tablet/móvil Android
**Para** usarla como una aplicación, no como una web con URL.

**Criterios de aceptación:**
- Dado el frontend web actual, cuando se construye, entonces existe un proyecto
  Android (Capacitor) que carga ese mismo bundle en un WebView.
- Dado un push/PR, cuando corre CI, entonces se genera un **APK debug** descargable
  como artefacto, sin necesidad de secretos ni credenciales.
- Dado que la app se sirve dentro del WebView, cuando carga, entonces todas las
  rutas de assets funcionan (el `base` de Vite es relativo, no `/RepasosDePrimaria/`).
- Dado que la app funciona offline (localStorage), cuando no hay red, entonces sigue
  operando exactamente igual que la web actual (Inc. 1 **no** introduce nube).

### US-A2 (P0) — Se retira el sitio público de GitHub Pages
**Como** responsable del proyecto
**Quiero** dejar de publicar la web en GitHub Pages
**Para** que el canal de distribución pase a ser la app, sin mantener una URL pública.

**Criterios de aceptación:**
- Dado que existe el pipeline de APK (artefacto utilizable), cuando se retira Pages,
  entonces el proyecto **no queda sin ningún artefacto publicado** en el intervalo.
- Dado el merge a `main`, cuando termina, entonces **no** se dispara ningún deploy a
  Pages (el workflow de deploy se elimina).
- Dado el `README`, cuando se lee, entonces la sección de despliegue describe el
  empaquetado Android, no Pages. _(La reescritura del copy de privacidad se hace en
  el Inc. 2/6, cuando entra la nube; en el Inc. 1 la promesa "nada sale del
  dispositivo" sigue siendo cierta.)_

---

## Épica B — El tutor se da de alta y consiente (Incremento 2)

### US-B1 (P0) — Alta del tutor con email y contraseña
**Como** tutor
**Quiero** crear una cuenta con mi email y una contraseña
**Para** poder guardar y recuperar el progreso de mis hijos en la nube.

**Criterios de aceptación:**
- Dado el alta, cuando introduzco email y contraseña válidos, entonces se crea la
  cuenta en **Firebase Auth** y se me envía un **email de verificación**.
- Dado que mi email **no** está verificado, cuando intento activar el guardado en la
  nube, entonces la app me lo impide y me recuerda verificar el email.
- Dado el diseño, cuando se crea la cuenta, entonces **el email vive solo en Firebase
  Auth**; ningún documento de datos (Firestore) lo contiene.
- Dado que no hay proyecto Firebase real todavía, cuando desarrollo/pruebo, entonces
  la app funciona contra el **emulador de Firebase** sin credenciales de producción.
- **(A11y)** Dado que uso teclado o lector de pantalla, cuando relleno el formulario,
  entonces cada campo tiene etiqueta asociada, los errores se anuncian y el foco es
  visible.
- **(i18n)** Dado cualquier texto de las pantallas de alta/consentimiento/errores,
  cuando se muestra, entonces procede de claves i18n en EN y ES (nunca hardcodeado).

### US-B2 (P0) — Consentimiento informado del tutor
**Como** tutor
**Quiero** entender qué datos se guardan y dar mi consentimiento
**Para** cumplir con mi responsabilidad y con la ley (RGPD, menores).

**Criterios de aceptación:**
- Dado el alta, cuando llego al paso de consentimiento, entonces veo, en lenguaje
  claro, qué se guarda (progreso del niño sin PII, cuenta del tutor) y qué **no**
  (el niño no tiene cuenta; el PIN no sale del dispositivo).
- Dado el consentimiento, cuando no lo acepto, entonces no puedo continuar con el
  guardado en la nube (pero la app sigue usable en local).
- Dado el consentimiento, cuando lo acepto, entonces queda registrado (fecha/versión
  del texto) asociado a la cuenta del tutor.
- Dado el texto legal, cuando se publica, entonces ha sido **validado por el Abogado**
  y enlaza a la **política de privacidad** (Inc. 6).

### US-B3 (P1) — Inicio de sesión y recuperación
**Como** tutor
**Quiero** iniciar sesión en otro dispositivo y recuperar la contraseña
**Para** acceder al progreso desde donde esté.

**Criterios de aceptación:**
- Dado un tutor con cuenta, cuando inicia sesión con email/contraseña correctos,
  entonces accede a sus perfiles de hijo.
- Dado que olvidé la contraseña, cuando pido recuperarla, entonces recibo un email de
  restablecimiento (flujo estándar de Firebase Auth).
- **(A11y/i18n)** como en US-B1.

---

## Épica C — Perfiles de hijo y datos en la nube (Incremento 3)

### US-C1 (P0) — El niño opera dentro de un perfil de hijo, sin login ni PII
**Criterios de aceptación:**
- Dado un tutor autenticado, cuando crea un perfil de hijo, entonces ese perfil
  guarda **solo** avatar y apodo de **catálogo cerrado** (sin texto libre
  identificante) y su progreso.
- Dado un perfil de hijo, cuando se persiste en Firestore, entonces **no** contiene
  nombre real, fecha de nacimiento, foto, email ni ningún PII del niño.
- Dado el modelo `CourseState` (ADR-002), cuando se sube a la nube, entonces mapea a
  documentos por perfil/curso sin rediseñar el dominio.

### US-C2 (P0) — Reglas de seguridad de Firestore
**Criterios de aceptación:**
- Dado un tutor, cuando accede a datos, entonces **solo** puede leer/escribir los
  documentos bajo su propio `uid`; nunca los de otra cuenta.
- Dado cualquier documento, cuando se valida contra las reglas, entonces **no** se
  permite escribir el email del tutor ni el PIN del niño en Firestore.
- Dado el emulador, cuando se ejecutan los tests de reglas, entonces cubren los casos
  de acceso cruzado (denegado) y propio (permitido).

### US-C3 (P1) — Offline-first
**Criterios de aceptación:**
- Dado que no hay red, cuando el niño juega, entonces el progreso se guarda localmente
  y **sincroniza** al reconectar (persistencia offline de Firestore).

---

## Épica D — Migración, puerta parental, legal (Incrementos 4–6)

### US-D1 (P0, Inc. 4) — No perder el progreso local existente
- Dado un usuario con progreso en `localStorage` (esquema v2), cuando el tutor crea
  su primer perfil de hijo, entonces ese progreso se **asocia** a ese perfil sin
  pérdida, y se ofrece hacerlo explícitamente (no silencioso).
- **Detalle completo en la [Épica E](#épica-e--migración-del-progreso-local-existente-incremento-4)**
  (US-E1…US-E8): aviso explícito, verify-before-delete, todos los cursos, una sola
  vez por dispositivo, Modelo B, reanudación/reintento, y cambio de cuenta de tutor.

### US-D2 (P0, Inc. 5) — Puerta parental para acciones sensibles
- Dado una acción destructiva o de cuenta (borrar datos en la nube, borrar/cerrar
  cuenta, cambiar email, exportar), cuando el tutor la lanza, entonces la app exige
  **reautenticación** inmediatamente antes de ejecutarla.
- **(A11y/i18n)** el diálogo de reautenticación cumple a11y y usa claves i18n.

### US-D3 (P0, Inc. 6) — Copy legal, política de privacidad y DPIA
- Dado que la nube entra en el producto, cuando se publica ese cambio, entonces **en
  el mismo cambio** se reescribe el copy "nada sale del dispositivo" (README, footer,
  `.env.example`), se añade la **política de privacidad** y existe la **DPIA**.
- Dado el Abogado, cuando revisa, entonces valida residencia de datos (Auth vs UE),
  base jurídica/consentimiento y declaración de Play Data safety.

---

## Épica E — Migración del progreso local existente (Incremento 4)

> Desarrolla en detalle el placeholder **US-D1**. Rama: `feat/migracion-progreso-local`.
> Contexto técnico: el progreso local vive en `localStorage` bajo la clave `tdp:v1`
> (esquema v2, `src/lib/storage.ts`): un mapa `courses` con un `CourseState` por
> curso (1.º–6.º) más `currentCourse` y las `preferences` del dispositivo. El
> destino en la nube ya soporta `CourseState` por curso
> (`src/lib/firebase/courseMapping.ts`), con dos rutas de cuenta (ADR-004):
> **Modelo A** (perfil de hijo bajo cuenta de tutor → `children/{childId}/courses/{curso}`)
> y **Modelo B** (cuenta propia de niño con Google → `users/{uid}/courses/{curso}`).
>
> **Principio rector:** *el progreso local nunca se pierde.* El dato local solo se
> elimina cuando la nube ha confirmado que lo tiene (verify-before-delete). Ante
> cualquier duda, gana conservar el dato local.

### US-E1 (P0) — Aviso explícito de migración al crear el primer perfil (Modelo A)
**Como** tutor que ya usaba la app sin cuenta
**Quiero** que se me diga con claridad que el progreso guardado en este dispositivo
se va a pasar al perfil de hijo que estoy creando
**Para** entender qué ocurre con ese avance y no descubrirlo por sorpresa.

**Criterios de aceptación:**
- Dado que existe progreso local con avance real (al menos un curso con progreso
  distinto del estado por defecto), cuando el tutor llega a la pantalla de creación
  del **primer** perfil de hijo (`ProfileSetupScreen`, variante `tutorChild`),
  entonces se muestra **antes de crear el perfil** un aviso explícito de que el
  progreso guardado en este dispositivo se añadirá a ese perfil. No es una
  migración silenciosa.
- Dado el aviso, cuando el progreso local abarca **varios cursos**, entonces el
  aviso indica que se transferirá el progreso de todos ellos (no solo el del curso
  activo).
- Dado que el tutor confirma la creación del perfil, cuando se ejecuta, entonces la
  migración arranca inmediatamente después de crear el perfil (US-E2), sin pedir un
  segundo paso manual.
- **(A11y)** Dado que uso teclado o lector de pantalla, cuando aparece el aviso,
  entonces es texto real (no solo color/icono), está asociado a la sección de
  creación y el foco es visible y navegable sin ratón.
- **(i18n)** Dado el aviso, cuando se muestra, entonces todos sus textos proceden de
  claves i18n en EN y ES.

### US-E2 (P0) — Migración segura: verificar antes de borrar (verify-before-delete)
**Como** usuario con progreso acumulado
**Quiero** que mi avance no se borre del dispositivo hasta que la nube confirme que
lo tiene
**Para** no perderlo si la subida falla a medias.

**Criterios de aceptación:**
- Dado un curso con progreso local, cuando se migra, entonces primero se **escribe**
  en Firestore y después se **verifica** que la escritura se completó — leyendo de
  vuelta el documento subido y confirmando que su contenido equivale al local
  (progreso, estrellas, racha, medallas, misión diaria), o confirmando el resultado
  satisfactorio de la transacción.
- Dado que la verificación de un curso es **satisfactoria**, cuando termina,
  entonces —y solo entonces— se elimina ese progreso del `localStorage`.
- Dado que la verificación de un curso **falla** (error de red, resultado no
  coincidente, cuota), cuando termina, entonces el progreso local de ese curso **se
  conserva** intacto y la app **no** lo borra bajo ninguna circunstancia.
- Dado un fallo de verificación, cuando ocurre, entonces la app lo trata como estado
  reintentable (US-E6), nunca como pérdida silenciosa.
- Dado que la nube ya contiene progreso previo para ese perfil/curso (perfil no
  vacío), cuando se migra, entonces la migración **no sobrescribe destruyendo** el
  progreso de nube existente (ver US-E4: la migración solo aplica al primer perfil
  del dispositivo, por lo que este caso solo surge en una reejecución sobre un
  perfil ya sembrado; en ese caso se conserva lo de mayor avance y no se pierde
  ninguno de los dos).

### US-E3 (P0) — Se migra el progreso de todos los cursos, no solo el activo
**Como** familia que ha jugado en varios cursos en el mismo dispositivo
**Quiero** que se transfiera el progreso de todos los cursos con avance
**Para** no perder lo trabajado en los cursos que no son el activo.

**Criterios de aceptación:**
- Dado un `localStorage` con progreso en **varios cursos** (p. ej. 3.º y 5.º),
  cuando se migra al perfil, entonces se transfiere el `CourseState` de **cada curso
  con avance real**, cada uno a su documento de curso correspondiente en la nube.
- Dado un curso cuyo `CourseState` es equivalente al estado por defecto (sin avance),
  cuando se migra, entonces ese curso se **omite** (no se crean documentos de nube
  vacíos).
- Dado el `currentCourse` local, cuando concluye la migración, entonces el perfil de
  nube queda con ese mismo curso como curso activo inicial (si tenía avance; si no,
  el que corresponda por defecto).
- Dado que la migración transfiere `CourseState`, cuando escribe en la nube, entonces
  respeta la minimización ya existente (`courseStateToCloudDoc` descarta el texto
  libre `nicknameCustom`); ningún dato personal identificante viaja a la nube.
- Dado que las `preferences` del dispositivo (idioma, sonido, movimiento) son
  globales y siguen siendo locales, cuando se migra, entonces **no** se transfieren
  a la nube (permanecen en `localStorage`, como hasta ahora).

### US-E4 (P0) — Una sola migración por dispositivo; sin fusión entre hermanos
**Como** familia con varios hijos que comparten una tablet
**Quiero** que el progreso local se asigne a un único perfil, sin mezclar avances de
distintos hermanos
**Para** que el progreso de cada niño quede limpio y sin ambigüedad.

**Criterios de aceptación:**
- Dado un dispositivo recién actualizado con progreso local, cuando se crea el
  **primer** perfil en él (sea perfil de hijo de un tutor o cuenta propia de niño),
  entonces la migración del progreso local ocurre **una única vez**, hacia ese primer
  perfil.
- Dado que la migración ya se completó en un dispositivo, cuando se crean **perfiles
  o cuentas posteriores** en el mismo dispositivo, entonces **no** se les ofrece ni
  se les aplica el progreso local (no hay fusión automática de progresos de varios
  hermanos).
- Dado que se registra que la migración terminó (marcador a nivel de dispositivo en
  `localStorage`), cuando la app arranca de nuevo, entonces el marcador impide
  reofrecer o repetir la migración salvo que quedara una parte pendiente por fallo de
  verificación (US-E6).
- Dado que dos hermanos comparten dispositivo, cuando cada uno quiere su propio
  progreso limpio, entonces usan cuentas/perfiles distintos (login-logout de tutores
  distintos vía US-E8, o el selector de perfil con PIN dentro de la misma cuenta de
  tutor, ya existente en Inc. 3) — no la migración.

### US-E5 (P0) — Migración análoga para la cuenta propia de niño (Modelo B)
**Como** niño (con supervisión parental) que crea su propia cuenta con Google en un
dispositivo donde ya había jugado sin cuenta
**Quiero** que el progreso guardado en ese dispositivo se pase a mi cuenta
**Para** seguir desde donde estaba, no desde cero.

**Criterios de aceptación:**
- Dado un dispositivo con progreso local y sin migración previa, cuando el niño crea
  su cuenta propia (Modelo B, `ProfileSetupScreen` variante `kid`) como **primer**
  perfil del dispositivo, entonces se aplica la **misma** migración que en Modelo A:
  aviso explícito (US-E1), verify-before-delete (US-E2), todos los cursos (US-E3),
  una sola vez (US-E4).
- Dado el destino de nube del Modelo B, cuando se migra, entonces el `CourseState`
  de cada curso se escribe bajo `users/{uid}/courses/{curso}` (no bajo `children/…`).
- Dado el marcador de migración a nivel de dispositivo, cuando el primer perfil del
  dispositivo es una cuenta de niño (Modelo B), entonces un perfil de tutor creado
  después en el mismo dispositivo **no** vuelve a recibir el progreso local, y
  viceversa (el marcador es común a ambos modelos: se migra a quien cree el primer
  perfil, sea del tipo que sea).

### US-E6 (P0) — La migración es reanudable y reintentable; nunca deja el dato a medias
**Como** usuario cuya conexión falla o que cierra la app a mitad del alta
**Quiero** que la migración se retome sin perder nada
**Para** que un corte no me cueste el progreso.

**Criterios de aceptación:**
- Dado que el usuario **cancela o cierra** el alta después de crear el perfil pero
  antes de que la migración termine, cuando vuelve a abrir la app, entonces el
  progreso local que aún no se verificó **sigue presente** y la migración se
  **reanuda** automáticamente hacia el mismo perfil para el que empezó (el estado
  pendiente registra el perfil destino: `uid` + `childId`, o `uid` de la cuenta de
  niño).
- Dado que la verificación de uno o más cursos falló, cuando la app detecta progreso
  local pendiente con el marcador de migración aún no cerrado, entonces **reintenta**
  la subida+verificación de los cursos pendientes en segundo plano, sin bloquear el
  juego del niño.
- Dado un fallo de verificación persistente, cuando se agota un intento, entonces se
  informa al usuario de forma **no bloqueante** de que parte del progreso aún no se
  ha guardado en la nube y se ofrece **reintentar**; el progreso local permanece
  disponible mientras tanto.
- Dado que **todos** los cursos con avance se han verificado en la nube, cuando la
  migración concluye, entonces se marca como completada (US-E4) y el progreso local
  migrado se elimina; a partir de ahí la fuente de verdad del progreso es la nube.
- Dado que la migración es idempotente, cuando se reejecuta un curso que ya había
  llegado a la nube, entonces el resultado es el mismo documento (no duplica ni
  corrompe), coherente con US-E2.
- **(i18n)** Dado el aviso de reintento, cuando se muestra, entonces sus textos
  proceden de claves i18n en EN y ES.

### US-E7 (P1) — Usuario nuevo sin progreso local: alta limpia
**Como** usuario que instala la app y crea una cuenta sin haber jugado antes
**Quiero** un alta sencilla sin mensajes sobre migrar algo que no existe
**Para** no confundirme con un aviso irrelevante.

**Criterios de aceptación:**
- Dado que no hay progreso local con avance real (no existe la clave, está corrupta,
  el almacenamiento no está disponible, o todos los cursos están en el estado por
  defecto), cuando se crea el primer perfil, entonces **no** se muestra el aviso de
  migración (US-E1) y el alta transcurre como un alta limpia.
- Dado ese caso, cuando termina el alta, entonces igualmente se registra el marcador
  de dispositivo (US-E4) para no evaluar la migración en cada arranque.
- Dado que el almacenamiento local no está disponible, cuando se evalúa la
  migración, entonces la app degrada sin error (no rompe el alta), coherente con la
  lectura defensiva de `storage.ts`.

### US-E8 (P0) — Cambiar de cuenta de tutor en el mismo dispositivo
**Como** adulto que comparte dispositivo (p. ej. dos progenitores, o un docente con
varias familias)
**Quiero** poder cerrar la sesión de una cuenta de tutor y entrar con otra fácilmente
**Para** que cada cuenta acceda a sus propios perfiles sin mezclar progreso.

**Criterios de aceptación:**
- Dado que hay una sesión activa dentro del juego (cuenta de tutor con un solo hijo,
  o cuenta de niño), cuando el adulto busca cambiar de cuenta, entonces existe un
  control accesible de **cambiar de cuenta / cerrar sesión** desde dentro de la app
  (en `SettingsScreen`), no solo desde el selector de perfiles con varios hijos.
- Dado que el control de cambio de cuenta se activa, cuando se lanza, entonces queda
  **protegido por el reto de adulto** (`AdultChallenge`, ya existente) para evitar
  que un niño cierre sesión por accidente y deje al adulto en la pantalla de login.
- Dado que el adulto confirma el cambio, cuando se ejecuta, entonces se cierra la
  sesión actual (`signOut`) y la app vuelve a la pantalla de entrada, donde puede
  iniciarse sesión con **otra** cuenta de tutor (o de niño).
- Dado que se cierra la sesión, cuando ocurre, entonces el progreso del niño **no se
  pierde**: permanece en la nube asociado a su cuenta/perfil; cerrar sesión no borra
  datos de nube ni de dispositivo.
- Dado que se cambia de cuenta, cuando la nueva sesión carga, entonces accede
  **únicamente** a los perfiles de su propia cuenta (frontera por `uid` de las reglas
  de Firestore, Inc. 3); nunca a los de la cuenta anterior.
- **(A11y)** Dado que uso teclado o lector de pantalla, cuando abro y confirmo el
  cambio de cuenta, entonces los controles tienen etiqueta, el foco es visible y el
  diálogo de confirmación es navegable sin ratón.
- **(i18n)** Dado cualquier texto del cambio de cuenta/confirmación, cuando se
  muestra, entonces procede de claves i18n en EN y ES.

> **Nota de alcance sobre US-E8 y la puerta parental (Inc. 5).** El reto de adulto
> que protege el cambio de cuenta es la fricción ligera ya disponible
> (`AdultChallenge`), no la puerta parental con reautenticación completa de Inc. 5
> (US-D2). Cambiar de cuenta no es una acción destructiva (no borra datos), por lo
> que no exige reautenticación; basta el reto de adulto. La reautenticación de Inc. 5
> se reserva para acciones destructivas/de cuenta (borrar datos de nube, cerrar
> cuenta, cambiar email).

### Textos de interfaz (i18n) — referencia EN

Claves nuevas de esta épica, con su valor EN de referencia (el valor ES se añade en
implementación manteniendo equivalencia semántica; +30% de expansión previsto):

```
account.profileSetup.migrationNotice.title        "Your progress will move here"
account.profileSetup.migrationNotice.body         "The progress saved on this device will be added to this profile, so nothing is lost."
account.profileSetup.migrationNotice.multiCourse  "Progress from every course you've played on this device will be transferred."
account.migration.inProgress                      "Saving your progress to the cloud…"
account.migration.incompleteTitle                 "Some progress isn't saved yet"
account.migration.incompleteBody                  "We couldn't finish saving part of your progress to the cloud. It's still safe on this device and we'll keep trying."
account.migration.retryAction                     "Try again now"
account.migration.doneToast                        "Your progress is safely in the cloud."
settings.account.label                            "Account"
settings.account.switch                           "Switch account"
settings.account.signOut                          "Sign out"
settings.account.switchConfirmTitle               "Switch to a different account?"
settings.account.switchConfirmBody                "You'll be signed out and can sign in with another account. Your child's progress stays safely in the cloud."
settings.account.switchConfirmButton              "Switch account"
settings.account.switchCancel                     "Cancel"
```

### Casos edge identificados

- **Progreso local corrupto o `schemaVersion` desconocida:** `parseState` ya devuelve
  el estado por defecto; se trata como "sin progreso que migrar" (US-E7), nunca como
  error de alta.
- **`localStorage` no disponible** (modo privado, cuota llena): no hay nada que
  migrar ni que borrar; el alta continúa (US-E7).
- **Cierre de la app entre crear el perfil y verificar la subida:** migración
  reanudable (US-E6); local intacto.
- **Verificación que falla en unos cursos y no en otros:** se borran solo los cursos
  verificados; los pendientes se conservan y se reintentan (US-E2 + US-E6).
- **Perfil creado pero el niño empieza a jugar antes de que la migración termine:** el
  juego escribe sobre el `CourseState` del curso activo en la nube; la migración debe
  **fusionar sin retroceder** el avance (no sobrescribir con un estado más antiguo un
  progreso ya mayor). Regla operativa: para cada curso, conservar el estado de mayor
  avance; nunca reducir estrellas, racha longest, medallas ni ejercicios resueltos.
- **Segundo perfil en el mismo dispositivo:** no recibe progreso local (US-E4).
- **Reinstalación de la app:** al perderse `localStorage`, no hay progreso local ni
  marcador; el usuario recupera su avance iniciando sesión (la fuente de verdad ya es
  la nube), no vía migración.

### Fuera de alcance (Inc. 4)

- **Fusión de progresos de varios hermanos** en un mismo perfil: descartada por
  decisión de producto (US-E4).
- **Opción de "empezar de cero" descartando el progreso local** en el alta: no se
  añade en este incremento (evita ambigüedad sobre qué pasa con el dato); el progreso
  local nunca se descarta por defecto.
- **Puerta parental con reautenticación completa** para acciones destructivas: es
  Inc. 5 (US-D2). US-E8 solo cubre el cambio de cuenta con reto de adulto.
- **Cuenta compartida entre dos progenitores** (mismo progreso del niño desde dos
  identidades distintas): decisión de arquitectura aún abierta (ver `docs/BACKLOG.md`,
  "Decisiones de arquitectura pendientes"). US-E8 permite alternar cuentas, no
  compartir progreso entre ellas.
- **Migración de `preferences` del dispositivo a la nube:** siguen siendo locales por
  diseño.

### Base jurídica del tratamiento (input para el Abogado)

- La migración **no introduce datos personales nuevos**: el `CourseState` migrado no
  contiene PII (el progreso es anónimo; `courseStateToCloudDoc` descarta el único
  texto libre). El destino en la nube ya está cubierto por el consentimiento del
  tutor / de la cuenta de niño capturado en Inc. 2/6 (`CONSENT_VERSION = "2026-08"`).
- **Punto a validar por el Abogado:** que el texto de consentimiento vigente cubra
  explícitamente el traslado a la nube de **progreso preexistente guardado en el
  dispositivo** (no solo el progreso generado tras el alta). Si no lo cubre con
  claridad, ajustar el copy antes del release. Base jurídica: ejecución del servicio
  solicitado por el tutor (guardar y sincronizar el progreso del niño), sobre la base
  del consentimiento ya registrado.

### Requisitos no funcionales (Inc. 4)

- **Integridad del dato (crítico):** cero pérdida de progreso. El borrado local solo
  procede tras verificación positiva en la nube. Es la restricción dura del
  incremento.
- **No bloqueo del juego:** la migración y sus reintentos ocurren sin impedir que el
  niño juegue; la experiencia offline-first (Inc. 3) se mantiene.
- **Idempotencia:** reejecutar la migración de un curso no duplica ni corrompe el
  documento de nube.

### Dependencias

- Inc. 3 mergeado (Firestore + perfiles + reglas + `CloudGameProvider`) — cumplido.
- Proyecto Firebase real para verificación end-to-end de subida/verify en WebView y
  offline (registrado en `.claude/pending-actions.md`); contra el emulador es
  verificable en desarrollo.
- Coordinación con la deuda técnica registrada por QA en la PR #31 (flush del
  debounce de guardado en `CloudGameProvider`): el mismo problema de "última edición
  sin flush" afecta a la ventana de migración; conviene resolverlo o tenerlo en
  cuenta al implementar el verify-before-delete.

---

## No funcionales

- **Minimización de datos**: tratar la mínima cantidad de datos personales posible;
  ningún dato del niño identifica al niño.
- **Residencia**: Firestore en región europea. (Auth: punto abierto legal — ADR-003.)
- **Offline-first**: la experiencia del niño no depende de la red.
- **Sin secretos en el repo**: keystores, `google-services.json`, credenciales de
  firma fuera del control de versiones; release firmado tras Environment protegido.

## Pendientes que requieren acción del usuario

- Crear el **proyecto Firebase** real (Console): habilitar Auth email/contraseña,
  crear Firestore en **región europea**, y entregar la config `VITE_FIREBASE_*`.
- Aportar el **keystore de subida** / activar **Play App Signing** cuando se prepare
  la publicación en Play (Inc. posterior).
