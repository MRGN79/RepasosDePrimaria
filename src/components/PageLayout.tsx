/*
 * PageLayout. Andamiaje semántico de pantalla: landmark <main>, ancho cómodo,
 * margen de borde ≥16px (A11Y-TOUCH-04), header/footer opcionales.
 * Mobile-first; en tablet (dispositivo objetivo) respira más (§7.1).
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styles from "./PageLayout.module.css";

type PageLayoutProps = {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** ancho del contenido: narrow (sesión) | wide (rejillas de materias) */
  width?: "narrow" | "wide";
};

export function PageLayout({
  header,
  children,
  footer,
  width = "wide",
}: PageLayoutProps) {
  const { t } = useTranslation("common");
  return (
    <div className={styles.page}>
      {header ? <header className={styles.header}>{header}</header> : null}
      <main
        id="main"
        className={[styles.main, styles[`width-${width}`]].join(" ")}
        tabIndex={-1}
      >
        {children}
      </main>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      <footer className={styles.siteFooter} aria-label="Información de la aplicación">
        <span>{t("footer.description")}</span>
        <span className={styles.version}>v{__APP_VERSION__}</span>
        <span className={styles.howItWorks}>{t("footer.howItWorks")}</span>
        <span className={styles.privacy}>{t("footer.privacy")}</span>
        <span className={styles.contentOrigin}>{t("footer.contentOrigin")}</span>
      </footer>
    </div>
  );
}
