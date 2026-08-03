/*
 * Medallas / insignias (gamificación §4). Reglas puras de desbloqueo evaluadas
 * tras consolidar una sesión. Cada medalla declara su condición sobre el estado
 * persistido. Módulo puro y testeable.
 *
 * El catálogo aquí define ids estables; el nombre/pista se resuelven por i18n
 * (content:badge.<id>.name / .hint).
 */
import type { CourseState } from "./storage";
import { exerciseById } from "@content/registry";

export interface BadgeDef {
  id: string;
  /** clave i18n del nombre (namespace content) */
  nameKey: string;
  /** clave i18n de la pista de cómo conseguirla */
  hintKey: string;
  /** token de color del relleno de la medalla desbloqueada */
  colorToken?: string;
  /** condición de desbloqueo evaluada sobre el estado ya consolidado */
  isEarned: (state: CourseState) => boolean;
}

const TIMES_TABLES_TOPIC = "operations.times_tables";
const ALL_SUBJECT_IDS = ["matematicas", "lengua", "ciencias", "sociales", "ingles"];

const bySubject = (s: CourseState, id: string) =>
  s.progress.correctBySubject?.[id] ?? 0;

// correctBySubject counts every correct answer including replays of the same
// exercise; only unique static IDs in correctExerciseIds reflect real mastery.
const bySubjectUnique = (s: CourseState, materiaId: string): number =>
  s.progress.correctExerciseIds.filter(
    (id) => exerciseById(id)?.materia === materiaId,
  ).length;

