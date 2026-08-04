/*
 * Paso explícito de rol tras Google Sign-In (ADR-004 §1): "¿esta cuenta la vas a
 * usar tú, la persona adulta, o es la cuenta de tu hijo/a?". Fija el rol ANTES
 * de crear el documento users/{uid}. La rama "soy el adulto" la protege luego un
 * reto de adulto (lo aplica AppRoot); la rama "es mi hijo/a" no lleva reto.
 */
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components";
import styles from "./account.module.css";

interface RoleChoiceScreenProps {
  onTutor: () => void;
  onKid: () => void;
}

export function RoleChoiceScreen({ onTutor, onKid }: RoleChoiceScreenProps) {
  const { t } = useTranslation("account");
  return (
    <PageLayout width="narrow">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t("google.roleTitle")}</h1>
        <p className={styles.subtitle}>{t("google.roleSubtitle")}</p>
        <ul className={styles.choices} role="list">
          <li>
            <button type="button" className={styles.bigChoice} onClick={onTutor}>
              <span className={styles.choiceTitle}>{t("google.adult")}</span>
              <span className={styles.choiceHint}>{t("chooser.tutorHint")}</span>
            </button>
          </li>
          <li>
            <button type="button" className={styles.bigChoice} onClick={onKid}>
              <span className={styles.choiceTitle}>{t("google.child")}</span>
              <span className={styles.choiceHint}>{t("chooser.kidHint")}</span>
            </button>
          </li>
        </ul>
      </div>
    </PageLayout>
  );
}
