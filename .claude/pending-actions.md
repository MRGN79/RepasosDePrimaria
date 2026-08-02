# Acciones Pendientes

<!--
Formato para añadir una entrada:
  checkbox-vacío AAAA-MM-DD HH:MM | tipo | detalle
  tipo: push · PR · deploy · otro

Para marcar como completado: cambiar checkbox vacío por checkbox marcado.
Los agentes escriben aquí cuando difieren una acción por horario sensible u otro motivo.
-->

- [ ] 2026-08-03 10:20 | otro | Renombrar el repositorio GitHub de `TerceroDePrimaria` a `RepasosDePrimaria`. **Autorizado explícitamente por el usuario** — no es una decisión pendiente de confirmar, es una acción pendiente de ejecutar. Pendiente sólo de coordinar el momento para no romper remoto/rama con commits en curso; el orquestador ejecuta el rename una vez integrada la feature de multi-curso.
- [ ] 2026-08-03 10:20 | deploy | Tras el rename del repo, reconfigurar GitHub Pages: cambia la URL pública (`/TerceroDePrimaria/` → `/RepasosDePrimaria/`). Requiere actualizar `base` en `vite.config.ts`, la ruta del favicon en `index.html` (`/TerceroDePrimaria/rumbo.svg`) y la referencia en `docs/devops/github-pages-setup.md`. Va en su propia rama `chore/` con sus gates exprés, no en la rama de esta feature. Nota estratégica: a medio plazo el canal de distribución deja de ser la web con URL pública (ver `docs/BACKLOG.md`), así que valorar el alcance de esta reconfiguración con esa dirección en mente.
- [ ] 2026-08-03 10:20 | PR | Feature multi-curso lista en la rama `claude/primary-app-multi-course-ygqnjm` con todos los gates en verde y commits locales. Pendiente de confirmación del usuario para abrir PR, merge y deploy (y del tag `v0.5.0` que crea DevOps sobre el commit desplegado).
