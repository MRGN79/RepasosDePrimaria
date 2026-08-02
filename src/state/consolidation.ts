/*
 * Lógica pura de consolidación de sesión: recalcula racha, suma estrellas,
 * actualiza progreso y desbloquea medallas. Separada del proveedor de React para
 * ser testeable y no romper Fast Refresh del componente.
 */
import type { CourseState } from "@/lib/storage";
import { advanceStreak, type StreakOutcome } from "@/lib/streak";
import { newlyEarnedBadges } from "@/lib/badges";

export interface SessionConsolidation {
  starsEarned: number;
  correctByTopic: Record<string, number>;
  correctBySubject: Record<string, number>;
  subjectsTried: string[];
  /** ids de ejercicios estáticos respondidos correctamente en esta sesión */
  newlyCorrectIds: string[];
  /** ids de ejercicios estáticos en los que se cometió al menos un error */
  newlyFailedIds: string[];
  /** la sesión cuenta como la "misión del día" completada */
  isDailyGoal: boolean;
}

export interface ConsolidationResult {
  streakOutcome: StreakOutcome;
  streakDays: number;
  newBadgeIds: string[];
}

/** Calcula el nuevo estado consolidado y el resultado, de forma pura. */
export function applyConsolidation(
  prev: CourseState,
  c: SessionConsolidation,
  today: string,
): { next: CourseState; result: ConsolidationResult } {
  const streakResult = advanceStreak(prev.streak, today);

  const correctByTopic = { ...prev.progress.correctByTopic };
  for (const [topic, n] of Object.entries(c.correctByTopic)) {
    correctByTopic[topic] = (correctByTopic[topic] ?? 0) + n;
  }
  const correctBySubject = { ...prev.progress.correctBySubject };
  for (const [subject, n] of Object.entries(c.correctBySubject)) {
    correctBySubject[subject] = (correctBySubject[subject] ?? 0) + n;
  }
  const subjectsTried = [...prev.progress.subjectsTried];
  for (const s of c.subjectsTried) {
    if (!subjectsTried.includes(s)) subjectsTried.push(s);
  }

  const correctExerciseIds = [...new Set([
    ...prev.progress.correctExerciseIds,
    ...c.newlyCorrectIds,
  ])];

  // Acumula fallos; elimina los que ya han sido respondidos correctamente
  const correctSet = new Set(correctExerciseIds);
  const failedExerciseIds = [
    ...new Set([...(prev.progress.failedExerciseIds ?? []), ...c.newlyFailedIds]),
  ].filter((id) => !correctSet.has(id));

  const withProgress: CourseState = {
    ...prev,
    streak: streakResult.state,
    stars: { total: prev.stars.total + c.starsEarned },
    dailyGoal: {
      lastDoneDate: c.isDailyGoal ? today : prev.dailyGoal.lastDoneDate,
      totalCompleted: c.isDailyGoal
        ? prev.dailyGoal.totalCompleted + 1
        : prev.dailyGoal.totalCompleted,
    },
    progress: { correctByTopic, correctBySubject, subjectsTried, correctExerciseIds, failedExerciseIds },
  };

  const earned = newlyEarnedBadges(withProgress);
  const unlocked = { ...withProgress.badges.unlocked };
  for (const id of earned) unlocked[id] = today;

  return {
    next: { ...withProgress, badges: { unlocked } },
    result: {
      streakOutcome: streakResult.outcome,
      streakDays: streakResult.state.current,
      newBadgeIds: earned,
    },
  };
}
