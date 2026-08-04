/*
 * Contenido real de Lengua Castellana — 2.º de Primaria (nivel "2").
 * Alineado a LOMLOE (RD 157/2022) de 2.º: conciencia silábica, uso de la
 * mayúscula (inicio de frase y nombres propios), singular y plural.
 * Específico del castellano: NO se traduce (D-1). Las claves i18n de este
 * contenido sólo existen en ES. Contenido original.
 */
import type { EjercicioAny } from "../types";

const tfL = (id: string, tema: string, sec: string, n: string, ans: "true" | "false"): EjercicioAny => ({
  id, materia: "lengua", tema, nivel: "2", tipo: "verdadero-falso",
  enunciadoKey: `exercises:spanish.${sec}.${n}.prompt`,
  opciones: [
    { id: "true", textoKey: "quiz:answer.trueLabel" },
    { id: "false", textoKey: "quiz:answer.falseLabel" },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

const mcL = (id: string, tema: string, sec: string, n: string, ans: "a" | "b" | "c"): EjercicioAny => ({
  id, materia: "lengua", tema, nivel: "2", tipo: "opcion-multiple",
  enunciadoKey: `exercises:spanish.${sec}.${n}.prompt`,
  opciones: [
    { id: "a", textoKey: `exercises:spanish.${sec}.${n}.a` },
    { id: "b", textoKey: `exercises:spanish.${sec}.${n}.b` },
    { id: "c", textoKey: `exercises:spanish.${sec}.${n}.c` },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

export const lengua2: EjercicioAny[] = [
  // ─── Sílabas ─────────────────────────────────────────────────────────────
  tfL("len-2-syll-001", "phonology.syllables", "syll2", "q1", "true"),
  tfL("len-2-syll-002", "phonology.syllables", "syll2", "q2", "true"),
  mcL("len-2-syll-003", "phonology.syllables", "syll2", "q3", "a"),
  tfL("len-2-syll-004", "phonology.syllables", "syll2", "q4", "false"),
  mcL("len-2-syll-005", "phonology.syllables", "syll2", "q5", "a"),
  tfL("len-2-syll-006", "phonology.syllables", "syll2", "q6", "true"),
  mcL("len-2-syll-007", "phonology.syllables", "syll2", "q7", "a"),
  tfL("len-2-syll-008", "phonology.syllables", "syll2", "q8", "true"),
  mcL("len-2-syll-009", "phonology.syllables", "syll2", "q9", "a"),
  tfL("len-2-syll-010", "phonology.syllables", "syll2", "q10", "true"),

  // ─── Mayúsculas ──────────────────────────────────────────────────────────
  tfL("len-2-caps-001", "orthography.capitals", "caps2", "q1", "true"),
  tfL("len-2-caps-002", "orthography.capitals", "caps2", "q2", "true"),
  mcL("len-2-caps-003", "orthography.capitals", "caps2", "q3", "a"),
  tfL("len-2-caps-004", "orthography.capitals", "caps2", "q4", "true"),
  mcL("len-2-caps-005", "orthography.capitals", "caps2", "q5", "a"),
  tfL("len-2-caps-006", "orthography.capitals", "caps2", "q6", "true"),
  mcL("len-2-caps-007", "orthography.capitals", "caps2", "q7", "a"),
  tfL("len-2-caps-008", "orthography.capitals", "caps2", "q8", "false"),
  mcL("len-2-caps-009", "orthography.capitals", "caps2", "q9", "a"),
  tfL("len-2-caps-010", "orthography.capitals", "caps2", "q10", "true"),

  // ─── Singular y plural ───────────────────────────────────────────────────
  tfL("len-2-plur-001", "grammar.singular_plural", "plural2", "q1", "true"),
  tfL("len-2-plur-002", "grammar.singular_plural", "plural2", "q2", "true"),
  mcL("len-2-plur-003", "grammar.singular_plural", "plural2", "q3", "a"),
  tfL("len-2-plur-004", "grammar.singular_plural", "plural2", "q4", "true"),
  mcL("len-2-plur-005", "grammar.singular_plural", "plural2", "q5", "a"),
  tfL("len-2-plur-006", "grammar.singular_plural", "plural2", "q6", "true"),
  mcL("len-2-plur-007", "grammar.singular_plural", "plural2", "q7", "a"),
  tfL("len-2-plur-008", "grammar.singular_plural", "plural2", "q8", "true"),
  mcL("len-2-plur-009", "grammar.singular_plural", "plural2", "q9", "a"),
  tfL("len-2-plur-010", "grammar.singular_plural", "plural2", "q10", "false"),
];
