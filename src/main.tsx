/*
 * Punto de entrada. Carga fuentes autoalojadas (Atkinson Hyperlegible, ADR D-3),
 * estilos transversales, i18n y monta la app dentro del proveedor de estado.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/print.css";

import i18n from "./i18n";
import { AppRoot } from "./AppRoot";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <AppRoot />
    </I18nextProvider>
  </StrictMode>,
);
