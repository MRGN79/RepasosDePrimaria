/*
 * Contenido real — 6.º de Primaria (nivel "6"). MVP ligero: un tema por materia
 * troncal. Alineado a LOMLOE (RD 157/2022), ciclo 3: porcentajes, diptongos e
 * hiatos, la energía y sus fuentes, la Unión Europea, la comida en inglés.
 * Lengua sólo ES (D-1); Natural Science y English sólo EN; Matemáticas y
 * Sociales siguen la UI (EN+ES). Contenido original.
 */
import type { EjercicioAny, Materia, Nivel } from "../types";

const NIVEL: Nivel = "6";
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

export const curso6: EjercicioAny[] = [
  // ─── Matemáticas · Los porcentajes (EN+ES, estático) ─────────────────────
  tf("mat-6-pct-001", "matematicas", "numbers.percentages", "percentages6", "q1", "true"),
  tf("mat-6-pct-002", "matematicas", "numbers.percentages", "percentages6", "q2", "true"),
  mc("mat-6-pct-003", "matematicas", "numbers.percentages", "percentages6", "q3", "a"),
  tf("mat-6-pct-004", "matematicas", "numbers.percentages", "percentages6", "q4", "true"),
  mc("mat-6-pct-005", "matematicas", "numbers.percentages", "percentages6", "q5", "a"),
  tf("mat-6-pct-006", "matematicas", "numbers.percentages", "percentages6", "q6", "true"),

  // ─── Lengua · Diptongos e hiatos (ES) ────────────────────────────────────
  tf("len-6-dip-001", "lengua", "orthography.diphthong_hiatus", "diphthong6", "q1", "true"),
  tf("len-6-dip-002", "lengua", "orthography.diphthong_hiatus", "diphthong6", "q2", "false"),
  mc("len-6-dip-003", "lengua", "orthography.diphthong_hiatus", "diphthong6", "q3", "a"),
  tf("len-6-dip-004", "lengua", "orthography.diphthong_hiatus", "diphthong6", "q4", "true"),
  mc("len-6-dip-005", "lengua", "orthography.diphthong_hiatus", "diphthong6", "q5", "a"),
  tf("len-6-dip-006", "lengua", "orthography.diphthong_hiatus", "diphthong6", "q6", "true"),

  // ─── Natural Science · Energy and its sources (EN) ───────────────────────
  tf("sci-6-ener-001", "ciencias", "energy.energy_sources", "energy6", "q1", "true"),
  tf("sci-6-ener-002", "ciencias", "energy.energy_sources", "energy6", "q2", "true"),
  mc("sci-6-ener-003", "ciencias", "energy.energy_sources", "energy6", "q3", "a"),
  tf("sci-6-ener-004", "ciencias", "energy.energy_sources", "energy6", "q4", "true"),
  mc("sci-6-ener-005", "ciencias", "energy.energy_sources", "energy6", "q5", "a"),
  tf("sci-6-ener-006", "ciencias", "energy.energy_sources", "energy6", "q6", "false"),

  // ─── Sociales · La Unión Europea (EN+ES) ─────────────────────────────────
  tf("soc-6-eu-001", "sociales", "geography.european_union", "eu6", "q1", "true"),
  tf("soc-6-eu-002", "sociales", "geography.european_union", "eu6", "q2", "false"),
  mc("soc-6-eu-003", "sociales", "geography.european_union", "eu6", "q3", "a"),
  tf("soc-6-eu-004", "sociales", "geography.european_union", "eu6", "q4", "true"),
  mc("soc-6-eu-005", "sociales", "geography.european_union", "eu6", "q5", "a"),
  tf("soc-6-eu-006", "sociales", "geography.european_union", "eu6", "q6", "true"),

  // ─── English · Food and meals (EN) ───────────────────────────────────────
  tf("eng-6-food-001", "ingles", "en_vocabulary.food", "food6", "q1", "true"),
  tf("eng-6-food-002", "ingles", "en_vocabulary.food", "food6", "q2", "false"),
  mc("eng-6-food-003", "ingles", "en_vocabulary.food", "food6", "q3", "a"),
  tf("eng-6-food-004", "ingles", "en_vocabulary.food", "food6", "q4", "true"),
  mc("eng-6-food-005", "ingles", "en_vocabulary.food", "food6", "q5", "a"),
  tf("eng-6-food-006", "ingles", "en_vocabulary.food", "food6", "q6", "true"),
];
