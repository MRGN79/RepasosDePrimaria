/*
 * Pantalla de acceso del tutor (ADR-003 §2, Inc. 2). Presentacional: recibe el
 * modo y los manejadores; no llama a Firebase directamente (eso lo hace quien la
 * conecta, vía useTutorAuth). Solo el tutor tiene cuenta; el niño nunca.
 *
 * Accesible: cada campo con <label> asociada, errores con role="alert", foco
 * visible heredado del sistema de diseño. Textos vía i18n (namespace "auth").
 */
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { PageLayout, Button } from "@/components";
import styles from "./TutorAuthScreen.module.css";

export type AuthMode = "signIn" | "signUp";

interface TutorAuthScreenProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (email: string, password: string) => void;
  onForgotPassword: (email: string) => void;
  /** si se pasa, muestra el botón "Continuar con Google" (ADR-004 §1). */
  onGoogle?: () => void;
  /** si se pasa, muestra la salida "Jugar sin cuenta" (US-E9): progreso solo local. */
  onSkip?: () => void;
  busy?: boolean;
  /** clave i18n de error a mostrar (ej. "auth:errors.invalidCredentials"). */
  errorKey?: string | null;
  /** clave i18n informativa (ej. "auth:reset.sent"). */
  infoKey?: string | null;
}

export function TutorAuthScreen({
  mode,
  onModeChange,
  onSubmit,
  onForgotPassword,
  onGoogle,
  onSkip,
  busy = false,
  errorKey,
  infoKey,
}: TutorAuthScreenProps) {
  const { t } = useTranslation(["auth", "account"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    onSubmit(email.trim(), password);
  };

  const isSignUp = mode === "signUp";

  return (
    <PageLayout width="narrow">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tutor-email">
              {t("field.email.label")}
            </label>
            <input
              id="tutor-email"
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("field.email.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errorKey ? true : undefined}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="tutor-password">
              {t("field.password.label")}
            </label>
            <input
              id="tutor-password"
              className={styles.input}
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder={t("field.password.placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errorKey ? true : undefined}
              required
            />
          </div>

          {errorKey ? (
            <p className={styles.error} role="alert">
              {t(errorKey.replace(/^auth:/, ""))}
            </p>
          ) : null}
          {infoKey ? (
            <p className={styles.info} role="status">
              {t(infoKey.replace(/^auth:/, ""))}
            </p>
          ) : null}

          <Button type="submit" variant="primary" size="lg" disabled={busy}>
            {isSignUp ? t("action.signUp") : t("action.signIn")}
          </Button>
        </form>

        {onGoogle ? (
          <>
            <p className={styles.orDivider} aria-hidden="true">
              ·
            </p>
            <Button type="button" variant="secondary" size="lg" disabled={busy} onClick={onGoogle}>
              {t("account:google.button")}
            </Button>
          </>
        ) : null}

        <div className={styles.actions}>
          {!isSignUp ? (
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => onForgotPassword(email.trim())}
            >
              {t("action.forgotPassword")}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => onModeChange(isSignUp ? "signIn" : "signUp")}
          >
            {isSignUp ? t("mode.toggleToSignIn") : t("mode.toggleToSignUp")}
          </button>
        </div>

        {onSkip ? (
          <div className={styles.skip}>
            <button
              type="button"
              className={styles.linkButton}
              onClick={onSkip}
              aria-describedby="tutor-auth-skip-hint"
            >
              {t("skip.action")}
            </button>
            <p id="tutor-auth-skip-hint" className={styles.skipHint}>
              {t("skip.hint")}
            </p>
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
