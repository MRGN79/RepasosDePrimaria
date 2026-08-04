/*
 * useSession — el motor de quiz como hook de React.
 * Gobierna el estado efímero de una sesión: ejercicio actual, respuesta marcada
 * por tipo, intentos, feedback rotado, revelación amable de la solución, estrellas
 * de la sesión y los view-models que consume SessionScreen.
 *
 * Reglas pedagógicas (specs 02/03):
 *  - Feedback inmediato y celebratorio; error AMABLE, sin castigo.
 *  - Acierto a la primera = 1 estrella; tras fallar = media estrella (0.5), nunca 0.
 *  - Tras 2 intentos fallidos se revela la solución y se avanza sin drama.
 *  - Nunca resta estrellas ni racha.
 */
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EjercicioAny, Materia, Nivel } from "@content/types";
import { esGenerado } from "@content/types";
import { fixedLanguageFor } from "@content/registry";
import type { OptionStatus, MatchItem } from "@/components";
import type { ResponseKind } from "@/screens/SessionScreen";
import {
  buildSession,
  checkOptionAnswer,
  checkNumericAnswer,
  checkMatchAnswer,
  matchLeftIds,
  type PreparedExercise,
  type MatchAnswer,
} from "@/lib/session";

const MAX_ATTEMPTS = 2;
const STAR_FIRST_TRY = 1;
const STAR_AFTER_RETRY = 0.5;

const CORRECT_FEEDBACK_COUNT = 4;
const ALMOST_FEEDBACK_COUNT = 3;

function randomIndex(n: number): number {
  return 1 + Math.floor(Math.random() * n);
}

interface OptionVM {
  id: string;
  label: string;
  status?: OptionStatus;
  checked?: boolean;
}

export interface SessionView {
  current: number; // 1-based
  total: number;
  sessionStars: number;
  prompt: string;
  /** idioma del contenido del ejercicio si difiere de la UI (WCAG 3.1.2) */
  promptLang: "en" | "es" | null;
  kind: ResponseKind;
  options: OptionVM[];
  numericValue: string;
  /** true cuando revealed=true en respuesta-corta: el display muestra la solución */
  numericRevealed: boolean;
  matchLeft: MatchItem[];
  matchRight: MatchItem[];
  feedback: { kind: "correct" | "almost"; message: string } | null;
  /** anuncio aria-live del resultado o del emparejado */
  liveMessage: string;
  canCheck: boolean;
  resolved: boolean;
  finished: boolean;
}

export interface SessionSummary {
  starsEarned: number; // redondeado al alza para la celebración
  correctByTopic: Record<string, number>;
  correctBySubject: Record<string, number>;
  materia: Materia;
  subjectsTried: Materia[];
  /** ids de ejercicios estáticos respondidos correctamente en esta sesión */
  newlyCorrectIds: string[];
  /** ids de ejercicios estáticos en los que el niño ha cometido al menos un error */
  failedIds: string[];
}

export interface UseSessionResult {
  view: SessionView | null;
  selectOption: (id: string) => void;
  inputDigit: (d: string) => void;
  deleteDigit: () => void;
  selectMatch: (side: "left" | "right", id: string) => void;
  check: () => void;
  next: () => void;
  summary: SessionSummary;
}

