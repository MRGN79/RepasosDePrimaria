/*
 * Persistencia local (ADR-001 §4, ADR-002 modelo multi-curso).
 * Clave raíz versionada "tdp:v1" (nombre de la clave, no del esquema).
 *
 * Esquema v2: los avances (perfil, racha, estrellas, medallas, misión diaria y
 * progreso) viven AISLADOS por curso en `courses[curso]`. Las preferencias del
 * dispositivo (idioma, sonido, movimiento) son globales. Ver ADR-002.
 *
 * Lectura defensiva: ante ausencia, corrupción o schemaVersion desconocida, se
 * descarta y se arranca con un estado por defecto limpio. Nunca rompe la app.
 * Migración: un estado v1 (un solo curso implícito, 3.º) se transforma a v2
 * moviendo todos sus avances al curso "3" sin pérdida de datos.
 * Si localStorage no está disponible (modo privado, almacenamiento lleno), la
 * app funciona en memoria y degrada sin error.
 *
 * Módulo aislado y testeable: no depende de React ni de i18n.
 */

export const STORAGE_KEY = "tdp:v1";
export const SCHEMA_VERSION = 2 as const;

export type Language = "en" | "es";

/** Cursos de Primaria. Sólo "3" tiene contenido en esta fase; el resto se
 *  ofrecen en el selector con las materias marcadas "Pronto". */
export type Curso = "1" | "2" | "3" | "4" | "5" | "6";
export const COURSES: readonly Curso[] = ["1", "2", "3", "4", "5", "6"] as const;
/** Curso por defecto: el único con contenido real (migración v1 → v2). */
export const DEFAULT_COURSE: Curso = "3";

export interface Preferences {
  language: Language | null; // null = no elegido explícitamente (sigue detección)
  sound: boolean;
  reducedMotion: boolean;
}

/** Avances de un curso concreto. Todo lo que debe estar aislado entre cursos. */
export interface CourseState {
  profile: {
    avatarId: string | null;
    nicknameId: string | null;
    nicknameCustom: string | null;
  };
  streak: {
    current: number;
    longest: number;
    lastPlayedDate: string | null; // "YYYY-MM-DD" en hora local
  };
  stars: {
    total: number;
  };
  badges: {
    /** id de medalla → fecha de desbloqueo "YYYY-MM-DD" */
    unlocked: Record<string, string>;
  };
  dailyGoal: {
    lastDoneDate: string | null; // "YYYY-MM-DD"
    totalCompleted: number;
  };
  progress: {
    /** topicId → número de aciertos acumulados */
    correctByTopic: Record<string, number>;
    /** materiaId → número de aciertos acumulados */
    correctBySubject: Record<string, number>;
    /** ids de materia probadas al menos una vez */
    subjectsTried: string[];
    /** ids de ejercicios estáticos respondidos correctamente (excluidos del pool hasta agotar la asignatura) */
    correctExerciseIds: string[];
    /** ids de ejercicios estáticos que el niño ha fallado alguna vez (pool del modo repaso) */
    failedExerciseIds: string[];
  };
}

/** Estado persistido completo (v2). */
export interface PersistedState {
  schemaVersion: typeof SCHEMA_VERSION;
  preferences: Preferences;
  /** curso activo actualmente seleccionado */
  currentCourse: Curso;
  /** avances por curso; se crean bajo demanda al seleccionar un curso */
  courses: Partial<Record<Curso, CourseState>>;
}

/**
 * Vista aplanada del curso activo que consumen los componentes: fusiona los
 * avances del curso activo con las preferencias globales y el curso actual.
 * Mantiene la forma que la UI ya esperaba (state.streak, state.stars, …) para
 * que el paso a multi-curso no obligue a reescribir cada pantalla.
 */
export type ActiveView = CourseState & {
  preferences: Preferences;
  currentCourse: Curso;
};

export function emptyCourseState(): CourseState {
  return {
    profile: { avatarId: null, nicknameId: null, nicknameCustom: null },
    streak: { current: 0, longest: 0, lastPlayedDate: null },
    stars: { total: 0 },
    badges: { unlocked: {} },
    dailyGoal: { lastDoneDate: null, totalCompleted: 0 },
    progress: {
      correctByTopic: {},
      correctBySubject: {},
      subjectsTried: [],
      correctExerciseIds: [],
      failedExerciseIds: [],
    },
  };
}

