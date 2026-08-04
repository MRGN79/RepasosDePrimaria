# Backlog de producto

Items anotados para implementar en el futuro, ordenados por aparición. No implican prioridad; el orden lo decide el usuario.

---

## Trabajo Activo

| Feature | Rama | Estado |
|---|---|---|
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 1: shell Capacitor + Android + CI de APK debug + retirada de GitHub Pages | `feat/capacitor-android-shell` (mergeada) | ✅ Mergeada en `main` (`2fc4ed4`) |
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 2: Firebase Auth + pantallas de alta/consentimiento del tutor | `feat/firebase-auth-tutor` (mergeada) | ✅ Mergeada en `main` (`72c908f`). Pantallas creadas pero aún no cableadas al flujo de entrada de la app; sin proyecto Firebase real, corre contra emulador |
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 3: Firestore + perfiles de hijo + reglas de seguridad | _(sin empezar)_ | Siguiente en el plan. **Precedido por la decisión de arquitectura de dos tipos de cuenta** (`docs/decisions/ADR-004-cuentas-adulto-y-nino.md`, estado _Propuesto_, rama `docs/adr-cuentas-adulto-nino` pendiente de PR): añade —en coexistencia con el tutor de ADR-003— una **cuenta de niño** que entra con su propia cuenta de Google (Family Link), sin PIN, acceso directo a curso. Esquema `users/{uid}` unificado con campo `role` inmutable; solo se persiste `uid` (email/nombre/foto de Google se descartan). Inc. 3 no arranca hasta que el usuario confirme el ADR-004. Puntos legales abiertos que se resuelven en su gate: consentimiento parental de la cuenta de niño (RGPD Art. 8 / LOPDGDD 14 años) y Play Families Policy (ver `.claude/pending-actions.md`) |
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 6: Copy legal + política de privacidad + DPIA | `claude/incremento-6-fx1iwx` (mergeada) | ✅ Mergeada en `main` (`f168ec2`, PR #28) — entregada **adelantada a Inc. 3** (Inc. 2 ya hizo falsa la promesa "nada sale del dispositivo"). Política de privacidad (pantalla en la app + `docs/legal/privacy-policy.md`), DPIA (`docs/legal/dpia.md`), mapeo de Play Data Safety (`docs/legal/play-data-safety.md`) y reescritura del copy en README, `.env.example` y footer. Validado por el Abogado. Acciones del usuario en `.claude/pending-actions.md` (DPA de Google, URL pública de la política, formulario Data Safety, revisión legal humana) |
| **Contenido de 1.º, 2.º, 4.º, 5.º y 6.º de Primaria (MVP ligero)** — catálogo multi-curso con contenido (refactor de infraestructura: registry/catalog conscientes de curso, aislamiento entre cursos) + paquete jugable en las 5 materias troncales de **todos los cursos que faltaban** (ya había 3.º), alineado a LOMLOE (RD 157/2022) | `feat/contenido-2do-primaria-mvp` (mergeada) | ✅ Mergeada en `main` (`cb92252`, PR #29). Adenda a ADR-002 + specs `08` (2.º) y `09` (1.º/4.º/5.º/6.º). **2.º**: 13 temas (numeración/suma/resta/tablas, sílabas/mayúsculas/plural, sentidos/cuerpo/animales, familia/colegio/barrio, números/colores/mascotas). **1.º/4.º/5.º/6.º**: un tema por materia (20 temas, 108 ítems estáticos), p. ej. 1.º sumas-hasta-10 + vocales + seres vivos + estaciones + saludos; 6.º porcentajes + diptongos + energía + UE + comida. Generadores de cálculo nuevos: `add-to-ten` (1.º) y `multiply-two-digit` (4.º), sumados a los 3 de 2.º. Los 6 cursos aislados por `nivel` (test multi-curso cubre 1.º-6.º). Versión: se mantiene `0.6.0` (sin bump, viaja con el pivote Firebase). Contenido original propio, mismo estándar legal que 3.º |

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
