/*
 * Traslado del progreso local a la nube (Épica E, verify-before-delete).
 *
 * Principio rector: EL PROGRESO LOCAL NUNCA SE PIERDE. Un curso solo se borra de
 * `localStorage` cuando la nube CONFIRMA que lo tiene, con dos señales:
 *   1. La escritura resuelve (setDoc solo resuelve con confirmación del servidor).
 *   2. La relectura FORZADA DESDE EL SERVIDOR (loadCourseFromServer,
 *      getDocFromServer) coincide estructuralmente con lo que se pretendía escribir.
 * La segunda señal ignora la caché offline de Firestore, que de otro modo daría un
 * falso positivo (confirmaría una escritura que solo tiene la caché del dispositivo).
 *
 * Anti-retroceso: antes de escribir se relee la nube y se FUNDE con el local
 * tomando máximos/uniones (mergeNonRegressing). Esto no destruye progreso de nube
 * preexistente y hace la operación idempotente: reejecutar produce el mismo
 * documento (id = curso, contenido determinista de local ∪ nube).
 *
 * Orquestación agnóstica de React: depende de `storage.ts` (progreso + marcador
 * locales) y `firestore.ts` (nube). La UI decide cuándo llamar y observa el
 * progreso vía `onProgress`.
 */
import {
  loadState,
  loadMigrationState,
  saveMigrationState,
  courseHasProgress,
  coursesWithProgress,
  removeCourseProgress,
  MIGRATION_SCHEMA_VERSION,
  type CourseState,
  type Curso,
  type MigrationState,
} from "@/lib/storage";
import { courseStateToCloudDoc } from "./courseMapping";
import { loadCourse, loadCourseFromServer, saveCourse } from "./firestore";

export interface MigrationTarget {
  uid: string;
  childId: string | null;
}

export type MigrationOutcome =
  | { status: "done"; migrated: Curso[] }
  | { status: "incomplete"; migrated: Curso[]; pending: Curso[] }
  | { status: "noop" };

export interface RunOptions {
  onProgress?: (s: { phase: "running" | "incomplete" | "done"; pending: Curso[] }) => void;
}

/* ------------------------------ helpers puros ------------------------------ */

/** Máximo de dos contadores no negativos. */
function maxNum(a: number, b: number): number {
  return a > b ? a : b;
}

/** Fecha "YYYY-MM-DD" más reciente (comparación lexicográfica válida para ISO). */
function laterDate(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a >= b ? a : b;
}

/** Máximo por clave de dos mapas clave→número (unión de claves). */
function mergeCounters(
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = maxNum(out[k] ?? 0, v);
  }
  return out;
}

/** Unión de dos listas de strings (sin duplicados, orden estable a→b). */
function unionList(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

/**
 * Funde el CourseState local con el de la nube SIN reducir ningún indicador de
 * avance. Por cada contador toma el máximo; por cada conjunto la unión. Nunca
 * retrocede. Es la garantía de que interleaving con `CloudGameProvider` es seguro
 * por convergencia, y de que el traslado es idempotente.
 */
export function mergeNonRegressing(local: CourseState, cloud: CourseState): CourseState {
  // Medallas: unión por clave conservando la fecha de desbloqueo más temprana.
  const unlocked: Record<string, string> = { ...cloud.badges.unlocked };
  for (const [id, date] of Object.entries(local.badges.unlocked)) {
    const prev = unlocked[id];
    unlocked[id] = prev === undefined ? date : prev <= date ? prev : date;
  }

  const correctExerciseIds = unionList(
    local.progress.correctExerciseIds,
    cloud.progress.correctExerciseIds,
  );
  // Fallos = unión menos los ya resueltos (coherente con consolidation.ts).
  const correctSet = new Set(correctExerciseIds);
  const failedExerciseIds = unionList(
    local.progress.failedExerciseIds,
    cloud.progress.failedExerciseIds,
  ).filter((id) => !correctSet.has(id));

  return {
    // El perfil no cuenta como avance; se conserva el del local si lo tiene.
    profile: local.profile.avatarId ? local.profile : cloud.profile,
    streak: {
      current: maxNum(local.streak.current, cloud.streak.current),
      longest: maxNum(local.streak.longest, cloud.streak.longest),
      lastPlayedDate: laterDate(local.streak.lastPlayedDate, cloud.streak.lastPlayedDate),
    },
    stars: { total: maxNum(local.stars.total, cloud.stars.total) },
    badges: { unlocked },
    dailyGoal: {
      lastDoneDate: laterDate(local.dailyGoal.lastDoneDate, cloud.dailyGoal.lastDoneDate),
      totalCompleted: maxNum(local.dailyGoal.totalCompleted, cloud.dailyGoal.totalCompleted),
    },
    progress: {
      correctByTopic: mergeCounters(
        local.progress.correctByTopic,
        cloud.progress.correctByTopic,
      ),
      correctBySubject: mergeCounters(
        local.progress.correctBySubject,
        cloud.progress.correctBySubject,
      ),
      subjectsTried: unionList(local.progress.subjectsTried, cloud.progress.subjectsTried),
      correctExerciseIds,
      failedExerciseIds,
    },
  };
}

function recordsEqual(a: Record<string, number | string>, b: Record<string, number | string>): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => a[k] === b[k]);
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

