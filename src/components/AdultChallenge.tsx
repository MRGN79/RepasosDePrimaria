/*
 * Reto de adulto (ADR-003 §4, ADR-004 §1/§7). Componente presentacional que
 * envuelve la lógica pura de `lib/adultChallenge`. Se usa en el alta con Google
 * (rama "soy el adulto") y queda listo como puerta parental (Inc. 5).
 *
 * Accesible: label asociada al input, error con role="alert", input numérico.
 */
import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components";
import { generateAdultChallenge, checkAdultChallenge } from "@/lib/adultChallenge";
import styles from "@/screens/account/account.module.css";

interface AdultChallengeProps {
  onPass: () => void;
  onCancel?: () => void;
}

export function AdultChallenge({ onPass, onCancel }: AdultChallengeProps) {
  const { t } = useTranslation("account");
  const challenge = useMemo(() => generateAdultChallenge(), []);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (checkAdultChallenge(challenge, value)) {
      onPass();
    } else {
      setWrong(true);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{t("adultChallenge.title")}</h1>
      <p className={styles.subtitle}>{t("adultChallenge.body")}</p>
      <form className={styles.field} onSubmit={handleSubmit} noValidate>
        <label className={styles.label} htmlFor="adult-challenge">
          {t("adultChallenge.question", { a: challenge.a, b: challenge.b })}
        </label>
        <input
          id="adult-challenge"
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={t("adultChallenge.inputLabel")}
          aria-invalid={wrong ? true : undefined}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
        />
        {wrong ? (
          <p className={styles.error} role="alert">
            {t("adultChallenge.wrong")}
          </p>
        ) : null}
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg">
            {t("adultChallenge.submit")}
          </Button>
          {onCancel ? (
            <Button type="button" variant="ghost" size="md" onClick={onCancel}>
              {t("adultChallenge.cancel")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
