/*
 * Construcción de la ficha imprimible (flujos §7, ADR §5/§7).
 * Filtra ejercicios imprimibles por materia/tema, CONGELA los valores de los
 * ejercicios de mates generados (operandos fijos) para que la ficha y su hoja de
 * soluciones sean coherentes. Puro y testeable.
 */
import type { EjercicioAny, Materia, Nivel } from "@content/types";
import { esGenerado } from "@content/types";
import { exercisesByTopic, exercisesBySubject } from "@content/registry";
import { generarOperandos, type GeneratedMath, type Rng } from "./randomMath";

export const PRINT_SHEET_LENGTH = 10;

export interface PrintItem {
  exercise: EjercicioAny;
  /** instancia congelada para mates generadas */
  math?: GeneratedMath;
}

/**
 * Genera una ficha de `length` ejercicios. Los temas generados producen N
 * instancias con números congelados distintos; los estáticos se repiten en orden
 * hasta completar (los escolares aceptan repetición en hojas de práctica).
 */
export function buildPrintSheet(
  curso: Nivel,
  materia: Materia,
  tema: string | null,
  length: number = PRINT_SHEET_LENGTH,
  rng: Rng = Math.random,
): PrintItem[] {
  const pool = (
    tema ? exercisesByTopic(curso, materia, tema) : exercisesBySubject(curso, materia)
  ).filter((e) => e.imprimible);
  if (pool.length === 0) return [];

  const out: PrintItem[] = [];
  for (let i = 0; i < length; i++) {
    const e = pool[i % pool.length];
    if (esGenerado(e)) {
      out.push({ exercise: e, math: generarOperandos(e.operacion, rng) });
    } else {
      out.push({ exercise: e });
    }
  }
  return out;
}
