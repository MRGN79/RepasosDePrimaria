# Flujos y pantallas clave — TerceroDePrimaria

> Documento de UX-UI. Define el journey del usuario, la estructura de cada pantalla y los comportamientos de interacción.
> Lee junto a `00-universo-visual-y-sistema-de-diseno.md` (identidad, tokens, componentes) y `02-criterios-accesibilidad.md` (criterios A11Y-*).
> Fecha: 2026-06-25. Para Maquetador (estructura visual) y Frontend (lógica de interacción).

**Convención:** los wireframes usan **claves i18n** (`namespace.componente.elemento`), nunca texto literal. El layout absorbe +30% de expansión EN→ES. Mobile-first; el dispositivo objetivo es tablet (768-1024px).

---

## 0. Mapa de navegación

```
                         ┌─────────────────┐
        (primer uso) ──→ │  ONBOARDING     │ ── elegir avatar/apodo (saltar permitido)
                         └────────┬────────┘
                                  │
                          ┌───────▼────────┐
   (visita recurrente) ─→ │     HOME       │ ←──────────────────────┐
                          │ (isla verano)  │                        │
                          └─┬───┬───┬───┬──┘                        │
              "Misión hoy"  │   │   │   │  ajustes                  │
                    ┌───────┘   │   │   └────────┐                  │
                    │      materias │ mochila    │                  │
            ┌───────▼──────┐  ┌─────▼─────┐ ┌────▼─────┐  ┌─────────▼────────┐
            │ SESIÓN        │  │ ELEGIR    │ │ MOCHILA  │  │ AJUSTES          │
            │ (misión)      │  │ MATERIA   │ │(progreso)│  │(idioma/sonido)   │
            └───────────────┘  └─────┬─────┘ └──────────┘  └──────────────────┘
                                     │
                              ┌──────▼──────┐
                              │ ELEGIR TEMA │── "Reto 4º" marcado
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐      ┌──────────────┐
                              │  SESIÓN     │─────→│ RESULTADOS   │──→ vuelve a HOME
                              │ (ejercicios)│      │ (celebración)│
                              └─────────────┘      └──────────────┘

        ┌──────────────┐     ┌──────────────┐
   HOME │ ZONA IMPRIMIR │──→ │ VISTA FICHA  │──→ window.print()
        └──────────────┘     │  (@media     │
                             │   print)     │
                             └──────────────┘
```

Regla de oro: **desde HOME hasta jugar en ≤ 2 toques** (US-01). Desde cualquier pantalla, siempre hay vuelta a HOME visible (Rumbo/casa) sin perder progreso.

---

## 1. ONBOARDING — elegir avatar y apodo (primer uso)

`US-02`. Solo en el primer arranque (cuando no hay `profile` en localStorage). Saltable.

```
[PANTALLA: Onboarding]
Header:
  └── Rumbo `happy` + saludo grande [home.welcome.title]
Body:
  ├── [Paso 1: Avatar]
  │     ├── título [onboarding.avatar.heading]
  │     └── Galería de avatares (rejilla 3×N, tarjetas ≥ 60×60px)
  │           └── cada avatar: imagen + nombre textual [content.avatar.<id>.name]
  │                 · comportamiento: toca → se marca (borde grueso + ✓), no solo color
  │                 · teclado: cada avatar focable, flechas/Tab + Enter
  ├── [Paso 2: Apodo] (lista CERRADA, no texto libre — D-2)
  │     ├── título [onboarding.nickname.heading]
  │     └── Chips de apodos predefinidos [content.nickname.<id>]
  │           · seleccionable, uno activo, estado por borde + ✓
  └── Acciones:
        ├── Botón primary [onboarding.continue]  (lg, ≥60px)
        └── Botón ghost  [onboarding.skip]       → asigna avatar+apodo por defecto
Footer: indicador de paso (1 de 2 / 2 de 2) en texto, no solo puntos
Estados:
  · vacío (nada elegido) → "continuar" usa el default; nunca bloquea
  · elegido → se persiste profile.avatarId / profile.nicknameId al continuar
A11y: cada avatar/apodo con nombre textual; navegable sin ratón (A11Y-KBD-01).
```

**Interacción:** un solo gesto por elección (toque). Si el niño no quiere decidir, "saltar" le deja jugar igual (US-02). Nunca un campo de texto.

---

## 2. HOME — la isla de verano

Pantalla de retorno diario. Pilar del hábito. Recuerda avatar, estrellas y racha desde localStorage (US-01).

```
[PANTALLA: Home]
Header:
  ├── Avatar + apodo del niño [profile]  (toca → Mochila)
  ├── StreakBadge: 🔥 + nº + [home.streak.days]   (icono + número + texto)
  └── StarCounter: ⭐ + nº total                    (icono + número, aria-label)
Body (orden vertical en móvil, puede ser 2 columnas en tablet):
  ├── [Bloque héroe: Misión de hoy]  (US-06, P1)
  │     ├── Rumbo `happy` presentando la misión
  │     ├── título [home.dailyGoal.title] + descripción corta [home.dailyGoal.desc]
  │     ├── estado: pendiente → Botón primary lg [home.dailyGoal.start]  (CTA principal)
  │     │            hecha hoy → sello "¡Hecha!" [home.dailyGoal.done] (icono ✓ + texto)
  │     └── (1 toque desde aquí a la sesión = cumple ≤2 toques)
  ├── [Acceso: Elegir yo]
  │     └── Botón secondary [home.play.chooseSubject] → Elegir materia
  ├── [Acceso: Para imprimir]
  │     └── Botón secondary [home.print.enter] → Zona imprimir
  └── [Acceso: Mi mochila]
        └── Botón ghost/icono [nav.menu.backpack] → Mochila
Footer/persistente:
  └── Botón ajustes (icono engranaje, esquina, ≥48px) → Ajustes
Estados:
  · primer día / sin racha → StreakBadge muestra "¡Empieza tu racha!" [home.streak.empty]
  · racha rota (no jugó ayer) → mensaje AMABLE [home.streak.reset] ("¡Hoy empezamos una nueva!"), nunca culpa
  · misión ya hecha hoy → bloque héroe celebra y ofrece "jugar más" (no obliga)
A11y: jerarquía de headings; CTA "misión" con etiqueta clara y foco visible (US-06 A11y).
```

