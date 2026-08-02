// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  DEFAULT_COURSE,
  defaultState,
  emptyCourseState,
  parseState,
  parseCourseState,
  loadState,
  saveState,
  isStorageAvailable,
  activeCourse,
  activeView,
  type PersistedState,
} from "./storage";

/*
 * Persistencia local (ADR-001 §4, ADR-002 multi-curso). Lectura defensiva: ante
 * ausencia, corrupción o schemaVersion desconocida, arranca con un estado por
 * defecto limpio y nunca lanza excepción. Un estado v1 se MIGRA a v2 sin pérdida
 * (los avances pasan al curso "3"). Si localStorage no está disponible, degrada
 * en silencio.
 */

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
afterEach(() => {
  localStorage.clear();
});

describe("defaultState", () => {
  it("devuelve un estado v2 limpio con el curso por defecto creado", () => {
    const s = defaultState();
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.preferences.language).toBeNull();
    expect(s.preferences.sound).toBe(true);
    expect(s.currentCourse).toBe(DEFAULT_COURSE);
    expect(s.courses[DEFAULT_COURSE]).toEqual(emptyCourseState());
  });
});

describe("emptyCourseState", () => {
  it("crea unos avances de curso limpios", () => {
    const cs = emptyCourseState();
    expect(cs.profile.avatarId).toBeNull();
    expect(cs.streak).toEqual({ current: 0, longest: 0, lastPlayedDate: null });
    expect(cs.stars.total).toBe(0);
    expect(cs.badges.unlocked).toEqual({});
    expect(cs.progress.correctByTopic).toEqual({});
    expect(cs.progress.subjectsTried).toEqual([]);
  });
});

describe("parseState — lectura defensiva (v2)", () => {
  it("descarta valores no-objeto (null, array, string, number)", () => {
    expect(parseState(null)).toBeNull();
    expect(parseState([])).toBeNull();
    expect(parseState("texto")).toBeNull();
    expect(parseState(42)).toBeNull();
  });

  it("descarta schemaVersion desconocida (ni v1 ni v2)", () => {
    expect(parseState({ schemaVersion: 999 })).toBeNull();
    expect(parseState({ schemaVersion: "2" })).toBeNull();
    expect(parseState({})).toBeNull(); // sin schemaVersion
  });

  it("valida un estado v2 y garantiza la entrada del curso activo", () => {
    const parsed = parseState({
      schemaVersion: SCHEMA_VERSION,
      preferences: { language: "es", sound: false, reducedMotion: true },
      currentCourse: "5",
      courses: {
        "5": { stars: { total: 30 }, streak: { current: 2, longest: 5, lastPlayedDate: "2026-06-24" } },
      },
    });
    expect(parsed).not.toBeNull();
    expect(parsed!.currentCourse).toBe("5");
    expect(parsed!.preferences).toEqual({ language: "es", sound: false, reducedMotion: true });
    expect(parsed!.courses["5"]!.stars.total).toBe(30);
    expect(parsed!.courses["5"]!.streak.current).toBe(2);
    // lo no provisto del curso cae a default:
    expect(parsed!.courses["5"]!.progress.subjectsTried).toEqual([]);
  });

  it("un currentCourse inválido cae al curso por defecto y se crea su entrada", () => {
    const parsed = parseState({ schemaVersion: SCHEMA_VERSION, currentCourse: "9", courses: {} });
    expect(parsed!.currentCourse).toBe(DEFAULT_COURSE);
    expect(parsed!.courses[DEFAULT_COURSE]).toEqual(emptyCourseState());
  });

  it("ignora claves de curso inválidas", () => {
    const parsed = parseState({
      schemaVersion: SCHEMA_VERSION,
      currentCourse: "3",
      courses: { "3": {}, "0": { stars: { total: 99 } }, foo: { stars: { total: 99 } } },
    });
    expect(Object.keys(parsed!.courses).sort()).toEqual(["3"]);
  });

  it("acepta idiomas soportados en/es y descarta el resto", () => {
    expect(parseState({ schemaVersion: SCHEMA_VERSION, preferences: { language: "es" } })!
      .preferences.language).toBe("es");
    expect(parseState({ schemaVersion: SCHEMA_VERSION, preferences: { language: "fr" } })!
      .preferences.language).toBeNull();
  });
});

describe("parseCourseState — normalización de avances", () => {
  it("ignora campos con tipos corruptos y usa el default de ese campo", () => {
    const cs = parseCourseState({
      stars: { total: "muchas" },
      progress: { correctByTopic: { math: "x" }, subjectsTried: [1, 2] },
      badges: { unlocked: { a: 5 } },
    });
    expect(cs.stars.total).toBe(0);
    expect(cs.progress.correctByTopic).toEqual({});
    expect(cs.progress.subjectsTried).toEqual([]);
    expect(cs.badges.unlocked).toEqual({});
  });
});

