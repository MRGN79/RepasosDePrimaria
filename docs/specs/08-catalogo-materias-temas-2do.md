# Catálogo de materias y temas — 2º de Primaria (LOMLOE) · MVP ligero

> Primer paquete jugable de 2.º de Primaria. **No** es paridad con 3.º: 2–4 temas
> por materia con ~10 ítems cada uno (más los generados por plantilla en cálculo).
> Se ampliará en incrementos futuros, como se hizo con 3.º.
> Alineado al currículo LOMLOE de Educación Primaria (RD 157/2022) para 2.º.
> Contenido de **elaboración propia** (mismo estándar legal que 3.º; ver footer y
> README). Los `topic.id` son estables y sirven de clave de datos e i18n.

## Alcance del MVP

- Curso: **2.º de Primaria** (`nivel: "2"`).
- Materias troncales: `matematicas`, `lengua` (ES), `ciencias` = Natural Science
  (EN, D-5), `sociales` (sigue idioma de UI), `ingles` = English (EN, D-1).
- Aislamiento por curso garantizado en el registro (ver ADR-002, adenda).

## Reglas i18n aplicadas (idénticas a 3.º)

- Títulos de materia/tema (menú): namespace `content`, en **EN y ES** para todos
  los cursos con contenido.
- Enunciados y opciones: namespace `exercises`. Idioma fijo por materia:
  Lengua = ES; Natural Science e English = EN; Matemáticas y Sociales = EN + ES.

---

## A. Matemáticas (`matematicas`) — sigue idioma de UI (EN+ES)

| Tema (`topic.id`) | Contenido LOMLOE 2.º | Tipo |
|---|---|---|
| `numbers.count_100` | Numeración hasta 100: anterior/posterior, decenas, comparar | estático (10 ítems) |
| `operations.add_nocarry` | Sumas sin llevar (resultado ≤ 99) | generado (`add-nocarry`) |
| `operations.sub_noborrow` | Restas sin llevar (sin pedir prestado) | generado (`sub-noborrow`) |
| `operations.times_2_5_10` | Tablas iniciales del 2, 5 y 10 | generado (`times-easy`) |

Los temas generados producen operandos aleatorios por repetición con respuesta
calculada (patrón D-6), no combinaciones escritas a mano.

## B. Lengua (`lengua`) — sólo ES (D-1)

| Tema (`topic.id`) | Contenido LOMLOE 2.º | Ítems |
|---|---|---|
| `phonology.syllables` | Conciencia silábica: contar sílabas de palabras | 10 |
| `orthography.capitals` | Mayúscula: inicio de frase y nombres propios | 10 |
| `grammar.singular_plural` | Singular y plural | 10 |

## C. Natural Science (`ciencias`) — sólo EN (D-5)

| Tema (`topic.id`) | Contenido LOMLOE 2.º | Ítems |
|---|---|---|
| `senses.five_senses` | The five senses | 10 |
| `body.human_body` | The human body (basic parts) | 10 |
| `living_things.animals_basic` | Animals | 10 |

## D. Ciencias Sociales (`sociales`) — sigue idioma de UI (EN+ES)

| Tema (`topic.id`) | Contenido LOMLOE 2.º | Ítems |
|---|---|---|
| `community.family` | La familia | 10 |
| `community.school` | El colegio | 10 |
| `community.neighborhood` | El barrio | 10 |

## E. English (`ingles`) — sólo EN (D-1)

| Tema (`topic.id`) | Contenido LOMLOE 2.º | Ítems |
|---|---|---|
| `en_vocabulary.numbers_1_20` | Numbers 1–20 | 10 |
| `en_vocabulary.colors` | Colours | 10 |
| `en_vocabulary.animals_pets` | Pets / domestic animals | 10 |

---

## Criterios de aceptación

1. Al seleccionar el curso **2.º**, Home muestra las 5 materias troncales con
   contenido real (no "Pronto"); los temas listados son los de la tabla anterior.
2. La **misión diaria** y la **sesión por tema** de 2.º sólo presentan ejercicios
   de 2.º; nunca aparecen ejercicios de 3.º (y viceversa), aunque el niño alterne
   de curso. El progreso de cada curso permanece aislado (ADR-002).
3. Cálculo: sumas/restas sin llevar con números ≤ 99; tablas restringidas a 2, 5
   y 10. La respuesta se valida contra los operandos generados.
4. i18n: todas las claves nuevas existen en el/los idioma(s) que exige la materia;
   los temas de idioma fijo (Lengua ES; Science/English EN) no requieren el otro.
5. Adecuación a la edad (6–7 años): enunciados breves, vocabulario cercano, sin
   datos personales.

## Fuera de alcance de este MVP (incrementos futuros de 2.º)

- Resta/suma con llevada, decenas y centenas más allá de 100.
- Más temas de lengua (separación de palabras, signos de interrogación), de
  ciencias (plantas, estados del agua) y de sociales (el tiempo, los oficios).
- Ejercicios de emparejar para 2.º (el MVP usa verdadero/falso y opción múltiple).