**Decisión UX:** la "Misión de hoy" es el héroe para **reducir la decisión** (un niño de 8 años no quiere elegir entre 30 temas). "Elegir yo" está disponible pero secundario. Esto refuerza el hábito sin quitar libertad.

---

## 3. ELEGIR MATERIA → ELEGIR TEMA

`US-03`. Dos niveles. Cada materia es una zona de la isla.

```
[PANTALLA: Elegir materia]
Header: título [subjects.title] + botón volver a HOME (≥48px)
Body:
  └── Rejilla de SubjectCard (2 col móvil / 2-3 col tablet, tarjetas grandes ≥ 60px alto)
        ├── Matemáticas [content.math.title]   (color math + icono propio)
        ├── Lengua      [content.spanish.title] (color spanish + icono)
        ├── Natural Science [content.science.title] (color science + icono + micro-etiqueta "EN")
        ├── Ciencias Sociales [content.social.title] (color social + icono)
        └── Inglés      [content.english.title] (color english + icono + micro-etiqueta "EN")
Estados:
  · materia sin contenido aún → tarjeta "Pronto" (aria-disabled, texto), no rompe navegación
A11y: cada materia = control accesible con etiqueta (icono+nombre) y foco visible (US-03 A11y).
        El color NO es el único distintivo: icono + nombre identifican la materia (daltonismo).
```

```
[PANTALLA: Elegir tema]
Header: nombre de la materia (color + icono) + volver a materias
Body:
  └── Lista/rejilla de TopicCard del bloque curricular
        ├── tema normal [content.<materia>.<tema>.title] + icono
        ├── tema "Reto 4º" → etiqueta especial [content.label.challengeG4]
        │     · icono cohete/estrella dorada + texto "Reto 4º" (no solo color morado)
        │     · opcional, nunca obligatorio para avanzar
        └── tema sin contenido → "Pronto" (aria-disabled + texto)
        └── opción "Mezcla sorpresa" del tema/materia [content.label.surpriseMix]
Footer: ninguno
Estados: vacío (materia sin temas con contenido) → mensaje "Pronto más juegos aquí"
A11y: cada tema control accesible; "Reto 4º" comunicado por icono+texto, no solo color.
```

---

## 4. SESIÓN DE EJERCICIOS

`US-04`, el corazón del producto. N ejercicios (5-10) de uno en uno, con feedback inmediato celebratorio. Sin presión de tiempo (default).

```
[PANTALLA: Sesión — un ejercicio]
Header (persistente durante la sesión):
  ├── SessionProgress: barra "X de N" (relleno + texto + Rumbo avanzando)
  ├── StarCounter de la sesión (sube al acertar)
  └── Botón salir (≥48px, separado de zona de respuesta) → confirma "¿Seguro?" sin drama
Body (cambia según tipo de ejercicio del MVP):
  ├── Enunciado [content.<id>.enunciado]  (≥20px, izquierda, sin mayúsculas sostenidas)
  ├── [Zona de respuesta — según tipo]
  │     ├── opcion-multiple  → OptionCards (radio, rejilla 1col móvil / 2×2 tablet)
  │     ├── verdadero-falso  → 2 OptionCards grandes con icono (👍/👎) + texto V/F
  │     ├── respuesta-corta  → display + NumPad en pantalla (mates) / banco de palabras
  │     └── emparejar        → MatchingBoard (clic-clic, NO solo arrastre — condición dura)
  └── [Acción]
        └── Botón primary [quiz.action.check]  (activo cuando hay respuesta elegida)
Feedback (overlay/inline tras "comprobar"):
  ├── ACIERTO:
  │     · Rumbo `happy` + animación rebote + estrella vuela al contador (reduce-motion: estática)
  │     · icono ✓ + mensaje festivo VARIADO [quiz.feedback.correct.<1..n>] (rotación aleatoria)
  │     · color verde + sonido opcional → Botón [quiz.action.next]
  └── FALLO (sin castigo):
        · Rumbo `cheer` + tono amable, sin rojo agresivo
        · icono ✗/↻ + mensaje variado [quiz.feedback.almost.<1..n>] ("¡Casi! Otra vez")
        · permite REINTENTAR; tras 1-2 intentos revela la correcta [quiz.feedback.solution]
          (resalta la opción correcta: icono + color + texto "Esta era"), avanza sin drama
        · NO resta estrellas ni racha
Estados:
  · sin respuesta elegida → "comprobar" deshabilitado (aria-disabled, no solo color)
  · cargando contenido → no debería verse (todo local); si acaso, skeleton breve
  · último ejercicio resuelto → transición a Resultados
A11y (US-04):
  · todo resoluble solo con teclado (opciones, V/F, NumPad, matching clic-clic)
  · feedback NUNCA solo por color: icono + texto siempre; aria-live anuncia acierto/error
  · alternativa textual al sonido; prefers-reduced-motion atenúa animación sin perder info
  · matching: selección secuencial + aria-live del emparejamiento
```

