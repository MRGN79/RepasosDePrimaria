/*
 * Contenedor de sesión: conecta useSession (motor) con SessionScreen (maqueta).
 * Gestiona la confirmación de salida, el anuncio aria-live y, al terminar,
 * consolida la sesión (estrellas/racha/medallas) y muestra Resultados.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SessionScreen } from "./SessionScreen";
import { ResultsScreen } from "./ResultsScreen";
import { Feedback, CelebrationModal, Button } from "@/components";
import type { Materia, Nivel } from "@content/types";
import { useSession } from "@/hooks/useSession";
import { useGameStore } from "@/state/gameContext";
import type { ConsolidationResult } from "@/state/consolidation";
import { badgeDef } from "@/lib/badges";
import type { PreparedExercise } from "@/lib/session";

type SessionContainerProps = {
  curso: Nivel;
  materia: Materia;
  tema: string | null;
  isDailyGoal: boolean;
  prebuilt?: PreparedExercise[];
  onExit: () => void;
  onHome: () => void;
  onPlayAgain: () => void;
};

export function SessionContainer({
  curso,
  materia,
  tema,
  isDailyGoal,
  prebuilt,
  onExit,
  onHome,
  onPlayAgain,
}: SessionContainerProps) {
  const { t } = useTranslation(["quiz", "results", "common", "content"]);
  const { consolidateSession, state } = useGameStore();

  // Captura los IDs ya dominados al montar (antes de ganar más en esta sesión)
  const excludeIds = useRef(new Set(state.progress.correctExerciseIds)).current;

  const {
    view,
    selectOption,
    inputDigit,
    deleteDigit,
    selectMatch,
    check,
    next,
    summary,
  } = useSession(curso, materia, tema, undefined, prebuilt, excludeIds);

  const [confirmExit, setConfirmExit] = useState(false);
  const [result, setResult] = useState<ConsolidationResult | null>(null);
  const consolidated = useRef(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Al terminar la secuencia, consolidar una sola vez.
  useEffect(() => {
    if (view?.finished && !consolidated.current) {
      consolidated.current = true;
      const r = consolidateSession({
        starsEarned: summary.starsEarned,
        correctByTopic: summary.correctByTopic,
        correctBySubject: summary.correctBySubject,
        subjectsTried: summary.subjectsTried,
        newlyCorrectIds: summary.newlyCorrectIds,
        newlyFailedIds: summary.failedIds,
        isDailyGoal,
      });
      setResult(r);
    }
  }, [view?.finished, consolidateSession, summary, materia, isDailyGoal]);

  // Avance automático tras resolver: ~3.5 s en acierto, ~5 s en revelación.
  const resolvedKey = view?.resolved && !view?.finished;
  const feedbackKind = view?.feedback?.kind;
  useEffect(() => {
    if (!resolvedKey) {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
      return;
    }
    const delay = feedbackKind === "correct" ? 3500 : 5000;
    autoAdvanceTimer.current = setTimeout(() => {
      next();
    }, delay);
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
    };
  }, [resolvedKey, feedbackKind, next]);

  const handleExit = useCallback(() => setConfirmExit(true), []);

  if (view?.finished && result) {
    const newBadgeId = result.newBadgeIds[0];
    const def = newBadgeId ? badgeDef(newBadgeId) : undefined;
    return (
      <ResultsScreen
        starsEarned={summary.starsEarned}
        streakDays={result.streakDays}
        streakFirst={result.streakOutcome === "first"}
        newBadge={def ? { name: t(def.nameKey), colorToken: def.colorToken } : null}
        dailyGoalDone={isDailyGoal}
        onPlayAgain={onPlayAgain}
        onHome={onHome}
      />
    );
  }

  if (!view) return null;

  return (
    <>
      <SessionScreen
        current={view.current}
        total={view.total}
        sessionStars={view.sessionStars}
        prompt={view.prompt}
        promptLang={view.promptLang}
        kind={view.kind}
        options={view.options}
        numericValue={view.numericValue}
        numericRevealed={view.numericRevealed}
        matchLeft={view.matchLeft}
        matchRight={view.matchRight}
        feedback={
          view.feedback ? (
            <Feedback kind={view.feedback.kind} message={view.feedback.message} />
          ) : undefined
        }
        canCheck={view.canCheck}
        resolved={view.resolved}
        onCheck={check}
        autoAdvanceMs={
          view.resolved && !view.finished
            ? view.feedback?.kind === "correct" ? 3500 : 5000
            : undefined
        }
        onNext={next}
        onSelectOption={selectOption}
        onDigit={inputDigit}
        onDelete={deleteDigit}
        onSelectMatch={selectMatch}
        onExit={handleExit}
      />

      {/* Anuncio aria-live del resultado / emparejado para lectores de pantalla */}
      <p className="tdp-visually-hidden" aria-live="polite">
        {view.liveMessage}
      </p>

      <CelebrationModal
        open={confirmExit}
        titleId="tdp-exit-confirm"
        title={t("quiz:session.exitConfirm.title")}
        closeLabel={t("quiz:session.exitConfirm.stay")}
        onClose={() => setConfirmExit(false)}
        actions={
          <>
            <Button variant="primary" size="lg" onClick={() => setConfirmExit(false)}>
              {t("quiz:session.exitConfirm.stay")}
            </Button>
            <Button variant="secondary" size="lg" onClick={onExit}>
              {t("quiz:session.exitConfirm.leave")}
            </Button>
          </>
        }
      />
    </>
  );
}
