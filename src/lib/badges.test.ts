import { describe, it, expect } from "vitest";
import { BADGES, newlyEarnedBadges, badgeDef } from "./badges";
import { emptyCourseState, type CourseState } from "./storage";

/*
 * Medallas (gamificación §4). Reglas de desbloqueo evaluadas sobre estado ya
 * consolidado. newlyEarnedBadges no muta el estado y sólo devuelve las nuevas.
 */

function stateWith(overrides: (s: CourseState) => void): CourseState {
  const s = emptyCourseState();
  overrides(s);
  return s;
}

const TIMES_TABLES_TOPIC = "operations.times_tables";
const ALL_SUBJECTS = ["matematicas", "lengua", "ciencias", "sociales", "ingles"];

describe("condiciones de cada medalla", () => {
  it("firstSession: se gana al tener lastPlayedDate", () => {
    const def = badgeDef("firstSession")!;
    expect(def.isEarned(emptyCourseState())).toBe(false);
    expect(def.isEarned(stateWith((s) => (s.streak.lastPlayedDate = "2026-06-25")))).toBe(true);
  });

  it("streak3: longest >= 3", () => {
    const def = badgeDef("streak3")!;
    expect(def.isEarned(stateWith((s) => (s.streak.longest = 2)))).toBe(false);
    expect(def.isEarned(stateWith((s) => (s.streak.longest = 3)))).toBe(true);
  });

  it("streak7: longest >= 7", () => {
    const def = badgeDef("streak7")!;
    expect(def.isEarned(stateWith((s) => (s.streak.longest = 6)))).toBe(false);
    expect(def.isEarned(stateWith((s) => (s.streak.longest = 7)))).toBe(true);
  });

  it("tablesMaster: >= 10 aciertos en tablas de multiplicar (generados, sin dedup)", () => {
    const def = badgeDef("tablesMaster")!;
    expect(def.isEarned(stateWith((s) => (s.progress.correctByTopic[TIMES_TABLES_TOPIC] = 9)))).toBe(false);
    expect(def.isEarned(stateWith((s) => (s.progress.correctByTopic[TIMES_TABLES_TOPIC] = 10)))).toBe(true);
  });

  it("explorer: todas las materias probadas al menos una vez", () => {
    const def = badgeDef("explorer")!;
    expect(def.isEarned(stateWith((s) => (s.progress.subjectsTried = ALL_SUBJECTS.slice(0, 4))))).toBe(false);
    expect(def.isEarned(stateWith((s) => (s.progress.subjectsTried = [...ALL_SUBJECTS])))).toBe(true);
  });

  it("hundredStars: total >= 100", () => {
    const def = badgeDef("hundredStars")!;
    expect(def.isEarned(stateWith((s) => (s.stars.total = 99)))).toBe(false);
    expect(def.isEarned(stateWith((s) => (s.stars.total = 100)))).toBe(true);
  });
});

describe("newlyEarnedBadges", () => {
  it("estado por defecto: ninguna medalla nueva", () => {
    expect(newlyEarnedBadges(emptyCourseState())).toEqual([]);
  });

  it("devuelve las medallas cuya condición se cumple y aún no estaban", () => {
    const s = stateWith((st) => {
      st.streak.lastPlayedDate = "2026-06-25";
      st.streak.longest = 3;
    });
    const earned = newlyEarnedBadges(s);
    expect(earned).toContain("firstSession");
    expect(earned).toContain("streak3");
    expect(earned).not.toContain("streak7");
  });

  it("no vuelve a anunciar una medalla ya desbloqueada", () => {
    const s = stateWith((st) => {
      st.streak.lastPlayedDate = "2026-06-25";
      st.badges.unlocked = { firstSession: "2026-06-20" };
    });
    expect(newlyEarnedBadges(s)).not.toContain("firstSession");
  });

  it("no muta el estado de entrada", () => {
    const s = stateWith((st) => (st.streak.longest = 7));
    const snapshot = JSON.parse(JSON.stringify(s));
    newlyEarnedBadges(s);
    expect(s).toEqual(snapshot);
  });
});

describe("catálogo de medallas", () => {
  it("todas las medallas tienen ids únicos y claves i18n", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BADGES) {
      expect(b.nameKey).toMatch(/^content:badge\./);
      expect(b.hintKey).toMatch(/^content:badge\./);
    }
  });
});
