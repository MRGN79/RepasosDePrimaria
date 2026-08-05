import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

// Config aislada para los tests de las reglas de seguridad de Firestore.
// Corren contra el emulador de Firestore (Java), no en la suite unitaria por
// defecto. Se lanzan con `npm run test:rules`, que arranca el emulador con
// `firebase emulators:exec` y ejecuta esta config.
//
// Timeouts holgados: el arranque del cliente de reglas y las transacciones
// contra el emulador son más lentos que un test de lógica pura.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@content": fileURLToPath(new URL("./content", import.meta.url)),
      "@locales": fileURLToPath(new URL("./locales", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/firestore/**/*.{test,spec}.ts"],
    globals: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    // Un solo worker: todos los tests comparten la misma instancia del emulador
    // y limpian Firestore entre casos; el paralelismo introduciría carreras.
    fileParallelism: false,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
