import type { CapacitorConfig } from "@capacitor/cli";

/*
 * Configuración de Capacitor (ADR-003).
 * Empaqueta el bundle web de Vite (webDir: "dist") como app Android.
 * - appId: identificador único de la app en Android (paquete Java invertido).
 * - webDir: carpeta que Vite genera con `npm run build`; Capacitor la copia al
 *   proyecto nativo con `cap sync` / `cap copy`.
 */
const config: CapacitorConfig = {
  appId: "com.repasosdeprimaria.app",
  appName: "Repasos de Primaria",
  webDir: "dist",
  android: {
    // El WebView usa https por defecto; sin tráfico de texto plano.
    allowMixedContent: false,
  },
  plugins: {
    // ADR-006 (Google Sign-In nativo): el plugin solo hace de picker nativo
    // (skipNativeAuth) y entrega el idToken al SDK Web de Firebase, que sigue
    // siendo el dueño real de la sesión (Auth/Firestore/App Check sin tocar).
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ["google.com"],
    },
  },
};

export default config;
