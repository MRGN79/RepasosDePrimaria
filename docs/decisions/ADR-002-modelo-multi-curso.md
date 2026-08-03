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
<!-- Copiar este archivo como docs/decisions/ADR-NNN-titulo-en-kebab-case.md -->
<!-- Nunca reutilizar un número, aunque el ADR se deprece -->
