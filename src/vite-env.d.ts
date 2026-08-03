/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

/*
 * Variables de entorno de Firebase (ADR-003, Inc. 2). Todas con prefijo VITE_
 * (públicas por naturaleza en un cliente Firebase; no son secretos). Opcionales:
 * si faltan, la app arranca en modo local sin nube. Ver src/lib/firebase/config.ts.
 */
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** "true" conecta con la Firebase Local Emulator Suite en desarrollo. */
  readonly VITE_FIREBASE_USE_EMULATOR?: string;
  /** Host del emulador (por defecto 127.0.0.1). */
  readonly VITE_FIREBASE_EMULATOR_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