/**
 * ¿Son estructuralmente equivalentes en TODO campo con significado de avance? Se
 * compara por contenido, no por `JSON.stringify`: Firestore puede reordenar claves
 * de mapas e ítems de arrays al serializar, y un stringify ingenuo daría falsos
 * negativos. El `profile` no interviene (no es avance; `nicknameCustom` se sube
 * siempre como null).
 */
export function courseStatesEquivalent(a: CourseState, b: CourseState): boolean {
  return (
    a.streak.current === b.streak.current &&
    a.streak.longest === b.streak.longest &&
    a.streak.lastPlayedDate === b.streak.lastPlayedDate &&
    a.stars.total === b.stars.total &&
    a.dailyGoal.lastDoneDate === b.dailyGoal.lastDoneDate &&
    a.dailyGoal.totalCompleted === b.dailyGoal.totalCompleted &&
    recordsEqual(a.badges.unlocked, b.badges.unlocked) &&
    recordsEqual(a.progress.correctByTopic, b.progress.correctByTopic) &&
    recordsEqual(a.progress.correctBySubject, b.progress.correctBySubject) &&
    setsEqual(a.progress.subjectsTried, b.progress.subjectsTried) &&
    setsEqual(a.progress.correctExerciseIds, b.progress.correctExerciseIds) &&
    setsEqual(a.progress.failedExerciseIds, b.progress.failedExerciseIds)
  );
}

/* --------------------------- señales para la UI --------------------------- */

/** ¿El marcador de migración ya existe? (⟹ no es el primer perfil del dispositivo). */
export function migrationMarkerExists(): boolean {
  return loadMigrationState() !== null;
}

/** ¿Hay progreso local con avance real que trasladar? (señal para mostrar el aviso). */
export function hasLocalProgressToMigrate(): boolean {
  return coursesWithProgress(loadState()).length > 0;
}

/* ------------------------------- núcleo ----------------------------------- */

class VerificationFailedError extends Error {
  constructor(public readonly curso: Curso) {
    super(`migration-verification-failed:${curso}`);
    this.name = "VerificationFailedError";
  }
}

/**
 * Traslada UN curso con verify-before-delete. Relee la nube y funde (anti-retroceso),
 * escribe, relee del SERVIDOR y compara; solo si coincide borra el curso en local.
 * Lanza si la verificación no se cumple (⟹ el curso queda pendiente, local intacto).
 */
async function migrateCourse(target: MigrationTarget, curso: Curso, localCS: CourseState): Promise<void> {
  const cloudCS = await loadCourse(target.uid, target.childId, curso);
  const merged = cloudCS === null ? localCS : mergeNonRegressing(localCS, cloudCS);
  const intended = courseStateToCloudDoc(merged);

  await saveCourse(target.uid, target.childId, curso, merged);

  const readback = await loadCourseFromServer(target.uid, target.childId, curso);
  if (readback === null || !courseStatesEquivalent(readback, intended)) {
    throw new VerificationFailedError(curso);
  }

  removeCourseProgress(curso);
}

function sameTarget(a: MigrationTarget, b: { uid: string; childId: string | null }): boolean {
  return a.uid === b.uid && a.childId === b.childId;
}

/**
 * Recorre `state.pendingCourses` SECUENCIALMENTE (no en paralelo): cada curso se
 * escribe, verifica, borra en local y se quita de pendientes en cuanto confirma.
 * Si la app se cierra a mitad, el marcador refleja exactamente lo que falta. Un
 * fallo (sin red, verificación) deja ese curso pendiente y sigue con el siguiente.
 */
