# Backlog de producto

Items anotados para implementar en el futuro, ordenados por aparición. No implican prioridad; el orden lo decide el usuario.

---

## Trabajo Activo

| Feature | Rama | Estado |
|---|---|---|
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 1: shell Capacitor + Android + CI de APK debug + retirada de GitHub Pages | `feat/capacitor-android-shell` (mergeada) | ✅ Mergeada en `main` (`2fc4ed4`) |
| **Pivote a app Android + Firebase (v0.6.0)** — Inc. 2: Firebase Auth + pantallas de alta/consentimiento del tutor | `feat/firebase-auth-tutor` | En curso — gates locales pasando; pendiente confirmación de push/PR del usuario. Sin proyecto Firebase real todavía; corre contra emulador |

**Decisión de arquitectura del pivote:** `docs/decisions/ADR-003-android-firebase.md` (incorpora las condiciones de Seguridad: email del tutor solo en Firebase Auth, PIN del hijo solo local, puerta parental, CI endurecido). Specs e incrementos en `docs/specs/07-app-android-firebase.md`. Punto legal abierto para el Abogado: residencia de datos de Firebase Auth + DPIA. Bloqueo externo: la creación real del proyecto Firebase (consola, credenciales) requiere una acción manual del usuario, no automatizable desde aquí.

**Plan de entrega en incrementos técnicos** (el ADR decide "todo de una vez" como producto — no se lanza al usuario una app a medias — pero internamente se trocea en PRs revisables):

1. **Shell Capacitor + Android + CI de APK debug** — envoltorio nativo, sin Firebase todavía; desbloquea todo lo demás. Retira GitHub Pages (el pipeline de APK pasa a ser el artefacto publicado). ← _en curso_
2. **Firebase Auth + alta/consentimiento del tutor** — email/contraseña del tutor con verificación obligatoria; pantallas de registro y consentimiento; corre contra el emulador de Firebase mientras no haya proyecto real. ← _iniciado_
3. **Firestore + perfiles de hijo + reglas de seguridad** — datos en la nube región europea, offline-first; el niño opera bajo la cuenta del tutor sin login ni PII.
4. **Migración del progreso local existente** — el progreso `localStorage` (esquema v2) se asocia al primer perfil de hijo del tutor sin pérdida.
5. **Puerta parental + endurecimiento** — reautenticación para acciones destructivas/de cuenta; endurecimiento de reglas.
6. **Copy legal + política de privacidad + DPIA** — reescritura del aviso "nada sale del dispositivo", política de privacidad, DPIA. _Debe viajar en el mismo cambio que introduce la nube (Inc. 2/3), no después._
7. **Retirada final de GitHub Pages** — ya cubierta en Inc. 1 al existir el pipeline de APK.

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
