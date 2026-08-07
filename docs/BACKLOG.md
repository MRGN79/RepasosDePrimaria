# Backlog de producto

Items anotados para implementar en el futuro, ordenados por aparición. No implican prioridad; el orden lo decide el usuario.

---

## Trabajo Activo

| Feature | Rama | Estado |
|---|---|---|
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 1: shell Capacitor + Android + CI de APK debug + retirada de GitHub Pages | `feat/capacitor-android-shell` (mergeada) | ✅ Mergeada en `main` (`2fc4ed4`) |
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 2: Firebase Auth + pantallas de alta/consentimiento del tutor | `feat/firebase-auth-tutor` (mergeada) | ✅ Mergeada en `main` (`72c908f`). Pantallas cableadas al flujo de entrada de la app en Inc. 3 (`AppRoot` + `CloudGameProvider`). **Ya conectado al proyecto Firebase real** (`repasos-de-primaria`, Firestore en `europe-southwest1`/Madrid): Authentication y Firestore configurados, keystore de debug fijo para Google Sign-In (PR #33), `firestore.rules` desplegadas a producción manualmente, y `.env.production` activa la nube en los builds de producción de la CI (`929276b`). Deja de correr solo contra el emulador |
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 3: Firestore + perfiles de hijo + reglas de seguridad | `feat/firestore-perfiles-multi-cuenta` (mergeada) | ✅ **Mergeada en `main`** (`1ed6f0b`, PR #31, squash). Implementa ADR-004 sobre ADR-003. **Completo y verificado contra el emulador:** `firestore.rules` definitivas (frontera uid+email_verified, role/consentimiento/createdAt inmutables, allowlist por documento, asimetría proveedor↔rol, ramificación tutor/kid, tope de hijos por contador transaccional, prohibición de PII) + **39 tests de reglas** (`npm run test:rules`). Capa de datos Firestore, Google Sign-In + paso de rol + reto de adulto, PIN-pestillo local, cuenta de niño directa, persistencia offline, y el cableado del flujo de entrada (`AppRoot` + `CloudGameProvider`). Notas de implementación en `docs/decisions/inc3-notas-implementacion.md`. **Gates:** Tester ✅ (2043 tests + 39 de reglas) · QA ✅ · Accesibilidad ✅ (tras fix de contraste/touch-targets/color) · Abogado ✅ (tras sincronizar `docs/legal/privacy-policy.md`, `dpia.md` y `play-data-safety.md` con el modelo de cuenta de niño de ADR-004). Verificaciones que requieren proyecto Firebase real o WebView (Google Sign-In nativo, offline e2e, Family Link) en `.claude/pending-actions.md`. **Fuera de alcance (siguen pendientes):** Inc. 4 (migración del progreso `localStorage` existente — ahora hay **dos rutas de cuenta** a las que migrar), Inc. 5 (puerta parental completa para acciones destructivas), y la Cloud Function de borrado en cascada (ADR-003 §5). Sin bump de versión: se mantiene dentro de 0.6.0 del pivote |
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 4: Migración del progreso `localStorage` existente a la nube | `feat/migracion-progreso-local` (mergeada) | ✅ **Mergeada en `main`** (`e08eaaf`, PR #32, squash). Specs en `docs/specs/07` (Épica E, US-E1…US-E8), diseño técnico en `docs/decisions/inc4-notas-tecnicas.md`, diseño UX en `docs/design/01-flujos-y-pantallas.md` (§11-13). Cubre: aviso explícito de migración al crear el primer perfil (Modelo A y Modelo B); **verify-before-delete** con `getDocFromServer` (nunca caché) antes de borrar el local; fusión **anti-retroceso** (`mergeNonRegressing`, nunca reduce progreso); migración de **todos los cursos** con avance, no solo el activo; **una sola vez por dispositivo** (marcador en `localStorage`, sin fusión entre hermanos); **reanudación/reintento** si el alta se cancela o la verificación falla; **cambio de cuenta de tutor** en Ajustes protegido por reto de adulto. **Gates:** Tester ✅ (2081 tests + 43 de reglas/emulador) · QA ✅ · Responsabilidad Social ✅ · Seguridad ✅ (uid en localStorage revisado y aceptado; aislamiento entre cuentas confirmado por reglas) · Accesibilidad ✅ (tras fix de jerarquía de encabezados y separación táctil) · Abogado ✅ (tras precisar en la política de privacidad el traslado del progreso preexistente). Sin bump: dentro de 0.6.0 del pivote |
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 6: Copy legal + política de privacidad + DPIA | `claude/incremento-6-fx1iwx` (mergeada) | ✅ Mergeada en `main` (`f168ec2`, PR #28) — entregada **adelantada a Inc. 3** (Inc. 2 ya hizo falsa la promesa "nada sale del dispositivo"). Política de privacidad (pantalla en la app + `docs/legal/privacy-policy.md`), DPIA (`docs/legal/dpia.md`), mapeo de Play Data Safety (`docs/legal/play-data-safety.md`) y reescritura del copy en README, `.env.example` y footer. Validado por el Abogado. Acciones del usuario en `.claude/pending-actions.md` (DPA de Google, URL pública de la política, formulario Data Safety, revisión legal humana) |
| **Contenido de 1.º, 2.º, 4.º, 5.º y 6.º de Primaria (MVP ligero)** — catálogo multi-curso con contenido (refactor de infraestructura: registry/catalog conscientes de curso, aislamiento entre cursos) + paquete jugable en las 5 materias troncales de **todos los cursos que faltaban** (ya había 3.º), alineado a LOMLOE (RD 157/2022) | `feat/contenido-2do-primaria-mvp` (mergeada) | ✅ Mergeada en `main` (`cb92252`, PR #29). Adenda a ADR-002 + specs `08` (2.º) y `09` (1.º/4.º/5.º/6.º). **2.º**: 13 temas (numeración/suma/resta/tablas, sílabas/mayúsculas/plural, sentidos/cuerpo/animales, familia/colegio/barrio, números/colores/mascotas). **1.º/4.º/5.º/6.º**: un tema por materia (20 temas, 108 ítems estáticos), p. ej. 1.º sumas-hasta-10 + vocales + seres vivos + estaciones + saludos; 6.º porcentajes + diptongos + energía + UE + comida. Generadores de cálculo nuevos: `add-to-ten` (1.º) y `multiply-two-digit` (4.º), sumados a los 3 de 2.º. Los 6 cursos aislados por `nivel` (test multi-curso cubre 1.º-6.º). Versión: se mantiene `0.6.0` (sin bump, viaja con el pivote Firebase). Contenido original propio, mismo estándar legal que 3.º |
| **App Check (reCAPTCHA v3, modo monitor) — mitigación del hallazgo de Seguridad de la API key Web** — cierra el hallazgo ⚠️ del gate de Seguridad del commit `929276b` (la API key de la app Web queda sin restricción efectiva; SHA-1 es solo para apps Android nativas). Nace de Seguridad, no de un incremento planificado del pivote. Implementa ADR-005 | `claude/pending-work-review-7b7hgz` (PR #35) · `chore/activar-site-key-appcheck` (PR #38) | ✅ **Mergeada en `main`** (PR #35, `5591637`). Firebase App Check con `ReCaptchaV3Provider` en **modo monitor** (nunca bloquea), aislado en `resolveAppCheckProvider` para migrar a **Play Integrity** cuando sea viable (keystore de release + Play Console + plugin nativo de Capacitor). Un único archivo de código (`src/lib/firebase/config.ts`); **no** toca `firestore.rules` (enforce es un toggle de consola futuro). Docs: ADR-005 (nuevo), ADR-003 §9 (puntero), DPIA (R6 corregido + R10 nuevo), política de privacidad ES/EN (excepción estrictamente de seguridad). **Site key activada** (PR #38, `a967951`): la app Web quedó registrada en Firebase Console (reCAPTCHA v3, dominio `localhost` autorizado — origen del WebView de Capacitor) y `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` cableada en `.env.production`; hasta ahora App Check era no-op, ahora el modo monitor genera telemetría real. Sigue en **Monitor**, NO Enforce (toggle de consola sin cambiar). Sin cambio de comportamiento observable para el usuario. 2081 tests y build sin cambios. **Sin bump**: se mantiene dentro de `0.6.0` del pivote (coherente con Inc. 3/4 y contenido multi-curso; la trazabilidad la aportan ADR-005 + changelog `Security`). Enforce y migración a Play Integrity quedan pendientes en `.claude/pending-actions.md` |

| **Fix: restaurar "jugar sin cuenta"** — al activar la nube en producción (`929276b`/PR #34) la pantalla de acceso se quedó sin salida sin login, contradiciendo ADR-003/004 (cuenta siempre opcional). Reportado directamente por el usuario, no nace de un incremento planificado | `fix/jugar-sin-cuenta` (mergeada) | ✅ **Mergeada en `main`** (`dea7f9f`, PR #40, squash). `TutorAuthScreen` gana un enlace "Jugar sin cuenta" (mismo árbol 100% local que con la nube deshabilitada); Ajustes gana "Crear cuenta" para el alta diferida, sin perder el progreso (usa la migración local→nube ya existente). `account` pasa a unión discriminada `{mode:"switch"\|"create"}` en `App.tsx`/`SettingsScreen.tsx`. **Gates:** QA ✅ (tras corregir un estado colgante: `skippedAccount` no se reseteaba al cerrar sesión) · Accesibilidad ✅ · Responsabilidad Social ✅ (elimina una barrera de entrada, sin dark patterns) · Abogado ✅ (sin cambios necesarios en política de privacidad/DPIA/Play Data Safety: el modo sin cuenta ya estaba cubierto). Sin cambios en tratamiento de datos: el modo sin cuenta es el mismo modo local ya cubierto por la política de privacidad. Sin bump: dentro de `0.6.0` del pivote |

| **Fix: Google Sign-In nativo (ADR-006)** — `signInWithPopup` no funciona en el WebView de Capacitor (confirmado por el usuario en un dispositivo real: se abre un navegador externo y la app se queda colgada). Se sustituye por `@capacitor-firebase/authentication` en modo `skipNativeAuth` (picker nativo, la sesión la sigue gestionando el SDK Web de Firebase) | `fix/google-signin-nativo` (Paso 1, mergeada) → `fix/google-signin-wire` (Paso 2, en curso) | 🔄 En curso, por pasos verificables en tablet real. **Paso 0** ✅: SHA-1 del keystore de debug registrado en Firebase Console, `google-services.json` regenerado con el cliente OAuth Android (`client_type: 1`) ya presente. **Paso 1** ✅ **Mergeado en `main`** (PR #41, `0eb6fdd`): dependencia instalada (Abogado ✅ licencia Apache-2.0), `capacitor.config.ts` configura el plugin, `cap sync` registra los módulos nativos, CI inyecta `google-services.json` desde el secreto `GOOGLE_SERVICES_JSON_BASE64`. Efecto colateral (bug real, separado, corregido de paso): `@capacitor/preferences` (PIN de pestillo, Inc. 3) nunca se había registrado en el proyecto Android nativo tras añadirse. **Paso 2** (este commit, sin mergear todavía): `signInWithGoogle()` cableado de verdad — plataforma nativa usa el picker (`skipNativeAuth: true` en la llamada, no solo en la config global) y entrega el idToken a `signInWithCredential` del SDK Web; detección de cancelación del picker (clave i18n `errors.cancelled`). **Gates:** QA ✅ (con recomendación aplicada: `extractCode`/`errorKeyFromCode` exportadas + 9 tests unitarios nuevos en `auth.test.ts`) · Seguridad ✅ (frontera de confianza del idToken, invariante `skipNativeAuth`, App Check intacto — sin hallazgos de seguridad) · Abogado ✅ (sin cambios legales, ADR-006 basta). **Hallazgo crítico de Seguridad, corregido en el mismo commit**: `rgcfaIncludeGoogle` no estaba activado en `android/variables.gradle` — sin él, Play Services Auth y `androidx.credentials` quedaban `compileOnly` (no empaquetados) y el picker nativo habría fallado en el dispositivo con `NoClassDefFoundError` pese a que el código pasaba todos los gates. Confirmado y corregido contra la guía oficial del plugin (`rgcfaIncludeGoogle = true` + `androidxCredentialsVersion = '1.3.0'`). **Pendiente**: abrir PR del Paso 2, y Paso 3 (verificar en la tablet: rol tutor, rol niño, cancelación, sin red, cuentas Family Link) |

**Decisión de arquitectura del pivote:** `docs/decisions/ADR-003-android-firebase.md` (incorpora las condiciones de Seguridad: email del tutor solo en Firebase Auth, PIN del hijo solo local, puerta parental, CI endurecido). Specs e incrementos en `docs/specs/07-app-android-firebase.md`. Punto legal abierto para el Abogado: residencia de datos de Firebase Auth + DPIA. Bloqueo externo: la creación real del proyecto Firebase (consola, credenciales) requiere una acción manual del usuario, no automatizable desde aquí.

**Plan de entrega en incrementos técnicos** (el ADR decide "todo de una vez" como producto — no se lanza al usuario una app a medias — pero internamente se trocea en PRs revisables):

1. **Shell Capacitor + Android + CI de APK debug** — envoltorio nativo, sin Firebase todavía; desbloquea todo lo demás. Retira GitHub Pages (el pipeline de APK pasa a ser el artefacto publicado). ← _en curso_
2. **Firebase Auth + alta/consentimiento del tutor** — email/contraseña del tutor con verificación obligatoria; pantallas de registro y consentimiento; corre contra el emulador de Firebase mientras no haya proyecto real. ← _iniciado_
3. **Firestore + perfiles de hijo + reglas de seguridad** — datos en la nube región europea, offline-first; el niño opera bajo la cuenta del tutor sin login ni PII.
4. **Migración del progreso local existente** — el progreso `localStorage` (esquema v2) se asocia al primer perfil de hijo del tutor sin pérdida.
5. **Puerta parental + endurecimiento** — reautenticación para acciones destructivas/de cuenta; endurecimiento de reglas.
6. **Copy legal + política de privacidad + DPIA** — reescritura del aviso "nada sale del dispositivo", política de privacidad, DPIA. _Debe viajar en el mismo cambio que introduce la nube (Inc. 2/3), no después._ ← ✅ **Mergeado en `main`** (PR #28), adelantado a Inc. 3 (Inc. 2 ya introdujo la cuenta del tutor, haciendo falsa la promesa antigua). Ver "Trabajo Activo".
7. **Retirada final de GitHub Pages** — ya cubierta en Inc. 1 al existir el pipeline de APK.

---

## Decisiones de arquitectura pendientes (sin resolver)

Dilemas de diseño registrados que **aún no tienen decisión**. No confundir con las decisiones ya tomadas (ADRs) ni con las acciones diferidas de `.claude/pending-actions.md`.

- **Compartir la cuenta del tutor entre los dos progenitores.** Un niño que usa la app en el móvil de mamá y en el de papá tropieza con que cada progenitor tiene su **propia identidad de Firebase Auth**, así que no pueden compartir el mismo progreso del niño sin compartir credenciales o duplicar cuentas. Se discutió en sesión y **ninguna de las dos opciones planteadas convenció al usuario**: (1) **compartir credenciales** de una única cuenta de tutor entre ambos progenitores (simple, pero rompe la premisa de una identidad = una persona y complica la puerta parental/reautenticación) y (2) **cuentas separadas por progenitor** con progreso duplicado o no compartido (respeta las identidades, pero fragmenta el progreso del niño). **Sigue sin resolver.** Queda fuera del alcance de ADR-003 y ADR-004 (que no lo abordan) y del Inc. 3. Explorar cuando se retome: modelos de cuenta compartida / co-tutores (p. ej. invitar a un segundo adulto a la misma cuenta lógica del niño), con sus implicaciones de seguridad (Arquitecto ↔ Seguridad) y legales (dos responsables de tratamiento). _No iniciar sin decisión del usuario._

---

## Dirección de producto (cambios mayores a futuro)

Registrados a petición del usuario. No son features incrementales sobre la web actual: implican cambios de naturaleza del producto.

- **Monetización (dos vías, interés comercial explícito del usuario).** (1) **Donativos voluntarios** y (2) **publicidad ligera y no invasiva** ("muy poca, nada invasiva"). Dado el interés comercial explícito, cuando se aborde debe **invocarse a Growth**: primero en modo consultor (dictamen de potencial) y, si el usuario confirma interés, en modo estratega. No iniciar ahora. Nota: el ADR-001 registraba el proyecto como "gratuito, sin interés comercial"; esa premisa ha cambiado y deberá revisarse al abrir la vía comercial. El `LICENSE` propietario ya elegido (ver Historial) mantiene abierta esta vía sin ceder derechos de reutilización. _(El pivote a app Android + Firebase, antes en esta sección, ha pasado a "Trabajo Activo".)_

---

## Deuda técnica

Registrada por QA y Accesibilidad en el gate de la PR #31 (Inc. 3, Firestore + perfiles multi-cuenta). No bloqueó el merge; queda para abordar cuando toque esa zona del código.

- **Guardado con debounce sin flush en `CloudGameProvider`.** El timer de `scheduleSave` (700 ms) no se vacía al desmontar ni al cambiar de curso/perfil: la última edición en esa ventana antes de un cierre de sesión o cambio de perfil puede perderse (no ha llegado aún a la cola offline de Firestore). Añadir flush en cleanup / antes de cambiar de contexto.
- **Bundle sin code-splitting.** El SDK de Firebase deja el bundle principal en ~1.7 MB (410 kB gzip), sin partición dinámica. Afecta al arranque en Android de gama baja. Evaluar `import()` dinámico o carga diferida de Firestore/Auth.
- **PIN local sin límite de intentos.** `PinScreen` (modo `enter`) no aplica backoff ante fuerza bruta de 4 dígitos. Es un pestillo local entre hermanos, no una frontera de seguridad — endurecimiento opcional.
- **Borde neutro `--tdp-color-border` por debajo de 3:1 de contraste (WCAG 1.4.11).** Limitación transversal del sistema de diseño (no introducida por Inc. 3): el token de borde en reposo usado en tarjetas/inputs de toda la app (p. ej. ya en `TutorAuthScreen`, Inc. 2) rinde ~1.7:1 sobre superficie clara. No bloquea porque la identificación del estado no depende de ese borde (foco/seleccionado usan `--tdp-color-primary`, ~11.5:1), pero conviene que Maquetador/UX-UI decidan si se sube el token hacia 3:1 o se documenta formalmente como decorativo.
- **Foco no se reubica entre pasos del asistente de alta de cuenta.** En `AppRoot.tsx`, los pasos rol→reto de adulto→consentimiento→perfil son pantallas completas que se reemplazan sin mover el foco al nuevo encabezado; un usuario de teclado/lector pierde el punto de referencia. Mover el foco al `h1` (o a un contenedor `tabindex="-1"`) en cada cambio de paso.

---

## Contenido

- **Añadir temas a Inglés** — "body parts", "food & drink", "classroom", "days & months".

---

## Funcionalidad

- **Sesión mixta de 10 preguntas** — opción de sesión más larga (actualmente 5) para cuando hay más tiempo disponible.

- **Fichas imprimibles por tema** — ahora existe impresión por asignatura; añadir filtrado por tema específico en la pantalla de impresión.

- **Modo nocturno** — tema oscuro para usar en casa por la tarde sin forzar la vista.

---

## Experiencia

- **Animación de racha** — efecto especial al alcanzar 7, 14 y 30 días seguidos.

- **Medallas por asignatura completada** — insignia cuando el niño ha respondido correctamente todas las preguntas de una asignatura.

---

## Historial

- **Multi-curso: selección de curso (1.º-6.º) + progreso aislado por curso + rebranding a "Repasos de Primaria"** (PR #22, mergeada, `967a611`) — repo renombrado a `RepasosDePrimaria`. Solo 3.º tiene contenido; el resto de cursos quedan como "Pronto". Ver `docs/decisions/ADR-002-modelo-multi-curso.md`. Pendiente el tag `v0.5.0` (bloqueo técnico, ver `.claude/pending-actions.md`).

- **Reconfiguración de GitHub Pages tras el rename del repo** (PR #23, mergeada) — `base` de Vite, favicon y docs actualizados a `/RepasosDePrimaria/`.

- **Aviso legal sobre el origen propio del contenido educativo** (PR #24, mergeada) — redactado por el Abogado; footer (ES/EN) con línea breve + sección completa en el README con referencia normativa (LOMLOE, RD 157/2022) y aviso de tipo notice-and-takedown.

- **`LICENSE`** (PR #25, mergeada) — modelo propietario elegido por el usuario: todos los derechos reservados, uso gratuito de la web para fines personales/educativos/no comerciales, reutilización del código o contenido sujeta a autorización previa.

- **Aclarar "5 preguntas por sesión" en el pie de página** (PR #20, mergeada) — el texto no distinguía entre la sesión por materia (5 preguntas) y la misión diaria de la home (15: 3 de cada materia), lo que parecía una inconsistencia. Ahora el pie de página lo explica en ES y EN.
