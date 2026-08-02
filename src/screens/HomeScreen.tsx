/*
 * HOME — la isla de verano (flujos §2).
 * Maqueta de estructura y estilos. Los datos (avatar, estrellas, racha, estado
 * de la misión) y los handlers de navegación los inyecta Frontend vía props.
 * Las cifras de ejemplo aquí son placeholders de maquetación.
 */
import { useTranslation } from "react-i18next";
import {
  PageLayout,
  Button,
  Mascot,
  StarCounter,
  StreakBadge,
  Icon,
} from "@/components";
import styles from "./HomeScreen.module.css";

type HomeScreenProps = {
  nickname?: string;
  courseLabel?: string;
  /** el curso activo tiene contenido; si no, se muestra el estado "Pronto" */
  contentReady?: boolean;
  totalStars?: number;
  streakDays?: number;
  streakVariant?: "normal" | "empty" | "reset";
  dailyGoalDone?: boolean;
  failedCount?: number;
  onStartDailyGoal?: () => void;
  onChooseSubject?: () => void;
  onReview?: () => void;
  onPrint?: () => void;
  onBackpack?: () => void;
  onSettings?: () => void;
};

export function HomeScreen({
  nickname = "Explorador",
  courseLabel,
  contentReady = true,
  totalStars = 0,
  streakDays = 0,
  streakVariant = "empty",
  dailyGoalDone = false,
  failedCount = 0,
  onStartDailyGoal,
  onChooseSubject,
  onReview,
  onPrint,
  onBackpack,
  onSettings,
}: HomeScreenProps) {
  const { t } = useTranslation(["home", "common"]);

  return (
    <PageLayout
      width="wide"
      header={
        <div className={styles.topbar}>
          <button type="button" className={styles.profile} onClick={onBackpack}>
            <Mascot expression="idle" size="xs" />
            <span className={styles.nickname}>{nickname}</span>
          </button>
          <div className={styles.stats}>
            <StreakBadge days={streakDays} variant={streakVariant} />
            <StarCounter count={totalStars} />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common:nav.settings")}
              onClick={onSettings}
            >
              <Icon name="settings" size={26} aria-hidden="true" />
            </Button>
          </div>
        </div>
      }
    >
      <h1 className={styles.welcome}>{t("home:welcome.title")}</h1>
      {courseLabel ? <p className={styles.courseTag}>{courseLabel}</p> : null}

      <section className={styles.hero} aria-labelledby="daily-goal-title">
        <Mascot expression="happy" size="md" />
        <div className={styles.heroBody}>
          {!contentReady ? (
            <>
              <h2 id="daily-goal-title" className={styles.heroTitle}>
                {t("home:comingSoon.title")}
              </h2>
              <p className={styles.heroDesc}>
                {t("home:comingSoon.desc", { course: courseLabel })}
              </p>
            </>
          ) : (
            <>
              <h2 id="daily-goal-title" className={styles.heroTitle}>
                {t("home:dailyGoal.title")}
              </h2>
              <p className={styles.heroDesc}>{t("home:dailyGoal.desc")}</p>
              {dailyGoalDone ? (
                <p className={styles.doneTag}>
                  <Icon name="check" size={24} aria-hidden="true" />
                  {t("home:dailyGoal.done")}
                </p>
              ) : (
                <Button variant="primary" size="lg" onClick={onStartDailyGoal}>
                  {t("home:dailyGoal.start")}
                </Button>
              )}
            </>
          )}
        </div>
      </section>

      <nav className={styles.accesses} aria-label={t("common:nav.menu.backpack")}>
        <Button variant="secondary" size="lg" onClick={onChooseSubject}>
          {t("home:play.chooseSubject")}
        </Button>
        {failedCount > 0 && onReview && (
          <Button variant="secondary" size="lg" onClick={onReview}>
            <Icon name="retry" size={26} aria-hidden="true" />
            {t("home:review.button", { count: failedCount })}
          </Button>
        )}
        <Button variant="secondary" size="lg" onClick={onPrint}>
          {t("home:print.enter")}
        </Button>
        <Button variant="ghost" size="lg" onClick={onBackpack}>
          <Icon name="backpack" size={26} aria-hidden="true" />
          {t("common:nav.menu.backpack")}
        </Button>
      </nav>
    </PageLayout>
  );
}
