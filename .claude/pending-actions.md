# Acciones Pendientes

<!--
Formato para añadir una entrada:
  checkbox-vacío AAAA-MM-DD HH:MM | tipo | detalle
  tipo: push · PR · deploy · otro

Para marcar como completado: cambiar checkbox vacío por checkbox marcado.
Los agentes escriben aquí cuando difieren una acción por horario sensible u otro motivo.
-->

- [x] 2026-08-03 10:20 | otro | Renombrar el repositorio GitHub de `TerceroDePrimaria` a `RepasosDePrimaria`. Hecho por el usuario directamente en GitHub Settings.
- [x] 2026-08-03 10:20 | PR | Feature multi-curso: PR #22 abierta, CI verde, mergeada (squash) a `main` en `967a611`. Deploy a GitHub Pages disparado automáticamente por el push a `main`.
- [ ] 2026-08-03 11:05 | otro | **Bloqueo técnico**: no se ha podido crear el tag `v0.5.0` sobre el commit `967a611`. `git push origin v0.5.0` devuelve HTTP 403 a través del proxy de este entorno (la creación/borrado de refs que no sean "nueva rama" está bloqueada; se comprobó también que no se puede borrar una rama de prueba). No existe herramienta MCP de GitHub en este entorno para crear tags o releases. Requiere que el usuario cree el tag manualmente (`git tag v0.5.0 967a61185eceb1be2bc16d10e78d07760bfe0427 && git push origin v0.5.0`, o desde GitHub → Releases → "Create a new release" apuntando a ese commit) o que se reintente desde una sesión/entorno con permisos de push de tags.
- [ ] 2026-08-03 11:05 | otro | Rama de diagnóstico `_diag-push-test` quedó creada en el repo (usada para comprobar permisos de push) y no se ha podido borrar por el mismo bloqueo de permisos. Borrarla manualmente desde GitHub o en cuanto se disponga de permisos de borrado de refs.
- [ ] 2026-08-03 10:20 | deploy | Reconfigurar GitHub Pages tras el rename: cambia la URL pública (`/TerceroDePrimaria/` → `/RepasosDePrimaria/`). Requiere actualizar `base` en `vite.config.ts`, la ruta del favicon en `index.html` (`/TerceroDePrimaria/rumbo.svg`) y la referencia en `docs/devops/github-pages-setup.md`. Va en su propia rama `chore/` con sus gates exprés. Nota estratégica: a medio plazo el canal de distribución deja de ser la web con URL pública (ver `docs/BACKLOG.md`), así que valorar el alcance de esta reconfiguración con esa dirección en mente.
