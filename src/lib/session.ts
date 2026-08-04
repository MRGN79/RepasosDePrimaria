/*
 * Motor de quiz (capa de servicio, sin React). Construye una sesión = secuencia
 * de N ejercicios de un tema (o mezcla), resolviendo los ejercicios generados de
 * mates en instancias concretas con sus operandos y respuesta calculada.
 *
 * También provee la verificación de respuesta por tipo de ejercicio. Puro y
 * testeable: la aleatoriedad (barajado, operandos) es inyectable.
 */
import type { EjercicioAny, Materia, Nivel } from "@content/types";
import { esGenerado } from "@content/types";
import {
  exercisesByTopic,
  exercisesBySubject,
  exerciseById,
} from "@content/registry";
import { generarOperandos, type GeneratedMath, type Rng } from "./randomMath";

export const DEFAULT_SESSION_LENGTH = 5;
export const ALL_SUBJECTS: Materia[] = ["matematicas", "lengua", "ciencias", "sociales", "ingles"];

/** Ejercicio listo para jugar: el generado ya tiene operandos concretos. */
export interface PreparedExercise {
  exercise: EjercicioAny;
  /** instancia de mates congelada (sólo para generados) */
  math?: GeneratedMath;
}

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Resuelve un ejercicio a su forma jugable, generando mates si procede. */
export function prepareExercise(
  exercise: EjercicioAny,
  rng: Rng = Math.random,
): PreparedExercise {
  if (esGenerado(exercise)) {
    return { exercise, math: generarOperandos(exercise.operacion, rng) };
  }
  return { exercise };
}

/**
 * Construye una sesión. Para temas con ejercicios estáticos, baraja y toma
 * hasta `length`. Para temas generados (un único ejercicio plantilla), produce
 * `length` instancias con operandos distintos. Para "mezcla sorpresa" mezcla la
 * materia entera.
 *
 * `excludeIds`: ids de ejercicios estáticos ya dominados. Si excluirlos deja el pool
 * vacío, se usa el pool completo (el niño ha terminado la asignatura: empieza de nuevo).
 */
export function buildSession(
  curso: Nivel,
  materia: Materia,
  tema: string | null,
  length: number = DEFAULT_SESSION_LENGTH,
  rng: Rng = Math.random,
  excludeIds: ReadonlySet<string> = new Set(),
): PreparedExercise[] {
  const fullPool = tema
    ? exercisesByTopic(curso, materia, tema)
    : exercisesBySubject(curso, materia);
  if (fullPool.length === 0) return [];
  const filtered = fullPool.filter((e) => !excludeIds.has(e.id));
  const pool = filtered.length > 0 ? filtered : fullPool;

  const generated = pool.filter(esGenerado);
  const statics = pool.filter((e) => !esGenerado(e));

  // Caso típico de cálculo: el tema es un único ejercicio generado → N instancias.
  if (generated.length > 0 && statics.length === 0) {
    return Array.from({ length }, () => {
      const template = generated[Math.floor(rng() * generated.length)];
      return prepareExercise(template, rng);
    });
  }

  // Mezcla: baraja todo; si no llega a length, repite generados (o vuelve a
  // recorrer los estáticos cuando no hay generados).
  const shuffled = shuffle(pool, rng);
  const out: PreparedExercise[] = [];
  let i = 0;
  while (out.length < length) {
    const next =
      i < shuffled.length
        ? shuffled[i]
        : generated.length > 0
          ? generated[Math.floor(rng() * generated.length)]
          : shuffled[i % shuffled.length];
    out.push(prepareExercise(next, rng));
    i++;
  }
  return out.slice(0, length);
}

/* ----------------------- Verificación de respuestas ----------------------- */

/** Respuesta de emparejado: mapa origen(left) → destino(right). */
export type MatchAnswer = Record<string, string>;

export function checkOptionAnswer(
  exercise: EjercicioAny,
  selectedOptionId: string,
): boolean {
  if (esGenerado(exercise)) return false;
  const correct = exercise.respuestaCorrecta;
  if (Array.isArray(correct)) return correct.includes(selectedOptionId);
  return correct === selectedOptionId;
}

export function checkNumericAnswer(prepared: PreparedExercise, value: string): boolean {
  if (!prepared.math) return false;
  const trimmed = value.trim();
  if (trimmed === "") return false;
  // Number() accepts '1e2', '0x1F', etc. — only plain integers are valid answers.
  const n = /^-?\d+$/.test(trimmed) ? Number(trimmed) : NaN;
  return n === prepared.math.answer;
}

/**
 * Verifica un emparejado completo: cada par left→right del usuario debe coincidir
 * con los pares correctos declarados como "left:right".
 */
export function checkMatchAnswer(
  exercise: EjercicioAny,
  answer: MatchAnswer,
): boolean {
  if (esGenerado(exercise) || !Array.isArray(exercise.respuestaCorrecta)) {
    return false;
  }
  const correctPairs = exercise.respuestaCorrecta
    .map((p) => p.split(":"))
    .filter((p) => p.length === 2);
  if (correctPairs.length === 0) return false;
  if (Object.keys(answer).length !== correctPairs.length) return false;
  return correctPairs.every(([l, r]) => answer[l] === r);
}

/** Extrae las opciones de la columna izquierda de un emparejado (ids l*). */
export function matchLeftIds(exercise: EjercicioAny): string[] {
  if (esGenerado(exercise) || !Array.isArray(exercise.respuestaCorrecta)) return [];
  return exercise.respuestaCorrecta.map((p) => p.split(":")[0]);
}

/**
 * Sesión de repaso de fallos: toma los IDs fallados, los resuelve a ejercicios
 * reales, baraja y devuelve hasta `length`.
 */
export function buildReviewSession(
  failedIds: string[],
  length: number = DEFAULT_SESSION_LENGTH,
  rng: Rng = Math.random,
): PreparedExercise[] {
  const exercises = [...new Set(failedIds)]
    .map((id) => exerciseById(id))
    .filter((e): e is EjercicioAny => e !== undefined);
  if (exercises.length === 0) return [];
  const shuffled = shuffle(exercises, rng);
  return shuffled.slice(0, length).map((e) => prepareExercise(e, rng));
}

/**
 * Sesión de misión diaria: 3 ejercicios de cada asignatura mezclados.
 * El orden se baraja para que no salgan todas las mates juntas, etc.
 * `excludeIds` filtra las preguntas ya dominadas por el niño.
 */
export function buildDailySession(
  curso: Nivel,
  perSubject = 3,
  rng: Rng = Math.random,
  excludeIds: ReadonlySet<string> = new Set(),
): PreparedExercise[] {
  const all = ALL_SUBJECTS.flatMap((materia) =>
    buildSession(curso, materia, null, perSubject, rng, excludeIds),
  );
  return shuffle(all, rng);
}
