/*
 * ONBOARDING — elegir avatar y apodo (flujos §1). Solo en el primer arranque,
 * o en modo edición (desde Ajustes). Lista CERRADA de avatares + apodo libre.
 * Selección por toque/teclado; estado por borde + ✓, no solo color.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageLayout, Button, Mascot, Icon } from "@/components";
import { AVATARS, NICKNAMES, DEFAULT_AVATAR, DEFAULT_NICKNAME } from "@/lib/profile";
import { COURSES, DEFAULT_COURSE, type Curso } from "@/lib/storage";
import { courseLabelKey } from "@/lib/catalog";
import styles from "./OnboardingScreen.module.css";

const MAX_NICKNAME_LENGTH = 20;

type OnboardingScreenProps = {
  editMode?: boolean;
  /** muestra el paso de elegir curso (sólo en el primer arranque) */
  showCourseStep?: boolean;
  initialCourse?: Curso;
  initialAvatarId?: string | null;
  initialNicknameId?: string | null;
  initialNicknameCustom?: string | null;
  onComplete: (
    avatarId: string,
    nicknameId: string | null,
    nicknameCustom: string | null,
    course?: Curso,
  ) => void;
};

export function OnboardingScreen({
  editMode = false,
  showCourseStep = false,
  initialCourse,
  initialAvatarId,
  initialNicknameId,
  initialNicknameCustom,
  onComplete,
}: OnboardingScreenProps) {
  const { t } = useTranslation(["onboarding", "content", "common"]);
  const [course, setCourse] = useState<Curso>(initialCourse ?? DEFAULT_COURSE);
  const [avatar, setAvatar] = useState<string | null>(initialAvatarId ?? null);
  const [nickname, setNickname] = useState<string | null>(initialNicknameId ?? null);
  const [nicknameCustom, setNicknameCustom] = useState(initialNicknameCustom ?? "");

  const handleCustomInput = (value: string) => {
    const filtered = value.replace(/[<>"&]/g, "").slice(0, MAX_NICKNAME_LENGTH);
    setNicknameCustom(filtered);
    if (filtered.trim()) setNickname(null);
  };

  const handleChipSelect = (id: string) => {
    setNickname(id);
    setNicknameCustom("");
  };

  const chosenCourse = showCourseStep ? course : undefined;

  const finish = (skip: boolean) => {
    if (skip) {
      onComplete(DEFAULT_AVATAR, DEFAULT_NICKNAME, null, chosenCourse);
      return;
    }
    const customTrimmed = nicknameCustom.trim();
    if (customTrimmed) {
      onComplete(avatar ?? DEFAULT_AVATAR, null, customTrimmed, chosenCourse);
    } else {
      onComplete(avatar ?? DEFAULT_AVATAR, nickname ?? DEFAULT_NICKNAME, null, chosenCourse);
    }
  };

  return (
    <PageLayout width="wide">
      <div className={styles.root}>
        <Mascot expression="happy" size="md" />

        {showCourseStep ? (
          <section aria-labelledby="ob-course" className={styles.step}>
            <h2 id="ob-course" className={styles.heading}>
              {t("onboarding:course.heading")}
            </h2>
            <ul className={styles.chips} role="list">
              {COURSES.map((c) => {
                const selected = course === c;
                return (
                  <li key={c}>
                    <button
                      type="button"
                      className={[styles.chip, selected ? styles.selected : ""]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={selected}
                      onClick={() => setCourse(c)}
                    >
                      {selected ? <Icon name="check" size={18} aria-hidden="true" /> : null}
                      {t(courseLabelKey(c))}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="ob-avatar" className={styles.step}>
          <h2 id="ob-avatar" className={styles.heading}>
            {t("onboarding:avatar.heading")}
          </h2>
          <ul className={styles.grid} role="list">
            {AVATARS.map((a) => {
              const selected = avatar === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className={[styles.choice, selected ? styles.selected : ""]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={selected}
                    onClick={() => setAvatar(a.id)}
                  >
                    <span className={styles.emoji} aria-hidden="true">
                      {a.emoji}
                    </span>
                    <span className={styles.choiceName}>{t(a.nameKey)}</span>
                    {selected ? (
                      <span className={styles.tick} aria-hidden="true">
                        <Icon name="check" size={20} />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="ob-nick" className={styles.step}>
          <h2 id="ob-nick" className={styles.heading}>
            {t("onboarding:nickname.heading")}
          </h2>
          <ul className={styles.chips} role="list">
            {NICKNAMES.map((n) => {
              const selected = nickname === n.id && !nicknameCustom;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={[styles.chip, selected ? styles.selected : ""]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={selected}
                    onClick={() => handleChipSelect(n.id)}
                  >
                    {selected ? (
                      <Icon name="check" size={18} aria-hidden="true" />
                    ) : null}
                    {t(n.labelKey)}
                  </button>
                </li>
              );
            })}
          </ul>
          <input
            type="text"
            className={styles.customInput}
            value={nicknameCustom}
            maxLength={MAX_NICKNAME_LENGTH}
            placeholder={t("onboarding:nickname.customPlaceholder")}
            aria-label={t("onboarding:nickname.customLabel")}
            onChange={(e) => handleCustomInput(e.target.value)}
          />
        </section>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={() => finish(false)}>
            {editMode ? t("onboarding:save") : t("onboarding:continue")}
          </Button>
          {!editMode ? (
            <Button variant="ghost" size="lg" onClick={() => finish(true)}>
              {t("onboarding:skip")}
            </Button>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
