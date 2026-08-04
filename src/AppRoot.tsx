/*
 * Orquestador de entrada (ADR-003, ADR-004, Inc. 3).
 *
 * Dos modos:
 *  - Nube DESHABILITADA (sin VITE_FIREBASE_* ni emulador): la app corre 100% en
 *    local, exactamente como antes — se renderiza <GameProvider><App/></>.
 *  - Nube HABILITADA: se ejecuta el flujo de cuenta (auth → verificación → rol →
 *    consentimiento → perfil) y, con un perfil activo, el juego respaldado por
 *    Firestore vía <CloudGameProvider>.
 *
 * El flujo de cuenta materializa ADR-004: cuenta de tutor (email/contraseña o
 * Google, con selector+PIN si hay más de un hijo) y cuenta de niño (Google
 * directo, sin PIN). El paso de rol + reto de adulto en la rama Google fija el
 * rol antes de crear el documento (ADR-004 §1).
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { User } from "firebase/auth";
import { GameProvider } from "@/state/gameStore";
import { CloudGameProvider } from "@/state/CloudGameProvider";
import { App } from "@/App";
import { isCloudEnabled } from "@/lib/firebase/config";
import {
  onTutorAuthChanged,
  signInTutor,
  signUpTutor,
  signOutTutor,
  signInWithGoogle,
  resendVerificationEmail,
  sendPasswordReset,
  refreshVerification,
  providerIdOf,
} from "@/lib/firebase/auth";
import {
  getUserDoc,
  listChildren,
  createTutorAccount,
  createKidAccount,
  createChildProfile,
  ChildLimitReachedError,
  MAX_CHILDREN,
  type UserDoc,
  type ChildProfile,
} from "@/lib/firebase/firestore";
import { hasPin, verifyPin, setPin } from "@/lib/pinLock";
import { nicknameKey } from "@/lib/profile";
import type { Curso, Language } from "@/lib/storage";
import { TutorAuthScreen, type AuthMode } from "@/screens/TutorAuthScreen";
import { ConsentScreen } from "@/screens/ConsentScreen";
import { PrivacyPolicyScreen } from "@/screens/PrivacyPolicyScreen";
import { RoleChoiceScreen } from "@/screens/account/RoleChoiceScreen";
import { ProfileSetupScreen } from "@/screens/account/ProfileSetupScreen";
import { VerifyEmailScreen } from "@/screens/account/VerifyEmailScreen";
import { ChildSelectorScreen } from "@/screens/account/ChildSelectorScreen";
import { PinScreen } from "@/screens/account/PinScreen";
import { AdultChallenge } from "@/components/AdultChallenge";

type Role = "tutor" | "kid";
type SetupStep = "role" | "adult" | "consent" | "profile";

export function AppRoot() {
  // Nube deshabilitada → comportamiento local intacto.
  if (!isCloudEnabled()) {
    return (
      <GameProvider>
        <App />
      </GameProvider>
    );
  }
  return <CloudRoot />;
}

function CloudRoot() {
  const { t, i18n } = useTranslation(["account", "content"]);
  const locale: Language = i18n.language === "es" ? "es" : "en";
  const moteName = (m: string) => t(nicknameKey(m));

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Datos de cuenta cargados tras el login.
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  const [bootLoading, setBootLoading] = useState(false);

  // Estado de la pantalla de entrada.
  const [entryMode, setEntryMode] = useState<AuthMode>("signIn");
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entryInfo, setEntryInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Verificación de email.
  const [verifyInfo, setVerifyInfo] = useState<string | null>(null);
  const [verifyStillPending, setVerifyStillPending] = useState(false);

  // Asistente de alta (cuenta nueva sin documento).
  const [setupRole, setSetupRole] = useState<Role | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Selección de perfil (cuenta de tutor con varios hijos).
  const [pinMode, setPinMode] = useState<"set" | "enter" | null>(null);
  const [pinTargetChild, setPinTargetChild] = useState<ChildProfile | null>(null);
  const [activeChild, setActiveChild] = useState<ChildProfile | null>(null);

  const provider = user ? providerIdOf(user) : null;

  const resetSetup = useCallback(() => {
    setSetupRole(null);
    setSetupStep(null);
    setProfileError(null);
  }, []);

  // Suscripción a la sesión.
  useEffect(() => {
    const unsub = onTutorAuthChanged((u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setUserDoc(null);
        setChildren([]);
        setActiveChild(null);
        resetSetup();
      }
    });
    return unsub;
  }, [resetSetup]);

  // Carga del documento de cuenta y perfiles cuando hay sesión verificada.
  const refreshAccount = useCallback(async () => {
    const u = user;
    if (!u) return;
    if (provider === "password" && !u.emailVerified) return; // pendiente de verificar
    setBootLoading(true);
    const doc = await getUserDoc(u.uid);
    setUserDoc(doc);
    if (doc?.role === "tutor") {
      const kids = await listChildren(u.uid);
      setChildren(kids);
      const locked = await Promise.all(kids.map((k) => hasPin(k.id)));
      setLockedIds(kids.filter((_, i) => locked[i]).map((k) => k.id));
      if (kids.length === 0) {
        // documento de tutor sin hijos: crear el primero
        setSetupRole("tutor");
        setSetupStep("profile");
      } else if (kids.length === 1) {
        setActiveChild(kids[0]);
      }
    } else if (!doc) {
      // cuenta nueva sin documento: decidir rol por proveedor
      if (provider === "password") {
        setSetupRole("tutor");
        setSetupStep("consent");
      } else {
        setSetupStep("role");
      }
    }
    setBootLoading(false);
  }, [user, provider]);

  useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);

  /* ------------------------------ acciones ------------------------------ */

  const runAuth = useCallback(
    async (op: () => Promise<{ ok: boolean; errorKey?: string }>) => {
      setBusy(true);
      setEntryError(null);
      setEntryInfo(null);
      const res = await op();
      if (!res.ok) setEntryError(res.errorKey ?? "auth:errors.generic");
      setBusy(false);
    },
    [],
  );

  const onSubmitEmail = useCallback(
    (email: string, password: string) => {
      void runAuth(async () => (entryMode === "signUp" ? signUpTutor(email, password) : signInTutor(email, password)));
    },
    [entryMode, runAuth],
  );

  const onForgot = useCallback(
    (email: string) => {
      void (async () => {
        setBusy(true);
        setEntryError(null);
        const res = await sendPasswordReset(email);
        setEntryInfo(res.ok ? "auth:reset.sent" : null);
        if (!res.ok) setEntryError(res.errorKey);
        setBusy(false);
      })();
    },
    [],
  );

  const onGoogle = useCallback(() => {
    void runAuth(async () => signInWithGoogle());
  }, [runAuth]);

  const onRecheckVerification = useCallback(() => {
    void (async () => {
      setBusy(true);
      const res = await refreshVerification();
      setBusy(false);
      if (res.ok && res.value) {
        setVerifyStillPending(false);
        await refreshAccount();
      } else {
        setVerifyStillPending(true);
      }
    })();
  }, [refreshAccount]);

  const onResendVerification = useCallback(() => {
    void (async () => {
      setBusy(true);
      const res = await resendVerificationEmail();
      setVerifyInfo(res.ok ? "verify.resent" : null);
      setBusy(false);
    })();
  }, []);

  const onSignOut = useCallback(() => {
    void signOutTutor();
  }, []);

  const onConsentAccept = useCallback(() => {
    void (async () => {
      if (!user || !setupRole) return;
      if (setupRole === "tutor") {
        setBusy(true);
        await createTutorAccount(user.uid, locale);
        setBusy(false);
        setSetupStep("profile");
      } else {
        // el niño acepta el consentimiento; el documento se crea al fijar el perfil
        setSetupStep("profile");
      }
    })();
  }, [user, setupRole, locale]);

  const onProfileCreate = useCallback(
    (p: { mote: string; avatar: string; currentCourse: Curso }) => {
      void (async () => {
        if (!user || !setupRole) return;
        setBusy(true);
        setProfileError(null);
        try {
          if (setupRole === "tutor") {
            const childId = await createChildProfile(user.uid, p);
            resetSetup();
            // Si ahora hay más de un hijo, ofrecer PIN para el nuevo perfil.
            const kids = await listChildren(user.uid);
            setChildren(kids);
            if (kids.length > 1) {
              const newChild = kids.find((k) => k.id === childId) ?? null;
              setPinTargetChild(newChild);
              setPinMode("set");
            } else {
              setActiveChild(kids[0] ?? null);
            }
          } else {
            await createKidAccount(user.uid, locale, p.mote, p.avatar, p.currentCourse);
            resetSetup();
            await refreshAccount();
          }
        } catch (e) {
          if (e instanceof ChildLimitReachedError) setProfileError("account:profileSetup.limitReached");
          else setProfileError("auth:errors.generic");
        } finally {
          setBusy(false);
        }
      })();
    },
    [user, setupRole, locale, resetSetup, refreshAccount],
  );

  const onSelectChild = useCallback((child: ChildProfile) => {
    void (async () => {
      if (await hasPin(child.id)) {
        setPinTargetChild(child);
        setPinMode("enter");
      } else {
        setActiveChild(child);
      }
    })();
  }, []);

  /* ------------------------------ render ------------------------------ */

  if (authLoading || bootLoading) {
    return <Loading />;
  }

  // Privacidad (superpuesta al consentimiento).
  if (showPrivacy) {
    return <PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} onHome={() => setShowPrivacy(false)} />;
  }

  // Sin sesión → pantalla de entrada (email/contraseña + Google).
  if (!user) {
    return (
      <TutorAuthScreen
        mode={entryMode}
        onModeChange={setEntryMode}
        onSubmit={onSubmitEmail}
        onForgotPassword={onForgot}
        onGoogle={onGoogle}
        busy={busy}
        errorKey={entryError}
        infoKey={entryInfo}
      />
    );
  }

  // Sesión por contraseña sin verificar → verificación.
  if (provider === "password" && !user.emailVerified) {
    return (
      <VerifyEmailScreen
        onRecheck={onRecheckVerification}
        onResend={onResendVerification}
        onSignOut={onSignOut}
        busy={busy}
        infoKey={verifyInfo}
        showStillPending={verifyStillPending}
      />
    );
  }

  // Asistente de alta.
  if (setupStep === "role") {
    return (
      <RoleChoiceScreen
        onTutor={() => {
          setSetupRole("tutor");
          setSetupStep("adult");
        }}
        onKid={() => {
          setSetupRole("kid");
          setSetupStep("adult");
        }}
      />
    );
  }

  if (setupStep === "adult") {
    return (
      <AdultChallenge
        onPass={() => setSetupStep("consent")}
        onCancel={() => setSetupStep("role")}
      />
    );
  }

  if (setupStep === "consent") {
    return (
      <ConsentScreen
        onAccept={onConsentAccept}
        onDecline={onSignOut}
        onPrivacy={() => setShowPrivacy(true)}
      />
    );
  }

  if (setupStep === "profile") {
    return (
      <ProfileSetupScreen
        variant={setupRole === "kid" ? "kid" : "tutorChild"}
        busy={busy}
        errorKey={profileError}
        onCreate={onProfileCreate}
      />
    );
  }

  // PIN: fijar (tras crear un hijo adicional) o desbloquear (al cambiar de niño).
  if (pinMode === "set" && pinTargetChild) {
    return (
      <PinScreen
        mode="set"
        name={moteName(pinTargetChild.mote)}
        onSet={(pin) => {
          void setPin(pinTargetChild.id, pin).then(() => {
            setLockedIds((ids) => [...ids, pinTargetChild.id]);
            setPinMode(null);
            setActiveChild(pinTargetChild);
            setPinTargetChild(null);
          });
        }}
        onSkip={() => {
          setPinMode(null);
          setActiveChild(pinTargetChild);
          setPinTargetChild(null);
        }}
      />
    );
  }

  if (pinMode === "enter" && pinTargetChild) {
    return (
      <PinScreen
        mode="enter"
        name={moteName(pinTargetChild.mote)}
        onEnter={async (pin) => {
          const ok = await verifyPin(pinTargetChild.id, pin);
          if (ok) {
            setActiveChild(pinTargetChild);
            setPinMode(null);
            setPinTargetChild(null);
          }
          return ok;
        }}
        onBack={() => {
          setPinMode(null);
          setPinTargetChild(null);
        }}
      />
    );
  }

  // Cuenta de niño → juego directo (sin selector ni PIN).
  if (userDoc?.role === "kid") {
    return (
      <CloudGameProvider
        uid={user.uid}
        childId={null}
        seed={{ avatar: userDoc.avatar, mote: userDoc.mote, currentCourse: userDoc.currentCourse }}
      >
        <App />
      </CloudGameProvider>
    );
  }

  // Cuenta de tutor con perfil activo → juego.
  if (userDoc?.role === "tutor" && activeChild) {
    return (
      <CloudGameProvider
        uid={user.uid}
        childId={activeChild.id}
        seed={{ avatar: activeChild.avatar, mote: activeChild.mote, currentCourse: activeChild.currentCourse }}
      >
        <App />
      </CloudGameProvider>
    );
  }

  // Cuenta de tutor con varios hijos y ninguno activo → selector.
  if (userDoc?.role === "tutor" && children.length > 1) {
    return (
      <ChildSelectorScreen
        children={children}
        lockedIds={lockedIds}
        canAdd={children.length < MAX_CHILDREN}
        onSelect={onSelectChild}
        onAdd={() => {
          setSetupRole("tutor");
          setSetupStep("profile");
        }}
        onSignOut={onSignOut}
      />
    );
  }

  // Estado transitorio (recargando).
  return <Loading />;
}

function Loading() {
  const { t } = useTranslation("account");
  return <p style={{ padding: "2rem", textAlign: "center" }}>{t("loading")}</p>;
}
