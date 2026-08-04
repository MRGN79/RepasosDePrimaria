/*
 * Registro central de contenido. Agrega los ejercicios de cada materia y expone
 * una API de consulta limpia para Frontend (sin que toque los JSON directamente).
 * Añadir contenido = editar un módulo de materia, sin tocar lógica.
 */
import type { EjercicioAny, Materia, Nivel } from "./types";
import { matematicas } from "./exercises/matematicas";
import { lengua } from "./exercises/lengua";
import { ciencias } from "./exercises/ciencias";
import { sociales } from "./exercises/sociales";
import { ingles } from "./exercises/ingles";
import { cuarto } from "./exercises/cuarto";
import { matematicas2 } from "./exercises/matematicas2";
import { lengua2 } from "./exercises/lengua2";
import { ciencias2 } from "./exercises/ciencias2";
import { sociales2 } from "./exercises/sociales2";
import { ingles2 } from "./exercises/ingles2";
import { curso1 } from "./exercises/curso1";
import { curso4 } from "./exercises/curso4";
import { curso5 } from "./exercises/curso5";
import { curso6 } from "./exercises/curso6";

export const ALL_EXERCISES: EjercicioAny[] = [
  // 3.º de Primaria (nivel "3")
  ...matematicas,
  ...lengua,
  ...ciencias,
  ...sociales,
  ...ingles,
  ...cuarto,
  // 2.º de Primaria (nivel "2")
  ...matematicas2,
  ...lengua2,
  ...ciencias2,
  ...sociales2,
  ...ingles2,
  // 1.º, 4.º, 5.º y 6.º de Primaria (MVP ligero: un tema por materia)
  ...curso1,
  ...curso4,
  ...curso5,
  ...curso6,
];

const EXERCISE_MAP = new Map(ALL_EXERCISES.map((e) => [e.id, e]));

/**
 * Materias cuyo contenido NO sigue el selector de idioma de la UI (D-1, D-5):
 * Lengua e Inglés (idioma propio) y Natural Science (fija en inglés).
 * Sus claves i18n sólo existen en EN o ES respectivamente; el contenido se
 * resuelve siempre con su idioma fijo.
 */
export const FIXED_LANGUAGE_SUBJECTS: Record<Materia, "en" | "es" | null> = {
  matematicas: null, // sigue la UI
  sociales: null, // sigue la UI
  lengua: "es", // sólo ES
  ciencias: "en", // Natural Science: sólo EN
  ingles: "en", // English: sólo EN
  cuarto: null, // sigue la UI
};

export function fixedLanguageFor(materia: Materia): "en" | "es" | null {
  return FIXED_LANGUAGE_SUBJECTS[materia];
}

/*
 * Todas las consultas de contenido filtran por CURSO (`nivel`), además de por
 * materia/tema. Es el aislamiento que impide que dos cursos con contenido activo
 * (p. ej. 2.º y 3.º) mezclen sus ejercicios aunque coincidan en id de tema.
 */
export function exercisesByTopic(
  curso: Nivel,
  materia: Materia,
  tema: string,
): EjercicioAny[] {
  return ALL_EXERCISES.filter(
    (e) => e.nivel === curso && e.materia === materia && e.tema === tema,
  );
}

export function exercisesBySubject(curso: Nivel, materia: Materia): EjercicioAny[] {
  return ALL_EXERCISES.filter((e) => e.nivel === curso && e.materia === materia);
}

/** Temas con contenido real para una materia dentro de un curso (orden de aparición). */
export function topicsWithContent(curso: Nivel, materia: Materia): string[] {
  const seen: string[] = [];
  for (const e of ALL_EXERCISES) {
    if (e.nivel === curso && e.materia === materia && !seen.includes(e.tema)) {
      seen.push(e.tema);
    }
  }
  return seen;
}

/**
 * Conjunto de cursos que tienen al menos un ejercicio real. Se deriva del propio
 * contenido registrado, de modo que activar un curso nuevo no obliga a tocar esta
 * lógica: basta con añadir ejercicios con su `nivel`.
 */
export function coursesWithContent(): Set<Nivel> {
  return new Set(ALL_EXERCISES.map((e) => e.nivel));
}

export function exerciseById(id: string): EjercicioAny | undefined {
  return EXERCISE_MAP.get(id);
}
