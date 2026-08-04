/*
 * Proveedor de estado respaldado por Firestore (ADR-003 §3/§6, ADR-004 §2).
 *
 * Provee EXACTAMENTE el mismo GameContext que GameProvider, para que todas las
 * pantallas del juego funcionen sin cambios. La diferencia: el progreso del
 * curso activo (CourseState) se lee y escribe en Firestore para el perfil
 * activo, en lugar de en localStorage.
 *
 *   - Perfil de niño (cuenta kid):   childId === null → users/{uid}/courses/{curso}
 *   - Perfil de hijo (cuenta tutor): childId !== null → users/{uid}/children/{childId}/courses/{curso}
 *
 * Offline-first: Firestore mantiene su propia caché offline (persistencia
 * habilitada en config.ts); no duplicamos el progreso en localStorage. Las
 * preferencias de dispositivo (idioma, sonido, movimiento) sí siguen siendo
 * locales del dispositivo.
 *
 * Identidad del perfil: avatar y mote (apodo de catálogo cerrado) vienen del
 * documento de perfil, no del CourseState. Se siembran en el CourseState en
 * memoria para que la UI (que lee state.profile) los muestre, pero al subir se
 * minimizan (courseStateToCloudDoc descarta el texto libre).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  loadState,
  saveState,
  emptyCourseState,
  type CourseState,
  type Language,
  type Curso,
  type Preferences,
} from "@/lib/storage";
import { localDateKey } from "@/lib/streak";
import { loadCourse, saveCourse, setKidCurrentCourse, setChildCurrentCourse } from "@/lib/firebase/firestore";
import { applyConsolidation, type SessionConsolidation } from "./consolidation";
import { GameContext, type GameStore } from "./gameContext";
import { activeView } from "@/lib/storage";
import type { PersistedState } from "@/lib/storage";

export interface CloudProfileSeed {
  avatar: string;
  mote: string;
  currentCourse: Curso;
}

interface CloudGameProviderProps {
  uid: string;
  /** null para cuenta de niño; id del perfil de hijo para cuenta de tutor. */
  childId: string | null;
  seed: CloudProfileSeed;
  children: ReactNode;
}

const SAVE_DEBOUNCE_MS = 700;

