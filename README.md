# Repasos de Primaria

Ejercicios y juegos educativos para repasar lo aprendido en Primaria. App instalable en Android, gratuita, pensada para que el niño juegue sin cuenta y con su progreso guardado en el dispositivo; de forma opcional, un adulto puede crear una cuenta para sincronizar ese progreso en la nube.

> **Alcance actual:** la app cubre la selección de curso de 1.º a 6.º de Primaria, con el progreso guardado por separado en cada curso. El **contenido de actividades está disponible por ahora para 3.º**; el resto de cursos aparecen en el selector marcados como "Pronto" mientras se preparan sus ejercicios.

## ¿Qué es esto?

**Repasos de Primaria** es una pequeña aplicación web pensada para que un niño o niña de Primaria repase lo que ha trabajado en clase. No hay deberes que entregar ni nadie vigilando: el niño elige su curso y una materia, resuelve ejercicios cortos, gana estrellas e insignias, y mantiene una racha diaria que le anima a volver al día siguiente. Cada curso guarda sus propios avances, sin mezclarse con los de otro.

Está hecha para usarse cómodamente **en tablet** (también funciona en móvil y ordenador) y es **ligera y rápida** incluso en dispositivos modestos. El **progreso del niño** (racha, estrellas, preferencias) se guarda **en el propio dispositivo** y funciona sin conexión. De forma **opcional**, un adulto (madre, padre o tutor) puede crear una cuenta para **guardar y sincronizar** ese progreso **en la nube** (Firebase, con la base de datos en región europea): en ese caso, salen del dispositivo únicamente el **correo del adulto** y el **progreso** —nunca ningún dato que identifique al niño, ni su PIN—. Los detalles están en la [política de privacidad](docs/legal/privacy-policy.md).

Además del modo interactivo, ofrece una **versión imprimible**: hojas de ejercicios en papel (con o sin soluciones) que un adulto puede imprimir o guardar como PDF desde el propio navegador.

### Características clave

- **5 materias:** Matemáticas, Lengua, Ciencias (*Natural Science*, en inglés), Ciencias Sociales e Inglés (*English*). Ciencias e Inglés presentan su contenido siempre en inglés (es la lengua de la asignatura); Lengua siempre en español; Matemáticas y Sociales siguen el idioma elegido en la interfaz.
- **4 tipos de ejercicio:** opción múltiple, verdadero/falso, respuesta corta y emparejar.
- **Números aleatorios en Matemáticas:** los ejercicios de cálculo (sumas, restas, tablas, multiplicación por una cifra y divisiones exactas) generan sus operandos en cada sesión, con rangos apropiados para 3º. La respuesta se calcula, no se almacena.
- **Gamificación sin cuenta:** racha diaria, estrellas, insignias (la "mochila"), objetivo diario, avatar y mote elegidos en el onboarding. Todo persiste en `localStorage`, sin registro.
- **Versión imprimible:** hojas de ejercicios para papel, con opción de incluir soluciones, vía `window.print()` del navegador (sin librerías pesadas de PDF).
- **Multiidioma (i18n) EN/ES** desde el primer día: ningún texto va escrito a mano en el código, todo pasa por claves de traducción.
- **Privacidad por diseño:** el niño no tiene cuenta ni aporta datos personales; su progreso y su PIN **no salen del dispositivo**. La cuenta del adulto (opcional) usa Firebase Authentication y el progreso se sincroniza en Cloud Firestore (**región europea**), minimizando los datos personales tratados. Sin analítica ni publicidad, y sin cookies de terceros con fines comerciales — única excepción, estrictamente de seguridad: Google reCAPTCHA v3 (Firebase App Check, en modo monitor) para proteger las cuentas frente a abuso automatizado, sin fines analíticos ni publicitarios. Ver [ADR-003](docs/decisions/ADR-003-android-firebase.md), [ADR-005](docs/decisions/ADR-005-app-check-recaptcha-interino.md), la [política de privacidad](docs/legal/privacy-policy.md) y la [DPIA](docs/legal/dpia.md).
- **Accesibilidad:** tipografía Atkinson Hyperlegible, soporte de movimiento reducido, contraste cuidado (ver `docs/design/02-criterios-accesibilidad.md`).

## Stack tecnológico

