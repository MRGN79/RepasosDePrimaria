/*
 * Inicialización de Firebase (ADR-003, Inc. 2; App Check: ADR-005).
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
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
  type Firestore,
} from "firebase/firestore";

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
let cachedFirestore: Firestore | null = null;
let emulatorConnected = false;
let firestoreEmulatorConnected = false;
let appCheckInitialized = false;

/**
 * ¿Soporta el entorno la persistencia offline con IndexedDB? En el WebView de
 * Android y en navegadores sí; en SSR/tests (node/jsdom) no. Sin IndexedDB se
 * cae a caché en memoria para no romper.
 */
function supportsIndexedDb(): boolean {
  return typeof globalThis !== "undefined" && "indexedDB" in globalThis;
}

/**
 * App Check necesita DOM (carga el script de reCAPTCHA). En node/jsdom
 * (tests) y con el emulador (que ignora App Check) no se inicializa.
 */
function supportsAppCheck(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Proveedor de App Check, aislado en un único punto de extensión (ADR-005):
 * hoy reCAPTCHA v3 (único proveedor viable con el SDK Web dentro del WebView
 * de Capacitor); el día que exista un plugin nativo de Capacitor para Play
 * Integrity, se sustituye aquí sin tocar el resto del módulo. Sin site key
 * configurada, devuelve null (no-op): App Check queda ausente, no bloquea.
 */
function resolveAppCheckProvider(): ReCaptchaV3Provider | null {
  const siteKey = env.VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;
  return new ReCaptchaV3Provider(siteKey);
}

/**
 * Inicializa App Check en modo monitor (ADR-005): mide el tráfico con/sin
 * token válido sin bloquear a nadie — el enforce es un toggle de consola
 * futuro, no algo que decida este código. El debug token (solo dev/no-prod)
 * nunca debe viajar en un build de producción.
 */
function initializeAppCheckOnce(app: FirebaseApp): void {
  if (appCheckInitialized || useEmulator || !supportsAppCheck()) return;
  const provider = resolveAppCheckProvider();
  if (!provider) return;

  if (env.VITE_FIREBASE_APPCHECK_DEBUG === "true" && !import.meta.env.PROD) {
    (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      true;
  }

  // Modo monitor: un fallo al inicializar App Check nunca debe impedir el uso
  // de Auth/Firestore (hallazgo de Seguridad, PR #35) — se traga el error.
  try {
    initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
  } catch {
    // Intencional: ver comentario arriba.
  } finally {
    appCheckInitialized = true;
  }
}

function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(effectiveConfig());
  initializeAppCheckOnce(cachedApp);
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

/**
 * Devuelve la instancia de Firestore con persistencia offline habilitada
 * (offline-first, ADR-003 §3: el niño juega sin conexión y sincroniza al
 * reconectar). Init idempotente. Se conecta al emulador si procede.
 *
 * La caché persistente (IndexedDB) solo se usa donde IndexedDB existe (WebView
 * de Android, navegador). En entornos sin IndexedDB se usa caché en memoria.
 */
export function getFirebaseFirestore(): Firestore {
  if (!isCloudEnabled()) {
    throw new Error(
      "Firebase no está configurado. La app funciona en local; configura VITE_FIREBASE_* o el emulador para habilitar la nube.",
    );
  }
  if (cachedFirestore) return cachedFirestore;
  const db = initializeFirestore(getFirebaseApp(), {
    localCache: supportsIndexedDb()
      ? persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) })
      : memoryLocalCache(),
  });
  if (useEmulator && !firestoreEmulatorConnected) {
    connectFirestoreEmulator(db, emulatorHost, 8080);
    firestoreEmulatorConnected = true;
  }
  cachedFirestore = db;
  return db;
}
