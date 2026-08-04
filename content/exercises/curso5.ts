/*
 * Contenido real — 5.º de Primaria (nivel "5"). MVP ligero: un tema por materia
 * troncal. Alineado a LOMLOE (RD 157/2022), ciclo 3: números decimales, sujeto
 * y predicado, aparato circulatorio, el clima, rutinas diarias en inglés.
 * Lengua sólo ES (D-1); Natural Science y English sólo EN; Matemáticas y
 * Sociales siguen la UI (EN+ES). Contenido original.
 */
import type { EjercicioAny, Materia, Nivel } from "../types";

const NIVEL: Nivel = "5";
const NS: Record<Materia, string> = {
  matematicas: "math", lengua: "spanish", ciencias: "science",
  sociales: "social", ingles: "english", cuarto: "cuarto4",
};

const tf = (id: string, materia: Materia, tema: string, sec: string, n: string, ans: "true" | "false"): EjercicioAny => ({
  id, materia, tema, nivel: NIVEL, tipo: "verdadero-falso",
  enunciadoKey: `exercises:${NS[materia]}.${sec}.${n}.prompt`,
  opciones: [
    { id: "true", textoKey: "quiz:answer.trueLabel" },
    { id: "false", textoKey: "quiz:answer.falseLabel" },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

const mc = (id: string, materia: Materia, tema: string, sec: string, n: string, ans: "a" | "b" | "c"): EjercicioAny => ({
  id, materia, tema, nivel: NIVEL, tipo: "opcion-multiple",
  enunciadoKey: `exercises:${NS[materia]}.${sec}.${n}.prompt`,
  opciones: [
    { id: "a", textoKey: `exercises:${NS[materia]}.${sec}.${n}.a` },
    { id: "b", textoKey: `exercises:${NS[materia]}.${sec}.${n}.b` },
    { id: "c", textoKey: `exercises:${NS[materia]}.${sec}.${n}.c` },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

export const curso5: EjercicioAny[] = [
  // ─── Matemáticas · Los números decimales (EN+ES, estático) ───────────────
  tf("mat-5-dec-001", "matematicas", "numbers.decimals", "decimals5", "q1", "true"),
  tf("mat-5-dec-002", "matematicas", "numbers.decimals", "decimals5", "q2", "true"),
  mc("mat-5-dec-003", "matematicas", "numbers.decimals", "decimals5", "q3", "a"),
  tf("mat-5-dec-004", "matematicas", "numbers.decimals", "decimals5", "q4", "true"),
  mc("mat-5-dec-005", "matematicas", "numbers.decimals", "decimals5", "q5", "a"),
  tf("mat-5-dec-006", "matematicas", "numbers.decimals", "decimals5", "q6", "false"),

  // ─── Lengua · Sujeto y predicado (ES) ────────────────────────────────────
  tf("len-5-sp-001", "lengua", "grammar.subject_predicate", "subjectpredicate5", "q1", "true"),
  tf("len-5-sp-002", "lengua", "grammar.subject_predicate", "subjectpredicate5", "q2", "false"),
  mc("len-5-sp-003", "lengua", "grammar.subject_predicate", "subjectpredicate5", "q3", "a"),
  tf("len-5-sp-004", "lengua", "grammar.subject_predicate", "subjectpredicate5", "q4", "true"),
  mc("len-5-sp-005", "lengua", "grammar.subject_predicate", "subjectpredicate5", "q5", "a"),
  tf("len-5-sp-006", "lengua", "grammar.subject_predicate", "subjectpredicate5", "q6", "true"),

  // ─── Natural Science · The circulatory system (EN) ───────────────────────
  tf("sci-5-circ-001", "ciencias", "human_body.circulatory", "circulatory5", "q1", "true"),
  tf("sci-5-circ-002", "ciencias", "human_body.circulatory", "circulatory5", "q2", "true"),
  mc("sci-5-circ-003", "ciencias", "human_body.circulatory", "circulatory5", "q3", "a"),
  tf("sci-5-circ-004", "ciencias", "human_body.circulatory", "circulatory5", "q4", "true"),
  mc("sci-5-circ-005", "ciencias", "human_body.circulatory", "circulatory5", "q5", "a"),
  tf("sci-5-circ-006", "ciencias", "human_body.circulatory", "circulatory5", "q6", "true"),

  // ─── Sociales · El clima (EN+ES) ─────────────────────────────────────────
  tf("soc-5-clim-001", "sociales", "geography.climate", "climate5", "q1", "true"),
  tf("soc-5-clim-002", "sociales", "geography.climate", "climate5", "q2", "false"),
  mc("soc-5-clim-003", "sociales", "geography.climate", "climate5", "q3", "a"),
  tf("soc-5-clim-004", "sociales", "geography.climate", "climate5", "q4", "true"),
  mc("soc-5-clim-005", "sociales", "geography.climate", "climate5", "q5", "a"),
  tf("soc-5-clim-006", "sociales", "geography.climate", "climate5", "q6", "true"),

  // ─── English · Daily routines (EN) ───────────────────────────────────────
  tf("eng-5-rout-001", "ingles", "en_vocabulary.daily_routines", "routines5", "q1", "true"),
  tf("eng-5-rout-002", "ingles", "en_vocabulary.daily_routines", "routines5", "q2", "false"),
  mc("eng-5-rout-003", "ingles", "en_vocabulary.daily_routines", "routines5", "q3", "a"),
  tf("eng-5-rout-004", "ingles", "en_vocabulary.daily_routines", "routines5", "q4", "true"),
  mc("eng-5-rout-005", "ingles", "en_vocabulary.daily_routines", "routines5", "q5", "a"),
  tf("eng-5-rout-006", "ingles", "en_vocabulary.daily_routines", "routines5", "q6", "true"),
];