describe("migración v1 → v2", () => {
  it("mueve todos los avances v1 (raíz) al curso 3 sin pérdida", () => {
    const v1 = {
      schemaVersion: 1,
      preferences: { language: "es", sound: false, reducedMotion: true },
      profile: { avatarId: "fox", nicknameId: "star", nicknameCustom: null },
      streak: { current: 4, longest: 9, lastPlayedDate: "2026-07-01" },
      stars: { total: 42 },
      badges: { unlocked: { firstSession: "2026-06-25" } },
      dailyGoal: { lastDoneDate: "2026-07-01", totalCompleted: 6 },
      progress: {
        correctByTopic: { "operations.add_carry": 3 },
        correctBySubject: { matematicas: 5 },
        subjectsTried: ["matematicas"],
        correctExerciseIds: ["mat-3-sumas-001"],
        failedExerciseIds: ["mat-3-sumas-002"],
      },
    };
    const parsed = parseState(v1)!;
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.currentCourse).toBe("3");
    // preferencias globales conservadas
    expect(parsed.preferences).toEqual({ language: "es", sound: false, reducedMotion: true });
    // avances migrados íntegros al curso 3
    const c3 = parsed.courses["3"]!;
    expect(c3.profile.avatarId).toBe("fox");
    expect(c3.stars.total).toBe(42);
    expect(c3.streak).toEqual({ current: 4, longest: 9, lastPlayedDate: "2026-07-01" });
    expect(c3.badges.unlocked).toEqual({ firstSession: "2026-06-25" });
    expect(c3.dailyGoal).toEqual({ lastDoneDate: "2026-07-01", totalCompleted: 6 });
    expect(c3.progress.correctExerciseIds).toEqual(["mat-3-sumas-001"]);
    expect(c3.progress.failedExerciseIds).toEqual(["mat-3-sumas-002"]);
    // otros cursos no existen todavía
    expect(parsed.courses["4"]).toBeUndefined();
  });

  it("migra aunque los avances v1 vengan incompletos (usa defaults por campo)", () => {
    const parsed = parseState({ schemaVersion: 1, stars: { total: 7 } })!;
    expect(parsed.currentCourse).toBe("3");
    expect(parsed.courses["3"]!.stars.total).toBe(7);
    expect(parsed.courses["3"]!.progress.subjectsTried).toEqual([]);
  });
});

describe("aislamiento entre cursos", () => {
  it("los avances de un curso no interfieren con los de otro", () => {
    const parsed = parseState({
      schemaVersion: SCHEMA_VERSION,
      currentCourse: "3",
      courses: {
        "3": { stars: { total: 50 } },
        "5": { stars: { total: 10 } },
      },
    })!;
    expect(parsed.courses["3"]!.stars.total).toBe(50);
    expect(parsed.courses["5"]!.stars.total).toBe(10);
  });

  it("activeCourse y activeView reflejan el curso activo", () => {
    const parsed = parseState({
      schemaVersion: SCHEMA_VERSION,
      preferences: { language: "en", sound: true, reducedMotion: false },
      currentCourse: "5",
      courses: { "5": { stars: { total: 10 } } },
    })!;
    expect(activeCourse(parsed).stars.total).toBe(10);
    const view = activeView(parsed);
    expect(view.stars.total).toBe(10);
    expect(view.currentCourse).toBe("5");
    expect(view.preferences.language).toBe("en");
  });
});

describe("loadState", () => {
  it("sin datos en localStorage devuelve el estado por defecto", () => {
    expect(loadState()).toEqual(defaultState());
  });

  it("JSON corrupto se descarta y arranca limpio (no lanza)", () => {
    localStorage.setItem(STORAGE_KEY, "{ esto no es json válido ");
    expect(() => loadState()).not.toThrow();
    expect(loadState()).toEqual(defaultState());
  });

  it("JSON válido pero con schemaVersion desconocida arranca limpio", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, stars: { total: 5 } }));
    expect(loadState()).toEqual(defaultState());
  });

  it("migra un estado v1 persistido al cargarlo", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, stars: { total: 15 } }),
    );
    const loaded = loadState();
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.courses["3"]!.stars.total).toBe(15);
  });

  it("carga un estado v2 válido previamente guardado (round-trip)", () => {
    const s = defaultState();
    s.currentCourse = "4";
    s.courses["4"] = { ...emptyCourseState(), stars: { total: 12 } };
    saveState(s);
    expect(loadState()).toEqual(s);
  });
});

describe("saveState / disponibilidad", () => {
  it("isStorageAvailable es true en jsdom", () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it("saveState no lanza si setItem falla (almacenamiento lleno)", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const s = defaultState();
    expect(() => saveState(s)).not.toThrow();
    spy.mockRestore();
  });

  it("si localStorage no está disponible, loadState degrada a default sin lanzar", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("acceso denegado");
      },
    });
    let result: PersistedState | null = null;
    expect(() => {
      result = loadState();
    }).not.toThrow();
    expect(result).toEqual(defaultState());
    expect(isStorageAvailable()).toBe(false);
    expect(() => saveState(defaultState())).not.toThrow();
    if (original) Object.defineProperty(globalThis, "localStorage", original);
  });
});
