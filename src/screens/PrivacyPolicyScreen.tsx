/*
 * Pantalla de política de privacidad (ADR-003 §9, US-D3, Inc. 6).
 * Presentacional: renderiza el texto legal desde el namespace i18n "legal"
 * (EN/ES), validado por el Abogado. El documento fuente equivalente vive en
 * docs/legal/privacy-policy.md. Alcanzable desde Ajustes y, cuando se cablee al
 * flujo de alta, desde el enlace de ConsentScreen (onPrivacy).
 */
import { useTranslation } from "react-i18next";
import { PageLayout, AppHeader } from "@/components";
import styles from "./PrivacyPolicyScreen.module.css";

type PrivacyPolicyScreenProps = {
  onBack: () => void;
  onHome: () => void;
};

/** Secciones en orden de lectura; `bullets` marca las que llevan lista. */
const SECTIONS: { id: string; bullets?: boolean }[] = [
  { id: "design" },
  { id: "whatWeProcess", bullets: true },
  { id: "whatWeDont", bullets: true },
  { id: "legalBasis" },
  { id: "location" },
  { id: "retention" },
  { id: "rights", bullets: true },
  { id: "security" },
  { id: "contact" },
];

export function PrivacyPolicyScreen({ onBack, onHome }: PrivacyPolicyScreenProps) {
  const { t } = useTranslation("legal");

  return (
    <PageLayout
      width="narrow"
      header={<AppHeader title={t("privacy.title")} onBack={onBack} onHome={onHome} />}
    >
      <article className={styles.wrap}>
        <p className={styles.updated}>{t("privacy.updated")}</p>
        <p className={styles.intro}>{t("privacy.intro")}</p>

        {SECTIONS.map(({ id, bullets }) => {
          const items = bullets
            ? (t(`privacy.${id}.bullets`, { returnObjects: true }) as string[])
            : null;
          return (
            <section key={id} className={styles.section} aria-labelledby={`privacy-${id}`}>
              <h2 id={`privacy-${id}`} className={styles.heading}>
                {t(`privacy.${id}.title`)}
              </h2>
              <p className={styles.body}>{t(`privacy.${id}.body`)}</p>
              {items ? (
                <ul className={styles.list}>
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </article>
    </PageLayout>
  );
}
