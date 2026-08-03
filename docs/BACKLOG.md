# Backlog de producto

Items anotados para implementar en el futuro, ordenados por aparición. No implican prioridad; el orden lo decide el usuario.

---

## Trabajo Activo

| Feature | Rama | Estado |
|---|---|---|
| **Giro a app Android instalable + login/datos vía Firebase** | _(aún sin rama — decisión de arquitectura cerrada, implementación pendiente de orquestar como Nueva Feature)_ | **Decisión tomada**: Opción A (Capacitor + Firebase Auth + Firestore + migración + CI de APK, todo de una vez), versión `0.6.0` para este trabajo con `1.0.0` reservada al lanzamiento en Play. Ver `docs/decisions/ADR-003-android-firebase.md` (incorpora las condiciones de Seguridad: email del tutor solo en Firebase Auth, PIN del hijo solo local, puerta parental, CI endurecido). Punto legal abierto para el Abogado: residencia de datos de Firebase Auth + DPIA. Pendiente: que el Jefe orqueste la implementación (Analista Funcional → Arquitecto/UX-UI/Maquetador/Frontend → Tester → gates → Abogado). Bloqueo externo: la creación real del proyecto Firebase (consola, credenciales) requiere una acción manual del usuario, no automatizable desde aquí. |

---

## Dirección de producto (cambios mayores a futuro)

Registrados a petición del usuario. No son features incrementales sobre la web actual: implican cambios de naturaleza del producto.

- **Cambio de naturaleza del producto: de web a app instalable en Android (posible iOS después).** **Decisión de arquitectura tomada** (ver Trabajo Activo y ADR-003) — pendiente de implementación. El modelo de datos multi-curso construido antes (ADR-002) ya es serializable y separa lo global de lo per-curso, de modo que no estorba esta migración; no se había añadido ninguna abstracción anticipada para ella.

- **Monetización (dos vías, interés comercial explícito del usuario).** (1) **Donativos voluntarios** y (2) **publicidad ligera y no invasiva** ("muy poca, nada invasiva"). Dado el interés comercial explícito, cuando se aborde debe **invocarse a Growth**: primero en modo consultor (dictamen de potencial) y, si el usuario confirma interés, en modo estratega. No iniciar ahora. Nota: el ADR-001 registraba el proyecto como "gratuito, sin interés comercial"; esa premisa ha cambiado y deberá revisarse al abrir la vía comercial. El `LICENSE` propietario ya elegido (ver Historial) mantiene abierta esta vía sin ceder derechos de reutilización.

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
