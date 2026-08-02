import { describe, it, expect } from "vitest";
import { applyConsolidation, type SessionConsolidation } from "./consolidation";
import { emptyCourseState, type CourseState } from "@/lib/storage";

/*
 * Consolidación de sesión: al terminar una tanda, recalcula racha, suma estrellas,
 * acumula progreso por tema/materia y desbloquea medallas. Lógica pura inyectando
 * la fecha de hoy (no usa el reloj real).
 */

function consolidation(over: Partial<SessionConsolidation> = {}): SessionConsolidation {
  return {
    starsEarned: 3,
    correctByTopic: {},
    correctBySubject: {},
    subjectsTried: ["matematicas"],
    newlyCorrectIds: [],
    newlyFailedIds: [],
    isDailyGoal: true,
    ...over,
  };
}

describe("applyConsolidation", () => {
  it("primera sesión: racha 1, suma estrellas, marca misión del día y desbloquea firstSession", () => {
    const { next, result } = applyConsolidation(
      emptyCourseState(),
      consolidation({ starsEarned: 5 }),
      "2026-06-25",
    );
    expect(result.streakOutcome).toBe("first");
    expect(result.streakDays).toBe(1);
    expect(next.streak.current).toBe(1);
    expect(next.stars.total).toBe(5);
    expect(next.dailyGoal.lastDoneDate).toBe("2026-06-25");
    expect(next.progress.subjectsTried).toEqual(["matematicas"]);
    expect(result.newBadgeIds).toContain("firstSession");
    expect(next.badges.unlocked.firstSession).toBe("2026-06-25");
  });

  it("acumula estrellas sobre el total previo, nunca lo reduce", () => {
    const prev: CourseState = emptyCourseState();
    prev.stars.total = 40;
    const { next } = applyConsolidation(prev, consolidation({ starsEarned: 7 }), "2026-06-25");
    expect(next.stars.total).toBe(47);
  });

  it("acumula aciertos por tema sobre el progreso previo", () => {
    const prev = emptyCourseState();
    prev.progress.correctByTopic = { "operations.times_tables": 4 };
    const { next } = applyConsolidation(
      prev,
      consolidation({ correctByTopic: { "operations.times_tables": 3 } }),
      "2026-06-25",
    );
    expect(next.progress.correctByTopic["operations.times_tables"]).toBe(7);
  });

  it("no duplica la materia en subjectsTried si ya estaba", () => {
    const prev = emptyCourseState();
    prev.progress.subjectsTried = ["matematicas"];
    const { next } = applyConsolidation(prev, consolidation({ subjectsTried: ["matematicas"] }), "2026-06-25");
    expect(next.progress.subjectsTried).toEqual(["matematicas"]);
  });

  it("desbloquea tablesMaster al cruzar el umbral de 10 aciertos en tablas", () => {
    const prev = emptyCourseState();
    prev.progress.correctByTopic = { "operations.times_tables": 8 };
    prev.streak.lastPlayedDate = "2026-06-24"; // ya había jugado (firstSession ya estaría)
    prev.badges.unlocked = { firstSession: "2026-06-24" };
    const { next, result } = applyConsolidation(
      prev,
      consolidation({ correctByTopic: { "operations.times_tables": 2 } }),
      "2026-06-25",
    );
    expect(result.newBadgeIds).toContain("tablesMaster");
    expect(next.badges.unlocked.tablesMaster).toBe("2026-06-25");
  });

  it("misión del día: si isDailyGoal es false, no toca lastDoneDate", () => {
    const prev = emptyCourseState();
    prev.dailyGoal.lastDoneDate = "2026-06-24";
    const { next } = applyConsolidation(prev, consolidation({ isDailyGoal: false }), "2026-06-25");
    expect(next.dailyGoal.lastDoneDate).toBe("2026-06-24");
  });

  it("misma jornada repetida: la racha no sube (outcome same-day)", () => {
    const prev = emptyCourseState();
    prev.streak = { current: 2, longest: 2, lastPlayedDate: "2026-06-25" };
    const { result } = applyConsolidation(prev, consolidation(), "2026-06-25");
    expect(result.streakOutcome).toBe("same-day");
    expect(result.streakDays).toBe(2);
  });

  it("no muta el estado previo (inmutabilidad)", () => {
    const prev = emptyCourseState();
    const snapshot = JSON.parse(JSON.stringify(prev));
    applyConsolidation(prev, consolidation(), "2026-06-25");
    expect(prev).toEqual(snapshot);
  });
});
