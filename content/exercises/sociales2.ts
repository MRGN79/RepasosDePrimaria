/*
 * Contenido real de Ciencias Sociales — 2.º de Primaria (nivel "2").
 * Alineado a LOMLOE (RD 157/2022) de 2.º: la familia, el colegio y el barrio
 * (el entorno cercano del niño y la vida en comunidad).
 * Sigue el idioma de la UI (claves i18n en EN y ES). Contenido original.
 */
import type { EjercicioAny } from "../types";

const tfC = (id: string, tema: string, sec: string, n: string, ans: "true" | "false"): EjercicioAny => ({
  id, materia: "sociales", tema, nivel: "2", tipo: "verdadero-falso",
  enunciadoKey: `exercises:social.${sec}.${n}.prompt`,
  opciones: [
    { id: "true", textoKey: "quiz:answer.trueLabel" },
    { id: "false", textoKey: "quiz:answer.falseLabel" },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

const mcC = (id: string, tema: string, sec: string, n: string, ans: "a" | "b" | "c"): EjercicioAny => ({
  id, materia: "sociales", tema, nivel: "2", tipo: "opcion-multiple",
  enunciadoKey: `exercises:social.${sec}.${n}.prompt`,
  opciones: [
    { id: "a", textoKey: `exercises:social.${sec}.${n}.a` },
    { id: "b", textoKey: `exercises:social.${sec}.${n}.b` },
    { id: "c", textoKey: `exercises:social.${sec}.${n}.c` },
  ],
  respuestaCorrecta: ans,
  imprimible: true,
});

export const sociales2: EjercicioAny[] = [
  // ─── La familia ──────────────────────────────────────────────────────────
  tfC("soc-2-family-001", "community.family", "family2", "q1", "true"),
  tfC("soc-2-family-002", "community.family", "family2", "q2", "true"),
  mcC("soc-2-family-003", "community.family", "family2", "q3", "a"),
  tfC("soc-2-family-004", "community.family", "family2", "q4", "true"),
  mcC("soc-2-family-005", "community.family", "family2", "q5", "a"),
  tfC("soc-2-family-006", "community.family", "family2", "q6", "true"),
  mcC("soc-2-family-007", "community.family", "family2", "q7", "a"),
  tfC("soc-2-family-008", "community.family", "family2", "q8", "false"),
  mcC("soc-2-family-009", "community.family", "family2", "q9", "a"),
  tfC("soc-2-family-010", "community.family", "family2", "q10", "true"),

  // ─── El colegio ──────────────────────────────────────────────────────────
  tfC("soc-2-school-001", "community.school", "school2", "q1", "true"),
  tfC("soc-2-school-002", "community.school", "school2", "q2", "true"),
  mcC("soc-2-school-003", "community.school", "school2", "q3", "a"),
  tfC("soc-2-school-004", "community.school", "school2", "q4", "true"),
  mcC("soc-2-school-005", "community.school", "school2", "q5", "a"),
  tfC("soc-2-school-006", "community.school", "school2", "q6", "true"),
  mcC("soc-2-school-007", "community.school", "school2", "q7", "a"),
  tfC("soc-2-school-008", "community.school", "school2", "q8", "true"),
  mcC("soc-2-school-009", "community.school", "school2", "q9", "a"),
  tfC("soc-2-school-010", "community.school", "school2", "q10", "true"),

  // ─── El barrio ───────────────────────────────────────────────────────────
  tfC("soc-2-neigh-001", "community.neighborhood", "neigh2", "q1", "true"),
  tfC("soc-2-neigh-002", "community.neighborhood", "neigh2", "q2", "true"),
  mcC("soc-2-neigh-003", "community.neighborhood", "neigh2", "q3", "a"),
  tfC("soc-2-neigh-004", "community.neighborhood", "neigh2", "q4", "true"),
  mcC("soc-2-neigh-005", "community.neighborhood", "neigh2", "q5", "a"),
  tfC("soc-2-neigh-006", "community.neighborhood", "neigh2", "q6", "true"),
  mcC("soc-2-neigh-007", "community.neighborhood", "neigh2", "q7", "a"),
  tfC("soc-2-neigh-008", "community.neighborhood", "neigh2", "q8", "true"),
  mcC("soc-2-neigh-009", "community.neighborhood", "neigh2", "q9", "a"),
  tfC("soc-2-neigh-010", "community.neighborhood", "neigh2", "q10", "true"),
];
