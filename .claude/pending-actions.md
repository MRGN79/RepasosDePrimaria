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
- [x] 2026-08-03 11:20 | otro | Rama de diagnóstico `_diag-push-test` — borrada por el usuario directamente en GitHub.
- [ ] 2026-08-03 11:20 | otro | Ramas de feature ya mergeadas sin borrar (mismo bloqueo de permisos de borrado de refs que `_diag-push-test`): `claude/primary-app-multi-course-ygqnjm` (PR #22) y `chore/rename-repo-pages-base` (PR #23). `chore/aviso-contenido-original` (PR #24) sí se autoborró. Borrar manualmente desde GitHub → Branches, o reintentar cuando se disponga de permisos de borrado de refs.
- [x] 2026-08-03 10:20 | deploy | Reconfigurar GitHub Pages tras el rename: PR #23 mergeada (`base` de Vite, favicon y docs actualizados a `/RepasosDePrimaria/`).
- [x] 2026-08-03 11:05 | otro | Aviso legal sobre el origen propio del contenido educativo (redactado por el Abogado): PR #24 mergeada (footer ES/EN + sección en README).
- [ ] 2026-08-03 11:05 | otro | **Decisión pendiente del usuario (no bloqueante)**: el repositorio no tiene fichero `LICENSE`. Por defecto, todos los derechos quedan reservados. El Abogado recomienda decidir la intención (propietario con aviso de copyright, o código abierto con licencia tipo MIT/Apache-2.0 + contenido bajo CC BY-NC-SA) para que Documentación cree el `LICENSE` correspondiente.
