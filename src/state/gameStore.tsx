/*
 * Proveedor de estado global de gamificación y preferencias. Envuelve la capa de
 * persistencia (lib/storage) y expone acciones de alto nivel. Es el ÚNICO punto
 * que toca localStorage; los componentes consumen vía useGameStore (gameContext).
 *
 * Multi-curso (ADR-002): los avances viven aislados por curso. El store expone
 * una vista aplanada del curso activo (state) para que las pantallas sigan
 * leyendo state.streak, state.stars, … sin cambios. Las escrituras de avances
 * (perfil, consolidación) apuntan al curso activo; las preferencias son globales.
 *
 * Scope deliberadamente pequeño: sólo lo que debe sobrevivir entre pantallas y
 * sesiones. El estado efímero de una sesión vive en useSession, no aquí.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loadState,
  saveState,
  isStorageAvailable,
  defaultState,
  emptyCourseState,
  activeCourse,
  activeView,
  type PersistedState,
  type CourseState,
  type Language,
  type Curso,
} from "@/lib/storage";
import { localDateKey } from "@/lib/streak";
import { applyConsolidation, type SessionConsolidation } from "./consolidation";
import { GameContext, type GameStore } from "./gameContext";

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const storageAvailable = useRef(isStorageAvailable()).current;
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persistencia: cada cambio del estado se guarda (degrada en silencio si no hay LS).
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Actualiza inmutablemente los avances del curso activo.
  const updateActiveCourse = useCallback(
    (updater: (cs: CourseState) => CourseState) => {
      setState((s) => {
        const cur = s.courses[s.currentCourse] ?? emptyCourseState();
        return { ...s, courses: { ...s.courses, [s.currentCourse]: updater(cur) } };
      });
    },
    [],
  );

  const setCourse = useCallback((curso: Curso) => {
    setState((s) => {
      if (s.currentCourse === curso && s.courses[curso]) return s;
      const courses = s.courses[curso]
        ? s.courses
        : { ...s.courses, [curso]: emptyCourseState() };
      return { ...s, currentCourse: curso, courses };
    });
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setState((s) => ({ ...s, preferences: { ...s.preferences, language } }));
  }, []);

  const setSound = useCallback((sound: boolean) => {
    setState((s) => ({ ...s, preferences: { ...s.preferences, sound } }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setState((s) => ({ ...s, preferences: { ...s.preferences, reducedMotion } }));
  }, []);

  const setProfile = useCallback(
    (avatarId: string, nicknameId: string | null, nicknameCustom: string | null = null) => {
      updateActiveCourse((cs) => ({ ...cs, profile: { avatarId, nicknameId, nicknameCustom } }));
    },
    [updateActiveCourse],
  );

  const clearData = useCallback(() => {
    const fresh = defaultState();
    stateRef.current = fresh;
    setState(fresh);
  }, []);

  const consolidateSession = useCallback<GameStore["consolidateSession"]>(
    (c: SessionConsolidation) => {
      const today = localDateKey();
      const prev = stateRef.current;
      const cur = prev.courses[prev.currentCourse] ?? emptyCourseState();
      const { next: nextCourse, result } = applyConsolidation(cur, c, today);
      const nextState: PersistedState = {
        ...prev,
        courses: { ...prev.courses, [prev.currentCourse]: nextCourse },
      };
      stateRef.current = nextState;
      setState(nextState);
      return result;
    },
    [],
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

  const view = useMemo(() => activeView(state), [state]);
  const course = useMemo(() => activeCourse(state), [state]);

  const value = useMemo<GameStore>(
    () => ({
      state: view,
      storageAvailable,
      currentCourse: state.currentCourse,
      setCourse,
      setLanguage,
      setSound,
      setReducedMotion,
      setProfile,
      clearData,
      hasProfile: course.profile.avatarId !== null,
      consolidateSession,
      removeFailedExerciseIds,
    }),
    [
      view,
      course,
      state.currentCourse,
      storageAvailable,
      setCourse,
      setLanguage,
      setSound,
      setReducedMotion,
      setProfile,
      clearData,
      consolidateSession,
      removeFailedExerciseIds,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
