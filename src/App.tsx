/*
 * App: router por estado local (sin react-router; las vistas son pocas y el
 * flujo es lineal). Compatible con hosting estático. Gobierna el gate de
 * onboarding, la navegación entre pantallas y la sincronización de preferencias
 * (idioma, movimiento reducido) con i18n y el DOM.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HomeScreen,
  SubjectSelectScreen,
  BackpackScreen,
} from "@/screens";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { PrivacyPolicyScreen } from "@/screens/PrivacyPolicyScreen";
import { SessionContainer } from "@/screens/SessionContainer";
import { PrintConfigScreen } from "@/screens/PrintConfigScreen";
import { PrintSheetScreen } from "@/screens/PrintSheetScreen";
import { CalligraphySheet } from "@/screens/CalligraphySheet";
import { pickCalligraphyJokes } from "@/lib/calligraphy";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { useGameStore } from "@/state/gameContext";
import { esGenerado, type Materia } from "@content/types";
import {
  buildSubjectVMs,
  buildTopicVMs,
  contentKeyFor,
  courseHasContent,
  courseLabelKey,
  type SubjectVM,
} from "@/lib/catalog";
import { exercisesByTopic, exerciseById } from "@content/registry";
import { buildPrintSheet, type PrintItem } from "@/lib/printSheet";
import { buildDailySession, buildReviewSession, DEFAULT_SESSION_LENGTH, type PreparedExercise } from "@/lib/session";
import { localDateKey, streakDisplayVariant } from "@/lib/streak";
import { nicknameKey, DEFAULT_NICKNAME, avatarById } from "@/lib/profile";
import { BADGES } from "@/lib/badges";

type Route =
  | { name: "home" }
  | { name: "subjects" }
  | { name: "session"; materia: Materia; tema: string | null; isDailyGoal: boolean; prebuilt?: PreparedExercise[] }
  | { name: "backpack" }
  | { name: "settings" }
  | { name: "privacyPolicy" }
  | { name: "editProfile" }
  | { name: "print" }
  | { name: "printSheet"; materia: Materia; tema: string | null }
  | { name: "calligraphySheet"; jokeKeys: string[] };

function formatBadgeDate(dateKey: string, lang: "en" | "es"): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const locale = lang === "es" ? "es-ES" : "en-GB";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

interface AppProps {
  /**
   * Sección "Cuenta" de Ajustes (US-E8). Presente solo con nube activa y sesión;
   * ausente ⟹ la sección no se renderiza (modo local no tiene cuenta). Se reenvía
   * tal cual a SettingsScreen. `onSwitchAccount` vive en AppRoot (cierre de sesión).
   */
  account?: { onSwitchAccount: () => void };
}

