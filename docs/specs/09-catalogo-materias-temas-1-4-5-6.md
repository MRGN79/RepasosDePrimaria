# Catálogo de materias y temas — 1.º, 4.º, 5.º y 6.º de Primaria · MVP ligero

> Continuación de la spec 08 (2.º). Objetivo deliberadamente **mínimo**: dar a
> cada curso restante (1.º, 4.º, 5.º, 6.º) **un único tema jugable por materia
> troncal** con 5–8 ítems, para poder navegar y **probar el cambio de curso** en
> la app real. **No** es cobertura curricular ni paridad con 3.º.
> Alineado al currículo LOMLOE de Educación Primaria (RD 157/2022).
> Contenido de **elaboración propia** (mismo estándar legal que 2.º y 3.º; ver
> footer y README). Los `topic.id` son estables y sirven de clave de datos e i18n.

## Alcance

- Cursos: **1.º, 4.º, 5.º y 6.º** (`nivel: "1" | "4" | "5" | "6"`).
- Materias troncales: `matematicas`, `lengua` (ES, D-1), `ciencias` = Natural
  Science (EN, D-5), `sociales` (sigue idioma de UI, EN+ES), `ingles` = English
  (EN, D-1).
- **Un tema por materia y curso** (no varios bloques). 5–8 ítems por tema, mezcla
  de verdadero/falso y opción múltiple; en Matemáticas se usa el patrón
  **generado** (D-6) donde encaja mejor que escribir ítems a mano.
- Aislamiento por curso garantizado en el registro (ADR-002, adenda). Cada curso
  tiene su propio índice `content/materias-N.json` y su módulo de contenido
  (`content/exercises/cursoN.ts`).

## Tema elegido por materia y curso, y por qué encaja en ese curso (LOMLOE)

### 1.º de Primaria (ciclo 1 — primeros contactos)

| Materia | Tema (`topic.id`) | Por qué encaja en 1.º |
|---|---|---|
| Matemáticas | `operations.add_to_10` — Sumas hasta 10 | En ciclo 1 se trabaja el sentido numérico y las sumas con resultados pequeños; **generado** (`add-to-ten`, resultado ≤ 10). |
| Lengua (ES) | `phonology.vowels` — Las vocales | Conciencia fonológica inicial: identificar las cinco vocales es de los primeros contenidos de lectoescritura. |
| Natural Science (EN) | `living_things.living_nonliving` — Living/non-living | Distinguir seres vivos de objetos es una idea básica del conocimiento del medio en ciclo 1. |
| Sociales | `time.seasons` — Las estaciones | Las estaciones y los ciclos del tiempo cercanos al niño son contenido propio de ciclo 1. |
| English (EN) | `en_vocabulary.greetings` — Greetings | Fórmulas de saludo y cortesía: primer vocabulario funcional en lengua extranjera. |

### 4.º de Primaria (ciclo 2)

| Materia | Tema (`topic.id`) | Por qué encaja en 4.º |
|---|---|---|
| Matemáticas | `operations.multiply_2digit` — Multiplicación por dos cifras | En ciclo 2 se consolida la multiplicación con multiplicadores de dos cifras; **generado** (`multiply-two-digit`, 2 cifras × 2 cifras). |
| Lengua (ES) | `grammar.verb_tenses` — Los tiempos verbales | Reconocer pasado/presente/futuro del verbo es contenido gramatical de ciclo 2. |
| Natural Science (EN) | `ecosystems.food_chains` — Food chains | Cadenas alimentarias y relaciones entre seres vivos (productores/consumidores) son propias de ciclo 2. |
| Sociales | `geography.water_cycle` — El ciclo del agua | El ciclo del agua (evaporación, condensación, precipitación) es un contenido clásico de 4.º. |
| English (EN) | `en_vocabulary.family` — Family | Vocabulario de la familia, ampliando el léxico personal en lengua extranjera. |

### 5.º de Primaria (ciclo 3)

