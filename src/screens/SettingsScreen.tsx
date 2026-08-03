/*
 * AJUSTES — idioma, sonido, perfil y datos (flujos §8).
 * El contenido de Lengua/Inglés/Natural Science no se traduce (D-1, D-5).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageLayout, AppHeader, ToggleSwitch, Button, Icon } from "@/components";
import { COURSES, type Language, type Curso } from "@/lib/storage";
import { courseLabelKey } from "@/lib/catalog";
import styles from "./SettingsScreen.module.css";

type SettingsScreenProps = {
  course: Curso;
  language: Language;
  sound: boolean;
  reducedMotion: boolean;
  onCourse: (course: Curso) => void;
  onLanguage: (lang: Language) => void;
  onSound: (on: boolean) => void;
  onReducedMotion: (on: boolean) => void;
  onEditProfile: () => void;
  onPrivacy: () => void;
  onClearData: () => void;
  onHome: () => void;
  onBack: () => void;
};

export function SettingsScreen({
  course,
  language,
  sound,
  reducedMotion,
  onCourse,
  onLanguage,
  onSound,
  onReducedMotion,
  onEditProfile,
  onPrivacy,
  onClearData,
  onHome,
  onBack,
}: SettingsScreenProps) {
  const { t } = useTranslation(["settings", "content", "common", "legal"]);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <PageLayout
      width="narrow"
      header={<AppHeader title={t("settings:title")} onBack={onBack} onHome={onHome} />}
    >
      <div className={styles.root}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t("settings:course.label")}</legend>
          <p className={styles.help}>{t("settings:course.help")}</p>
          <div className={styles.courseRow} role="radiogroup" aria-label={t("settings:course.label")}>
            {COURSES.map((c) => (
              <Button
                key={c}
                variant={course === c ? "primary" : "secondary"}
                size="lg"
                onClick={() => onCourse(c)}
                aria-pressed={course === c}
              >
                {course === c ? <Icon name="check" size={22} aria-hidden="true" /> : null}
                {t(courseLabelKey(c))}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t("settings:language.label")}</legend>
          <div className={styles.langRow} role="radiogroup" aria-label={t("settings:language.label")}>
            <Button
              variant={language === "es" ? "primary" : "secondary"}
              size="lg"
              onClick={() => onLanguage("es")}
              aria-pressed={language === "es"}
            >
              {language === "es" ? <Icon name="check" size={22} aria-hidden="true" /> : null}
              {t("settings:language.es")}
            </Button>
            <Button
              variant={language === "en" ? "primary" : "secondary"}
              size="lg"
              onClick={() => onLanguage("en")}
              aria-pressed={language === "en"}
            >
              {language === "en" ? <Icon name="check" size={22} aria-hidden="true" /> : null}
              {t("settings:language.en")}
            </Button>
          </div>
        </fieldset>

        <ToggleSwitch
          checked={sound}
          label={t("settings:sound.label")}
          stateLabel={sound ? t("settings:sound.on") : t("settings:sound.off")}
          onToggle={() => onSound(!sound)}
        />

        <ToggleSwitch
          checked={reducedMotion}
          label={t("settings:reducedMotion.label")}
          stateLabel={reducedMotion ? t("settings:reducedMotion.on") : t("settings:reducedMotion.off")}
          onToggle={() => onReducedMotion(!reducedMotion)}
        />

        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t("settings:profile.label")}</legend>
          <Button variant="secondary" size="lg" onClick={onEditProfile}>
            {t("settings:profile.edit")}
          </Button>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t("settings:about.label")}</legend>
          <Button variant="secondary" size="lg" onClick={onPrivacy}>
            {t("settings:about.privacy")}
          </Button>
        </fieldset>

        <fieldset className={[styles.group, styles.dangerGroup].join(" ")}>
          <legend className={styles.legend}>{t("settings:clearData.label")}</legend>
          {confirmClear ? (
            <div className={styles.confirmBox}>
              <p className={styles.confirmText}>{t("settings:clearData.confirmBody")}</p>
              <div className={styles.confirmActions}>
                <Button variant="secondary" size="lg" onClick={() => setConfirmClear(false)}>
                  {t("settings:clearData.cancel")}
                </Button>
                <Button variant="primary" size="lg" onClick={onClearData}>
                  {t("settings:clearData.confirmButton")}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="lg" onClick={() => setConfirmClear(true)}>
              {t("settings:clearData.label")}
            </Button>
          )}
        </fieldset>
      </div>
    </PageLayout>
  );
}
