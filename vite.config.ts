import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import pkg from "./package.json";

// Base path para GitHub Pages: el sitio se sirve desde
// https://<usuario>.github.io/RepasosDePrimaria/ (ver ADR-001 §6).
// HashRouter evita 404 en rutas de cliente sobre Pages.
export default defineConfig({
  base: "/RepasosDePrimaria/",
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
