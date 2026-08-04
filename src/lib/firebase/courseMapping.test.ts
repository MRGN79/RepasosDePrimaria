import { describe, it, expect } from "vitest";
import { courseStateToCloudDoc, cloudDocToCourseState, COURSE_DOC_KEYS } from "./courseMapping";
import { emptyCourseState, type CourseState } from "@/lib/storage";

function sample(): CourseState {
  const cs = emptyCourseState();
  cs.profile = { avatarId: "fox", nicknameId: "explorer", nicknameCustom: "Juanito el de la clase B" };
  cs.streak = { current: 3, longest: 5, lastPlayedDate: "2026-08-01" };
  cs.stars = { total: 42 };
  cs.badges.unlocked = { "first-star": "2026-07-30" };
  cs.dailyGoal = { lastDoneDate: "2026-08-01", totalCompleted: 7 };
  cs.progress.correctByTopic = { sumas: 4 };
  cs.progress.subjectsTried = ["matematicas"];
  return cs;
}

describe("courseStateToCloudDoc — minimización", () => {
  it("descarta el apodo de texto libre (nicknameCustom → null)", () => {
    const doc = courseStateToCloudDoc(sample());
    expect(doc.profile.nicknameCustom).toBeNull();
    expect(doc.profile.avatarId).toBe("fox");
    expect(doc.profile.nicknameId).toBe("explorer");
  });

  it("solo emite las claves de primer nivel permitidas por las reglas", () => {
    const doc = courseStateToCloudDoc(sample());
    expect(Object.keys(doc).sort()).toEqual([...COURSE_DOC_KEYS].sort());
  });

  it("conserva el progreso y la gamificación sin PII", () => {
    const doc = courseStateToCloudDoc(sample());
    expect(doc.stars.total).toBe(42);
    expect(doc.streak.current).toBe(3);
    expect(doc.badges.unlocked["first-star"]).toBe("2026-07-30");
    expect(doc.progress.correctByTopic.sumas).toBe(4);
  });

  it("no comparte referencias mutables con el origen (copia profunda superficial)", () => {
    const src = sample();
    const doc = courseStateToCloudDoc(src);
    doc.progress.subjectsTried.push("lengua");
    expect(src.progress.subjectsTried).toEqual(["matematicas"]);
  });
});

describe("cloudDocToCourseState — lectura defensiva", () => {
  it("normaliza un documento corrupto a un CourseState coherente", () => {
    const cs = cloudDocToCourseState({ stars: { total: "no-number" }, progress: 123 });
    expect(cs.stars.total).toBe(0);
    expect(cs.progress.subjectsTried).toEqual([]);
  });

  it("round-trip preserva el progreso (salvo el texto libre, ya minimizado)", () => {
    const doc = courseStateToCloudDoc(sample());
    const back = cloudDocToCourseState(doc);
    expect(back.stars.total).toBe(42);
    expect(back.profile.nicknameCustom).toBeNull();
    expect(back.progress.correctByTopic.sumas).toBe(4);
  });
});