| Materia | Tema (`topic.id`) | Por qué encaja en 5.º |
|---|---|---|
| Matemáticas | `numbers.decimals` — Los números decimales | Los números decimales (décimas, comparación, suma sencilla) se introducen y afianzan en ciclo 3; ítems **estáticos** (razonamiento conceptual). |
| Lengua (ES) | `grammar.subject_predicate` — Sujeto y predicado | El análisis de la oración en sujeto y predicado es contenido sintáctico de 5.º. |
| Natural Science (EN) | `human_body.circulatory` — Circulatory system | El estudio de los aparatos del cuerpo humano (aquí, el circulatorio) corresponde a ciclo 3. |
| Sociales | `geography.climate` — El clima | Diferenciar tiempo y clima y conocer factores y tipos de clima es contenido geográfico de ciclo 3. |
| English (EN) | `en_vocabulary.daily_routines` — Daily routines | Rutinas diarias: estructuras y léxico de acciones cotidianas, típico del nivel. |

### 6.º de Primaria (ciclo 3)

| Materia | Tema (`topic.id`) | Por qué encaja en 6.º |
|---|---|---|
| Matemáticas | `numbers.percentages` — Los porcentajes | Los porcentajes y su relación con fracciones y decimales se trabajan al final de Primaria; ítems **estáticos**. |
| Lengua (ES) | `orthography.diphthong_hiatus` — Diptongos e hiatos | Distinguir diptongo e hiato (y su relación con la acentuación) es contenido ortográfico de 6.º. |
| Natural Science (EN) | `energy.energy_sources` — Energy and its sources | La energía, sus formas y fuentes (renovables y no renovables) es contenido de ciclo 3. |
| Sociales | `geography.european_union` — La Unión Europea | España en Europa y la Unión Europea es contenido de ciudadanía/geografía de 6.º. |
| English (EN) | `en_vocabulary.food` — Food and meals | Vocabulario de comidas y alimentos, ampliando campos léxicos en lengua extranjera. |

## Reglas i18n aplicadas (idénticas a 2.º y 3.º)

- Títulos de materia/tema (menú): namespace `content`, en **EN y ES** para todos
  los cursos con contenido (para las materias de idioma fijo, el título del menú
  se muestra en inglés en ambos locales, como ya ocurría en 2.º/3.º).
- Enunciados y opciones: namespace `exercises`. Idioma fijo por materia:
  Lengua = ES; Natural Science e English = EN; Matemáticas y Sociales = EN + ES.
- Los temas generados de Matemáticas (1.º y 4.º) no requieren claves de enunciado
  propias: usan la plantilla `exercises:math.template.operation` ya existente.

## Criterios de aceptación

1. Al seleccionar cualquiera de los cursos **1.º, 4.º, 5.º o 6.º**, Home muestra
   las 5 materias troncales con contenido real (ninguna en "Pronto"), cada una
   con su único tema jugable.
2. La **misión diaria** y la **sesión por tema** de cada curso sólo presentan
   ejercicios de ese curso; nunca se mezclan cursos, aunque el niño alterne. El
   progreso de cada curso permanece aislado (ADR-002).
3. Cálculo generado: 1.º sumas con resultado ≤ 10; 4.º multiplicación de dos
   cifras por dos cifras. La respuesta se calcula y valida contra los operandos.
4. i18n: todas las claves nuevas existen en el/los idioma(s) que exige la materia
   (verificado por `i18n-content.test.ts`, que ahora cubre los seis cursos).
5. Adecuación a la edad de cada curso: enunciados breves, vocabulario cercano,
   sin datos personales.

## Fuera de alcance de este MVP (incrementos futuros)

- Más de un tema por materia; cobertura curricular por bloques.
- Zona "Reto" o adelantos del curso siguiente.
- Ejercicios de emparejar (este MVP usa verdadero/falso y opción múltiple).
- Ampliación de los generadores de cálculo (p. ej. decimales generados en 5.º,
  divisiones con resto en 6.º); de momento 5.º y 6.º usan ítems estáticos.
