// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  emptyCourseState,
  loadState,
  saveState,
  loadMigrationState,
  defaultState,
  courseHasProgress,
  type CourseState,
  type Curso,
  type PersistedState,
} from "@/lib/storage";

/**
 * ¿El curso ya no tiene avance en local? Un curso migrado desaparece de `tdp:v1`,
 * salvo el curso ACTIVO, que `loadState()` recrea vacío (documentado en §2.3): en
 * ambos casos deja de tener avance real.
 */
function noLocalProgress(curso: Curso): boolean {
  const cs = loadState().courses[curso];
  return cs === undefined || !courseHasProgress(cs);
}

/*
 * Traslado del progreso local a la nube (Épica E, verify-before-delete).
 * La nube se mockea con un Map en memoria: saveCourse guarda; loadCourse y
 * loadCourseFromServer leen. Los tests cubren la fusión anti-retroceso, la
 * equivalencia estructural, la idempotencia, el multi-curso, el fallo sin red y
 * la reanudación atada al target.
 */

const { cloud, fail } = vi.hoisted(() => ({
  cloud: new Map<string, CourseState>(),
  fail: { onSave: new Set<string>(), corrupt: new Set<string>() },
}));

function keyOf(uid: string, childId: string | null, curso: Curso): string {
  return `${uid}/${childId}/${curso}`;
}

vi.mock("./firestore", () => ({
  loadCourse: vi.fn(async (uid: string, childId: string | null, curso: Curso) => {
    const v = cloud.get(keyOf(uid, childId, curso));
    return v ? structuredClone(v) : null;
  }),
  loadCourseFromServer: vi.fn(async (uid: string, childId: string | null, curso: Curso) => {
    // Corrupción simulada: devuelve un documento que NO coincide (verificación falla).
    if (fail.corrupt.has(curso)) return emptyCourseState();
    const v = cloud.get(keyOf(uid, childId, curso));
    return v ? structuredClone(v) : null;
  }),
  saveCourse: vi.fn(async (uid: string, childId: string | null, curso: Curso, cs: CourseState) => {
    if (fail.onSave.has(curso)) throw new Error("network"); // sin red: setDoc no confirma
    cloud.set(keyOf(uid, childId, curso), structuredClone(cs));
  }),
}));

import {
  beginMigration,
  resumeMigrationIfPending,
  mergeNonRegressing,
  courseStatesEquivalent,
  migrationMarkerExists,
  hasLocalProgressToMigrate,
} from "./migration";

const TARGET = { uid: "u1", childId: "c1" as string | null };

function progressed(overrides: Partial<CourseState> = {}): CourseState {
  const cs = emptyCourseState();
  cs.stars.total = 10;
  cs.streak = { current: 2, longest: 4, lastPlayedDate: "2026-08-01" };
  cs.dailyGoal = { lastDoneDate: "2026-08-01", totalCompleted: 3 };
  cs.badges.unlocked = { "first-star": "2026-07-20" };
  cs.progress.correctByTopic = { sumas: 5 };
  cs.progress.correctBySubject = { matematicas: 5 };
  cs.progress.subjectsTried = ["matematicas"];
  cs.progress.correctExerciseIds = ["e1", "e2"];
  cs.progress.failedExerciseIds = ["e3"];
  return { ...cs, ...overrides };
}

function seedLocal(courses: Partial<Record<Curso, CourseState>>, currentCourse: Curso = "3"): void {
  const state: PersistedState = { ...defaultState(), currentCourse, courses };
  saveState(state);
}

beforeEach(() => {
  localStorage.clear();
  cloud.clear();
  fail.onSave.clear();
  fail.corrupt.clear();
});

/* ------------------------------ helpers puros ------------------------------ */

