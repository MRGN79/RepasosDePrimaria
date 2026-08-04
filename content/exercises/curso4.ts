/*
 * Contenido real — 4.º de Primaria (nivel "4"). MVP ligero: un tema por materia
 * troncal. Alineado a LOMLOE (RD 157/2022), ciclo 2: multiplicación por dos
 * cifras, tiempos verbales, cadenas alimentarias, ciclo del agua, la familia en
 * inglés. Lengua sólo ES (D-1); Natural Science y English sólo EN; Matemáticas
 * y Sociales siguen la UI (EN+ES). Contenido original.
 */
import type { EjercicioAny, Materia, Nivel } from "../types";

const NIVEL: Nivel = "4";
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

export const curso4: EjercicioAny[] = [
  // ─── Matemáticas · Multiplicación por dos cifras (generado) ──────────────
  { id: "mat-4-mult-gen", materia: "matematicas", tema: "operations.multiply_2digit", nivel: "4", tipo: "respuesta-corta", operacion: "multiply-two-digit", plantillaKey: "exercises:math.template.operation", imprimible: true },

  // ─── Lengua · Los tiempos verbales (ES) ──────────────────────────────────
  tf("len-4-verb-001", "lengua", "grammar.verb_tenses", "verbtenses4", "q1", "true"),
  tf("len-4-verb-002", "lengua", "grammar.verb_tenses", "verbtenses4", "q2", "false"),
  mc("len-4-verb-003", "lengua", "grammar.verb_tenses", "verbtenses4", "q3", "a"),
  tf("len-4-verb-004", "lengua", "grammar.verb_tenses", "verbtenses4", "q4", "true"),
  mc("len-4-verb-005", "lengua", "grammar.verb_tenses", "verbtenses4", "q5", "b"),
  tf("len-4-verb-006", "lengua", "grammar.verb_tenses", "verbtenses4", "q6", "true"),

  // ─── Natural Science · Food chains (EN) ──────────────────────────────────
  tf("sci-4-food-001", "ciencias", "ecosystems.food_chains", "foodchains4", "q1", "true"),
  tf("sci-4-food-002", "ciencias", "ecosystems.food_chains", "foodchains4", "q2", "true"),
  mc("sci-4-food-003", "ciencias", "ecosystems.food_chains", "foodchains4", "q3", "a"),
  tf("sci-4-food-004", "ciencias", "ecosystems.food_chains", "foodchains4", "q4", "true"),
  mc("sci-4-food-005", "ciencias", "ecosystems.food_chains", "foodchains4", "q5", "a"),
  tf("sci-4-food-006", "ciencias", "ecosystems.food_chains", "foodchains4", "q6", "true"),

  // ─── Sociales · El ciclo del agua (EN+ES) ────────────────────────────────
  tf("soc-4-water-001", "sociales", "geography.water_cycle", "watercycle4", "q1", "true"),
  tf("soc-4-water-002", "sociales", "geography.water_cycle", "watercycle4", "q2", "true"),
  mc("soc-4-water-003", "sociales", "geography.water_cycle", "watercycle4", "q3", "a"),
  tf("soc-4-water-004", "sociales", "geography.water_cycle", "watercycle4", "q4", "true"),
  mc("soc-4-water-005", "sociales", "geography.water_cycle", "watercycle4", "q5", "a"),
  tf("soc-4-water-006", "sociales", "geography.water_cycle", "watercycle4", "q6", "true"),

  // ─── English · Family (EN) ───────────────────────────────────────────────
  tf("eng-4-fam-001", "ingles", "en_vocabulary.family", "family4", "q1", "true"),
  tf("eng-4-fam-002", "ingles", "en_vocabulary.family", "family4", "q2", "false"),
  mc("eng-4-fam-003", "ingles", "en_vocabulary.family", "family4", "q3", "a"),
  tf("eng-4-fam-004", "ingles", "en_vocabulary.family", "family4", "q4", "true"),
  mc("eng-4-fam-005", "ingles", "en_vocabulary.family", "family4", "q5", "a"),
  tf("eng-4-fam-006", "ingles", "en_vocabulary.family", "family4", "q6", "true"),
];
