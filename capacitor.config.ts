import type { CapacitorConfig } from "@capacitor/cli";

/*
 * Configuración de Capacitor (ADR-003).
 * Empaqueta el bundle web de Vite (webDir: "dist") como app Android.
 * - appId: identificador único de la app en Android (paquete Java invertido).
 * - webDir: carpeta que Vite genera con `npm run build`; Capacitor la copia al
 *   proyecto nativo con `cap sync` / `cap copy`.
 * No introduce Firebase todavía (eso es el Incremento 2).
 */
const config: CapacitorConfig = {
  appId: "com.repasosdeprimaria.app",
  appName: "Repasos de Primaria",
  webDir: "dist",
  android: {
    // El WebView usa https por defecto; sin tráfico de texto plano.
    allowMixedContent: false,
  },
};

export default config;
