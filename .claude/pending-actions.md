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
- [ ] 2026-08-03 12:40 | otro | **Bloqueo técnico, aplazado a petición del usuario**: no se ha podido crear el tag `v0.5.0` sobre el commit `967a611`. `git push origin v0.5.0` devuelve HTTP 403 a través del proxy de este entorno (la creación/borrado de refs que no sean "nueva rama" está bloqueada). No existe herramienta MCP de GitHub en este entorno para crear tags o releases. Comando para cuando se retome: `git tag v0.5.0 967a61185eceb1be2bc16d10e78d07760bfe0427 && git push origin v0.5.0` (o desde GitHub → Releases → "Create a new release" apuntando a ese commit).
- [x] 2026-08-03 11:20 | otro | Rama de diagnóstico `_diag-push-test` — borrada por el usuario directamente en GitHub.
- [x] 2026-08-03 12:40 | otro | Ramas de feature ya mergeadas (`claude/primary-app-multi-course-ygqnjm` PR #22, `chore/rename-repo-pages-base` PR #23) — borradas por el usuario directamente en GitHub.
- [x] 2026-08-03 10:20 | deploy | Reconfigurar GitHub Pages tras el rename: PR #23 mergeada (`base` de Vite, favicon y docs actualizados a `/RepasosDePrimaria/`).
- [x] 2026-08-03 11:05 | otro | Aviso legal sobre el origen propio del contenido educativo (redactado por el Abogado): PR #24 mergeada (footer ES/EN + sección en README).
- [x] 2026-08-03 12:25 | otro | `LICENSE` creado (usuario eligió modelo propietario, todos los derechos reservados): PR #25 mergeada.
- [ ] 2026-08-03 13:10 | otro | **Autorizado por el usuario, pendiente de ejecutar manualmente**: hacer privado el repositorio GitHub `MRGN79/RepasosDePrimaria`. No existe herramienta MCP disponible en este entorno para cambiar la visibilidad de un repositorio (mismo tipo de limitación que el rename anterior). El usuario debe hacerlo desde GitHub → Settings → Danger Zone → Change visibility.
- [ ] 2026-08-03 13:10 | otro | **Pendiente de la decisión de arquitectura del giro a Android/Firebase**: cuando el usuario elija la opción propuesta por el Arquitecto, retirar el despliegue a GitHub Pages (`.github/workflows/deploy.yml`, referencias en README y `docs/devops/github-pages-setup.md`) — ya no hace falta según el usuario. No ejecutar hasta que el nuevo pipeline de distribución (APK) esté decidido, para no dejar el proyecto sin ningún artefacto publicado entre medias.