export function defaultState(): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    preferences: { language: null, sound: true, reducedMotion: false },
    currentCourse: DEFAULT_COURSE,
    courses: { [DEFAULT_COURSE]: emptyCourseState() },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCurso(value: unknown): value is Curso {
  return typeof value === "string" && (COURSES as readonly string[]).includes(value);
}

function parsePreferences(raw: unknown): Preferences {
  const base = defaultState().preferences;
  const prefs = isPlainObject(raw) ? raw : {};
  const lang = prefs.language;
  return {
    language: lang === "en" || lang === "es" ? lang : base.language,
    sound: typeof prefs.sound === "boolean" ? prefs.sound : base.sound,
    reducedMotion:
      typeof prefs.reducedMotion === "boolean" ? prefs.reducedMotion : base.reducedMotion,
  };
}

/**
 * Valida y normaliza los avances de un curso, fusionando lo válido con los
 * valores por defecto. Reutilizada tanto por la validación v2 como por la
 * migración v1 → v2 (donde estos campos viven en la raíz del estado v1).
 */
export function parseCourseState(raw: unknown): CourseState {
  const base = emptyCourseState();
  const src = isPlainObject(raw) ? raw : {};
  const profile = isPlainObject(src.profile) ? src.profile : {};
  const streak = isPlainObject(src.streak) ? src.streak : {};
  const stars = isPlainObject(src.stars) ? src.stars : {};
  const badges = isPlainObject(src.badges) ? src.badges : {};
  const dailyGoal = isPlainObject(src.dailyGoal) ? src.dailyGoal : {};
  const progress = isPlainObject(src.progress) ? src.progress : {};

  const unlocked =
    isPlainObject(badges.unlocked) &&
    Object.values(badges.unlocked).every((v) => typeof v === "string")
      ? (badges.unlocked as Record<string, string>)
      : {};
  const correctByTopic =
    isPlainObject(progress.correctByTopic) &&
    Object.values(progress.correctByTopic).every((v) => typeof v === "number")
      ? (progress.correctByTopic as Record<string, number>)
      : {};
  const correctBySubject =
    isPlainObject(progress.correctBySubject) &&
    Object.values(progress.correctBySubject).every((v) => typeof v === "number")
      ? (progress.correctBySubject as Record<string, number>)
      : {};
  const subjectsTried =
    Array.isArray(progress.subjectsTried) &&
    progress.subjectsTried.every((v) => typeof v === "string")
      ? (progress.subjectsTried as string[])
      : [];
  const correctExerciseIds =
    Array.isArray(progress.correctExerciseIds) &&
    progress.correctExerciseIds.every((v) => typeof v === "string")
      ? (progress.correctExerciseIds as string[])
      : [];
  const failedExerciseIds =
    Array.isArray(progress.failedExerciseIds) &&
    progress.failedExerciseIds.every((v) => typeof v === "string")
      ? (progress.failedExerciseIds as string[])
      : [];

  return {
    profile: {
      avatarId: typeof profile.avatarId === "string" ? profile.avatarId : base.profile.avatarId,
      nicknameId: typeof profile.nicknameId === "string" ? profile.nicknameId : base.profile.nicknameId,
      nicknameCustom:
        typeof profile.nicknameCustom === "string" ? profile.nicknameCustom : base.profile.nicknameCustom,
    },
    streak: {
      current: typeof streak.current === "number" && streak.current >= 0 ? Math.floor(streak.current) : 0,
      longest: typeof streak.longest === "number" && streak.longest >= 0 ? Math.floor(streak.longest) : 0,
      lastPlayedDate: typeof streak.lastPlayedDate === "string" ? streak.lastPlayedDate : null,
    },
    stars: {
      total: typeof stars.total === "number" && stars.total >= 0 ? Math.floor(stars.total) : 0,
    },
    badges: { unlocked },
    dailyGoal: {
      lastDoneDate: typeof dailyGoal.lastDoneDate === "string" ? dailyGoal.lastDoneDate : null,
      totalCompleted:
        typeof dailyGoal.totalCompleted === "number" && dailyGoal.totalCompleted >= 0
          ? Math.floor(dailyGoal.totalCompleted)
          : 0,
    },
    progress: { correctByTopic, correctBySubject, subjectsTried, correctExerciseIds, failedExerciseIds },
  };
}