async function runPending(marker: MigrationState, opts?: RunOptions): Promise<MigrationOutcome> {
  const target: MigrationTarget = { uid: marker.target.uid, childId: marker.target.childId };
  const migrated: Curso[] = [];
  let pending = [...marker.pendingCourses];
  let failed = false;

  opts?.onProgress?.({ phase: "running", pending });

  for (const curso of marker.pendingCourses) {
    const localCS = loadState().courses[curso];

    // Ya trasladado en una pasada anterior (borrado en local): la nube lo tiene.
    if (!localCS || !courseHasProgress(localCS)) {
      pending = pending.filter((c) => c !== curso);
      persist({ ...marker, pending, status: pending.length ? "pending" : "done" });
      continue;
    }

    try {
      await migrateCourse(target, curso, localCS);
      migrated.push(curso);
      pending = pending.filter((c) => c !== curso);
      persist({ ...marker, pending, status: pending.length ? "pending" : "done" });
    } catch {
      failed = true;
    }
  }

  if (pending.length === 0) {
    persist({ ...marker, pending, status: "done", bumpAttempt: false });
    opts?.onProgress?.({ phase: "done", pending });
    return { status: "done", migrated };
  }

  persist({ ...marker, pending, status: "pending", bumpAttempt: failed });
  opts?.onProgress?.({ phase: "incomplete", pending });
  return { status: "incomplete", migrated, pending };
}

/** Reescribe el marcador con la lista de pendientes actual (y opcionalmente cuenta un intento). */
function persist(args: {
  target: MigrationState["target"];
  pending: Curso[];
  status: "pending" | "done";
  attempts?: number;
  bumpAttempt?: boolean;
}): void {
  const current = loadMigrationState();
  const attempts = (current?.attempts ?? args.attempts ?? 0) + (args.bumpAttempt ? 1 : 0);
  saveMigrationState({
    schemaVersion: MIGRATION_SCHEMA_VERSION,
    status: args.status,
    target: args.target,
    pendingCourses: args.pending,
    attempts,
    lastErrorAt: args.bumpAttempt ? new Date().toISOString() : (current?.lastErrorAt ?? null),
  });
}

/* ------------------------------- API pública ------------------------------- */

/**
 * Arranca el traslado tras crear el PRIMER perfil del dispositivo. Autoprotegida:
 *  - Si ya existe marcador (no es el primer perfil) ⟹ { status: "noop" } (US-E4).
 *  - Si no hay progreso local ⟹ escribe marcador "done" y ⟹ { status: "noop" } (US-E7),
 *    para no reevaluar la migración en cada arranque.
 * Idempotente y reintentable.
 */
export async function beginMigration(target: MigrationTarget, opts?: RunOptions): Promise<MigrationOutcome> {
  if (migrationMarkerExists()) return { status: "noop" };

  const state = loadState();
  const withProgress = coursesWithProgress(state);

  // Curso activo primero (§4.1): el resto en segundo plano. La corrección ya la
  // garantiza mergeNonRegressing; esto minimiza el clobber del curso activo.
  const active = state.currentCourse;
  const ordered = withProgress.includes(active)
    ? [active, ...withProgress.filter((c) => c !== active)]
    : withProgress;

  const markerTarget = { uid: target.uid, childId: target.childId };

  if (ordered.length === 0) {
    saveMigrationState({
      schemaVersion: MIGRATION_SCHEMA_VERSION,
      status: "done",
      target: markerTarget,
      pendingCourses: [],
      attempts: 0,
      lastErrorAt: null,
    });
    return { status: "noop" };
  }

  const marker: MigrationState = {
    schemaVersion: MIGRATION_SCHEMA_VERSION,
    status: "pending",
    target: markerTarget,
    pendingCourses: ordered,
    attempts: 0,
    lastErrorAt: null,
  };
  saveMigrationState(marker);

  return runPending(marker, opts);
}

/**
 * Reanuda/reintenta si hay pendientes para ESTE target (US-E6). Devuelve null si
 * no hay marcador, no está pendiente, o el target no coincide (el usuario cambió
 * de cuenta antes de terminar: los pendientes siguen destinados al target original
 * y el local se conserva).
 */
export async function resumeMigrationIfPending(
  activeTarget: MigrationTarget,
  opts?: RunOptions,
): Promise<MigrationOutcome | null> {
  const marker = loadMigrationState();
  if (!marker || marker.status !== "pending" || marker.pendingCourses.length === 0) return null;
  if (!sameTarget(activeTarget, marker.target)) return null;
  return runPending(marker, opts);
}
