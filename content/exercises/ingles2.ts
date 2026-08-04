/*
 * Real content for English (foreign language) — Year 2 of Primary (level "2").
 * Aligned to the LOMLOE (RD 157/2022) Year 2 curriculum: numbers 1-20, colours,
 * and pets / domestic animals — basic first vocabulary.
 * English is fixed in English (D-1): its i18n keys only exist in EN.
 * Original content.
 */
import type { EjercicioAny } from "../types";

const tfE = (id: string, tema: string, sec: string, n: string, ans: "true" | "false"): EjercicioAny => ({
  id, materia: "ingles", tema, nivel: "2", tipo: "verdadero-falso",
  enunciadoKey: `exercises:english.${sec}.${n}.prompt`,
  opciones: [
    { id: "true", textoKey: "quiz:answer.trueLabel" },
    { id: "false", textoKey: "quiz:answer.falseLabel" },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

const mcE = (id: string, tema: string, sec: string, n: string, ans: "a" | "b" | "c"): EjercicioAny => ({
  id, materia: "ingles", tema, nivel: "2", tipo: "opcion-multiple",
  enunciadoKey: `exercises:english.${sec}.${n}.prompt`,
  opciones: [
    { id: "a", textoKey: `exercises:english.${sec}.${n}.a` },
    { id: "b", textoKey: `exercises:english.${sec}.${n}.b` },
    { id: "c", textoKey: `exercises:english.${sec}.${n}.c` },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

export const ingles2: EjercicioAny[] = [
  // ─── Numbers 1-20 ────────────────────────────────────────────────────────
  tfE("eng-2-num-001", "en_vocabulary.numbers_1_20", "num2", "q1", "true"),
  tfE("eng-2-num-002", "en_vocabulary.numbers_1_20", "num2", "q2", "true"),
  mcE("eng-2-num-003", "en_vocabulary.numbers_1_20", "num2", "q3", "a"),
  tfE("eng-2-num-004", "en_vocabulary.numbers_1_20", "num2", "q4", "true"),
  mcE("eng-2-num-005", "en_vocabulary.numbers_1_20", "num2", "q5", "a"),
  tfE("eng-2-num-006", "en_vocabulary.numbers_1_20", "num2", "q6", "true"),
  mcE("eng-2-num-007", "en_vocabulary.numbers_1_20", "num2", "q7", "a"),
  tfE("eng-2-num-008", "en_vocabulary.numbers_1_20", "num2", "q8", "true"),
  mcE("eng-2-num-009", "en_vocabulary.numbers_1_20", "num2", "q9", "a"),
  tfE("eng-2-num-010", "en_vocabulary.numbers_1_20", "num2", "q10", "true"),

  // ─── Colours ─────────────────────────────────────────────────────────────
  tfE("eng-2-col-001", "en_vocabulary.colors", "colors2", "q1", "true"),
  tfE("eng-2-col-002", "en_vocabulary.colors", "colors2", "q2", "true"),
  mcE("eng-2-col-003", "en_vocabulary.colors", "colors2", "q3", "a"),
  tfE("eng-2-col-004", "en_vocabulary.colors", "colors2", "q4", "true"),
  mcE("eng-2-col-005", "en_vocabulary.colors", "colors2", "q5", "a"),
  tfE("eng-2-col-006", "en_vocabulary.colors", "colors2", "q6", "true"),
  mcE("eng-2-col-007", "en_vocabulary.colors", "colors2", "q7", "a"),
  tfE("eng-2-col-008", "en_vocabulary.colors", "colors2", "q8", "true"),
  mcE("eng-2-col-009", "en_vocabulary.colors", "colors2", "q9", "a"),
  tfE("eng-2-col-010", "en_vocabulary.colors", "colors2", "q10", "true"),

  // ─── Pets ────────────────────────────────────────────────────────────────
  tfE("eng-2-pets-001", "en_vocabulary.animals_pets", "pets2", "q1", "true"),
  tfE("eng-2-pets-002", "en_vocabulary.animals_pets", "pets2", "q2", "true"),
  mcE("eng-2-pets-003", "en_vocabulary.animals_pets", "pets2", "q3", "a"),
  tfE("eng-2-pets-004", "en_vocabulary.animals_pets", "pets2", "q4", "true"),
  mcE("eng-2-pets-005", "en_vocabulary.animals_pets", "pets2", "q5", "a"),
  tfE("eng-2-pets-006", "en_vocabulary.animals_pets", "pets2", "q6", "true"),
  mcE("eng-2-pets-007", "en_vocabulary.animals_pets", "pets2", "q7", "a"),
  tfE("eng-2-pets-008", "en_vocabulary.animals_pets", "pets2", "q8", "true"),
  mcE("eng-2-pets-009", "en_vocabulary.animals_pets", "pets2", "q9", "a"),
  tfE("eng-2-pets-010", "en_vocabulary.animals_pets", "pets2", "q10", "true"),
];
