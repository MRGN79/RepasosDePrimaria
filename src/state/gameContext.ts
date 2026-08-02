/*
 * Contexto y hook de acceso al estado de juego. Separado del proveedor (.tsx)
 * para que el módulo del componente sólo exporte componentes (Fast Refresh).
 */
import { createContext, useContext } from "react";
import type { ActiveView, Language, Curso } from "@/lib/storage";
import type {
  SessionConsolidation,
  ConsolidationResult,
} from "./consolidation";

export interface GameStore {
  /** Vista aplanada del curso activo + preferencias globales. */
  state: ActiveView;
  storageAvailable: boolean;
  /** curso actualmente seleccionado */
  currentCourse: Curso;
  /** cambia el curso activo; crea sus avances vacíos si es la primera vez */
  setCourse: (curso: Curso) => void;
  setLanguage: (lang: Language) => void;
  setSound: (on: boolean) => void;
  setReducedMotion: (on: boolean) => void;
  setProfile: (avatarId: string, nicknameId: string | null, nicknameCustom?: string | null) => void;
  clearData: () => void;
  hasProfile: boolean;
  consolidateSession: (c: SessionConsolidation) => ConsolidationResult;
  removeFailedExerciseIds: (ids: string[]) => void;
}

export const GameContext = createContext<GameStore | null>(null);

export function useGameStore(): GameStore {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameStore must be used within GameProvider");
  return ctx;
}