describe("mergeNonRegressing", () => {
  it("toma el máximo de cada contador (nunca reduce)", () => {
    const local = progressed({ stars: { total: 10 } });
    const cloudCS = progressed({ stars: { total: 25 } });
    const merged = mergeNonRegressing(local, cloudCS);
    expect(merged.stars.total).toBe(25);
  });

  it("no reduce el progreso de nube preexistente aunque el local sea menor", () => {
    const local = emptyCourseState();
    local.progress.correctByTopic = { sumas: 1 };
    const cloudCS = emptyCourseState();
    cloudCS.progress.correctByTopic = { sumas: 9, restas: 4 };
    const merged = mergeNonRegressing(local, cloudCS);
    expect(merged.progress.correctByTopic).toEqual({ sumas: 9, restas: 4 });
  });

  it("une conjuntos (subjectsTried, correctExerciseIds) sin duplicar", () => {
    const local = emptyCourseState();
    local.progress.subjectsTried = ["matematicas"];
    local.progress.correctExerciseIds = ["e1", "e2"];
    const cloudCS = emptyCourseState();
    cloudCS.progress.subjectsTried = ["lengua", "matematicas"];
    cloudCS.progress.correctExerciseIds = ["e2", "e3"];
    const merged = mergeNonRegressing(local, cloudCS);
    expect([...merged.progress.subjectsTried].sort()).toEqual(["lengua", "matematicas"]);
    expect([...merged.progress.correctExerciseIds].sort()).toEqual(["e1", "e2", "e3"]);
  });

  it("quita de failedExerciseIds los que ya están resueltos en cualquiera de los dos", () => {
    const local = emptyCourseState();
    local.progress.failedExerciseIds = ["e1", "e2"];
    const cloudCS = emptyCourseState();
    cloudCS.progress.correctExerciseIds = ["e1"];
    const merged = mergeNonRegressing(local, cloudCS);
    expect(merged.progress.failedExerciseIds).toEqual(["e2"]);
  });

  it("conserva la fecha de desbloqueo más temprana en medallas", () => {
    const local = emptyCourseState();
    local.badges.unlocked = { streak: "2026-08-05" };
    const cloudCS = emptyCourseState();
    cloudCS.badges.unlocked = { streak: "2026-07-01" };
    const merged = mergeNonRegressing(local, cloudCS);
    expect(merged.badges.unlocked.streak).toBe("2026-07-01");
  });

  it("toma la fecha más reciente para lastPlayedDate/lastDoneDate", () => {
    const local = progressed();
    local.streak.lastPlayedDate = "2026-08-10";
    const cloudCS = progressed();
    cloudCS.streak.lastPlayedDate = "2026-08-02";
    expect(mergeNonRegressing(local, cloudCS).streak.lastPlayedDate).toBe("2026-08-10");
  });

  it("es idempotente: fundir dos veces da el mismo resultado", () => {
    const local = progressed();
    const cloudCS = progressed({ stars: { total: 99 } });
    const once = mergeNonRegressing(local, cloudCS);
    const twice = mergeNonRegressing(local, once);
    expect(courseStatesEquivalent(once, twice)).toBe(true);
  });
});

describe("courseStatesEquivalent", () => {
  it("verdadero para el mismo contenido con claves/arrays reordenados", () => {
    const a = progressed();
    a.progress.correctByTopic = { sumas: 5, restas: 2 };
    a.progress.correctExerciseIds = ["e1", "e2"];
    const b = structuredClone(a);
    b.progress.correctByTopic = { restas: 2, sumas: 5 };
    b.progress.correctExerciseIds = ["e2", "e1"];
    expect(courseStatesEquivalent(a, b)).toBe(true);
  });

  it("falso si difiere un contador de avance", () => {
    const a = progressed();
    const b = progressed({ stars: { total: 11 } });
    expect(courseStatesEquivalent(a, b)).toBe(false);
  });

  it("ignora el profile (no es avance)", () => {
    const a = progressed();
    const b = structuredClone(a);
    b.profile = { avatarId: "otro", nicknameId: "otro", nicknameCustom: "libre" };
    expect(courseStatesEquivalent(a, b)).toBe(true);
  });
});

/* ------------------------------ beginMigration ----------------------------- */

describe("beginMigration — primer perfil", () => {
  it("traslada todos los cursos con avance y los borra del local tras verificar", async () => {
    seedLocal({ "3": progressed(), "4": progressed({ stars: { total: 7 } }) }, "3");
    const outcome = await beginMigration(TARGET);
    expect(outcome.status).toBe("done");
    // Nube tiene ambos cursos
    expect(cloud.get(keyOf("u1", "c1", "3"))?.stars.total).toBe(10);
    expect(cloud.get(keyOf("u1", "c1", "4"))?.stars.total).toBe(7);
    // Local vaciado de esos cursos (el activo "3" se recrea vacío; "4" desaparece)
    expect(noLocalProgress("3")).toBe(true);
    expect(loadState().courses["4"]).toBeUndefined();
    // Marcador done
    expect(loadMigrationState()?.status).toBe("done");
  });

  it("migra el curso activo primero", async () => {
    seedLocal({ "3": progressed(), "5": progressed() }, "5");
    const order: Curso[] = [];
    await beginMigration(TARGET, {
      onProgress: ({ pending }) => {
        if (pending.length) order.push(pending[0]);
      },
    });
    // El primer pendiente reportado es el curso activo.
    expect(order[0]).toBe("5");
  });

  it("sin progreso escribe marcador done y devuelve noop (US-E7)", async () => {
    seedLocal({ "3": emptyCourseState() }, "3");
    const outcome = await beginMigration(TARGET);
    expect(outcome.status).toBe("noop");
    expect(loadMigrationState()?.status).toBe("done");
  });

  it("con marcador ya existente devuelve noop sin migrar (US-E4, un perfil por dispositivo)", async () => {
    seedLocal({ "3": progressed() }, "3");
    await beginMigration(TARGET);
    cloud.clear();
    seedLocal({ "3": progressed() }, "3");
    const outcome = await beginMigration({ uid: "u2", childId: "otro" });
    expect(outcome.status).toBe("noop");
    expect(cloud.size).toBe(0); // no volvió a escribir
  });

  it("es idempotente: reejecutar no corrompe ni duplica (mismo documento)", async () => {
    seedLocal({ "3": progressed() }, "3");
    await beginMigration(TARGET);
    const first = structuredClone(cloud.get(keyOf("u1", "c1", "3")));
    // Fuerza una segunda pasada vía resume (misma diana) restaurando pendiente.
    // Como el local ya está vacío, no reescribe y el documento permanece igual.
    await resumeMigrationIfPending(TARGET);
    expect(cloud.get(keyOf("u1", "c1", "3"))).toEqual(first);
  });

  it("no destruye progreso de nube preexistente (fusión anti-retroceso)", async () => {
    const cloudPrev = progressed({ stars: { total: 50 } });
    cloud.set(keyOf("u1", "c1", "3"), cloudPrev);
    seedLocal({ "3": progressed({ stars: { total: 10 } }) }, "3");
    await beginMigration(TARGET);
    expect(cloud.get(keyOf("u1", "c1", "3"))?.stars.total).toBe(50);
  });
});