**Generación de mates (D-6):** los ejercicios de cálculo generan operandos aleatorios al montar (plantilla i18n con interpolación `{{a}} {{b}}`); la respuesta se calcula, no se almacena. Visualmente esto es transparente para el niño: ve una operación normal.

**Decisión UX — fallo amable:** el patrón es *reintento → pista opcional → revelar*. Nunca un "INCORRECTO" en rojo a pantalla. El error es una invitación, no un veredicto. Rumbo anima, no regaña.

---

## 5. RESULTADOS DE SESIÓN — celebración

`US-04`, `US-05`. Pantalla de cierre festiva: el botín del día.

```
[PANTALLA: Resultados]
Header: confeti (respeta reduce-motion: estático) + Rumbo `happy` grande
Body:
  ├── Titular celebratorio [results.title]  (display, grande, 3xl)
  ├── Estrellas ganadas hoy:
  │     └── nº grande + estrellas (animación de entrada / estáticas en reduce-motion)
  │           [results.starsEarned] (aria-label "Has ganado N estrellas")
  ├── Avance de racha:
  │     ├── racha subió → 🔥 nº + [results.streak.up] ("¡Llevas N días seguidos!")
  │     └── primer día → [results.streak.first] ("¡Empiezas una racha!")
  ├── [Si desbloqueó medalla] → CelebrationModal/inset de medalla
  │     └── Badge a color + nombre [content.badge.<id>] + [results.badge.unlocked]
  └── [Acciones]
        ├── Botón primary [results.action.playAgain] → nueva sesión o elegir
        └── Botón secondary [results.action.home] → HOME
Estados:
  · misión del día completada → celebración ESPECIAL [results.dailyGoal.done] + marca dailyGoal.lastDoneDate
  · sin medalla nueva → se omite ese bloque (no se inventa)
A11y (US-05): estrellas/racha/medallas con texto alternativo comprensible, no solo iconos.
        El refuerzo (cuánto ganó) vive en texto+icono, nunca solo en la animación.
```

**Persistencia al cerrar la sesión:** se consolidan estrellas (`stars.total`), se recalcula la racha (ADR-001 §4: comparar fecha local con `lastPlayedDate`), se evalúan medallas. Si la racha se rompió por un día sin jugar, el mensaje es **amable** (US-05), nunca culpabilizador.

---

## 6. MOCHILA — mis estrellas, racha y medallas

`US-05`. El escaparate del orgullo del niño. Motiva sin comparar (no hay ranking).

```
[PANTALLA: Mi mochila]
Header: avatar + apodo + volver a HOME
Body:
  ├── [Resumen]
  │     ├── StarCounter total [backpack.stars]
  │     ├── StreakBadge actual + mejor racha [backpack.streak.current / .best]
  ├── [Colección de medallas]
  │     └── Rejilla de Badge
  │           ├── desbloqueada → ilustración a color + nombre + fecha
  │           └── bloqueada → silueta atenuada + candado + "Por conseguir" (no solo color)
  └── (sin secciones de comparación con otros — explícitamente fuera de scope)
Estados:
  · sin medallas aún → todas en estado bloqueado con pista de cómo conseguirlas
A11y: cada estrella/racha/medalla con aria-label; bloqueada/desbloqueada distinguible sin color.
```

---

## 7. ZONA IMPRIMIR → VISTA FICHA

`US-07`. Generar ficha A4 con soluciones. La acción de imprimir suele hacerla un adulto, pero la interfaz sigue siendo para el niño.

```
[PANTALLA: Zona imprimir]
Header: título [print.title] + Rumbo + volver a HOME
Body:
  ├── Paso 1: elegir MATERIA (SubjectCards, igual que sección 3)
  ├── Paso 2: elegir TEMA (TopicCards) o "Mezcla sorpresa"
  ├── [MVP: cantidad fija 10 ejercicios; post-MVP: pocos/normal/muchos]
  ├── [MVP: dificultad normal; post-MVP: fácil/normal/con retos]
  ├── (toggle) incluir soluciones on/off [print.includeSolutions]
  └── Botón primary [print.create] → Vista ficha
Estados: tema sin contenido imprimible → desactivado con "Pronto"
A11y (US-07): todos los controles (materia/tema/imprimir) accesibles sin ratón.

[PANTALLA: Vista ficha (preview + @media print)]
Pantalla (preview):
  ├── Vista previa A4 de la ficha
  └── Botón primary [print.action.print] → window.print()
  └── Botón volver para reconfigurar
@media print (lo que sale en papel — ver 00 §7.2):
  ├── Cabecera ligera: título + ilustración de línea + "Mi nombre: ___" + "Fecha: ___" + materia/tema
  ├── Cuerpo: ejercicios numerados, B/N, negro sólido, ≥12pt, espacio de escritura ≥10mm,
  │           break-inside: avoid por ejercicio
  ├── Pie: mensaje de ánimo [print.footer.cheer]
  └── Hoja de soluciones: break-before: page (si incluir-soluciones on)
        · mismo nº de ejercicio + respuesta correcta
        · mates generadas (D-6): valores CONGELADOS en esta ficha + su solución coherente
A11y/print: negro sólido sobre blanco; estrellas como contorno; nada depende de color; márgenes ≥15mm.
```

---

## 8. AJUSTES — idioma y sonido

`US-08` (P1). Pensado para que un niño o un adulto lo use sin complicación.

