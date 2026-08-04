/*
 * PIN-pestillo del perfil de hijo (ADR-004 §6). Dos modos: fijar el PIN al crear
 * un perfil y desbloquear al cambiar de niño. El PIN nunca sale del dispositivo
 * (lo gestiona lib/pinLock sobre Capacitor Preferences).
 */
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { PageLayout, Button } from "@/components";
import { isValidPin } from "@/lib/pinLock";
import styles from "./account.module.css";

interface PinScreenProps {
  mode: "set" | "enter";
  name: string;
  onSet?: (pin: string) => void;
  /** Devuelve (async) si el PIN es correcto; en false se muestra el error. */
  onEnter?: (pin: string) => Promise<boolean>;
  onSkip?: () => void;
  onBack?: () => void;
}

export function PinScreen({ mode, name, onSet, onEnter, onSkip, onBack }: PinScreenProps) {
  const { t } = useTranslation("account");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "set") {
      if (!isValidPin(pin)) return setErrorKey("pin.invalid");
      if (pin !== confirm) return setErrorKey("pin.mismatch");
      onSet?.(pin);
    } else {
      if (!isValidPin(pin)) return setErrorKey("pin.invalid");
      setChecking(true);
      void (onEnter?.(pin) ?? Promise.resolve(false)).then((ok) => {
        setChecking(false);
        if (!ok) setErrorKey("pin.wrong");
      });
    }
  };

  return (
    <PageLayout width="narrow">
      <form className={styles.wrap} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>
          {mode === "set" ? t("pin.setTitle", { name }) : t("pin.enterTitle", { name })}
        </h1>
        {mode === "set" ? <p className={styles.subtitle}>{t("pin.setBody")}</p> : null}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="pin-input">
            {t("pin.label")}
          </label>
          <input
            id="pin-input"
            className={styles.input}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            aria-invalid={errorKey ? true : undefined}
            onChange={(e) => {
              setPin(digitsOnly(e.target.value));
              setErrorKey(null);
            }}
          />
        </div>

        {mode === "set" ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="pin-confirm">
              {t("pin.confirmLabel")}
            </label>
            <input
              id="pin-confirm"
              className={styles.input}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={confirm}
              onChange={(e) => {
                setConfirm(digitsOnly(e.target.value));
                setErrorKey(null);
              }}
            />
          </div>
        ) : null}

        {errorKey ? (
          <p className={styles.error} role="alert">
            {t(errorKey)}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={checking}>
            {mode === "set" ? t("pin.save") : t("pin.unlock")}
          </Button>
          {mode === "set" && onSkip ? (
            <Button type="button" variant="ghost" size="md" onClick={onSkip}>
              {t("pin.skip")}
            </Button>
          ) : null}
          {mode === "enter" && onBack ? (
            <Button type="button" variant="ghost" size="md" onClick={onBack}>
              {t("pin.back")}
            </Button>
          ) : null}
        </div>
      </form>
    </PageLayout>
  );
}
