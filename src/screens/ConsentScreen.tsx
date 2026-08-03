/*
 * Pantalla de consentimiento informado del tutor (ADR-003 §2, US-B2, Inc. 2).
 * Explica en lenguaje claro qué se guarda en la nube y qué NO, antes de activar
 * el guardado. Presentacional: recibe los manejadores. Textos vía i18n ("auth").
 *
 * El texto legal definitivo y el enlace a la política de privacidad los valida
 * el Abogado y viajan con el cambio que activa la nube (Inc. 6).
 */
import { useTranslation } from "react-i18next";
import { PageLayout, Button } from "@/components";
import styles from "./ConsentScreen.module.css";

interface ConsentScreenProps {
  onAccept: () => void;
  onDecline: () => void;
  onPrivacy: () => void;
  /** muestra el aviso de que hace falta consentimiento (tras un intento sin aceptar). */
  showMustAccept?: boolean;
}

export function ConsentScreen({ onAccept, onDecline, onPrivacy, showMustAccept }: ConsentScreenProps) {
  const { t } = useTranslation("auth");
  return (
    <PageLayout width="narrow">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t("consent.title")}</h1>
        <p className={styles.intro}>{t("consent.intro")}</p>

        <section className={styles.block} aria-labelledby="consent-stored">
          <h2 id="consent-stored" className={styles.blockTitle}>
            {t("consent.storedTitle")}
          </h2>
          <ul className={styles.list}>
            <li>{t("consent.storedAccount")}</li>
            <li>{t("consent.storedProgress")}</li>
          </ul>
        </section>

        <section className={`${styles.block} ${styles.blockNot}`} aria-labelledby="consent-not">
          <h2 id="consent-not" className={styles.blockTitle}>
            {t("consent.notStoredTitle")}
          </h2>
          <ul className={styles.list}>
            <li>{t("consent.notStoredChild")}</li>
            <li>{t("consent.notStoredPin")}</li>
          </ul>
        </section>

        <button type="button" className={styles.privacyLink} onClick={onPrivacy}>
          {t("consent.privacyLink")}
        </button>

        {showMustAccept ? (
          <p className={styles.mustAccept} role="alert">
            {t("consent.mustAccept")}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={onAccept}>
            {t("consent.accept")}
          </Button>
          <Button variant="ghost" size="md" onClick={onDecline}>
            {t("consent.decline")}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
