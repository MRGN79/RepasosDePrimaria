# ADR-002: Modelo de datos multi-curso y aislamiento de progreso por curso

**Fecha:** 2026-08-03
**Estado:** Aceptado
**Decidido por:** Arquitecto

---

## Contexto

El producto amplía su objetivo: de una app centrada en 3.º de Primaria pasa a
cubrir **todos los cursos de Primaria (1.º–6.º)** bajo la marca "Repasos de
Primaria". El usuario debe poder **seleccionar su curso y cambiarlo** cuando
quiera, y los avances (racha, estrellas, medallas, misión diaria, progreso por
tema/materia) de un curso **no deben interferir** con los de otro.

Restricciones y fuerzas de esta fase:

- **Sólo 3.º tiene contenido real.** El resto de cursos se ofrecen en el selector
  con las materias marcadas "Pronto"; no se inventa contenido de relleno.
- **No hay pérdida de datos.** Existen usuarios con progreso guardado en el
  esquema anterior (v1, un único curso implícito, 3.º). Ese progreso debe
  conservarse al desplegar el cambio.
- **Sigue sin backend.** Persistencia 100% local (`localStorage`), como en
  ADR-001 §4. La promesa de privacidad ("nada sale del dispositivo") se mantiene
  intacta en esta fase.
- **Cambio de tooling nulo.** Se reutiliza la capa de persistencia versionada y
  la lectura defensiva ya existentes.

Contexto estratégico a futuro (no se implementa aquí, pero condiciona el diseño
para no cerrar puertas innecesariamente): el producto dejará de distribuirse como
web con URL pública y pasará a ser una **aplicación instalable en Android (posible
iOS después)**, con login y guardado en la nube vía **Firebase**. Eso será un
cambio de arquitectura mayor con su propio ADR; aquí sólo se evita un diseño que
lo dificulte, sin sobre-diseñar para ello.

## Decisión

### 1. El esquema de persistencia sube a v2 con avances aislados por curso

`PersistedState` (esquema v2) separa lo **global del dispositivo** de lo
**propio de cada curso**:

```
PersistedState (v2)
├─ schemaVersion: 2
├─ preferences        (GLOBAL: idioma, sonido, movimiento reducido)
├─ currentCourse      (curso activo: "1".."6")
└─ courses            (Partial<Record<Curso, CourseState>>)
     └─ CourseState   (perfil, racha, estrellas, medallas, misión diaria, progreso)
```

- **`Curso = "1" | "2" | "3" | "4" | "5" | "6"`.** `DEFAULT_COURSE = "3"` (el
  único con contenido).
- Los avances viven en `courses[curso]`; se **crean bajo demanda** al seleccionar
  un curso por primera vez.
- Las **preferencias** (idioma, sonido, movimiento) son del dispositivo, no del
  curso: no tiene sentido duplicarlas ni que cambien al cambiar de curso.

### 2. El perfil (avatar/apodo) es por curso, pero se hereda al abrir uno nuevo

`profile` forma parte de `CourseState`, de modo que cada curso puede tener su
propio personaje (soporta hermanos en cursos distintos compartiendo dispositivo).
Para no forzar un onboarding en cada cambio de curso, **al activar un curso nuevo
se copia el perfil del curso activo** como valor inicial; el niño puede cambiarlo
luego desde "editar perfil". El progreso, en cambio, arranca siempre a cero.

### 3. Migración v1 → v2 sin pérdida

`parseState` detecta `schemaVersion: 1` (avances en la raíz) y los **mueve
íntegros al curso "3"**, elevando las preferencias al nivel global. El resto de la
lectura defensiva (ADR-001 §4) se conserva: ante corrupción o esquema
desconocido, se arranca limpio sin lanzar. La validación por-campo se factoriza en
`parseCourseState`, reutilizada tanto por la migración como por la validación v2.

### 4. El catálogo pasa a depender del curso

`buildSubjectVMs(curso, t)` y `buildTopicVMs(curso, materia, t)` reciben el curso:

- **Curso 3:** comportamiento anterior — una materia/tema es "Pronto" si no tiene
  contenido en el registro.