/**
 * Valida y normaliza el estado leído. Devuelve un estado v2 completo y coherente.
 * - Un estado v2 se valida campo a campo.
 * - Un estado v1 (esquema anterior, un solo curso implícito) se migra a v2
 *   moviendo todos sus avances al curso "3" sin pérdida.
 * - Cualquier otra cosa (no objeto, esquema desconocido) devuelve null y el
 *   llamante usa el estado por defecto.
 */
export function parseState(raw: unknown): PersistedState | null {
  if (!isPlainObject(raw)) return null;

  // Migración v1 → v2: los avances estaban en la raíz; van al curso por defecto.
  if (raw.schemaVersion === 1) {
    return {
      schemaVersion: SCHEMA_VERSION,
      preferences: parsePreferences(raw.preferences),
      currentCourse: DEFAULT_COURSE,
      courses: { [DEFAULT_COURSE]: parseCourseState(raw) },
    };
  }

  if (raw.schemaVersion !== SCHEMA_VERSION) return null;

  const currentCourse = isCurso(raw.currentCourse) ? raw.currentCourse : DEFAULT_COURSE;
  const coursesRaw = isPlainObject(raw.courses) ? raw.courses : {};
  const courses: Partial<Record<Curso, CourseState>> = {};
  for (const key of Object.keys(coursesRaw)) {
    if (isCurso(key)) courses[key] = parseCourseState(coursesRaw[key]);
  }
  // Garantiza que el curso activo siempre tiene una entrada.
  if (!courses[currentCourse]) courses[currentCourse] = emptyCourseState();

  return {
    schemaVersion: SCHEMA_VERSION,
    preferences: parsePreferences(raw.preferences),
    currentCourse,
    courses,
  };
}

/** Avances del curso activo, creando una entrada vacía si aún no existe. */
export function activeCourse(state: PersistedState): CourseState {
  return state.courses[state.currentCourse] ?? emptyCourseState();
}

/** Vista aplanada que consume la UI (curso activo + preferencias globales). */
export function activeView(state: PersistedState): ActiveView {
  return {
    ...activeCourse(state),
    preferences: state.preferences,
    currentCourse: state.currentCourse,
  };
}

function getStorage(): Storage | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    // Prueba de escritura: algunos navegadores en modo privado lanzan al escribir.
    const probe = "__tdp_probe__";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

export function loadState(): PersistedState {
  const ls = getStorage();
  if (!ls) return defaultState();
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = parseState(JSON.parse(raw) as unknown);
    return parsed ?? defaultState();
  } catch {
    return defaultState();
  }
}

export function saveState(state: PersistedState): void {
  const ls = getStorage();
  if (!ls) return; // degrada en silencio: la sesión sigue en memoria
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // almacenamiento lleno o restringido: no romper la experiencia del niño
  }
}

export function isStorageAvailable(): boolean {
  return getStorage() !== null;
}

/* ---------------------------------------------------------------------------
 * Marcador y estado de reanudación del traslado del progreso local a la nube.
 *
 * Vive en una clave PROPIA (`tdp:migration`), separada del progreso (`tdp:v1`):
 * debe sobrevivir a cerrar sesión (para no re-migrar en un segundo perfil del
 * mismo dispositivo) y desaparecer al reinstalar la app (Android borra los datos
 * del WebView, y se van a la vez el progreso y el marcador, quedando coherentes).
 * Es un marcador a nivel de dispositivo: común a la cuenta de tutor y a la de
 * niño (se migra hacia el primer perfil creado, del tipo que sea).
 *
 * Módulo puro: `MigrationState` son strings y `Curso`; no toca Firebase.
 * ------------------------------------------------------------------------- */

export const MIGRATION_KEY = "tdp:migration";
export const MIGRATION_SCHEMA_VERSION = 1 as const;

/** Perfil destino del traslado: `childId` null ⟹ cuenta de niño (Modelo B). */
export interface MigrationTargetRef {
  uid: string;
  childId: string | null;
}

/** Estado persistido bajo `tdp:migration` (esquema versionado, lectura defensiva). */
export interface MigrationState {
  schemaVersion: typeof MIGRATION_SCHEMA_VERSION;
  status: "pending" | "done";
  target: MigrationTargetRef;
  /** cursos con avance aún NO verificados en la nube */
  pendingCourses: Curso[];
  /** reintentos consumidos (gobierna el paso a aviso + reintento manual) */
  attempts: number;
  lastErrorAt: string | null;
}