export const BADGES: BadgeDef[] = [
  /* ---- Primera sesión ---- */
  {
    id: "firstSession",
    nameKey: "content:badge.firstSession.name",
    hintKey: "content:badge.firstSession.hint",
    colorToken: "--tdp-subject-math",
    isEarned: (s) => s.streak.lastPlayedDate !== null,
  },

  /* ---- Racha ---- */
  {
    id: "streak2",
    nameKey: "content:badge.streak2.name",
    hintKey: "content:badge.streak2.hint",
    colorToken: "--tdp-subject-social",
    isEarned: (s) => s.streak.longest >= 2,
  },
  {
    id: "streak3",
    nameKey: "content:badge.streak3.name",
    hintKey: "content:badge.streak3.hint",
    colorToken: "--tdp-subject-social",
    isEarned: (s) => s.streak.longest >= 3,
  },
  {
    id: "streak5",
    nameKey: "content:badge.streak5.name",
    hintKey: "content:badge.streak5.hint",
    colorToken: "--tdp-subject-social",
    isEarned: (s) => s.streak.longest >= 5,
  },
  {
    id: "streak7",
    nameKey: "content:badge.streak7.name",
    hintKey: "content:badge.streak7.hint",
    colorToken: "--tdp-subject-english",
    isEarned: (s) => s.streak.longest >= 7,
  },
  {
    id: "streak14",
    nameKey: "content:badge.streak14.name",
    hintKey: "content:badge.streak14.hint",
    colorToken: "--tdp-subject-english",
    isEarned: (s) => s.streak.longest >= 14,
  },
  {
    id: "streak21",
    nameKey: "content:badge.streak21.name",
    hintKey: "content:badge.streak21.hint",
    colorToken: "--tdp-subject-english",
    isEarned: (s) => s.streak.longest >= 21,
  },
  {
    id: "streak30",
    nameKey: "content:badge.streak30.name",
    hintKey: "content:badge.streak30.hint",
    colorToken: "--tdp-subject-english",
    isEarned: (s) => s.streak.longest >= 30,
  },

  /* ---- Estrellas ---- */
  {
    id: "stars10",
    nameKey: "content:badge.stars10.name",
    hintKey: "content:badge.stars10.hint",
    colorToken: "--tdp-subject-math",
    isEarned: (s) => s.stars.total >= 10,
  },
  {
    id: "stars50",
    nameKey: "content:badge.stars50.name",
    hintKey: "content:badge.stars50.hint",
    colorToken: "--tdp-subject-math",
    isEarned: (s) => s.stars.total >= 50,
  },
  {
    id: "hundredStars",
    nameKey: "content:badge.hundredStars.name",
    hintKey: "content:badge.hundredStars.hint",
    colorToken: "--tdp-subject-math",
    isEarned: (s) => s.stars.total >= 100,
  },
  {
    id: "stars200",
    nameKey: "content:badge.stars200.name",
    hintKey: "content:badge.stars200.hint",
    colorToken: "--tdp-subject-math",
    isEarned: (s) => s.stars.total >= 200,
  },
  {
    id: "stars500",
    nameKey: "content:badge.stars500.name",
    hintKey: "content:badge.stars500.hint",
    colorToken: "--tdp-subject-math",
    isEarned: (s) => s.stars.total >= 500,
  },

  /* ---- Maestro de tablas ---- */
  {
    id: "tablesMaster",
    nameKey: "content:badge.tablesMaster.name",
    hintKey: "content:badge.tablesMaster.hint",
    colorToken: "--tdp-subject-science",
    isEarned: (s) => (s.progress.correctByTopic[TIMES_TABLES_TOPIC] ?? 0) >= 10,
  },

  /* ---- Explorador (todas las materias) ---- */
  {
    id: "explorer",
    nameKey: "content:badge.explorer.name",
    hintKey: "content:badge.explorer.hint",
    colorToken: "--tdp-subject-spanish",
    isEarned: (s) =>
      ALL_SUBJECT_IDS.every((id) => s.progress.subjectsTried.includes(id)),
  },

  /* ---- Primeros en materia ---- */
  {
    id: "firstMath",
    nameKey: "content:badge.firstMath.name",
    hintKey: "content:badge.firstMath.hint",
    colorToken: "--tdp-subject-math",
    isEarned: (s) => bySubject(s, "matematicas") > 0,
  },
  {
    id: "firstSpanish",
    nameKey: "content:badge.firstSpanish.name",
    hintKey: "content:badge.firstSpanish.hint",
    colorToken: "--tdp-subject-spanish",
    isEarned: (s) => bySubject(s, "lengua") > 0,
  },
  {
    id: "firstScience",
    nameKey: "content:badge.firstScience.name",
    hintKey: "content:badge.firstScience.hint",
    colorToken: "--tdp-subject-science",
    isEarned: (s) => bySubject(s, "ciencias") > 0,
  },
  {
    id: "firstSocial",
    nameKey: "content:badge.firstSocial.name",
    hintKey: "content:badge.firstSocial.hint",
    colorToken: "--tdp-subject-social",
    isEarned: (s) => bySubject(s, "sociales") > 0,
  },
  {
    id: "firstEnglish",
    nameKey: "content:badge.firstEnglish.name",
    hintKey: "content:badge.firstEnglish.hint",
    colorToken: "--tdp-subject-english",
    isEarned: (s) => bySubject(s, "ingles") > 0,
  },

  /* ---- 10 aciertos por materia ---- */
  {
    id: "math10",
    nameKey: "content:badge.math10.name",
    hintKey: "content:badge.math10.hint",
    colorToken: "--tdp-subject-math",
    isEarned: (s) => bySubjectUnique(s, "matematicas") >= 10,
  },
  {
    id: "spanish10",
    nameKey: "content:badge.spanish10.name",
    hintKey: "content:badge.spanish10.hint",
    colorToken: "--tdp-subject-spanish",
    isEarned: (s) => bySubjectUnique(s, "lengua") >= 10,
  },
  {
    id: "science10",
    nameKey: "content:badge.science10.name",
    hintKey: "content:badge.science10.hint",
    colorToken: "--tdp-subject-science",
    isEarned: (s) => bySubjectUnique(s, "ciencias") >= 10,
  },
  {
    id: "social10",
    nameKey: "content:badge.social10.name",
    hintKey: "content:badge.social10.hint",
    colorToken: "--tdp-subject-social",
    isEarned: (s) => bySubjectUnique(s, "sociales") >= 10,
  },
  {
    id: "english10",
    nameKey: "content:badge.english10.name",
    hintKey: "content:badge.english10.hint",
    colorToken: "--tdp-subject-english",
    isEarned: (s) => bySubjectUnique(s, "ingles") >= 10,
  },

  /* ---- Misión del día ---- */
  {
    id: "dailyGoal5",
    nameKey: "content:badge.dailyGoal5.name",
    hintKey: "content:badge.dailyGoal5.hint",
    colorToken: "--tdp-subject-social",
    isEarned: (s) => (s.dailyGoal.totalCompleted ?? 0) >= 5,
  },
  {
    id: "dailyGoal10",
    nameKey: "content:badge.dailyGoal10.name",
    hintKey: "content:badge.dailyGoal10.hint",
    colorToken: "--tdp-subject-english",
    isEarned: (s) => (s.dailyGoal.totalCompleted ?? 0) >= 10,
  },
];

/**
 * Devuelve los ids de medallas recién desbloqueadas: condición cumplida y no
 * presentes aún en state.badges.unlocked. No muta el estado.
 */
export function newlyEarnedBadges(state: CourseState): string[] {
  return BADGES.filter(
    (b) => !(b.id in state.badges.unlocked) && b.isEarned(state),
  ).map((b) => b.id);
}

export function badgeDef(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}