- **Resto de cursos:** se muestran las **5 materias troncales** de Primaria
  (Matemáticas, Lengua, Natural Science, Sociales, English) **todas "Pronto"**. Se
  excluye la zona-preview "cuarto", propia de 3.º. No se toca el contenido
  existente ni el registro de ejercicios.

### 5. La UI consume una "vista aplanada" del curso activo

El store expone `state` como `ActiveView = CourseState & { preferences,
currentCourse }`. Así las pantallas siguen leyendo `state.streak`, `state.stars`,
`state.progress`, etc. **sin cambios**, y el radio de impacto del multi-curso se
limita a: selector de curso (onboarding + ajustes), estado "Pronto" en Home para
cursos sin contenido, y las firmas de catálogo. La consolidación de sesión y las
reglas de medallas operan sobre `CourseState`, no sobre el estado completo.

## Consecuencias

**Positivas:**
- Aislamiento real entre cursos: imposible que la racha o las medallas de un curso
  contaminen otro (cada uno es una entrada independiente en `courses`).
- Migración transparente: los usuarios de 3.º conservan todo su progreso.
- Cambio mínimo en la UI gracias a la vista aplanada; el resto del código de
  pantallas no se entera del multi-curso.
- Añadir contenido a otro curso en el futuro no requiere tocar el modelo de
  almacenamiento, sólo el contenido y el catálogo.

**Negativas / trade-offs:**
- Cinco de los seis cursos están "vacíos" en esta fase; el selector muestra
  opciones sin actividades todavía (mitigado con el estado "Pronto" explícito).
- El perfil por-curso con herencia añade una regla sutil (copiar al crear) que hay
  que recordar; se documenta y se cubre con la lógica del store.

**Riesgos:**
- Si en el futuro se decide que el perfil debe ser único del dispositivo (un solo
  niño avanzando de curso), habrá que consolidar perfiles; es un cambio acotado a
  la capa de storage.

## Relación con la futura migración a Firebase / app Android

El modelo `courses[curso] → CourseState` es **serializable y plano**, y ya separa
lo global de lo per-curso. Eso encaja de forma natural con un documento por usuario
en Firestore (p. ej. `users/{uid}/courses/{curso}`) el día que exista login: la
migración de `localStorage` a la nube podrá mapear cada `CourseState` a un
documento sin rediseñar el dominio. **No se implementa nada de esto ahora** y no se
añade ninguna abstracción para anticiparlo; simplemente el diseño elegido no lo
estorba. La decisión de adoptar Firebase, login y empaquetado Android será un ADR
propio (ver `docs/BACKLOG.md`).

## Alternativas consideradas

### Opción A — Namespacing por prefijo de clave (topicId con el curso incrustado)
Guardar el progreso plano y prefijar cada clave con el curso (`"3:operations.add"`).
**Por qué se descarta:** ensucia todas las estructuras de progreso, complica las
reglas de medallas y hace frágil el aislamiento (un olvido de prefijo mezcla
cursos). El agrupado explícito en `courses[curso]` es más seguro y legible.

### Opción B — Una clave de localStorage distinta por curso (`tdp:v2:3`, `tdp:v2:5`)
**Por qué se descarta:** dispersa el estado en N claves, complica la migración
atómica desde v1 y la lógica de "curso activo" y preferencias globales. Un único
documento versionado mantiene la lectura/escritura y la migración en un solo sitio.

### Opción C — Perfil y preferencias también por curso
**Por qué se descarta:** las preferencias (idioma, sonido) son claramente del
dispositivo; duplicarlas sorprendería al usuario al cambiar de curso. El perfil sí
se mantiene por curso (caso hermanos) pero con herencia para evitar fricción.

---

## Adenda (2026-08-04): del catálogo consciente de curso al catálogo con contenido por curso

**Estado:** Aceptado · **Decidido por:** Arquitecto

### Contexto de la adenda

El ADR original dejó fuera a propósito el contenido: "sólo 3.º tiene contenido…
no se toca el contenido existente ni el registro". Al abordar el **primer paquete
de contenido de 2.º de Primaria** (MVP ligero), esa frontera se cruza y aparece un
riesgo latente que el diseño original no cubría: el registro de ejercicios
(`content/registry.ts`) filtraba **sólo por materia + tema**, sin curso. Con dos
cursos con contenido activo simultáneamente, dos temas homónimos de cursos
distintos mezclarían sus ejercicios (misión diaria, sesión por tema, ficha
imprimible). Los síntomas concretos:

- `content/materias.json` era una lista plana única (la taxonomía de 3.º), sin
  dimensión de curso.
- `exercisesByTopic` / `topicsWithContent` no consideraban el curso.
- `Nivel = "3" | "4"` no cubría el resto de cursos y `Ejercicio.nivel` no se usaba
  para filtrar.
- `src/lib/catalog.ts` codificaba `COURSE_WITH_CONTENT = "3"` como constante fija;
  `courseHasContent` y `buildSubjectVMs`/`buildTopicVMs` asumían **un único curso
  con contenido en toda la app**.

### Decisión de la adenda

1. **`Ejercicio.nivel` es el discriminador de curso.** `Nivel` se alinea con
   `Curso` (`"1".."6"`). Todas las consultas del registro filtran también por
   `nivel`, de modo que dos cursos con contenido nunca mezclan ejercicios aunque
   compartan id de tema. Las firmas pasan a
   `exercisesByTopic(curso, materia, tema)`, `exercisesBySubject(curso, materia)`,
   `topicsWithContent(curso, materia)`.

2. **El catálogo pasa a ser un índice por curso.** Cada curso con contenido tiene
   su propio fichero (`content/materias.json` = 3.º, `content/materias-2.json` =
   2.º), cargados en un mapa `curso → CatalogoMaterias` en `catalog.ts`. Se
   descarta un único JSON con todos los cursos incrustados para no reescribir el
   índice grande de 3.º ni su suite i18n, y porque ficheros separados son más
   legibles y fáciles de revisar por curso.

3. **"Qué cursos tienen contenido" se DERIVA del registro, no de una constante.**
   `courseHasContent(curso)` consulta `coursesWithContent()` (el conjunto de
   `nivel` presentes en el contenido real). Añadir un tercer curso en el futuro
   sólo requiere su índice y su contenido: no se vuelve a tocar esta función ni el
   catálogo. Se elimina `COURSE_WITH_CONTENT`.

4. **`buildSubjectVMs`/`buildTopicVMs` funcionan con N cursos con contenido.** Un
   curso con contenido recorre **su propio** índice; los cursos sin contenido
   siguen mostrando las 5 troncales en "Pronto" (se reutiliza la metadata de
   materia —icono, color, título— de 3.º, que es común a toda Primaria).

5. **Generadores de cálculo propios de 2.º.** Se añaden a `randomMath.ts` tres
   operaciones alineadas a LOMLOE 2.º —`add-nocarry` (suma sin llevar ≤ 99),
   `sub-noborrow` (resta sin pedir prestado) y `times-easy` (tablas del 2, 5 y
   10)— reutilizando el patrón de ejercicio generado (D-6) en lugar de escribir
   cientos de combinaciones a mano.

El threading del curso se propaga hasta la UI (`buildSession`, `buildDailySession`,
`buildPrintSheet`, `useSession`, `SessionContainer`, `App.tsx`) tomando siempre el
curso activo del store (`currentCourse`).

### Consecuencias

- **Aislamiento garantizado por tests** (`registry.multicourse.test.ts`): conjuntos
  de ejercicios disjuntos por curso, sesiones y misión diaria acotadas al curso.
- El aislamiento de **progreso** entre cursos ya lo daba el ADR original
  (`courses[curso].progress`, keyeado por tema dentro de cada curso): aunque dos
  cursos compartan un id de tema, sus contadores no se cruzan.
- Añadir un curso nuevo es aditivo: índice + contenido con su `nivel`. Ninguna de
  las funciones de catálogo/registro vuelve a tocarse.

### Por qué es adenda y no un ADR nuevo

Es una **extensión natural** de la decisión "el catálogo depende del curso"
(sección 4 del ADR): pasa de *consciente de curso* a *con contenido por curso*. No
cambia el modelo de persistencia (v2 intacto), ni la vista aplanada, ni las reglas
de aislamiento de progreso. No hay cambio de rumbo que justifique un ADR-003-bis.

---
<!-- Copiar este archivo como docs/decisions/ADR-NNN-titulo-en-kebab-case.md -->
<!-- Nunca reutilizar un número, aunque el ADR se deprece -->
