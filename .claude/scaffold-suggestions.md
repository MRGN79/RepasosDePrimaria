# Sugerencias para el Scaffold

Este archivo recoge mejoras identificadas durante el proyecto que podrían
incorporarse al repositorio plantilla (scaffold) para beneficiar futuros proyectos.

El Jefe es el responsable de este archivo. Cualquier agente puede proponer
una entrada; el Jefe la registra, la presenta al usuario y, si es aprobada,
genera el prompt listo para ejecutar en el repo scaffold.

---

## Pendientes de revisión

<!-- El Jefe añade aquí las sugerencias según van surgiendo -->

- **2026-08-06 — Bug en `safe-commit.sh`: el ajuste de timestamp en horario sensible falla silenciosamente.** Al commitear `.claude/pending-actions.md` en `main` durante horario sensible, el script imprimió `⏰ Horario sensible. Timestamp ajustado a: 1786024219 +0200` (un epoch Unix sin formatear, no una fecha legible como en ejecuciones anteriores del mismo script en este proyecto, que sí mostraban `2026-08-05T22:44:00+0200`), y el commit resultante (`2c5e5d6`) quedó con la **hora real** (`2026-08-06 15:50:19 +0200`, verificado con `git log -1 --format="%ai"`), no con la víspera 20:00-22:59 esperada. Parece un fallo intermitente en la rama de cálculo de "commit padre más reciente que el candidato" (líneas ~36 en adelante de `safe-commit.sh`) que corrompe la variable de salida del epoch en vez de formatearla, y además no aplica el offset resultante al commit. Actualización: resultó ser reproducible de forma consistente en esta sesión a partir de ese punto — los 3 commits siguientes en `main` el mismo día mostraron el mismo epoch sin formatear y quedaron todos con hora real (verificado con `git log -1 --format="%ai"` en cada uno). Segunda actualización: también ocurrió en un commit posterior sobre una rama de feature (`b71fb50`), no solo en `main` — descarto la hipótesis de que dependa de la rama. Tercera actualización (2026-08-07, sesión nueva): reproducido de nuevo, en rama de feature (`chore/apk-filename-project-version`, commit `78bb382`), tras un reinicio de sesión/contenedor — mismo síntoma exacto (`Timestamp ajustado a: 1786085285 +0200`, epoch sin formatear) y mismo resultado (commit con hora real `08:48:05`, no con la víspera 20:00-22:59). Al persistir entre sesiones y reinicios de contenedor distintos, descarto también que sea un estado transitorio de una sesión concreta: parece un bug determinista del script ante alguna condición de entrada (posiblemente el propio valor o formato de `date` del sistema, ya contemplado como salida de emergencia por el propio script — "Si el sistema no puede calcular la víspera... avisa y committea con hora real en vez de bloquear el trabajo" — pero que en este entorno se dispara siempre, no como excepción). Patrón sin causa raíz identificada; persiste. Revisar la lógica de fallback de esa rama y añadir un test/aserción de que el epoch calculado se formatea antes de usarse en `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`.

---

## Aprobadas — prompts listos para ejecutar

<!-- Cuando el usuario aprueba una sugerencia, el Jefe mueve la entrada aquí
     e incluye el prompt generado. El usuario lo pega en una sesión de
     Claude Code abierta en el repo scaffold. -->

---

## Descartadas

<!-- Sugerencias que el usuario decidió no incorporar, con el motivo -->
