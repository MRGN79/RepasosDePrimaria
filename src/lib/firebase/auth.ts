/*
 * Servicio de autenticación del TUTOR (ADR-003 §2, Inc. 2).
 *
 * Wrapper fino sobre Firebase Auth, agnóstico de React. Reglas del ADR que este
 * módulo respeta:
 * - Solo el tutor tiene cuenta (email/contraseña). El niño nunca.
 * - Verificación de email obligatoria antes de habilitar el guardado en la nube.
 * - El email vive SOLO en Firebase Auth: este módulo nunca lo escribe en ningún
 *   almacén de datos (Firestore/localStorage).
 * - `reauthenticate` es la primitiva de la puerta parental (Inc. 5).
 *
 * Los errores de Firebase se traducen a claves i18n estables para que la UI
 * muestre mensajes claros en EN/ES sin acoplarse a los códigos de Firebase.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { getFirebaseAuth } from "./config";

/** Resultado uniforme: éxito con datos, o fallo con una clave i18n de error. */
export type AuthResult<T> =
  | { ok: true; value: T }
  | { ok: false; errorKey: string };

/**
 * Traduce el código de error de Firebase a una clave del namespace i18n "auth".
 * Cualquier código no contemplado cae en un mensaje genérico.
 */
function errorKeyFromCode(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "auth:errors.emailInUse";
    case "auth/invalid-email":
      return "auth:errors.invalidEmail";
    case "auth/weak-password":
      return "auth:errors.weakPassword";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "auth:errors.invalidCredentials";
    case "auth/too-many-requests":
      return "auth:errors.tooManyRequests";
    case "auth/network-request-failed":
      return "auth:errors.network";
    case "auth/requires-recent-login":
      return "auth:errors.requiresRecentLogin";
    case "auth/popup-closed-by-user":
      return "auth:errors.cancelled";
    default:
      return "auth:errors.generic";
  }
}

function extractCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  // El plugin nativo de Google Sign-In (ADR-006) no siempre expone `.code`:
  // al cancelar el picker solo llega un Error con `.message` ("Authorization
  // canceled." en Android). Se normaliza al código que ya usa el SDK Web
  // cuando se cierra el popup, para compartir la misma clave i18n en ambas
  // plataformas en vez de mostrar el error genérico.
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && /cancel/i.test(message)) {
      return "auth/popup-closed-by-user";
    }
  }
  return "unknown";
}

async function guarded<T>(op: () => Promise<T>): Promise<AuthResult<T>> {
  try {
    return { ok: true, value: await op() };
  } catch (error) {
    return { ok: false, errorKey: errorKeyFromCode(extractCode(error)) };
  }
}

/** Alta del tutor: crea la cuenta y envía el email de verificación. */
export async function signUpTutor(email: string, password: string): Promise<AuthResult<User>> {
  return guarded(async () => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    return cred.user;
  });
}

/** Inicio de sesión del tutor. */
export async function signInTutor(email: string, password: string): Promise<AuthResult<User>> {
  return guarded(async () => {
    const auth = getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  });
}

/**
 * Inicio de sesión / alta con Google (ADR-004 §1). Sirve para AMBOS roles: el
 * proveedor no fija el rol en este caso — la UI lo decide después (paso de rol
 * + reto de adulto para la rama tutor). De la cuenta de Google solo se usará el
 * `uid` (ADR-004 §3): este módulo no persiste email/nombre/foto en ningún sitio.
 *
 * Dos caminos según la plataforma (ADR-006):
 * - Navegador / emulador: `signInWithPopup` del SDK Web, como siempre.
 * - WebView nativo de Android: `signInWithPopup` no puede volver a la app (el
 *   navegador externo que abre no tiene relación de `opener` con el WebView).
 *   Se usa en su lugar el picker nativo de `@capacitor-firebase/authentication`
 *   con `skipNativeAuth: true` — el plugin SOLO hace de selector de cuenta y
 *   entrega un idToken; el SDK Web sigue siendo el único dueño de la sesión
 *   (Auth/Firestore/App Check sin cambios). `skipNativeAuth` se fija aquí
 *   además de en `capacitor.config.ts` para que el Auth nativo nunca se
 *   invoque, venga de donde venga la llamada.
 */
export async function signInWithGoogle(): Promise<AuthResult<User>> {
  return guarded(async () => {
    const auth = getFirebaseAuth();
    if (!Capacitor.isNativePlatform()) {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      return cred.user;
    }
    const { credential } = await FirebaseAuthentication.signInWithGoogle({
      skipNativeAuth: true,
    });
    if (!credential?.idToken) throw { code: "auth/no-credential" };
    const googleCredential = GoogleAuthProvider.credential(credential.idToken, credential.accessToken);
    const cred = await signInWithCredential(auth, googleCredential);
    return cred.user;
  });
}

/**
 * Proveedor de autenticación del usuario actual ("password" | "google.com" | …).
 * Se usa para saber si una cuenta puede elegir rol (Google) o es tutor por
 * construcción (password). No es PII: es el método de acceso.
 */
export function providerIdOf(user: User): string | null {
  return user.providerData[0]?.providerId ?? null;
}

export async function signOutTutor(): Promise<AuthResult<void>> {
  return guarded(async () => {
    await signOut(getFirebaseAuth());
  });
}

/** Reenvía el email de verificación al usuario actual. */
export async function resendVerificationEmail(): Promise<AuthResult<void>> {
  return guarded(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw { code: "auth/no-current-user" };
    await sendEmailVerification(user);
  });
}

export async function sendPasswordReset(email: string): Promise<AuthResult<void>> {
  return guarded(async () => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  });
}

/**
 * Reautenticación con la contraseña actual: primitiva de la PUERTA PARENTAL
 * (ADR-003 §5). La UI la invoca justo antes de una acción destructiva/de cuenta.
 */
export async function reauthenticateTutor(password: string): Promise<AuthResult<void>> {
  return guarded(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user || !user.email) throw { code: "auth/no-current-user" };
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  });
}

/** Suscripción a cambios de sesión. Devuelve la función para desuscribirse. */
export function onTutorAuthChanged(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function currentTutor(): User | null {
  return getFirebaseAuth().currentUser;
}

/** El guardado en la nube solo se habilita con el email verificado (ADR §2). */
export function isTutorEmailVerified(): boolean {
  return getFirebaseAuth().currentUser?.emailVerified ?? false;
}

/**
 * Recarga el usuario y fuerza el refresh del ID token para que el claim
 * `email_verified` se propague a las reglas de Firestore sin reiniciar sesión
 * (ADR-003 §2, §9). Devuelve si el email ya está verificado.
 */
export async function refreshVerification(): Promise<AuthResult<boolean>> {
  return guarded(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw { code: "auth/no-current-user" };
    await user.reload();
    await user.getIdToken(true);
    return user.emailVerified;
  });
}