export function CloudGameProvider({ uid, childId, seed, children }: CloudGameProviderProps) {
  const { t } = useTranslation("account");

  // Preferencias del dispositivo (globales, se quedan en localStorage).
  const [preferences, setPreferences] = useState<Preferences>(() => loadState().preferences);
  const persistPreferences = useCallback((next: Preferences) => {
    setPreferences(next);
    const local = loadState();
    saveState({ ...local, preferences: next });
  }, []);

  const [currentCourse, setCurrentCourse] = useState<Curso>(seed.currentCourse);
  const [courses, setCourses] = useState<Partial<Record<Curso, CourseState>>>({});
  const [loadingCourse, setLoadingCourse] = useState(true);

  const seedProfile = useCallback(
    (cs: CourseState): CourseState =>
      cs.profile.avatarId
        ? cs
        : { ...cs, profile: { avatarId: seed.avatar, nicknameId: seed.mote, nicknameCustom: null } },
    [seed.avatar, seed.mote],
  );

  // Carga el curso activo desde Firestore cuando cambia y aún no está en memoria.
  useEffect(() => {
    if (courses[currentCourse]) {
      setLoadingCourse(false);
      return;
    }
    let cancelled = false;
    setLoadingCourse(true);
    void loadCourse(uid, childId, currentCourse).then((cs) => {
      if (cancelled) return;
      const seeded = seedProfile(cs ?? emptyCourseState());
      setCourses((prev) => ({ ...prev, [currentCourse]: seeded }));
      setLoadingCourse(false);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, childId, currentCourse, courses, seedProfile]);

  // Guardado con debounce del curso activo a Firestore.
  const saveTimer = useRef<number | undefined>(undefined);
  const scheduleSave = useCallback(
    (curso: Curso, cs: CourseState) => {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void saveCourse(uid, childId, curso, cs);
      }, SAVE_DEBOUNCE_MS);
    },
    [uid, childId],
  );

  const updateActiveCourse = useCallback(
    (updater: (cs: CourseState) => CourseState) => {
      setCourses((prev) => {
        const cur = prev[currentCourse] ?? seedProfile(emptyCourseState());
        const next = updater(cur);
        scheduleSave(currentCourse, next);
        return { ...prev, [currentCourse]: next };
      });
    },
    [currentCourse, scheduleSave, seedProfile],
  );

  const setCourse = useCallback(
    (curso: Curso) => {
      setCurrentCourse(curso);
      // Persiste el curso activo del perfil (no bloquea la UI).
      const write = childId === null ? setKidCurrentCourse(uid, curso) : setChildCurrentCourse(uid, childId, curso);
      void write.catch(() => {
        /* offline: Firestore reintenta al reconectar */
      });
    },
    [uid, childId],
  );

  const setLanguage = useCallback(
    (language: Language) => persistPreferences({ ...preferences, language }),
    [preferences, persistPreferences],
  );
  const setSound = useCallback(
    (sound: boolean) => persistPreferences({ ...preferences, sound }),
    [preferences, persistPreferences],
  );
  const setReducedMotion = useCallback(
    (reducedMotion: boolean) => persistPreferences({ ...preferences, reducedMotion }),
    [preferences, persistPreferences],
  );

  const setProfile = useCallback(
    (avatarId: string, nicknameId: string | null, nicknameCustom: string | null = null) => {
      updateActiveCourse((cs) => ({ ...cs, profile: { avatarId, nicknameId, nicknameCustom } }));
    },
    [updateActiveCourse],
  );

  const clearData = useCallback(() => {
    // En la nube, "borrar datos" reinicia el progreso del curso activo (la
    // supresión de cuenta completa con puerta parental es Inc. 5).
    const fresh = seedProfile(emptyCourseState());
    setCourses((prev) => ({ ...prev, [currentCourse]: fresh }));
    scheduleSave(currentCourse, fresh);
  }, [currentCourse, scheduleSave, seedProfile]);

  const consolidateSession = useCallback<GameStore["consolidateSession"]>(
    (c: SessionConsolidation) => {
      const today = localDateKey();
      const cur = courses[currentCourse] ?? seedProfile(emptyCourseState());
      const { next, result } = applyConsolidation(cur, c, today);
      setCourses((prev) => ({ ...prev, [currentCourse]: next }));
      scheduleSave(currentCourse, next);
      return result;
    },
    [courses, currentCourse, scheduleSave, seedProfile],
  );

  const removeFailedExerciseIds = useCallback(
    (ids: string[]) => {
      const toRemove = new Set(ids);
      updateActiveCourse((cs) => ({
        ...cs,
        progress: {
          ...cs.progress,
          failedExerciseIds: cs.progress.failedExerciseIds.filter((id) => !toRemove.has(id)),
        },
      }));
    },
    [updateActiveCourse],
  );

  const activeCourseState = courses[currentCourse];

  const value = useMemo<GameStore | null>(() => {
    if (!activeCourseState) return null;
    const persisted: PersistedState = {
      schemaVersion: 2,
      preferences,
      currentCourse,
      courses: { [currentCourse]: activeCourseState },
    };
    return {
      state: activeView(persisted),
      storageAvailable: true,
      currentCourse,
      setCourse,
      setLanguage,
      setSound,
      setReducedMotion,
      setProfile,
      clearData,
      hasProfile: activeCourseState.profile.avatarId !== null,
      consolidateSession,
      removeFailedExerciseIds,
    };
  }, [
    activeCourseState,
    preferences,
    currentCourse,
    setCourse,
    setLanguage,
    setSound,
    setReducedMotion,
    setProfile,
    clearData,
    consolidateSession,
    removeFailedExerciseIds,
  ]);

  if (loadingCourse || !value) {
    return <p style={{ padding: "2rem", textAlign: "center" }}>{t("loading")}</p>;
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