export function useSession(
  curso: Nivel,
  materia: Materia,
  tema: string | null,
  length?: number,
  prebuilt?: PreparedExercise[],
  excludeIds?: ReadonlySet<string>,
): UseSessionResult {
  const { t } = useTranslation(["quiz", "exercises"]);

  // La secuencia se construye una sola vez por montaje de la sesión.
  const [items] = useState<PreparedExercise[]>(() =>
    prebuilt ?? buildSession(curso, materia, tema, length, Math.random, excludeIds),
  );

  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [resolvedCorrect, setResolvedCorrect] = useState(false);
  const [feedback, setFeedback] = useState<SessionView["feedback"]>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [sessionStars, setSessionStars] = useState(0);
  const [correctByTopic, setCorrectByTopic] = useState<Record<string, number>>({});
  const [correctBySubject, setCorrectBySubject] = useState<Record<string, number>>({});
  const [newlyCorrectIds, setNewlyCorrectIds] = useState<string[]>([]);
  const [failedIds, setFailedIds] = useState<string[]>([]);

  // Respuestas por tipo
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numericValue, setNumericValue] = useState("");
  const [matchAnswer, setMatchAnswer] = useState<MatchAnswer>({});
  const [pendingMatch, setPendingMatch] = useState<string | null>(null); // id origen seleccionado

  const finished = items.length === 0 || index >= items.length;
  const prepared = finished ? null : items[index];
  const exercise = prepared?.exercise ?? null;

  const kind: ResponseKind = exercise ? (exercise.tipo as ResponseKind) : "opcion-multiple";

  const resetPerExercise = useCallback(() => {
    setAttempts(0);
    setRevealed(false);
    setResolvedCorrect(false);
    setFeedback(null);
    setLiveMessage("");
    setSelectedOption(null);
    setNumericValue("");
    setMatchAnswer({});
    setPendingMatch(null);
  }, []);

  /* --------------------------- selección por tipo --------------------------- */

  const selectOption = useCallback(
    (id: string) => {
      if (revealed || resolvedCorrect) return;
      setSelectedOption(id);
    },
    [revealed, resolvedCorrect],
  );

  const inputDigit = useCallback(
    (d: string) => {
      if (revealed || resolvedCorrect) return;
      setNumericValue((v) => (v.length >= 6 ? v : v + d));
    },
    [revealed, resolvedCorrect],
  );

  const deleteDigit = useCallback(() => {
    if (revealed || resolvedCorrect) return;
    setNumericValue((v) => v.slice(0, -1));
  }, [revealed, resolvedCorrect]);

  const selectMatch = useCallback(
    (side: "left" | "right", id: string) => {
      if (!exercise || revealed || resolvedCorrect) return;
      if (matchAnswer[id] || Object.values(matchAnswer).includes(id)) return; // ya emparejado

      if (side === "left") {
        setPendingMatch((cur) => (cur === id ? null : id));
        return;
      }
      // side === right: empareja con el origen pendiente
      if (pendingMatch) {
        const source = pendingMatch;
        setMatchAnswer((m) => ({ ...m, [source]: id }));
        setPendingMatch(null);
        setLiveMessage(
          t("quiz:answer.matching.paired", {
            source: labelForOption(exercise, source, t),
            target: labelForOption(exercise, id, t),
          }),
        );
      }
    },
    [exercise, revealed, resolvedCorrect, matchAnswer, pendingMatch, t],
  );

  /* ------------------------------ comprobar -------------------------------- */

  const isAnswerProvided = useMemo(() => {
    if (!exercise) return false;
    if (kind === "respuesta-corta") return numericValue.trim() !== "";
    if (kind === "emparejar") {
      const need = matchLeftIds(exercise).length;
      return need > 0 && Object.keys(matchAnswer).length === need;
    }
    return selectedOption !== null;
  }, [exercise, kind, numericValue, matchAnswer, selectedOption]);

  const check = useCallback(() => {
    if (!exercise || !prepared || revealed || resolvedCorrect || !isAnswerProvided) {
      return;
    }

    let correct = false;
    if (kind === "respuesta-corta") {
      correct = checkNumericAnswer(prepared, numericValue);
    } else if (kind === "emparejar") {
      correct = checkMatchAnswer(exercise, matchAnswer);
    } else {
      correct = checkOptionAnswer(exercise, selectedOption ?? "");
    }

    if (correct) {
      const award = attempts === 0 ? STAR_FIRST_TRY : STAR_AFTER_RETRY;
      setSessionStars((s) => s + award);
      setCorrectByTopic((m) => ({
        ...m,
        [exercise.tema]: (m[exercise.tema] ?? 0) + 1,
      }));
      setCorrectBySubject((m) => ({
        ...m,
        [exercise.materia]: (m[exercise.materia] ?? 0) + 1,
      }));
      if (!esGenerado(exercise)) {
        setNewlyCorrectIds((ids) =>
          ids.includes(exercise.id) ? ids : [...ids, exercise.id],
        );
      }
      setResolvedCorrect(true);
      setFeedback({
        kind: "correct",
        message: t(`quiz:feedback.correct.${randomIndex(CORRECT_FEEDBACK_COUNT)}`),
      });
      setLiveMessage(t("quiz:feedback.correctAnnounce"));
      return;
    }

    if (!esGenerado(exercise)) {
      setFailedIds((ids) => (ids.includes(exercise.id) ? ids : [...ids, exercise.id]));
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= MAX_ATTEMPTS) {
      // Revela la solución amablemente y permite avanzar (sin estrella, sin drama).
      setRevealed(true);
      setFeedback({ kind: "almost", message: t("quiz:feedback.solution") });
      setLiveMessage(t("quiz:feedback.solution"));
    } else {
      setFeedback({
        kind: "almost",
        message: t(`quiz:feedback.almost.${randomIndex(ALMOST_FEEDBACK_COUNT)}`),
      });
      setLiveMessage(t("quiz:feedback.almostAnnounce"));
      // En emparejado, dejamos reintentar limpiando los pares para volver a probar.
      if (kind === "emparejar") {
        setMatchAnswer({});
        setPendingMatch(null);
      }
    }
  }, [
    exercise,
    prepared,
    revealed,
    resolvedCorrect,
    isAnswerProvided,
    kind,
    numericValue,
    matchAnswer,
    selectedOption,
    attempts,
    t,
  ]);

  const next = useCallback(() => {
    resetPerExercise();
    setIndex((i) => i + 1);
  }, [resetPerExercise]);

  /* ------------------------------ view-models ------------------------------ */

  const view: SessionView | null = useMemo(() => {
    if (!exercise || !prepared) {
      return {
        current: items.length,
        total: items.length,
        sessionStars: Math.ceil(sessionStars),
        prompt: "",
        promptLang: null,
        kind,
        options: [],
        numericValue: "",
        numericRevealed: false,
        matchLeft: [],
        matchRight: [],
        feedback: null,
        liveMessage: "",
        canCheck: false,
        resolved: false,
        finished: true,
      };
    }

    const prompt = buildPrompt(exercise, prepared, t);
    const resolved = resolvedCorrect || revealed;

    const options: OptionVM[] = buildOptionVMs(
      exercise,
      selectedOption,
      revealed,
      resolvedCorrect,
      t,
    );

    const { left, right } = buildMatchVMs(exercise, matchAnswer, pendingMatch, t);

    return {
      current: index + 1,
      total: items.length,
      // Floor mientras la sesión sigue abierta: con Math.ceil, la primera
      // media estrella (acierto tras reintento) ya mostraba "1" estrella
      // completa sin haberla ganado del todo. El redondeo al alza queda
      // reservado para el resumen final (ver más arriba y starsEarned).
      sessionStars: Math.floor(sessionStars),
      prompt,
      promptLang: fixedLanguageFor(exercise.materia),
      kind,
      options,
      numericValue: revealed && kind === "respuesta-corta" && prepared.math
        ? String(prepared.math.answer)
        : numericValue,
      numericRevealed: revealed && kind === "respuesta-corta",
      matchLeft: left,
      matchRight: right,
      feedback,
      liveMessage,
      canCheck: isAnswerProvided,
      resolved,
      finished: false,
    };
  }, [
    exercise,
    prepared,
    items.length,
    index,
    sessionStars,
    kind,
    selectedOption,
    revealed,
    resolvedCorrect,
    matchAnswer,
    pendingMatch,
    numericValue,
    feedback,
    liveMessage,
    isAnswerProvided,
    t,
  ]);

  const subjectsTried = useMemo<Materia[]>(
    () => [...new Set(items.map((p) => p.exercise.materia as Materia))],
    [items],
  );

  const summary: SessionSummary = useMemo(
    () => ({
      starsEarned: Math.ceil(sessionStars),
      correctByTopic,
      correctBySubject,
      materia,
      subjectsTried,
      newlyCorrectIds,
      failedIds,
    }),
    [sessionStars, correctByTopic, correctBySubject, materia, subjectsTried, newlyCorrectIds, failedIds],
  );

  return {
    view,
    selectOption,
    inputDigit,
    deleteDigit,
    selectMatch,
    check,
    next,
    summary,
  };
}

