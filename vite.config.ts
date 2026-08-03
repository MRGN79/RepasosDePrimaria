import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import pkg from "./package.json";

// Base path relativo ("./"): la app se empaqueta como aplicación Android con
// Capacitor (ADR-003) y se sirve desde la raíz del esquema local del WebView,
// no desde una subruta pública. Un base relativo funciona tanto dentro del
// WebView como en cualquier hosting estático. Sustituye al antiguo
// "/RepasosDePrimaria/" de GitHub Pages, retirado en este mismo cambio.
export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@content": fileURLToPath(new URL("./content", import.meta.url)),
      "@locales": fileURLToPath(new URL("./locales", import.meta.url)),
    },
  },
});
