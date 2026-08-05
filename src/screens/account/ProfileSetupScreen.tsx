/*
 * Alta mínima de perfil para la nube (ADR-004 §3): avatar y apodo de CATÁLOGO
 * CERRADO (sin texto libre identificante) + curso. Se usa para crear el primer
 * perfil de hijo del tutor y para configurar el perfil de la cuenta de niño.
 * El apodo (mote) es un id de catálogo; nunca texto escrito a mano.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageLayout, Button, Icon } from "@/components";
import { AVATARS, NICKNAMES, DEFAULT_AVATAR, DEFAULT_NICKNAME } from "@/lib/profile";
import { COURSES, DEFAULT_COURSE, type Curso } from "@/lib/storage";
import { courseLabelKey } from "@/lib/catalog";
import styles from "./account.module.css";

interface ProfileSetupScreenProps {
  variant: "tutorChild" | "kid";
  initialCourse?: Curso;
  busy?: boolean;
  errorKey?: string | null;
  /**
   * Muestra el aviso de migración encima de "Crear" (US-E1/E5). Lo evalúa
   * AppRoot leyendo `storage.ts`; degrada a `false` si no hay progreso local con
   * avance real o `localStorage` no está disponible (US-E7).
   */
  showMigrationNotice?: boolean;
  /** Nº de cursos con avance real; `>1` activa la línea `multiCourse`. */
  migrationCourseCount?: number;
  onCreate: (profile: { mote: string; avatar: string; currentCourse: Curso }) => void;
}

export function ProfileSetupScreen({
  variant,
  initialCourse,
  busy = false,
  errorKey,
  showMigrationNotice = false,
  migrationCourseCount = 0,
  onCreate,
}: ProfileSetupScreenProps) {
  const { t } = useTranslation(["account", "onboarding", "content"]);
  const [course, setCourse] = useState<Curso>(initialCourse ?? DEFAULT_COURSE);
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [mote, setMote] = useState<string>(DEFAULT_NICKNAME);

  const title = variant === "kid" ? t("account:profileSetup.kidTitle") : t("account:profileSetup.tutorTitle");

  return (
    <PageLayout width="wide">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{title}</h1>

        <section aria-labelledby="ps-course">
          <h2 id="ps-course" className={styles.label}>
            {t("account:profileSetup.course")}
          </h2>
          <ul className={styles.chips} role="list">
            {COURSES.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  className={`${styles.chip} ${course === c ? styles.selected : ""}`}
                  aria-pressed={course === c}
                  onClick={() => setCourse(c)}
                >
                  {t(courseLabelKey(c))}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ps-avatar">
          <h2 id="ps-avatar" className={styles.label}>
            {t("account:profileSetup.avatar")}
          </h2>
          <ul className={styles.grid} role="list">
            {AVATARS.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={`${styles.avatarChoice} ${avatar === a.id ? styles.selected : ""}`}
                  aria-pressed={avatar === a.id}
                  onClick={() => setAvatar(a.id)}
                >
                  <span className={styles.avatarEmoji} aria-hidden="true">
                    {a.emoji}
                  </span>
                  <span className={styles.avatarName}>{t(a.nameKey)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ps-nick">
          <h2 id="ps-nick" className={styles.label}>
            {t("account:profileSetup.nickname")}
          </h2>
          <ul className={styles.chips} role="list">
            {NICKNAMES.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`${styles.chip} ${mote === n.id ? styles.selected : ""}`}
                  aria-pressed={mote === n.id}
                  onClick={() => setMote(n.id)}
                >
                  {t(n.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {showMigrationNotice ? (
          <aside
            className={styles.migrationNotice}
            role="note"
            aria-labelledby="ps-migration-title"
          >
            <span className={styles.migrationNoticeIcon} aria-hidden="true">
              <Icon name="cloud" size={28} />
            </span>
            <div className={styles.migrationNoticeBody}>
              <h2 id="ps-migration-title" className={styles.migrationNoticeTitle}>
                {t("account:profileSetup.migrationNotice.title")}
              </h2>
              <p className={styles.migrationNoticeText}>
                {t("account:profileSetup.migrationNotice.body")}
              </p>
              {migrationCourseCount > 1 ? (
                <p className={styles.migrationNoticeText}>
                  {t("account:profileSetup.migrationNotice.multiCourse")}
                </p>
              ) : null}
            </div>
          </aside>
        ) : null}

        {errorKey ? (
          <p className={styles.error} role="alert">
            {t(errorKey.replace(/^account:/, ""))}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            disabled={busy}
            onClick={() => onCreate({ mote, avatar, currentCourse: course })}
          >
            {t("account:profileSetup.create")}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
