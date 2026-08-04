/*
 * Contenido real — 1.º de Primaria (nivel "1"). MVP ligero: un tema por materia
 * troncal, pocos ítems, para poder navegar y probar el cambio de curso.
 * Alineado a LOMLOE (RD 157/2022), ciclo 1: primeros contactos (vocales, sumas
 * hasta 10, seres vivos, estaciones, saludos en inglés).
 * Reglas de idioma: Lengua sólo ES (D-1); Natural Science y English sólo EN
 * (D-5/D-1); Matemáticas y Sociales siguen la UI (EN+ES). Contenido original.
 */
import type { EjercicioAny, Materia, Nivel } from "../types";

const NIVEL: Nivel = "1";
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

export const curso1: EjercicioAny[] = [
  // ─── Matemáticas · Sumas hasta 10 (generado) ─────────────────────────────
  { id: "mat-1-add-gen", materia: "matematicas", tema: "operations.add_to_10", nivel: "1", tipo: "respuesta-corta", operacion: "add-to-ten", plantillaKey: "exercises:math.template.operation", imprimible: true },

  // ─── Lengua · Las vocales (ES) ───────────────────────────────────────────
  tf("len-1-vow-001", "lengua", "phonology.vowels", "vowels1", "q1", "true"),
  tf("len-1-vow-002", "lengua", "phonology.vowels", "vowels1", "q2", "false"),
  mc("len-1-vow-003", "lengua", "phonology.vowels", "vowels1", "q3", "a"),
  tf("len-1-vow-004", "lengua", "phonology.vowels", "vowels1", "q4", "true"),
  mc("len-1-vow-005", "lengua", "phonology.vowels", "vowels1", "q5", "b"),
  tf("len-1-vow-006", "lengua", "phonology.vowels", "vowels1", "q6", "true"),

  // ─── Natural Science · Living and non-living things (EN) ──────────────────
  tf("sci-1-life-001", "ciencias", "living_things.living_nonliving", "livingnonliving1", "q1", "true"),
  tf("sci-1-life-002", "ciencias", "living_things.living_nonliving", "livingnonliving1", "q2", "false"),
  mc("sci-1-life-003", "ciencias", "living_things.living_nonliving", "livingnonliving1", "q3", "a"),
  tf("sci-1-life-004", "ciencias", "living_things.living_nonliving", "livingnonliving1", "q4", "true"),
  mc("sci-1-life-005", "ciencias", "living_things.living_nonliving", "livingnonliving1", "q5", "c"),
  tf("sci-1-life-006", "ciencias", "living_things.living_nonliving", "livingnonliving1", "q6", "false"),

  // ─── Sociales · Las estaciones (EN+ES) ───────────────────────────────────
  tf("soc-1-seas-001", "sociales", "time.seasons", "seasons1", "q1", "true"),
  tf("soc-1-seas-002", "sociales", "time.seasons", "seasons1", "q2", "true"),
  mc("soc-1-seas-003", "sociales", "time.seasons", "seasons1", "q3", "a"),
  tf("soc-1-seas-004", "sociales", "time.seasons", "seasons1", "q4", "true"),
  mc("soc-1-seas-005", "sociales", "time.seasons", "seasons1", "q5", "a"),
  tf("soc-1-seas-006", "sociales", "time.seasons", "seasons1", "q6", "true"),

  // ─── English · Greetings (EN) ────────────────────────────────────────────
  tf("eng-1-greet-001", "ingles", "en_vocabulary.greetings", "greetings1", "q1", "true"),
  tf("eng-1-greet-002", "ingles", "en_vocabulary.greetings", "greetings1", "q2", "false"),
  mc("eng-1-greet-003", "ingles", "en_vocabulary.greetings", "greetings1", "q3", "a"),
  tf("eng-1-greet-004", "ingles", "en_vocabulary.greetings", "greetings1", "q4", "true"),
  mc("eng-1-greet-005", "ingles", "en_vocabulary.greetings", "greetings1", "q5", "a"),
  tf("eng-1-greet-006", "ingles", "en_vocabulary.greetings", "greetings1", "q6", "true"),
];