| Tecnología | Versión | Para qué |
|---|---|---|
| [Vite](https://vitejs.dev/) | ^6 | Build y servidor de desarrollo; genera el sitio estático |
| [React](https://react.dev/) | ^18.3 | Librería de interfaz |
| [TypeScript](https://www.typescriptlang.org/) | ^5.7 | Tipado de todo el código y del modelo de contenido |
| [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) | ^23 / ^15 | Internacionalización EN/ES con detección de idioma |
| [Vitest](https://vitest.dev/) | ^2.1 | Tests unitarios y de integración |
| [ESLint](https://eslint.org/) | ^9 | Linting |
| [@fontsource/atkinson-hyperlegible](https://www.npmjs.com/package/@fontsource/atkinson-hyperlegible) | ^5 | Tipografía de alta legibilidad |

> Nota: `react-router-dom` figura en las dependencias, pero el enrutado actual se resuelve por estado local en `src/App.tsx` (las vistas son pocas y el flujo es lineal). Ver ADR-001 §1.

Decisiones de arquitectura completas: [`docs/decisions/ADR-001-stack-y-arquitectura.md`](docs/decisions/ADR-001-stack-y-arquitectura.md).

## Requisitos previos

- **Node.js 22** o superior (el CLI de Capacitor lo exige; el CI de lint/build usa Node 20, el de empaquetado Android usa Node 22).
- **npm** (incluido con Node). El proyecto usa `package-lock.json`.

Para el desarrollo local no hace falta nada más: sin configurar Firebase, la app arranca en **modo local** (sin nube). La configuración de Firebase (Auth/Firestore) es **opcional** y se activa por variables de entorno; ver [Variables de entorno](#variables-de-entorno) y [ADR-003](docs/decisions/ADR-003-android-firebase.md).

## Instalación y configuración local

Desde una máquina limpia:

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/RepasosDePrimaria.git
cd RepasosDePrimaria

# 2. Instalar dependencias (usa el lock file)
npm ci
```

Opcionalmente, copia el archivo de variables de entorno de referencia (no es necesario para arrancar, ver más abajo):

```bash
cp .env.example .env.local
```

## Variables de entorno

La app **funciona sin ninguna variable de entorno** (modo local, sin nube). Para activar el guardado en la nube (cuenta del adulto + progreso en Firestore) se usan variables `VITE_FIREBASE_*` **opcionales**, documentadas en [`.env.example`](.env.example). Ninguna es obligatoria para arrancar.

| Variable | Descripción | Obligatoria | Ejemplo |
|---|---|---|---|
| `VITE_FIREBASE_*` | Config pública del cliente Firebase (Auth/Firestore). Sin ellas, la app funciona en modo local | No | ver [`.env.example`](.env.example) |
| `VITE_FIREBASE_USE_EMULATOR` | Usa el emulador de Firebase en desarrollo, sin proyecto real | No | `true` |

Notas importantes:

- Toda variable expuesta al cliente lleva el prefijo `VITE_`. **Cualquier `VITE_*` es pública** (acaba en el bundle del navegador): la config de Firebase no es secreta, pero **nunca pongas secretos reales** (claves de firma, credenciales de servidor) en variables `VITE_*`.
- El *base path* de Vite es **relativo (`"./"`)** para que la aplicación se ejecute dentro de la app Android (Capacitor); está fijado en [`vite.config.ts`](vite.config.ts). Ver ADR-003.

## Cómo ejecutar

```bash
# Servidor de desarrollo con recarga en caliente (HMR)
npm run dev

# Compilar el sitio estático de producción (TypeScript + Vite) → carpeta dist/
npm run build

# Previsualizar localmente el build de producción
npm run preview
```

Tras `npm run dev`, abre la URL que imprime Vite en consola (por defecto `http://localhost:5173/`).

## Cómo ejecutar los tests

```bash
# Lanzar la suite de tests en modo watch
npm test

# Lanzar la suite una sola vez (modo CI)
npm run test:run

# Linting + comprobación de tipos
npm run lint
```

La suite incluye **113 tests** (motor de quiz, generación de números aleatorios, cálculo de racha, persistencia en localStorage, insignias, consolidación de progreso y verificación de claves i18n en EN/ES).

## Estructura del proyecto

```
RepasosDePrimaria/
├── content/                  # Contenido educativo (modelo de datos tipado)
│   ├── materias.json         # Índice de materias y temas
│   ├── types.ts              # Tipos del esquema de ejercicios (Ejercicio, EjercicioGenerado…)
│   ├── registry.ts           # API de consulta del contenido (sin tocar JSON directamente)
│   └── exercises/            # Un módulo por materia (matematicas, lengua, ciencias, sociales, ingles)
├── locales/                  # Traducciones i18n
│   ├── en/                   # Inglés (fallback técnico)
│   └── es/                   # Castellano (uso real)
├── public/                   # Activos estáticos servidos tal cual (rumbo.svg…)
├── src/
│   ├── App.tsx               # Enrutado por estado y orquestación de pantallas
│   ├── main.tsx              # Punto de entrada
│   ├── components/           # Componentes de UI reutilizables (+ CSS Modules)
│   ├── screens/              # Pantallas (Home, Onboarding, Session, Backpack, Print…)
│   ├── hooks/                # Hooks (useSession…)
│   ├── lib/                  # Lógica de dominio (quizEngine, randomMath, streak, storage, badges…)
│   ├── state/                # Estado global del juego (gameStore, consolidation)
│   ├── i18n/                 # Configuración de i18next y carga de namespaces
│   └── styles/               # Estilos base, tokens de diseño y estilos de impresión
├── android/                  # Proyecto Android nativo (Capacitor) — envuelve el bundle web
├── capacitor.config.ts       # Configuración de Capacitor (appId, webDir)
├── docs/                     # Documentación interna (specs, decisiones, diseño, devops)
├── .github/workflows/        # CI (lint + build) y empaquetado del APK Android
├── vite.config.ts            # Configuración de Vite (base path relativo, alias @/@content/@locales)
└── CHANGELOG.md              # Historial de versiones
```

## Cómo empaquetar la app Android

La aplicación es una **app instalable en Android** empaquetada con [Capacitor](https://capacitorjs.com): el mismo bundle web de Vite se ejecuta dentro de un WebView nativo. Ver [ADR-003](docs/decisions/ADR-003-android-firebase.md).

```bash
# Construir el bundle web y sincronizarlo con el proyecto Android
npm run cap:sync

# Abrir el proyecto en Android Studio (requiere Android Studio instalado)
npm run android:open
```

Para compilar el APK de prueba desde línea de comandos se necesita el **Android SDK + JDK**:

```bash
cd android && ./gradlew assembleDebug   # → android/app/build/outputs/apk/debug/app-debug.apk
```

### Integración continua

- Cada **Pull Request** y cada **push a `main`** disparan el workflow [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml), que construye un **APK debug sin firmar** y lo publica como artefacto descargable del workflow. No requiere secretos.
- En **push a `main` o tag `vX.Y.Z`**, además se prepara el **AAB de release firmado** mediante Play App Signing, con los secretos de firma tras un **GitHub Environment protegido** (`android-release`). Mientras esos secretos no existan, ese paso avisa y no falla.
- Las Pull Requests pasan también por [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (lint + build). **CI verde es requisito para hacer merge.**
- Los archivos internos (`.claude/`, `CLAUDE.md`, `.github/`, `docs/`, `CHANGELOG.md`) y cualquier clave de firma **nunca** se incluyen en la app ni se versionan.

> **Nota:** el proyecto ya no se publica en GitHub Pages; el canal de distribución es la app instalable. Configuración de *branch protection*: ver [`docs/devops/github-pages-setup.md`](docs/devops/github-pages-setup.md).

## Cómo mantener el proyecto (veranos sucesivos)

Esta sección recoge las dos tareas de mantenimiento más habituales, pensada para quien retome el proyecto en el futuro.

### Añadir un ejercicio nuevo al catálogo

El contenido es **JSON/TS tipado**: añadir ejercicios no requiere tocar lógica, solo datos.

1. Localiza el módulo de la materia en `content/exercises/` (`matematicas.ts`, `lengua.ts`, `ciencias.ts`, `sociales.ts`, `ingles.ts`).
2. Añade un objeto que cumpla el tipo `Ejercicio` (o `EjercicioGenerado` para cálculo de Matemáticas) definido en [`content/types.ts`](content/types.ts):
   - `id` **estable y único** (ej. `"mat-3-sumas-001"`).
   - `materia`, `tema`, `nivel` (`"3"` o `"4"`), `tipo` (`opcion-multiple`, `verdadero-falso`, `respuesta-corta`, `emparejar`).
   - `enunciadoKey`, `textoKey` de opciones y `pistaKey` son **claves i18n**, no texto literal: añade su traducción en `locales/en/` y `locales/es/` (normalmente en `exercises.json` o `content.json`).
   - `imprimible: true/false` según deba aparecer en las hojas de papel.
3. Si el tema es nuevo, decláralo en [`content/materias.json`](content/materias.json) dentro de la materia correspondiente (con `disponible: true` cuando ya tenga contenido; `false` muestra estado "Pronto").
4. TypeScript valida la forma del ejercicio al compilar; los tests de claves i18n (`src/lib/i18n-content.test.ts`) verifican que cada clave referenciada existe en EN y ES. Ejecuta `npm run lint` y `npm run test:run` antes de subir.

> Materias con idioma fijo: Lengua (solo ES), Ciencias e Inglés (solo EN). Ver `FIXED_LANGUAGE_SUBJECTS` en [`content/registry.ts`](content/registry.ts): el contenido de esas materias se resuelve siempre en su idioma, independientemente del selector de la interfaz.

### Añadir un idioma nuevo

La internacionalización está pensada para que añadir un idioma **no requiera tocar código de la interfaz**, solo traducciones:

1. Crea la carpeta `locales/<idioma>/` con **los mismos archivos JSON** que `locales/en/` (mismos namespaces: `common`, `home`, `onboarding`, `subjects`, `quiz`, `results`, `backpack`, `print`, `settings`, `content`, `exercises`).
2. Traduce los valores manteniendo las mismas claves.
3. Registra el idioma en [`src/i18n/index.ts`](src/i18n/index.ts): importa los nuevos JSON, añádelos a `resources` y al array `supportedLngs`.
4. Recuerda la regla i18n del proyecto: **ningún string visible va escrito a mano en el código**; todo pasa por clave. Las claves siguen el patrón `namespace.componente.elemento`.

Detalles completos en `docs/specs/06-i18n-textos-ui.md` y ADR-001 §2.

## Aviso sobre el contenido

Todas las preguntas y ejercicios de esta aplicación son de elaboración propia. Se han redactado tomando como referencia el currículo oficial de Educación Primaria vigente en España (Ley Orgánica 3/2020, LOMLOE, y el Real Decreto 157/2022, de 1 de marzo, por el que se establecen la ordenación y las enseñanzas mínimas de la Educación Primaria, junto con la normativa autonómica de desarrollo que corresponda).

No se ha copiado, reproducido ni adaptado material de libros de texto ni de ninguna editorial. Los enunciados, las respuestas y su formulación son originales. Cualquier parecido con contenidos de terceros sería casual y no intencionado.

Si crees que algún contenido pudiera infringir derechos de propiedad intelectual, puedes comunicárnoslo a través del repositorio del proyecto en GitHub y lo revisaremos, retirándolo o corrigiéndolo si procede.

<details>
<summary><strong>Content notice (English)</strong></summary>

All questions and exercises in this application are original works. They have been written using the official primary-education curriculum in force in Spain as a reference (Organic Law 3/2020, LOMLOE, and Royal Decree 157/2022 of 1 March, which sets out the organisation and minimum requirements of Primary Education, together with the applicable regional implementing regulations).

No material from textbooks or from any publisher has been copied, reproduced or adapted. The wording of the questions, the answers and their phrasing are original. Any resemblance to third-party content would be coincidental and unintentional.

If you believe any content may infringe intellectual property rights, you can let us know through the project's GitHub repository and we will review it, removing or correcting it where appropriate.

</details>

## Contribuir

Este es un proyecto personal y gratuito, pero el flujo de trabajo está pensado para ser ordenado y transferible:

- **Reportar un bug o proponer una mejora:** abre una issue usando las plantillas de [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/) (`bug_report.md` / `feature_request.md`).
- **Ramas:** una rama de vida corta por cambio, con nomenclatura `tipo/descripcion-en-kebab-case` (`feat/`, `fix/`, `docs/`, `chore/`…). `main` está protegida: nunca se commitea directamente.
- **Pull Requests:** usa la plantilla [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). El CI (lint + build) debe estar en verde antes del *merge*, que se hace por **squash**.
- **Antes de subir:** ejecuta `npm run lint` y `npm run test:run` en local.
- **Changelog:** todo cambio relevante para el usuario se anota en la sección `[Unreleased]` de [`CHANGELOG.md`](CHANGELOG.md), siguiendo [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
- **Versionado:** [Semantic Versioning](https://semver.org/lang/es/) (`MAJOR.MINOR.PATCH`).

## Licencia

Todos los derechos reservados. El uso de la aplicación desplegada es gratuito para uso personal, educativo y no comercial; la reutilización del código o del contenido requiere autorización previa. Ver [`LICENSE`](LICENSE) para el texto completo (ES/EN).

---

Hecho para que aprender en verano no pese. ☀️
