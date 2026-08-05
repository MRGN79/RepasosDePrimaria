/*
 * Indicador NO bloqueante del traslado del progreso a la nube (flujos §11.2).
 * Tres estados: en curso · completado (toast efímero) · incompleto-recuperable.
 *
 * Regla dura de este componente: NINGÚN estado usa el rojo de error. El estado
 * incompleto es NEUTRO/INFORMATIVO (superficie cálida + icono de nube), nunca una
 * alarma — el progreso local sigue a salvo y el copy lo dice. Es multicanal:
 * icono + texto siempre (no solo color), coherente con A11Y-COLOR-01.
 *
 * Presentacional: Frontend controla cuándo montarlo, la fase actual, el
 * autodescarte del toast (~4-5s) y el handler de reintento. Aquí solo vive la
 * estructura visual y el anuncio a lectores de pantalla (aria-live="polite").
 */
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { Button } from "./Button";
import styles from "./MigrationStatus.module.css";

export type MigrationPhase = "inProgress" | "done" | "incomplete";

type MigrationStatusProps = {
  phase: MigrationPhase;
  /** Reintento manual de los cursos pendientes. Acción NO destructiva: no toca
   *  el dato local, solo reintenta subir+verificar. No exige reto de adulto. */
  onRetry?: () => void;
};

export function MigrationStatus({ phase, onRetry }: MigrationStatusProps) {
  const { t } = useTranslation("account");

  const phaseClass =
    phase === "done"
      ? styles.done
      : phase === "incomplete"
        ? styles.incomplete
        : styles.inProgress;

  return (
    <section
      className={[styles.root, phaseClass].join(" ")}
      role="status"
      aria-live="polite"
      aria-label={t("migration.regionLabel")}
    >
      {phase === "inProgress" ? (
        <div className={styles.line}>
          <span className={styles.iconWrap} aria-hidden="true">
            <Icon name="cloud" size={26} />
          </span>
          <span className={styles.text}>{t("migration.inProgress")}</span>
          <span className={styles.dots} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className={styles.line}>
          <span className={styles.iconWrap} aria-hidden="true">
            <Icon name="check" size={24} />
            <Icon name="cloud" size={26} />
          </span>
          <span className={styles.text}>{t("migration.doneToast")}</span>
        </div>
      ) : null}

      {phase === "incomplete" ? (
        <div className={styles.stack}>
          <div className={styles.line}>
            <span className={styles.iconWrap} aria-hidden="true">
              <Icon name="cloud" size={26} />
            </span>
            <span className={styles.heading}>{t("migration.incompleteTitle")}</span>
          </div>
          <p className={styles.body}>{t("migration.incompleteBody")}</p>
          {onRetry ? (
            <div className={styles.actions}>
              <Button variant="secondary" size="md" onClick={onRetry}>
                <Icon name="retry" size={22} aria-hidden="true" />
                {t("migration.retryAction")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