/* ------------------------------- helpers --------------------------------- */

type TFn = ReturnType<typeof useTranslation>["t"];

function labelForOption(exercise: EjercicioAny, optionId: string, t: TFn): string {
  if (esGenerado(exercise)) return optionId;
  const opt = exercise.opciones?.find((o) => o.id === optionId);
  return opt ? t(opt.textoKey) : optionId;
}

function buildPrompt(exercise: EjercicioAny, prepared: PreparedExercise, t: TFn): string {
  if (esGenerado(exercise) && prepared.math) {
    return t(exercise.plantillaKey, {
      a: prepared.math.a,
      b: prepared.math.b,
      op: prepared.math.operator,
    });
  }
  if (!esGenerado(exercise)) return t(exercise.enunciadoKey);
  return "";
}

function buildOptionVMs(
  exercise: EjercicioAny,
  selectedOption: string | null,
  revealed: boolean,
  resolvedCorrect: boolean,
  t: TFn,
): OptionVM[] {
  if (esGenerado(exercise) || !exercise.opciones) return [];
  const correct = exercise.respuestaCorrecta;
  const isCorrectId = (id: string) =>
    Array.isArray(correct) ? correct.includes(id) : correct === id;

  return exercise.opciones.map((o) => {
    let status: OptionStatus = "idle";
    const isSelected = selectedOption === o.id;
    if (resolvedCorrect && isSelected) status = "correct";
    else if (revealed && isCorrectId(o.id)) status = "correct-revealed";
    else if (revealed && isSelected) status = "incorrect";
    else if (isSelected) status = "selected";
    return {
      id: o.id,
      label: t(o.textoKey),
      status,
      checked: isSelected,
    };
  });
}

