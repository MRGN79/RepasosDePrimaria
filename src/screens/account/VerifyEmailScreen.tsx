/*
 * Verificación de email obligatoria del tutor (ADR-003 §2). Hasta que el correo
 * está verificado, las reglas de Firestore no permiten escribir. Google Sign-In
 * llega con email verificado por construcción, así que esta pantalla es para la
 * ruta email/contraseña.
 */
import { useTranslation } from "react-i18next";
import { PageLayout, Button } from "@/components";
import styles from "./account.module.css";

interface VerifyEmailScreenProps {
  onRecheck: () => void;
  onResend: () => void;
  onSignOut: () => void;
  busy?: boolean;
  infoKey?: string | null;
  showStillPending?: boolean;
}

export function VerifyEmailScreen({
  onRecheck,
  onResend,
  onSignOut,
  busy = false,
  infoKey,
  showStillPending,
}: VerifyEmailScreenProps) {
  const { t } = useTranslation("account");
  return (
    <PageLayout width="narrow">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t("verify.title")}</h1>
        <p className={styles.subtitle}>{t("verify.body")}</p>

        {showStillPending ? (
          <p className={styles.error} role="alert">
            {t("verify.stillPending")}
          </p>
        ) : null}
        {infoKey ? (
          <p className={styles.info} role="status">
            {t(infoKey.replace(/^account:/, ""))}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button variant="primary" size="lg" disabled={busy} onClick={onRecheck}>
            {t("verify.recheck")}
          </Button>
          <Button variant="ghost" size="md" disabled={busy} onClick={onResend}>
            {t("verify.resend")}
          </Button>
          <Button variant="ghost" size="md" onClick={onSignOut}>
            {t("verify.signOut")}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
