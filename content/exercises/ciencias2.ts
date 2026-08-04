/*
 * Real content for Natural Science — Year 2 of Primary (level "2").
 * Aligned to the LOMLOE (RD 157/2022) Year 2 curriculum: the five senses,
 * the human body (basic parts), and animals.
 * Natural Science is fixed in English (D-5): its i18n keys only exist in EN.
 * Original content.
 */
import type { EjercicioAny } from "../types";

const tfS = (id: string, tema: string, sec: string, n: string, ans: "true" | "false"): EjercicioAny => ({
  id, materia: "ciencias", tema, nivel: "2", tipo: "verdadero-falso",
  enunciadoKey: `exercises:science.${sec}.${n}.prompt`,
  opciones: [
    { id: "true", textoKey: "quiz:answer.trueLabel" },
    { id: "false", textoKey: "quiz:answer.falseLabel" },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

const mcS = (id: string, tema: string, sec: string, n: string, ans: "a" | "b" | "c"): EjercicioAny => ({
  id, materia: "ciencias", tema, nivel: "2", tipo: "opcion-multiple",
  enunciadoKey: `exercises:science.${sec}.${n}.prompt`,
  opciones: [
    { id: "a", textoKey: `exercises:science.${sec}.${n}.a` },
    { id: "b", textoKey: `exercises:science.${sec}.${n}.b` },
    { id: "c", textoKey: `exercises:science.${sec}.${n}.c` },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

export const ciencias2: EjercicioAny[] = [
  // ─── The five senses ─────────────────────────────────────────────────────
  tfS("sci-2-senses-001", "senses.five_senses", "senses2", "q1", "true"),
  tfS("sci-2-senses-002", "senses.five_senses", "senses2", "q2", "true"),
  mcS("sci-2-senses-003", "senses.five_senses", "senses2", "q3", "a"),
  tfS("sci-2-senses-004", "senses.five_senses", "senses2", "q4", "true"),
  mcS("sci-2-senses-005", "senses.five_senses", "senses2", "q5", "a"),
  tfS("sci-2-senses-006", "senses.five_senses", "senses2", "q6", "true"),
  mcS("sci-2-senses-007", "senses.five_senses", "senses2", "q7", "a"),
  tfS("sci-2-senses-008", "senses.five_senses", "senses2", "q8", "false"),
  mcS("sci-2-senses-009", "senses.five_senses", "senses2", "q9", "a"),
  tfS("sci-2-senses-010", "senses.five_senses", "senses2", "q10", "true"),

  // ─── The human body ──────────────────────────────────────────────────────
  tfS("sci-2-body-001", "body.human_body", "body2", "q1", "true"),
  tfS("sci-2-body-002", "body.human_body", "body2", "q2", "true"),
  mcS("sci-2-body-003", "body.human_body", "body2", "q3", "a"),
  tfS("sci-2-body-004", "body.human_body", "body2", "q4", "true"),
  mcS("sci-2-body-005", "body.human_body", "body2", "q5", "a"),
  tfS("sci-2-body-006", "body.human_body", "body2", "q6", "true"),
  mcS("sci-2-body-007", "body.human_body", "body2", "q7", "a"),
  tfS("sci-2-body-008", "body.human_body", "body2", "q8", "true"),
  mcS("sci-2-body-009", "body.human_body", "body2", "q9", "a"),
  tfS("sci-2-body-010", "body.human_body", "body2", "q10", "true"),

  // ─── Animals ─────────────────────────────────────────────────────────────
  tfS("sci-2-animals-001", "living_things.animals_basic", "animals2", "q1", "true"),
  tfS("sci-2-animals-002", "living_things.animals_basic", "animals2", "q2", "true"),
  mcS("sci-2-animals-003", "living_things.animals_basic", "animals2", "q3", "a"),
  tfS("sci-2-animals-004", "living_things.animals_basic", "animals2", "q4", "true"),
  mcS("sci-2-animals-005", "living_things.animals_basic", "animals2", "q5", "a"),
  tfS("sci-2-animals-006", "living_things.animals_basic", "animals2", "q6", "true"),
  mcS("sci-2-animals-007", "living_things.animals_basic", "animals2", "q7", "a"),
  tfS("sci-2-animals-008", "living_things.animals_basic", "animals2", "q8", "true"),
  mcS("sci-2-animals-009", "living_things.animals_basic", "animals2", "q9", "a"),
  tfS("sci-2-animals-010", "living_things.animals_basic", "animals2", "q10", "true"),
];
