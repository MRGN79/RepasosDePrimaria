# ADR-003: App instalable en Android (Capacitor) con login del tutor y datos en la nube (Firebase)

**Fecha:** 2026-08-03
**Estado:** Aceptado
**Decidido por:** Usuario (dirección de producto) + Arquitecto (diseño técnico), con inputs vinculantes de Seguridad y Abogado
**Sustituye premisas de:** ADR-001 (§ "sin backend, sin login, nada sale del dispositivo") — ver "Consecuencias".

> **Nota de procedencia:** la decisión de producto (pasar de web a app Android con
> login del tutor y datos en la nube vía Firebase) la tomó el usuario y quedó
> registrada en `docs/BACKLOG.md` (Dirección de producto). Este ADR **materializa
> y fija** esa decisión con todas las restricciones legales y de seguridad ya
> resueltas; es la **fuente de verdad** del pivote. No reabre la decisión.

---

## Contexto

El producto deja de ser una web estática con URL pública (GitHub Pages) y pasa a
ser una **aplicación instalable en Android** (posible iOS después), con:

- **Login del tutor** (madre/padre/docente), no del niño.
- **Guardado de datos en la nube**, para que el progreso sobreviva al cambio de
  dispositivo y pueda sincronizarse.

Este es un cambio de arquitectura mayor: de "sin backend, sin login, 100% local"
a "autenticación + backend gestionado en la nube". La app sigue siendo para
**niños de Primaria**, lo que impone restricciones legales fuertes (RGPD,
protección de menores, LOPDGDD; y de cara a distribución, la Families Policy de
Google Play). El diseño se hace **privacy-by-design y data-minimisation-first**:
el objetivo es tratar la **mínima cantidad de datos personales posible**, y que
**ningún dato del niño identifique al niño**.

### Fuerzas y restricciones

- El frontend actual (Vite + React + TS) es un activo valioso y funciona bien; se
  quiere **reutilizarlo tal cual**, no reescribirlo para móvil.
- Los datos de menores son categoría sensible: minimizar, no perfilar, no exponer.
- Debe funcionar **sin conexión** (niños usando la tablet sin wifi estable) y
  sincronizar cuando la haya (offline-first).
- La distribución pasa a ser la **APK/AAB** (Google Play a futuro); la URL pública
  deja de ser el canal principal → **se retira GitHub Pages**.

---

## Decisión

### 1. Empaquetado: Capacitor (no React Native, no TWA)

Se envuelve el frontend web actual con **Capacitor**. El WebView carga el mismo
bundle de Vite; los plugins nativos de Capacitor dan acceso a lo que se necesite
(estado de red, almacenamiento seguro, etc.).

- **Por qué no React Native:** obligaría a reescribir toda la UI (no comparte DOM);
  se perdería la inversión hecha en pantallas, accesibilidad e i18n.
- **Por qué no TWA (Trusted Web Activity):** una TWA es un envoltorio de una web
  publicada en una URL; exige mantener el sitio público y una relación de dominio.
  Contradice retirar la URL pública y complica el modo offline y la futura tienda.
- **Capacitor** mantiene el código web como fuente única, permite build de APK/AAB
  y deja la puerta abierta a iOS sin reescritura.

`base` de Vite pasa de `"/RepasosDePrimaria/"` a **relativo (`"./"`)**: dentro del
WebView la app se sirve desde la raíz del esquema local, no desde una subruta de
Pages. Este cambio, por sí solo, ya invalida el despliegue de Pages actual.

### 2. Autenticación: Firebase Auth — cuenta del TUTOR, nunca del niño

- **Firebase Authentication** con **email/contraseña del tutor**.
- **Verificación de email obligatoria** antes de habilitar el guardado en la nube.
- **El niño NUNCA tiene login propio.** No hay credencial, email ni cuenta de
  menor. El niño opera dentro de **"perfiles de hijo"** creados por el tutor bajo
  la cuenta del tutor.
- **El email del tutor vive SOLO en Firebase Auth.** No se duplica en Firestore ni
  en ningún documento de datos. (Regla verificable por Seguridad y por las reglas
  de Firestore: ningún documento contiene el email.)

### 3. Datos: Cloud Firestore, región europea, offline-first

- **Cloud Firestore** como base de datos, **aprovisionada en región europea**
  (residencia de datos en la UE).
- **Modo offline-first**: persistencia local de Firestore habilitada; la app
  funciona sin red y sincroniza al reconectar. Encaja con el modelo `CourseState`
  serializable de ADR-002 (`users/{uid}/children/{childId}/courses/{curso}` u
  organización equivalente — se fija en el Inc. 3).
- **Minimización de datos del niño:** un perfil de hijo contiene **avatar y apodo
  de catálogo cerrado** (ya existentes, sin texto libre identificante — ver
  `profile.ts`) y **progreso de aprendizaje**. **Ningún PII del niño** (ni nombre
  real, ni fecha de nacimiento, ni foto, ni email).

### 4. PIN del niño: control LOCAL, nunca en la nube

- El PIN del niño (si se usa para que un hermano no entre en el perfil de otro) es
  **exclusivamente un control local del dispositivo**.
- **El PIN NUNCA se envía a Firestore** ni a Firebase Auth ni a ningún servicio.
  No es una credencial de autenticación; es un pestillo local. (Regla verificable:
  ningún documento de Firestore contiene el PIN ni un hash del PIN.)

### 5. Puerta parental (reautenticación) para acciones sensibles

Las acciones **destructivas o de cuenta** (borrar datos en la nube, cerrar/borrar
la cuenta del tutor, cambiar el email, exportar datos) exigen **reautenticación
del tutor** (Firebase `reauthenticateWithCredential`) inmediatamente antes de
ejecutarse. Esto evita que un niño con la app abierta ejecute acciones de cuenta.