export function App({ account }: AppProps = {}) {
  const { t, i18n } = useTranslation(["common", "content", "backpack"]);
  const store = useGameStore();
  const { state, removeFailedExerciseIds } = store;

  const [route, setRoute] = useState<Route>({ name: "home" });
  // materia seleccionada en flujos de 2 niveles (subjects / print)
  const [selectedSubject, setSelectedSubject] = useState<Materia | null>(null);
  const [includeSolutions, setIncludeSolutions] = useState(true);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);

  // Los IDs de ejercicios retirados entre versiones quedan huérfanos en
  // localStorage y corrompen el pool de repaso indefinidamente si no se limpian.
  useEffect(() => {
    const staleIds = state.progress.failedExerciseIds.filter(
      (id) => exerciseById(id) === undefined,
    );
    if (staleIds.length > 0) removeFailedExerciseIds(staleIds);
  }, [state.progress.failedExerciseIds, removeFailedExerciseIds]);

  // Sincroniza idioma elegido con i18n (si el usuario lo fijó explícitamente)
  // y refleja el idioma activo en <html lang> para los lectores de pantalla
  // (WCAG 3.1.1).
  useEffect(() => {
    if (state.preferences.language && i18n.language !== state.preferences.language) {
      void i18n.changeLanguage(state.preferences.language);
    }
    document.documentElement.lang = state.preferences.language ?? i18n.language;
  }, [state.preferences.language, i18n.language, i18n]);

  // Sincroniza el toggle de movimiento reducido con el DOM (lo lee base.css).
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = state.preferences.reducedMotion
      ? "true"
      : "false";
  }, [state.preferences.reducedMotion]);

  // Sin esto, "hecho hoy" y la racha se quedan calculados con la fecha del
  // último render si la pantalla se deja abierta cruzando la medianoche.
  const [today, setToday] = useState(() => localDateKey());
  useEffect(() => {
    let timerId: number;
    const scheduleNext = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timerId = window.setTimeout(() => {
        setToday(localDateKey());
        scheduleNext();
      }, nextMidnight.getTime() - now.getTime());
    };
    scheduleNext();
    return () => window.clearTimeout(timerId);
  }, []);

  const goHome = useCallback(() => {
    setSelectedSubject(null);
    setRoute({ name: "home" });
  }, []);

  // Botón atrás de Android: fuera de Home vuelve a Home; en Home permite salir.
  useAndroidBackButton(route.name === "home", goHome);

  const curso = store.currentCourse;
  const contentReady = courseHasContent(curso);
  const courseLabel = t(courseLabelKey(curso));

  const subjectVMs = useMemo<SubjectVM[]>(() => buildSubjectVMs(curso, t), [curso, t]);

  const subjectProgress = useMemo(() => {
    const triedSet = new Set(state.progress.subjectsTried);
    return subjectVMs
      .filter((s) => triedSet.has(s.id))
      .map((s) => ({
        id: s.id,
        title: s.title,
        colorToken: s.colorToken,
        topics: buildTopicVMs(curso, s.id, t)
          .filter((tp) => !tp.soon)
          .flatMap((tp) => {
            const exercises = exercisesByTopic(curso, s.id, tp.id);
            if (exercises.every(esGenerado)) return [];
            const total = exercises.length;
            return [{
              id: tp.id,
              title: tp.title,
              mastered: Math.min(state.progress.correctByTopic[tp.id] ?? 0, total),
              total,
            }];
          }),
      }))
      .filter((s) => s.topics.length > 0);
  }, [curso, subjectVMs, state.progress.correctByTopic, state.progress.subjectsTried, t]);

  const currentLanguage: "en" | "es" =
    (state.preferences.language ?? i18n.language) === "es" ? "es" : "en";

  const badgeVMs = useMemo(
    () =>
      BADGES.map((b) => {
        const unlockedOn = state.badges.unlocked[b.id];
        return {
          id: b.id,
          name: t(b.nameKey),
          hint: t(b.hintKey),
          locked: !unlockedOn,
          unlockedOn: unlockedOn ? formatBadgeDate(unlockedOn, currentLanguage) : undefined,
          colorToken: b.colorToken,
        };
      }),
    [state.badges.unlocked, t, currentLanguage],
  );

  const dailyGoalDoneToday = state.dailyGoal.lastDoneDate === today;
  const streakVariant = streakDisplayVariant(state.streak);
  const nickname = state.profile.nicknameCustom
    ? state.profile.nicknameCustom
    : t(nicknameKey(state.profile.nicknameId));

  /* ------------------------------ onboarding ------------------------------ */
  if (!store.hasProfile) {
    return (
      <OnboardingScreen
        showCourseStep
        initialCourse={curso}
        onComplete={(avatarId, nicknameId, nicknameCustom, chosenCourse) => {
          if (chosenCourse && chosenCourse !== curso) store.setCourse(chosenCourse);
          store.setProfile(avatarId, nicknameId ?? DEFAULT_NICKNAME, nicknameCustom ?? null);
          setRoute({ name: "home" });
        }}
      />
    );
  }

  /* -------------------------------- routes -------------------------------- */

  if (route.name === "home") {
    return (
      <HomeScreen
        nickname={nickname}
        courseLabel={courseLabel}
        contentReady={contentReady}
        totalStars={state.stars.total}
        streakDays={state.streak.current}
        streakVariant={streakVariant}
        dailyGoalDone={dailyGoalDoneToday}
        onStartDailyGoal={() => {
          if (!contentReady) return;
          const excludeIds = new Set(state.progress.correctExerciseIds);
          const prebuilt = buildDailySession(curso, 3, Math.random, excludeIds);
          if (prebuilt.length === 0) return;
          setRoute({
            name: "session",
            materia: "matematicas",
            tema: null,
            isDailyGoal: true,
            prebuilt,
          });
        }}
        onChooseSubject={() => {
          setSelectedSubject(null);
          setRoute({ name: "subjects" });
        }}
        failedCount={state.progress.failedExerciseIds.length}
        onReview={() => {
          const allIds = state.progress.failedExerciseIds;
          const staleIds = allIds.filter((id) => exerciseById(id) === undefined);
          if (staleIds.length > 0) removeFailedExerciseIds(staleIds);
          const validIds = allIds.filter((id) => exerciseById(id) !== undefined);
          if (validIds.length === 0) return;
          setRoute({
            name: "session",
            materia: "matematicas",
            tema: null,
            isDailyGoal: false,
            prebuilt: buildReviewSession(validIds, DEFAULT_SESSION_LENGTH, Math.random),
          });
        }}
        onPrint={() => {
          setSelectedSubject(null);
          setRoute({ name: "print" });
        }}
        onBackpack={() => setRoute({ name: "backpack" })}
        onSettings={() => setRoute({ name: "settings" })}
      />
    );
  }

  if (route.name === "subjects") {
    const topics = selectedSubject ? buildTopicVMs(curso, selectedSubject, t) : null;
    const selectedTitle = selectedSubject
      ? t(`content:${contentKeyFor(selectedSubject)}.title`)
      : undefined;
    return (
      <SubjectSelectScreen
        subjects={subjectVMs}
        topics={topics}
        selectedSubjectTitle={selectedTitle}
        onSelectSubject={(id) => setSelectedSubject(id as Materia)}
        onSelectTopic={(tema) =>
          selectedSubject &&
          setRoute({ name: "session", materia: selectedSubject, tema, isDailyGoal: false })
        }
        onBack={() => (selectedSubject ? setSelectedSubject(null) : goHome())}
        onHome={goHome}
      />
    );
  }

  if (route.name === "session") {
    return (
      <SessionContainer
        curso={curso}
        materia={route.materia}
        tema={route.tema}
        isDailyGoal={route.isDailyGoal}
        prebuilt={route.prebuilt}
        onExit={goHome}
        onHome={goHome}
        onPlayAgain={() => {
          setSelectedSubject(null);
          setRoute({ name: "subjects" });
        }}
      />
    );
  }

  if (route.name === "backpack") {
    return (
      <BackpackScreen
        nickname={nickname}
        totalStars={state.stars.total}
        currentStreak={state.streak.current}
        bestStreak={state.streak.longest}
        badges={badgeVMs}
        subjectProgress={subjectProgress}
        onHome={goHome}
      />
    );
  }

  if (route.name === "settings") {
    return (
      <SettingsScreen
        course={curso}
        language={currentLanguage}
        sound={state.preferences.sound}
        reducedMotion={state.preferences.reducedMotion}
        onCourse={(c) => {
          store.setCourse(c);
          setSelectedSubject(null);
        }}
        onLanguage={store.setLanguage}
        onSound={store.setSound}
        onReducedMotion={store.setReducedMotion}
        onEditProfile={() => setRoute({ name: "editProfile" })}
        onPrivacy={() => setRoute({ name: "privacyPolicy" })}
        onClearData={() => {
          store.clearData();
          setRoute({ name: "home" });
        }}
        onHome={goHome}
        onBack={goHome}
        account={account}
      />
    );
  }

  if (route.name === "privacyPolicy") {
    return (
      <PrivacyPolicyScreen
        onBack={() => setRoute({ name: "settings" })}
        onHome={goHome}
      />
    );
  }

  if (route.name === "editProfile") {
    return (
      <OnboardingScreen
        editMode
        initialAvatarId={state.profile.avatarId}
        initialNicknameId={state.profile.nicknameId}
        initialNicknameCustom={state.profile.nicknameCustom}
        onComplete={(avatarId, nicknameId, nicknameCustom) => {
          store.setProfile(avatarId, nicknameId, nicknameCustom);
          setRoute({ name: "settings" });
        }}
      />
    );
  }

  if (route.name === "print") {
    const topics = selectedSubject ? buildTopicVMs(curso, selectedSubject, t) : null;
    const selectedTitle = selectedSubject
      ? t(`content:${contentKeyFor(selectedSubject)}.title`)
      : undefined;
    return (
      <PrintConfigScreen
        subjects={subjectVMs}
        topics={topics}
        selectedSubjectTitle={selectedTitle}
        includeSolutions={includeSolutions}
        onSelectSubject={(id) => setSelectedSubject(id as Materia)}
        onSelectTopic={(tema) => {
          if (!selectedSubject) return;
          setPrintItems(buildPrintSheet(curso, selectedSubject, tema));
          setRoute({ name: "printSheet", materia: selectedSubject, tema });
        }}
        onToggleSolutions={setIncludeSolutions}
        onCreate={() => {
          if (!selectedSubject) return;
          setPrintItems(buildPrintSheet(curso, selectedSubject, null));
          setRoute({ name: "printSheet", materia: selectedSubject, tema: null });
        }}
        canCreate={selectedSubject !== null}
        onCalligraphy={() =>
          setRoute({ name: "calligraphySheet", jokeKeys: pickCalligraphyJokes(3, Math.random) })
        }
        onBack={() => (selectedSubject ? setSelectedSubject(null) : goHome())}
        onHome={goHome}
      />
    );
  }

  if (route.name === "calligraphySheet") {
    return (
      <CalligraphySheet
        jokeKeys={route.jokeKeys}
        onBack={() => setRoute({ name: "print" })}
        onHome={goHome}
      />
    );
  }

  if (route.name === "printSheet") {
    const subjectTitle = t(`content:${contentKeyFor(route.materia)}.title`);
    const topicTitle = route.tema
      ? buildTopicVMs(curso, route.materia, t).find((tp) => tp.id === route.tema)?.title ?? subjectTitle
      : t("content:label.surpriseMix");
    return (
      <PrintSheetScreen
        subjectTitle={subjectTitle}
        topicTitle={topicTitle}
        items={printItems}
        includeSolutions={includeSolutions}
        nickname={nickname}
        avatarEmoji={avatarById(state.profile.avatarId).emoji}
        onBack={() => setRoute({ name: "print" })}
        onHome={goHome}
      />
    );
  }

  return null;
}
