/*
 * Inicialización de Firebase (ADR-003, Inc. 2).
 *
 * Principios:
 * - La configuración llega por variables VITE_FIREBASE_* (públicas, no secretas).
 * - Si la config no está completa Y no hay emulador, la nube queda DESHABILITADA:
 *   la app sigue funcionando en local (localStorage) sin lanzar. Esto permite
 *   desarrollar y ejecutar la app sin un proyecto Firebase real todavía.
 * - En desarrollo, VITE_FIREBASE_USE_EMULATOR="true" conecta con la Firebase
 *   Local Emulator Suite para probar Auth (y más adelante Firestore) sin
 *   credenciales de producción.
 * - Init perezoso e idempotente: no se toca la red hasta que algo pide Auth.
 *
 * Este módulo NO expone credenciales ni secretos: los valores VITE_* ya son
 * públicos por diseño en cualquier app cliente Firebase.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";

interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const env = import.meta.env;

export const useEmulator = env.VITE_FIREBASE_USE_EMULATOR === "true";
const emulatorHost = env.VITE_FIREBASE_EMULATOR_HOST ?? "127.0.0.1";

/** Config leída de entorno; cada campo puede faltar. */
function readEnvConfig(): Partial<FirebaseEnvConfig> {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

/**
 * La nube está habilitada si hay projectId + apiKey (config real) o si se usa el
 * emulador (donde el emulador acepta credenciales de demo). Sin esto, la app
 * corre 100% local y las pantallas de nube no deben intentar conectar.
 */
export function isCloudEnabled(): boolean {
  const cfg = readEnvConfig();
  if (useEmulator) return true;
  return Boolean(cfg.apiKey && cfg.projectId && cfg.authDomain && cfg.appId);
}

/**
 * Config efectiva para inicializar Firebase. Con emulador, los valores reales
 * son irrelevantes (el emulador no valida), así que se rellenan valores de demo
 * deterministas para un projectId estable en pruebas.
 */
function effectiveConfig(): FirebaseEnvConfig {
  const cfg = readEnvConfig();
  if (useEmulator) {
    const projectId = cfg.projectId ?? "demo-repasos";
    return {
      apiKey: cfg.apiKey ?? "demo-api-key",
      authDomain: cfg.authDomain ?? `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: cfg.storageBucket ?? `${projectId}.appspot.com`,
      messagingSenderId: cfg.messagingSenderId ?? "0",
      appId: cfg.appId ?? "demo-app-id",
    };
  }
  return {
    apiKey: cfg.apiKey ?? "",
    authDomain: cfg.authDomain ?? "",
    projectId: cfg.projectId ?? "",
    storageBucket: cfg.storageBucket ?? "",
    messagingSenderId: cfg.messagingSenderId ?? "",
    appId: cfg.appId ?? "",
  };
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let emulatorConnected = false;

function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(effectiveConfig());
  return cachedApp;
}

/**
 * Devuelve la instancia de Auth, inicializándola una sola vez y conectando al
 * emulador si procede. Lanza si la nube no está habilitada: las pantallas deben
 * comprobar `isCloudEnabled()` antes de llamar aquí.
 */
export function getFirebaseAuth(): Auth {
  if (!isCloudEnabled()) {
    throw new Error(
      "Firebase no está configurado. La app funciona en local; configura VITE_FIREBASE_* o el emulador para habilitar la nube.",
    );
  }
  if (cachedAuth) return cachedAuth;
  const auth = getAuth(getFirebaseApp());
  if (useEmulator && !emulatorConnected) {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    emulatorConnected = true;
  }
  cachedAuth = auth;
  return auth;
}
