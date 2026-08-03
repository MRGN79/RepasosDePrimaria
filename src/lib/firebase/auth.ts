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
  EmailAuthProvider,
  type User,
  type Unsubscribe,
} from "firebase/auth";
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
    default:
      return "auth:errors.generic";
  }
}

function extractCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
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
