/*
 * Hook de sesión del tutor (ADR-003, Inc. 2). Conecta el servicio de auth con
 * el estado de React y expone acciones que devuelven claves i18n de error para
 * que las pantallas muestren mensajes claros.
 *
 * Si la nube no está configurada (sin VITE_FIREBASE_* y sin emulador), el hook
 * no intenta conectar: devuelve `cloudEnabled: false` y la app sigue en local.
 *
 * Este hook NO está aún conectado al gate de entrada de la app: la integración
 * en el flujo (mostrar login/consentimiento y sincronizar con la nube) es el
 * paso de cierre del Incremento 2/3.
 */
import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { isCloudEnabled } from "@/lib/firebase/config";
import {
  onTutorAuthChanged,
  signInTutor,
  signUpTutor,
  signOutTutor,
  resendVerificationEmail,
  sendPasswordReset,
  type AuthResult,
} from "@/lib/firebase/auth";

export interface TutorAuthState {
  cloudEnabled: boolean;
  loading: boolean;
  user: User | null;
  emailVerified: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult<User>>;
  signIn: (email: string, password: string) => Promise<AuthResult<User>>;
  signOut: () => Promise<AuthResult<void>>;
  resendVerification: () => Promise<AuthResult<void>>;
  resetPassword: (email: string) => Promise<AuthResult<void>>;
}

export function useTutorAuth(): TutorAuthState {
  const cloudEnabled = isCloudEnabled();
  const [loading, setLoading] = useState(cloudEnabled);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!cloudEnabled) return;
    const unsubscribe = onTutorAuthChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [cloudEnabled]);

  const signUp = useCallback((email: string, password: string) => signUpTutor(email, password), []);
  const signIn = useCallback((email: string, password: string) => signInTutor(email, password), []);
  const signOut = useCallback(() => signOutTutor(), []);
  const resendVerification = useCallback(() => resendVerificationEmail(), []);
  const resetPassword = useCallback((email: string) => sendPasswordReset(email), []);

  return {
    cloudEnabled,
    loading,
    user,
    emailVerified: user?.emailVerified ?? false,
    signUp,
    signIn,
    signOut,
    resendVerification,
    resetPassword,
  };
}