### 6. CI/CD y firma: APK debug sin firmar en PR; release firmado solo en main/tag

- **En cada PR**: CI construye el web bundle, sincroniza Capacitor y genera un
  **APK debug SIN firmar** (con la clave debug estándar de Android), publicado como
  **artefacto del workflow** para prueba manual. No requiere secretos.
- **En `main` / tag**: build de **release firmado** mediante **Play App Signing**.
  Los secretos de firma (keystore de subida, credenciales) viven **tras un GitHub
  Environment protegido** (aprobación/entorno restringido), **nunca en el repo ni
  en logs**.
- **Ningún secreto de firma se commitea.** `.gitignore` excluye keystores, `.jks`,
  `google-services.json` y `key.properties`.

### 7. Configuración por variables de entorno; emulador para desarrollo

- La configuración de Firebase se inyecta por **variables `VITE_FIREBASE_*`**
  (públicas por naturaleza en apps cliente Firebase; no son secretos, pero se
  gestionan por entorno para no fijar un proyecto concreto en el código).
- **No existe todavía un proyecto Firebase real.** Mientras no lo haya, el
  desarrollo y las pruebas de reglas de Firestore y flujos de auth corren contra la
  **Firebase Local Emulator Suite**. El código detecta el modo emulador por env var
  y no exige credenciales de producción para arrancar en desarrollo.

---

## Plan de entrega (incrementos técnicos)

Producto: "todo de una vez" (no se lanza una app a medias). Ingeniería: se trocea
en PRs revisables (ver `docs/specs/07-app-android-firebase.md` y `docs/BACKLOG.md`):

1. Shell Capacitor + empaquetado Android + CI de APK debug (sin Firebase) + retirada de GitHub Pages.
2. Firebase Auth + pantallas de alta/consentimiento del tutor (contra emulador).
3. Firestore + perfiles de hijo + reglas de seguridad.
4. Migración del progreso `localStorage` existente a la nube.
5. Puerta parental + endurecimiento.
6. Copy legal + política de privacidad + DPIA (viaja con el incremento que introduce la nube).
7. Retirada final de GitHub Pages (cubierta ya en Inc. 1).

---

## Consecuencias

**Positivas:**
- Se reutiliza el 100% del frontend actual; el pivote no tira código.
- Datos del niño minimizados y sin PII: la superficie de riesgo legal se reduce.
- Offline-first: la experiencia del niño no depende de la red.
- Separación estricta de responsabilidades: email en Auth, PIN local, progreso en
  Firestore. Cada dato en un solo sitio, verificable.

**Negativas / trade-offs (respecto a ADR-001):**
- **Se rompe la promesa "nada sale del dispositivo".** Ahora el progreso del niño
  y la cuenta del tutor sí salen a la nube. **El copy de privacidad DEBE
  reescribirse en el mismo cambio que introduce la nube** (no después): README,
  footer, `.env.example` y una **política de privacidad** nueva; más una **DPIA**
  por tratarse de datos de menores. (Requisito del Abogado — ver "Puntos legales
  abiertos".)
- Aparece coste de infraestructura (Firebase) y complejidad operativa (entornos,
  secretos, firma). Lo asume DevOps.
- Se pierde la simplicidad de "hosting estático sin backend".

**Riesgos:**
- Configurar mal las **reglas de Firestore** expondría datos entre cuentas: son el
  control de seguridad central y las revisa Seguridad en cada incremento que las
  toque.
- Si un implementador reintrodujera el email en Firestore o el PIN en la nube, se
  romperían las decisiones §2/§4: Seguridad verifica esto explícitamente contra
  este ADR en su gate.

---

## Puntos legales abiertos (para el Abogado, antes de exponer la nube a usuarios reales)

1. **Residencia de datos de Firebase Auth.** Firestore se aprovisiona en la UE,
   pero **Firebase Authentication no garantiza residencia UE** del mismo modo
   (los datos de Auth pueden procesarse fuera). El Abogado debe valorar el impacto
   RGPD (transferencias internacionales / SCCs) y documentarlo.
2. **DPIA obligatoria** por tratamiento de datos de menores; debe existir antes del
   lanzamiento real.
3. **Base jurídica y consentimiento del tutor** (RGPD art. 6/8): el alta del tutor
   incluye pantalla de consentimiento informado; el Abogado valida el texto.
4. **Política de privacidad** publicada, enlazada desde la app y la ficha de Play.
5. **Google Play Families / Data safety**: declaración de datos recogidos coherente
   con la minimización de este ADR.

Estos puntos **no bloquean** el desarrollo de los incrementos, pero **sí bloquean**
la exposición de la nube a usuarios reales (gate del Abogado).

---

## Alternativas consideradas

### Empaquetado — React Native
Reescritura total de la UI. Descartado: tira la inversión en pantallas, a11y e i18n.

### Empaquetado — TWA / PWA en Play
Exige mantener la URL pública y relación de dominio; contradice retirar Pages y
complica offline. Descartado.

### Auth — cuenta o PIN del niño como credencial en la nube
Convertiría al niño en sujeto identificado con credencial: más PII, más riesgo
legal, más superficie de ataque. Descartado: el niño no es una cuenta.

### Backend propio (Node + Postgres) en vez de Firebase
Más control, pero mucho más coste operativo y de seguridad para un proyecto de una
persona. Firebase (Auth + Firestore gestionados, reglas declarativas, offline SDK)
cubre el caso con menos superficie que mantener. Descartado por ahora.

---
<!-- Copiar este archivo como docs/decisions/ADR-NNN-titulo-en-kebab-case.md -->
<!-- Nunca reutilizar un número, aunque el ADR se deprece -->
