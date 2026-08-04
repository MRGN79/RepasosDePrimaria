/*
 * Mapeo CourseState (ADR-002) ↔ documento Firestore courses/{curso}
 * (ADR-003 §6, ADR-004 §2). Módulo PURO: no importa Firebase ni React, para
 * poder testear el mapeo de forma aislada.
 *
 * Minimización estricta (ADR-004 §3): el documento en la nube NUNCA lleva texto
 * libre identificante. `nicknameCustom` (apodo escrito a mano) se descarta al
 * subir: la identidad visible del perfil vive en `mote`/`avatar` de catálogo
 * cerrado, a nivel del documento de perfil, no dentro del CourseState. En la
 * nube el `profile` del CourseState solo conserva las referencias de catálogo.
 */
import { parseCourseState, type CourseState } from "@/lib/storage";

/** Claves de primer nivel permitidas por las reglas en courses/{curso}. */
export const COURSE_DOC_KEYS = [
  "profile",
  "streak",
  "stars",
  "badges",
  "dailyGoal",
  "progress",
] as const;

/**
 * CourseState → documento de nube. Copia solo las claves permitidas y anula
 * `nicknameCustom` (texto libre) para no subir PII. El resto es serializable y
 * plano por diseño de ADR-002.
 */
export function courseStateToCloudDoc(cs: CourseState): CourseState {
  return {
    profile: {
      avatarId: cs.profile.avatarId,
      nicknameId: cs.profile.nicknameId,
      nicknameCustom: null,
    },
    streak: { ...cs.streak },
    stars: { ...cs.stars },
    badges: { unlocked: { ...cs.badges.unlocked } },
    dailyGoal: { ...cs.dailyGoal },
    progress: {
      correctByTopic: { ...cs.progress.correctByTopic },
      correctBySubject: { ...cs.progress.correctBySubject },
      subjectsTried: [...cs.progress.subjectsTried],
      correctExerciseIds: [...cs.progress.correctExerciseIds],
      failedExerciseIds: [...cs.progress.failedExerciseIds],
    },
  };
}

/**
 * Documento de nube → CourseState. Lectura defensiva reutilizando el mismo
 * validador que localStorage: ante datos corruptos o incompletos, normaliza a
 * un estado coherente en vez de romper.
 */
export function cloudDocToCourseState(raw: unknown): CourseState {
  return parseCourseState(raw);
}