```
[PANTALLA: Ajustes]
Header: título [settings.title] + volver
Body:
  ├── Idioma de la interfaz [settings.language]
  │     └── toggle/selector ES | EN — cambia sin recargar ni perder progreso
  │           · nota: contenido de Lengua/Inglés/Natural Science NO se traduce (D-1, D-5)
  ├── Sonido [settings.sound]
  │     └── toggle mute (control grande ≥60px, icono altavoz/tachado + texto) — persiste
  └── [opcional] Reducir movimiento [settings.reducedMotion]
        └── toggle que fuerza prefers-reduced-motion en la app
Estados: cambios se aplican al momento y se persisten (prefs.lang / prefs.muted / prefs.reducedMotion)
A11y (US-08): todos los controles accesibles con foco visible; toggles con estado textual, no solo visual.
```

---

## 9. Estados globales y casos límite (para Frontend)

| Situación | Comportamiento de diseño |
|---|---|
| Primer arranque sin localStorage | Onboarding; si se salta, default. App jugable de inmediato. |
| localStorage no disponible (modo privado) | App funciona en memoria; no persiste racha. Sin error visible que asuste al niño (ADR-001 §4). |
| Datos corruptos | Se descartan, arranca limpio (ADR-001 §4). El niño no ve un crash. |
| Sesión cerrada a medias | Al volver, empieza sesión nueva (no se reanuda en MVP — US-09 es P2). Sin culpa. |
| Racha rota | Mensaje amable y positivo en HOME y Resultados (US-05). |
| Tema/materia sin contenido | Estado "Pronto" visible y deshabilitado, nunca un hueco roto (US-03). |
| Cambio de idioma a media navegación | Interfaz se actualiza en vivo; contenido de materias de idioma fijo no cambia (US-08). |

---

## 10. Resumen de pantallas para el MVP (P0)

| Pantalla | User story | Prioridad |
|---|---|---|
| Home (isla) | US-01 | P0 |
| Onboarding avatar/apodo | US-02 | P1 |
| Elegir materia / tema | US-03 | P0 |
| Sesión de ejercicios (4 tipos + feedback) | US-04 | P0 |
| Resultados (celebración) | US-04/05 | P0 |
| Mochila (estrellas/racha/medallas) | US-05 | P0 |
| Misión del día (bloque en Home) | US-06 | P1 |
| Zona imprimir + vista ficha | US-07 | P0 |
| Ajustes (idioma/sonido) | US-08 | P1 |

Todos los tipos de ejercicio del MVP (`opcion-multiple`, `verdadero-falso`, `respuesta-corta`/numérica, `emparejar`) están cubiertos en la pantalla de Sesión (sección 4) con su variante de zona de respuesta y sus criterios de accesibilidad.

---

## 11. MIGRACIÓN DEL PROGRESO LOCAL A LA NUBE (Incremento 4)