/* ------------------------- fallos y reanudación --------------------------- */

describe("verify-before-delete — conserva el local ante fallo", () => {
  it("sin red: el curso queda pendiente y el local NO se borra", async () => {
    fail.onSave.add("3");
    seedLocal({ "3": progressed() }, "3");
    const outcome = await beginMigration(TARGET);
    expect(outcome.status).toBe("incomplete");
    expect(loadState().courses["3"]).toBeDefined(); // intacto
    const marker = loadMigrationState();
    expect(marker?.status).toBe("pending");
    expect(marker?.pendingCourses).toContain("3");
  });

  it("verificación no coincide: pendiente + local intacto", async () => {
    fail.corrupt.add("3");
    seedLocal({ "3": progressed() }, "3");
    const outcome = await beginMigration(TARGET);
    expect(outcome.status).toBe("incomplete");
    expect(loadState().courses["3"]).toBeDefined();
  });

  it("migración parcial: unos cursos verifican y otros quedan pendientes", async () => {
    fail.onSave.add("4");
    seedLocal({ "3": progressed(), "4": progressed() }, "3");
    const outcome = await beginMigration(TARGET);
    expect(outcome.status).toBe("incomplete");
    expect(noLocalProgress("3")).toBe(true); // migrado (activo, recreado vacío)
    expect(courseHasProgress(loadState().courses["4"]!)).toBe(true); // pendiente, intacto
    expect(loadMigrationState()?.pendingCourses).toEqual(["4"]);
  });
});

describe("resumeMigrationIfPending", () => {
  it("reintenta los pendientes y completa al recuperar la red", async () => {
    fail.onSave.add("3");
    seedLocal({ "3": progressed() }, "3");
    await beginMigration(TARGET);
    expect(loadMigrationState()?.status).toBe("pending");
    // Se recupera la red
    fail.onSave.clear();
    const outcome = await resumeMigrationIfPending(TARGET);
    expect(outcome?.status).toBe("done");
    expect(noLocalProgress("3")).toBe(true);
    expect(loadMigrationState()?.status).toBe("done");
  });

  it("devuelve null y conserva el local si el target no coincide (usuario cambió de cuenta)", async () => {
    fail.onSave.add("3");
    seedLocal({ "3": progressed() }, "3");
    await beginMigration(TARGET);
    fail.onSave.clear();
    const outcome = await resumeMigrationIfPending({ uid: "otro", childId: "otro" });
    expect(outcome).toBeNull();
    expect(loadState().courses["3"]).toBeDefined(); // se conserva, destinado al original
    expect(cloud.has(keyOf("otro", "otro", "3"))).toBe(false);
  });

  it("devuelve null si no hay migración pendiente", async () => {
    seedLocal({ "3": progressed() }, "3");
    await beginMigration(TARGET); // completa
    expect(await resumeMigrationIfPending(TARGET)).toBeNull();
  });

  it("cuenta un intento por reintento fallido", async () => {
    fail.onSave.add("3");
    seedLocal({ "3": progressed() }, "3");
    await beginMigration(TARGET);
    const first = loadMigrationState()?.attempts ?? 0;
    await resumeMigrationIfPending(TARGET);
    const second = loadMigrationState()?.attempts ?? 0;
    expect(second).toBeGreaterThan(first);
  });
});

/* ------------------------------ señales de UI ------------------------------ */

describe("señales para la UI", () => {
  it("migrationMarkerExists refleja el marcador", async () => {
    expect(migrationMarkerExists()).toBe(false);
    seedLocal({ "3": progressed() }, "3");
    await beginMigration(TARGET);
    expect(migrationMarkerExists()).toBe(true);
  });

  it("hasLocalProgressToMigrate detecta avance real y lo descarta si no lo hay", () => {
    expect(hasLocalProgressToMigrate()).toBe(false);
    seedLocal({ "3": emptyCourseState() }, "3");
    expect(hasLocalProgressToMigrate()).toBe(false);
    seedLocal({ "3": progressed() }, "3");
    expect(hasLocalProgressToMigrate()).toBe(true);
  });
});