function parseMigrationTarget(raw: unknown): MigrationTargetRef | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.uid !== "string" || raw.uid.length === 0) return null;
  const childId = raw.childId;
  if (childId !== null && typeof childId !== "string") return null;
  return { uid: raw.uid, childId };
}

/**
 * Lee el marcador de migración de `localStorage`. Devuelve null si no existe,
 * está corrupto, o su forma no es reconocible (lectura defensiva, como el resto
 * del módulo). Un null significa "aún no ha empezado ninguna migración en este
 * dispositivo" (por tanto, es el primer perfil).
 */
export function loadMigrationState(): MigrationState | null {
  const ls = getStorage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(MIGRATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlainObject(parsed)) return null;
    if (parsed.schemaVersion !== MIGRATION_SCHEMA_VERSION) return null;
    const target = parseMigrationTarget(parsed.target);
    if (!target) return null;
    const status = parsed.status === "done" ? "done" : "pending";
    const pendingCourses = Array.isArray(parsed.pendingCourses)
      ? parsed.pendingCourses.filter(isCurso)
      : [];
    const attempts =
      typeof parsed.attempts === "number" && parsed.attempts >= 0
        ? Math.floor(parsed.attempts)
        : 0;
    const lastErrorAt = typeof parsed.lastErrorAt === "string" ? parsed.lastErrorAt : null;
    return {
      schemaVersion: MIGRATION_SCHEMA_VERSION,
      status,
      target,
      pendingCourses,
      attempts,
      lastErrorAt,
    };
  } catch {
    return null;
  }
}

export function saveMigrationState(state: MigrationState): void {
  const ls = getStorage();
  if (!ls) return;
  try {
    ls.setItem(MIGRATION_KEY, JSON.stringify(state));
  } catch {
    // almacenamiento lleno o restringido: no romper la experiencia del niño
  }
}

/** Borra el marcador de migración. Uso interno y de tests. */
export function clearMigrationState(): void {
  const ls = getStorage();
  if (!ls) return;
  try {
    ls.removeItem(MIGRATION_KEY);
  } catch {
    // ignorar: sin marcador no se pierde progreso, solo se podría re-evaluar
  }
}

/**
 * ¿Este curso tiene AVANCE real? Verdadero si algún campo de aprendizaje difiere
 * del estado por defecto. El `profile` (avatar/apodo) NO cuenta como avance: un
 * curso donde solo se eligió avatar pero nunca se jugó se trata como "sin avance"
 * y se omite del traslado (no se siembra un documento de nube vacío).
 */
export function courseHasProgress(cs: CourseState): boolean {
  return (
    cs.stars.total > 0 ||
    cs.streak.longest > 0 ||
    cs.dailyGoal.totalCompleted > 0 ||
    Object.keys(cs.badges.unlocked).length > 0 ||
    Object.keys(cs.progress.correctByTopic).length > 0 ||
    Object.keys(cs.progress.correctBySubject).length > 0 ||
    cs.progress.subjectsTried.length > 0 ||
    cs.progress.correctExerciseIds.length > 0 ||
    cs.progress.failedExerciseIds.length > 0
  );
}

/** Cursos con avance real, en orden de `COURSES` (1..6). */
export function coursesWithProgress(state: PersistedState): Curso[] {
  const out: Curso[] = [];
  for (const c of COURSES) {
    const cs = state.courses[c];
    if (cs && courseHasProgress(cs)) out.push(c);
  }
  return out;
}

/**
 * Elimina los avances de UN curso de `tdp:v1`, conservando `preferences` y
 * `currentCourse` intactos. Se usa tras verificar que la nube ya tiene ese curso.
 * Si al borrar quedara sin la entrada del curso activo, `loadState()` la recrea
 * vacía en la siguiente lectura, así que no rompe nada.
 */
export function removeCourseProgress(curso: Curso): void {
  const ls = getStorage();
  if (!ls) return;
  const state = loadState();
  if (!state.courses[curso]) return;
  const courses = { ...state.courses };
  delete courses[curso];
  saveState({ ...state, courses });
}
