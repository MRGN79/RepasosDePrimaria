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
  /**
   * Nivel del encabezado del título (WCAG 1.3.1/2.4.6). Por defecto h1, para el
   * uso a pantalla completa (AppRoot). Cuando se embebe dentro de otra pantalla
   * con su propio h1 (p. ej. SettingsScreen), pasar 2 para no duplicar nivel.
   */
  headingLevel?: 1 | 2 | 3;
}

export function AdultChallenge({ onPass, onCancel, headingLevel = 1 }: AdultChallengeProps) {
  const { t } = useTranslation("account");
  const challenge = useMemo(() => generateAdultChallenge(), []);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const Heading = `h${headingLevel}` as const;

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
      <Heading className={styles.title}>{t("adultChallenge.title")}</Heading>
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