> Diseño de UX-UI para la [Épica E](../specs/07-app-android-firebase.md#épica-e--migración-del-progreso-local-existente-incremento-4) (US-E1…US-E7). Fecha de esta sección: 2026-08-05.
> Contexto: al pasar el producto a Android + Firebase (ADR-003/ADR-004), un dispositivo que ya se usaba en local tiene progreso en `localStorage`. Cuando el tutor crea su **primer perfil de hijo** (Modelo A, `ProfileSetupScreen` variante `tutorChild`) o el niño crea su **cuenta propia** (Modelo B, variante `kid`), ese progreso se traslada a la nube.
> **Principio rector heredado de las specs:** *el progreso local nunca se pierde* — el borrado local solo ocurre tras verificación positiva en la nube (verify-before-delete, US-E2). El diseño refleja esa promesa: nada en pantalla puede leerse como pérdida.

### 11.0 Principios de diseño de este flujo

1. **El aviso primero, la migración después — nunca silenciosa (US-E1).** Antes de crear el perfil se ve, con palabras (no solo icono), que el avance del dispositivo se sumará a ese perfil. Integrado en la pantalla de creación, no como modal aparte que bloquea.
2. **La migración no bloquea el juego (US-E6, RNF "no bloqueo").** Tras crear el perfil, el niño entra a jugar de inmediato; la subida ocurre en segundo plano con un indicador **no modal**. Un niño de Primaria no espera ante un spinner cuando quiere jugar.
3. **El error se comunica como "aún no", nunca como "perdiste" (US-E2/E6).** El estado de fallo usa un tratamiento **calmado** (superficie cálida + texto neutro + icono de nube), **jamás** el rojo de `--tdp-color-error`. La palabra "error" no aparece en el copy. El mensaje siempre recuerda que el progreso sigue a salvo en el dispositivo.
4. **Audiencia real del indicador = el adulto que supervisa.** El copy es seguro para un niño (no alarma), pero está pensado para que el tutor entienda qué pasa. En Modelo B (cuenta de niño) se asume supervisión parental en el alta (ADR-004).

### 11.1 Aviso de migración — `ProfileSetupScreen` extendida (estado: PENDIENTE)

El aviso es una **sección reforzante dentro** de la pantalla de creación de perfil ya existente (§ código `ProfileSetupScreen.tsx`), colocada **justo encima del botón de crear** — lo último que se lee antes de confirmar. No cambia el resto de la pantalla (curso / avatar / apodo).

```
[PANTALLA: ProfileSetupScreen — con aviso de migración]
(variante tutorChild = primer hijo del tutor · variante kid = cuenta propia de niño)
Body (PageLayout width="wide"):
  ├── h1 [account.profileSetup.tutorTitle | .kidTitle]        (sin cambios)
  ├── Sección Curso   → chips de curso                        (sin cambios)
  ├── Sección Avatar  → rejilla de avatares                   (sin cambios)
  ├── Sección Apodo   → chips de apodo                        (sin cambios)
  ├── ⭐ [NUEVO] MigrationNotice  ← solo si hay progreso local con avance real
  │     ┌─────────────────────────────────────────────────────────┐
  │     │  [icono nube ☁ decorativo]  título [account.profileSetup │
  │     │                              .migrationNotice.title]       │
  │     │  cuerpo [account.profileSetup.migrationNotice.body]        │
  │     │  · si progreso en >1 curso:                                │
  │     │     línea extra [account.profileSetup.migrationNotice      │
  │     │                  .multiCourse]                             │
  │     │     (+ opcional: chips no interactivos con los cursos      │
  │     │      afectados — ver decisión D-mig-1)                     │
  │     └─────────────────────────────────────────────────────────┘
  │        · role="note" o <aside> con aria-labelledby al título
  │        · tratamiento calmado (surface-warm), NO estado de error
  ├── [errorKey de alta] → <p role="alert">                   (sin cambios)
  └── Acciones:
        └── Botón primary lg [account.profileSetup.create]  (≥60px)
              · al pulsar: crea el perfil Y arranca la migración (US-E1)
Estados de esta pantalla:
  · SIN progreso local con avance (US-E7) → NO se renderiza MigrationNotice;
        alta limpia idéntica a la actual. No hay aviso de "migrar nada".
  · CON progreso en 1 curso → MigrationNotice sin la línea multiCourse.
  · CON progreso en varios cursos → MigrationNotice + línea multiCourse.
  · busy (creando) → botón deshabilitado (patrón ya existente, aria-disabled).
A11y:
  · El aviso es TEXTO real, no solo color/icono (US-E1 A11y). El icono de nube es
    decoración (aria-hidden); la información vive en título + cuerpo.
  · Orden de tabulación: …apodo → MigrationNotice (si es focable/lectura) → crear.
    El aviso no roba foco ni interrumpe; es contenido, no diálogo.
  · Contraste del texto ≥ 4.5:1 sobre surface-warm (A11Y-CONTRAST-01).
```

**Props nuevas para `ProfileSetupScreen`** (para Frontend; la lógica de detección de progreso vive fuera, en AppRoot/CloudRoot):
- `showMigrationNotice?: boolean` — si hay progreso local con avance real (lo evalúa AppRoot leyendo `storage.ts`; degrada a `false` si `localStorage` no está disponible o el estado es el por defecto, US-E7).
- `migrationCourseCount?: number` — nº de cursos con avance real; `>1` activa la línea `multiCourse`.
- `migrationCourseLabels?: Curso[]` — opcional, solo si se adopta D-mig-1 (chips de cursos).

**Decisión D-mig-1 (chips de cursos afectados):** las specs solo exigen indicar que se transfieren *todos* los cursos, no listarlos. Recomiendo la **línea genérica `multiCourse` como base** (menos texto para un niño) y dejar los chips con los nombres de curso como **refuerzo opcional para el tutor**. Si se implementan, son `aria-hidden` decorativos o una lista con `aria-label`; nunca interactivos (no se elige qué migrar — el progreso local nunca se descarta por defecto, "Fuera de alcance" de la Épica E).

### 11.2 Estados de la migración en curso — componente `MigrationStatus` (NO bloqueante)

Tras confirmar la creación del perfil, la app entra al juego (HOME) igual que hoy. La migración se muestra con una **banda/indicador no modal** que vive en HOME y pantallas de navegación. Tres estados:

```
[COMPONENTE: MigrationStatus]  — región con aria-live="polite", no roba foco
Ubicación: banda fina bajo el AppHeader en HOME (y pantallas de navegación).
           Se OCULTA durante una sesión de ejercicios activa (no distraer al
           niño mientras juega); los reintentos siguen en segundo plano y la
           banda reaparece al volver a HOME.

Estado A — EN CURSO:
  ┌───────────────────────────────────────────────────────────┐
  │ [☁ nube, aria-hidden]  [account.migration.inProgress]  ⋯   │
  └───────────────────────────────────────────────────────────┘
  · tratamiento calmado (surface-warm + texto neutro + icono primary)
  · "⋯" = puntos animados suaves; con reduce-motion → puntos estáticos
  · aria-live anuncia el texto una vez (no repite)

Estado B — COMPLETADO (toast efímero):
  ┌───────────────────────────────────────────────────────────┐
  │ [✓ + ☁]  [account.migration.doneToast]                     │
  └───────────────────────────────────────────────────────────┘
  · tratamiento de éxito (success-bg + success-text + icono check)
  · auto-descarta ~4-5s; con reduce-motion aparece sin deslizar
  · icono ✓ + texto (no solo color, A11Y-COLOR-01)

Estado C — INCOMPLETO / RECUPERABLE (banda persistente, NO alarmante):
  ┌───────────────────────────────────────────────────────────┐
  │ [☁ nube, aria-hidden]                                      │
  │ título   [account.migration.incompleteTitle]               │
  │ cuerpo   [account.migration.incompleteBody]                │
  │ [Botón secondary  [account.migration.retryAction] ]        │
  └───────────────────────────────────────────────────────────┘
  · 🚫 NUNCA rojo/error: surface-warm + border + texto neutro + icono nube
  · el cuerpo SIEMPRE dice que el progreso sigue a salvo en el dispositivo
  · botón "Reintentar ahora" ≥48px, foco visible, activable por teclado
  · persistente: se puede quedar en pantalla; reaparece en el siguiente
    arranque mientras queden cursos pendientes (US-E6). Reintentos automáticos
    en segundo plano continúan aunque el usuario no pulse nada.
  · el botón de reintento NO exige reto de adulto (acción no destructiva:
    solo reintenta subir+verificar; el dato local no se toca).
```

**Por qué no una pantalla bloqueante "Guardando…":** las specs marcan la migración como *no bloqueante* (US-E6) y ofrecen la clave `doneToast` (un toast, no una pantalla). Un gate de carga entre el alta y el juego frustra a un niño que quiere empezar y contradice la reanudación en segundo plano. El indicador acompaña, no interrumpe.

### 11.3 Journey completo (Modelo A y B — el mismo)

```
Tutor/niño en ProfileSetupScreen (primer perfil del dispositivo)
  · hay progreso local con avance → ve MigrationNotice (§11.1) encima de "Crear"
  → pulsa [Crear perfil]
  → se crea el perfil (Modelo A: children/{childId} · Modelo B: users/{uid})
  → arranca la migración; la app entra a HOME (el niño ya puede jugar)
  → MigrationStatus EN CURSO (§11.2-A), no bloqueante
      ├── todos los cursos suben+verifican → COMPLETADO toast (§11.2-B) →
      │     local migrado se borra; fuente de verdad = nube; marcador cerrado
      └── algún curso falla verify → INCOMPLETO recuperable (§11.2-C) →
            local de ese curso intacto; reintento automático + botón manual;
            reaparece en próximo arranque hasta cerrarse (US-E6)
Casos que NO muestran nada de esto:
  · sin progreso local con avance (US-E7) → alta limpia, sin MigrationNotice ni banda
  · segundo perfil del dispositivo (US-E4) → no se ofrece ni se aplica migración
```

### 11.4 Copy de referencia (EN + propuesta ES) — para Frontend

> El EN procede de las specs (Épica E, "Textos de interfaz"). El ES es **propuesta** de UX-UI manteniendo equivalencia semántica y tono amable; Frontend lo convierte a claves i18n (`account:…`) en ambos locales. Expansión ES ≈ +30% ya considerada en el layout (bandas y panel crecen con el contenido, sin anchos fijos).

| Clave (referencia) | EN | ES (propuesta) |
|---|---|---|
| `account.profileSetup.migrationNotice.title` | Your progress will move here | Tu progreso se guarda aquí |
| `account.profileSetup.migrationNotice.body` | The progress saved on this device will be added to this profile, so nothing is lost. | El progreso guardado en este dispositivo se añadirá a este perfil, así no se pierde nada. |
| `account.profileSetup.migrationNotice.multiCourse` | Progress from every course you've played on this device will be transferred. | Se transferirá el progreso de todos los cursos que hayas jugado en este dispositivo. |
| `account.migration.inProgress` | Saving your progress to the cloud… | Guardando tu progreso en la nube… |
| `account.migration.doneToast` | Your progress is safely in the cloud. | Tu progreso está a salvo en la nube. |
| `account.migration.incompleteTitle` | Some progress isn't saved yet | Parte del progreso aún no está guardado |
| `account.migration.incompleteBody` | We couldn't finish saving part of your progress to the cloud. It's still safe on this device and we'll keep trying. | No hemos podido terminar de guardar parte de tu progreso en la nube. Sigue a salvo en este dispositivo y lo seguiremos intentando. |
| `account.migration.retryAction` | Try again now | Reintentar ahora |

**Claves nuevas que propone UX-UI** (no estaban en las specs; a reconciliar con Analista/Frontend):
| Clave propuesta | EN | ES (propuesta) | Para qué |
|---|---|---|---|
| `account.migration.regionLabel` | Progress sync | Guardado del progreso | `aria-label` de la región `MigrationStatus` (contexto para lector de pantalla). |
| `account.migration.dismiss` | Dismiss | Cerrar | Cerrar la banda incompleta/toast sin resolverla (reaparece luego). Opcional. |

### 11.5 Componentes: reutilizar vs. nuevo

**Reutilizar (sin cambios):**
- `PageLayout` (`width="wide"`), `Button` (primary lg para crear; secondary para "Reintentar ahora"), `Icon`, `AppHeader`.
- `ProfileSetupScreen` — **se extiende** con las props de §11.1; no se rehace.
- Tokens existentes: `--tdp-color-surface-warm`, `--tdp-color-border`, `--tdp-color-text`, `--tdp-color-primary`, `--tdp-color-success*`, `--tdp-touch-secondary`, radios y sombras del sistema.

**Nuevo (para Maquetador):**
- **`MigrationNotice`** — bloque presentacional del aviso (§11.1). Puede ser markup + CSS dentro de `ProfileSetupScreen` (no requiere componente aislado si no se reutiliza en otro sitio). Tratamiento calmado; nunca variante de error.
- **`MigrationStatus`** — componente no modal con los tres estados A/B/C (§11.2), `aria-live="polite"`. Recibe de Frontend `{ phase: "inProgress" | "done" | "incomplete", onRetry }`. **No usa el rojo de error en ningún estado.**
- **Icono `cloud`** — nuevo en `Icon.tsx` (línea gruesa, plano, coherente con §1). Se compone con los existentes `check` (estado B) y se acompaña de `retry` si se quiere reforzar el estado C. No hace falta un icono compuesto "nube-check": basta nube + check adyacentes.

---

## 12. CAMBIAR DE CUENTA DE TUTOR EN AJUSTES (US-E8)

> Diseño de UX-UI para US-E8. Un dispositivo compartido entre familias/tutores (dos progenitores, un docente con varias familias) necesita un control para **cerrar sesión y entrar con otra cuenta** desde dentro de la app — hoy solo existe `signOut` en el selector de hijos (con >1 perfil) y en la verificación de email, inaccesible cuando ya hay una sesión de un solo hijo o una cuenta de niño jugando.

### 12.1 `SettingsScreen` extendida — nueva sección "Cuenta"

Se añade un `fieldset` "Cuenta" a Ajustes (§8), coherente con los grupos ya existentes (curso, idioma, perfil, privacidad, borrar datos). Se coloca **junto al grupo de datos** (parte inferior, zona de acciones de cuenta), separado del grupo destructivo "Borrar datos".

```
[PANTALLA: Ajustes — con sección Cuenta]  (solo si la nube está activa y hay sesión)
Header: AppHeader [settings.title] + volver/casa                 (sin cambios)
Body (PageLayout width="narrow"):
  ├── Curso · Idioma · Sonido · Reducir movimiento · Perfil · Privacidad  (sin cambios)
  ├── ⭐ [NUEVO] fieldset "Cuenta"
  │     legend [settings.account.label]
  │     (opcional) help [settings.account.help]  ← "¿compartes el dispositivo?"
  │     └── Botón secondary lg [settings.account.switch]  (≥60px)
  │           · al pulsar → paso RETO DE ADULTO (§12.2)
  └── fieldset "Borrar datos" (destructivo)                       (sin cambios)
Visibilidad (importante):
  · Solo se renderiza cuando la nube está HABILITADA y hay una sesión activa.
    En modo local (sin Firebase) NO hay cuenta → la sección NO aparece.
Estados internos de la sección (inline, mismo patrón que "Borrar datos"):
  · default   → botón [settings.account.switch]
  · challenge → panel AdultChallenge (reto de adulto, componente existente)
  · confirm   → confirmBox con título+cuerpo+acciones (reutiliza el patrón
                confirmBox/confirmActions ya usado por "Borrar datos")
A11y (US-E8 A11y):
  · botón con etiqueta textual; foco visible ≥3px; ≥60px táctil.
  · el reto y la confirmación navegables solo con teclado; foco gestionado.
  · confirmación con role="alertdialog" o región con aria-labelledby al título.
```

### 12.2 Flujo de interacción — reto de adulto → confirmación → cerrar sesión

El orden sigue los criterios de aceptación de US-E8: *activar el control → protegido por reto de adulto → el adulto confirma → se cierra sesión*.

```
Ajustes › sección Cuenta › [Cambiar de cuenta]
  → PASO 1 — RETO DE ADULTO (AdultChallenge, ya existente)
       · pregunta aritmética simple; impide que un niño cierre la sesión por
         curiosidad/accidente y deje al adulto en la pantalla de login (US-E8).
       · [Cancelar] → vuelve a Ajustes sin cambios.
       · acierto → PASO 2.
  → PASO 2 — CONFIRMACIÓN informada
       ┌─────────────────────────────────────────────────────────┐
       │ título  [settings.account.switchConfirmTitle]            │
       │ cuerpo  [settings.account.switchConfirmBody]             │
       │         («… El progreso de tu hijo/a sigue a salvo en    │
       │          la nube.»  ← reaseguro clave: cerrar sesión NO  │
       │          borra datos)                                    │
       │ [ Cancelar (secondary) ]   [ Cambiar de cuenta (primary)]│
       └─────────────────────────────────────────────────────────┘
       · [Cancelar] → vuelve a Ajustes.
       · [Cambiar de cuenta] → signOut → AppRoot re-renderiza a la pantalla
         de entrada (TutorAuthScreen) automáticamente (onTutorAuthChanged).
  → RESULTADO: pantalla de entrada; se puede iniciar sesión con OTRA cuenta.
       · el progreso del niño permanece en la nube (frontera por uid, Inc. 3);
         la nueva sesión ve SOLO sus propios perfiles.
```

**Por qué reto de adulto Y confirmación (dos pasos):** el reto prueba que es un adulto (evita el accidente del niño); la confirmación aporta el **consentimiento informado + el reaseguro** de que no se pierde el progreso. Son propósitos distintos. Es una acción poco frecuente y con consecuencia visible (deja la app en login), así que una fricción deliberada es apropiada. Se implementa **inline** (sin infraestructura de modal nueva), reutilizando el patrón `confirmBox` que Ajustes ya usa para "Borrar datos" y el componente `AdultChallenge` tal cual.

**Alcance (nota de las specs):** el reto de adulto aquí es la **fricción ligera** (`AdultChallenge`), **no** la reautenticación completa de la puerta parental de Inc. 5 (US-D2). Cambiar de cuenta no borra datos, así que no exige reautenticación.

### 12.3 Copy de referencia (EN + propuesta ES) — para Frontend

| Clave (referencia) | EN | ES (propuesta) |
|---|---|---|
| `settings.account.label` | Account | Cuenta |
| `settings.account.switch` | Switch account | Cambiar de cuenta |
| `settings.account.signOut` | Sign out | Cerrar sesión |
| `settings.account.switchConfirmTitle` | Switch to a different account? | ¿Cambiar a otra cuenta? |
| `settings.account.switchConfirmBody` | You'll be signed out and can sign in with another account. Your child's progress stays safely in the cloud. | Se cerrará la sesión y podrás entrar con otra cuenta. El progreso de tu hijo o hija sigue a salvo en la nube. |
| `settings.account.switchConfirmButton` | Switch account | Cambiar de cuenta |
| `settings.account.switchCancel` | Cancel | Cancelar |

**Clave nueva que propone UX-UI:**
| Clave propuesta | EN | ES (propuesta) | Para qué |
|---|---|---|---|
| `settings.account.help` | Sharing this device with another family? | ¿Compartes este dispositivo con otra familia? | Texto de ayuda del `fieldset` que explica para qué sirve "Cambiar de cuenta". Opcional pero recomendado (da contexto al adulto). |

El reto de adulto reutiliza sus claves ya existentes (`account.adultChallenge.title|body|question|wrong|submit|cancel`) sin cambios.

> **Sobre `settings.account.signOut` vs `settings.account.switch`:** ambas claves existen en las specs, pero llevan a la **misma acción y misma pantalla** (login). Mostrar dos botones casi idénticos confunde. **Recomiendo un único control "Cambiar de cuenta"** (intención más clara para el caso de dispositivo compartido) y conservar `settings.account.signOut` solo como copy alternativo si producto prefiere ese verbo. Ver Tensión T-3.

### 12.4 Componentes: reutilizar vs. nuevo

**Reutilizar (sin cambios):**
- `SettingsScreen` — **se extiende** con el fieldset "Cuenta"; no se rehace.
- `AdultChallenge` — tal cual (ya es un panel accesible con label, `role="alert"` en error, input numérico).
- `Button` (secondary lg para "Cambiar de cuenta"; primary/secondary en la confirmación), `Icon`.
- Patrón `confirmBox` / `confirmActions` de `SettingsScreen.module.css` (ya existe para "Borrar datos") — se reutiliza para la confirmación.

**Nuevo (para Maquetador):**
- Ninguna pieza visual nueva imprescindible: la sección se compone de un `fieldset` + `Button` + el patrón inline existente. Si se quiere, un **icono opcional `switch`/`swap`** para el botón; no es necesario (el texto basta). Recomiendo **no** añadir icono nuevo aquí y mantenerlo textual.

**Contrato de datos para Frontend (tensión arquitectónica T-1):** `signOut` (`signOutTutor`) vive en `AppRoot/CloudRoot`, pero `SettingsScreen` se renderiza dentro de `App` (dentro de `CloudGameProvider`). Hay que **pasar el callback hacia abajo**: `CloudRoot → CloudGameProvider → App → SettingsScreen` como prop (p.ej. `onSwitchAccount?: () => void`) más un flag `canSwitchAccount` (true solo con nube activa y sesión). Cuando `onSwitchAccount` no llega (modo local), la sección "Cuenta" no se renderiza. Es lógica de Frontend, señalada aquí para que no se pierda.

---

## 13. Tensiones señaladas (specs ↔ experiencia infantil)

Puntos donde las specs y una buena experiencia para un niño de Primaria rozan. Se dejan explícitos en vez de forzarlos en silencio (política de UX-UI).

| ID | Tensión | Resolución propuesta |
|---|---|---|
| **T-1** | US-E8 pide el control de cambio de cuenta en `SettingsScreen`, pero `signOut` vive en `AppRoot`, dos capas por encima, y en modo local no hay cuenta. | No es un problema de diseño sino de cableado: pasar `onSwitchAccount`/`canSwitchAccount` como props de `CloudRoot` a `SettingsScreen`; ocultar la sección en modo local. Señalado a Frontend (§12.4). |
| **T-2** | El copy de `MigrationStatus` ("Saving to the cloud", "isn't saved yet") está pensado para el **adulto**, pero un niño podría estar jugando y verlo. | Copy siempre no-alarmante y reforzante ("sigue a salvo"); indicador **no bloqueante** que se **oculta durante la sesión** de ejercicios; reintentos automáticos para que el adulto no tenga que actuar (§11.2). |
| **T-3** | Las specs dan dos claves — `settings.account.switch` y `settings.account.signOut` — para la misma acción/pantalla. Dos botones casi iguales confunden a cualquiera, más a un adulto con prisa en un dispositivo del aula. | Un solo botón "Cambiar de cuenta"; `signOut` queda como copy alternativo, no como segundo botón (§12.3). A confirmar con Analista/producto. |
| **T-4** | US-E1 dice "la migración arranca inmediatamente **después de crear el perfil**"; una lectura literal sugeriría una pantalla de espera. | Se interpreta como *disparar* la migración al crear, no *esperar* a que termine: el niño entra a jugar y la migración corre en segundo plano (coherente con US-E6 y con la clave `doneToast`). Sin pantalla bloqueante (§11.2, "Por qué no una pantalla bloqueante"). |
| **T-5** | El concepto "progreso guardado en este dispositivo" es abstracto para un niño pequeño (Modelo B, cuenta de niño). | Se apoya en la supervisión parental asumida en el alta (ADR-004) y en copy concreto y tranquilizador. El aviso no exige que el niño lo comprenda del todo: no bloquea ni pide decisión, solo informa (§11.0-4). |
| **T-6** | Las specs contemplan "empezar de cero descartando el progreso local" como **fuera de alcance**; un niño podría querer un perfil limpio. | Se respeta el "Fuera de alcance": el aviso **no** ofrece descartar. Para un perfil limpio existe crear otro perfil/cuenta (US-E4), no la migración. El diseño no añade un control de descarte que introduciría ambigüedad sobre el dato. |

> **Coordinación con Accesibilidad:** las dos superficies nuevas (MigrationNotice/MigrationStatus y la sección Cuenta) heredan los criterios `A11Y-*` de `02-criterios-accesibilidad.md`. Puntos a verificar en el gate: texto real no solo icono (US-E1), contraste ≥4.5:1 del copy calmado sobre `surface-warm`, `aria-live="polite"` en `MigrationStatus` sin robar foco, foco gestionado y navegación por teclado en el reto+confirmación de cambio de cuenta, y que el estado de fallo **no** dependa del color rojo. El indicador de migración no debe introducir parpadeo (A11Y-MOTION-04): los "puntos" de "en curso" son suaves y se detienen con reduce-motion.