function buildMatchVMs(
  exercise: EjercicioAny,
  matchAnswer: MatchAnswer,
  pendingMatch: string | null,
  t: TFn,
): { left: MatchItem[]; right: MatchItem[] } {
  if (esGenerado(exercise) || exercise.tipo !== "emparejar" || !exercise.opciones) {
    return { left: [], right: [] };
  }
  const leftIds = matchLeftIds(exercise);
  const leftSet = new Set(leftIds);
  const rightTargets = Object.values(matchAnswer);

  const pairLabelFor = (sourceId: string) => {
    const i = leftIds.indexOf(sourceId);
    return i >= 0 ? String(i + 1) : undefined;
  };

  const left: MatchItem[] = exercise.opciones
    .filter((o) => leftSet.has(o.id))
    .map((o) => ({
      id: o.id,
      label: t(o.textoKey),
      selected: pendingMatch === o.id,
      matched: o.id in matchAnswer,
      pairLabel: o.id in matchAnswer ? pairLabelFor(o.id) : undefined,
    }));

  const right: MatchItem[] = exercise.opciones
    .filter((o) => !leftSet.has(o.id))
    .map((o) => {
      const sourceId = Object.entries(matchAnswer).find(([, r]) => r === o.id)?.[0];
      return {
        id: o.id,
        label: t(o.textoKey),
        selected: false,
        matched: rightTargets.includes(o.id),
        pairLabel: sourceId ? pairLabelFor(sourceId) : undefined,
      };
    });

  return { left, right };
}
