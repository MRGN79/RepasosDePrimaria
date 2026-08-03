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
