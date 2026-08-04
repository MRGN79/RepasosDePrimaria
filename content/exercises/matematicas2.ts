/*
 * Contenido real de Matemáticas — 2.º de Primaria (nivel "2").
 * Alineado al currículo LOMLOE (RD 157/2022) de 2.º: numeración hasta 100,
 * sumas y restas sin llevar, tablas iniciales (2, 5, 10).
 * Mates sigue el idioma de la UI (claves i18n en EN y ES).
 * Los ejercicios de cálculo son GENERADOS (D-6): operandos aleatorios por
 * repetición, respuesta calculada. Los de numeración son estáticos.
 * Contenido original.
 */
import type { EjercicioAny } from "../types";

const tf = (id: string, tema: string, q: string, ans: "true" | "false"): EjercicioAny => ({
  id, materia: "matematicas", tema, nivel: "2", tipo: "verdadero-falso",
  enunciadoKey: q,
  opciones: [
    { id: "true", textoKey: "quiz:answer.trueLabel" },
    { id: "false", textoKey: "quiz:answer.falseLabel" },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

const mc = (id: string, tema: string, sec: string, n: string, ans: "a" | "b" | "c"): EjercicioAny => ({
  id, materia: "matematicas", tema, nivel: "2", tipo: "opcion-multiple",
  enunciadoKey: `exercises:math.${sec}.${n}.prompt`,
  opciones: [
    { id: "a", textoKey: `exercises:math.${sec}.${n}.a` },
    { id: "b", textoKey: `exercises:math.${sec}.${n}.b` },
    { id: "c", textoKey: `exercises:math.${sec}.${n}.c` },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

export const matematicas2: EjercicioAny[] = [
  // ─── Números hasta 100 (estático) ────────────────────────────────────────
  tf("mat-2-count-001", "numbers.count_100", "exercises:math.count100.q1.prompt", "true"),
  tf("mat-2-count-002", "numbers.count_100", "exercises:math.count100.q2.prompt", "true"),
  mc("mat-2-count-003", "numbers.count_100", "count100", "q3", "a"),
  tf("mat-2-count-004", "numbers.count_100", "exercises:math.count100.q4.prompt", "true"),
  mc("mat-2-count-005", "numbers.count_100", "count100", "q5", "a"),
  tf("mat-2-count-006", "numbers.count_100", "exercises:math.count100.q6.prompt", "true"),
  mc("mat-2-count-007", "numbers.count_100", "count100", "q7", "b"),
  tf("mat-2-count-008", "numbers.count_100", "exercises:math.count100.q8.prompt", "true"),
  mc("mat-2-count-009", "numbers.count_100", "count100", "q9", "b"),
  tf("mat-2-count-010", "numbers.count_100", "exercises:math.count100.q10.prompt", "true"),

  // ─── Sumas sin llevar (generado) ─────────────────────────────────────────
  { id: "mat-2-add-gen", materia: "matematicas", tema: "operations.add_nocarry", nivel: "2", tipo: "respuesta-corta", operacion: "add-nocarry", plantillaKey: "exercises:math.template.operation", imprimible: true },

  // ─── Restas sin llevar (generado) ────────────────────────────────────────
  { id: "mat-2-sub-gen", materia: "matematicas", tema: "operations.sub_noborrow", nivel: "2", tipo: "respuesta-corta", operacion: "sub-noborrow", plantillaKey: "exercises:math.template.operation", imprimible: true },

  // ─── Tablas del 2, 5 y 10 (generado) ─────────────────────────────────────
  { id: "mat-2-times-gen", materia: "matematicas", tema: "operations.times_2_5_10", nivel: "2", tipo: "respuesta-corta", operacion: "times-easy", plantillaKey: "exercises:math.template.operation", imprimible: true },
];
