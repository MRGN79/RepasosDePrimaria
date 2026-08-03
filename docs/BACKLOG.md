# Backlog de producto

Items anotados para implementar en el futuro, ordenados por aparición. No implican prioridad; el orden lo decide el usuario.

---

## Trabajo Activo

_(sin trabajo activo — ver Historial para lo último integrado)_

---

## Dirección de producto (cambios mayores a futuro)

Registrados a petición del usuario. No son features incrementales sobre la web actual: implican cambios de naturaleza del producto. **No iniciados** — requieren su propio flujo cuando se aborden.

- **Cambio de naturaleza del producto: de web a app instalable en Android (posible iOS después).** El usuario ha indicado que "va a dejar de ser una web con una URL, para ser una aplicación instalable en Android". Es decir, la dirección no es "web con URL pública que crece", sino app instalable, con **login y guardado de datos en la nube vía Firebase**. Esto implica pasar de "sin backend, sin login" a autenticación y backend en la nube: es un cambio de arquitectura mayor que **necesita su propio flujo de Decisión de Arquitectura con el Arquitecto** (nuevo ADR) y previsiblemente **invalidará partes del README actual sobre privacidad** ("nada sale del dispositivo") y hará que **GitHub Pages / la URL pública dejen de ser el canal de distribución principal**. El modelo de datos multi-curso construido ahora (ADR-002) ya es serializable y separa lo global de lo per-curso, de modo que no estorba esa migración; no se ha añadido ninguna abstracción anticipada para ella.

- **Monetización (dos vías, interés comercial explícito del usuario).** (1) **Donativos voluntarios** y (2) **publicidad ligera y no invasiva** ("muy poca, nada invasiva"). Dado el interés comercial explícito, cuando se aborde debe **invocarse a Growth**: primero en modo consultor (dictamen de potencial) y, si el usuario confirma interés, en modo estratega. No iniciar ahora. Nota: el ADR-001 registraba el proyecto como "gratuito, sin interés comercial"; esa premisa ha cambiado y deberá revisarse al abrir la vía comercial.

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

- **Multi-curso: selección de curso (1.º-6.º) + progreso aislado por curso + rebranding a "Repasos de Primaria"** (PR #22, mergeada, `967a611`) — repo renombrado a `RepasosDePrimaria`. Solo 3.º tiene contenido; el resto de cursos quedan como "Pronto". Ver `docs/decisions/ADR-002-modelo-multi-curso.md`. Pendiente el tag `v0.5.0` (bloqueo técnico, ver `.claude/pending-actions.md`) y la reconfiguración de GitHub Pages con la nueva URL.

- **Aclarar "5 preguntas por sesión" en el pie de página** (PR #20, mergeada) — el texto no distinguía entre la sesión por materia (5 preguntas) y la misión diaria de la home (15: 3 de cada materia), lo que parecía una inconsistencia. Ahora el pie de página lo explica en ES y EN.
