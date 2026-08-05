/*
 * Capa de acceso a datos de Firestore (ADR-003 §3/§5, ADR-004 §2/§3, Inc. 3).
 *
 * Wrapper fino y agnóstico de React sobre Firestore. Materializa el esquema
 * unificado users/{uid} con `role`:
 *   - tutor: users/{uid} + children/{childId} + children/{childId}/courses/{curso}
 *   - kid:   users/{uid} + users/{uid}/courses/{curso}
 *
 * Principios que este módulo respeta:
 *   - Minimización (ADR-004 §3): de Google solo se usa el uid. Este módulo NUNCA
 *     escribe email / displayName / photoURL / nombre / foto en Firestore.
 *     `mote`/`avatar` salen de catálogo cerrado; el progreso pasa por
 *     courseStateToCloudDoc, que descarta el texto libre.
 *   - Sin escritura antes del consentimiento (ADR-004 §4): la creación del
 *     documento de usuario exige el objeto `consentimiento`; hasta entonces la
 *     app opera en local.
 *   - Tope de hijos coherente (ADR-003 §5): createChildProfile usa una
 *     transacción que incrementa childrenCount y lo valida contra el tope; las
 *     reglas rechazan una creación de hijo que no venga acompañada del bump.
 */
import {
  doc,
  collection,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseFirestore } from "./config";
import { courseStateToCloudDoc, cloudDocToCourseState } from "./courseMapping";
import type { CourseState, Curso, Language } from "@/lib/storage";

export type Role = "tutor" | "kid";

/** Versión del texto de consentimiento aceptado (coherente con Inc. 6). */
export const CONSENT_VERSION = "2026-08";

/** Tope de perfiles de hijo por cuenta de tutor (ADR-003 §5). Coincide con las reglas. */
export const MAX_CHILDREN = 6;

export interface TutorUserDoc {
  role: "tutor";
  locale: Language;
  childrenCount: number;
}

export interface KidUserDoc {
  role: "kid";
  locale: Language;
  mote: string;
  avatar: string;
  currentCourse: Curso;
}

export type UserDoc = TutorUserDoc | KidUserDoc;

export interface ChildProfile {
  id: string;
  mote: string;
  avatar: string;
  currentCourse: Curso;
}

function db(): Firestore {
  return getFirebaseFirestore();
}

/** Lee el documento de usuario o null si aún no existe (cuenta sin alta completada). */
export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db(), "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}

/**
 * Alta de la cuenta de tutor. Exige que el consentimiento ya esté aceptado
 * (la primera escritura en la nube). childrenCount arranca en 0.
 */
export async function createTutorAccount(uid: string, locale: Language): Promise<void> {
  await setDoc(doc(db(), "users", uid), {
    role: "tutor",
    locale,
    childrenCount: 0,
    consentimiento: { version: CONSENT_VERSION, acceptedAt: serverTimestamp() },
    createdAt: serverTimestamp(),
  });
}

/**
 * Alta de la cuenta de niño (Google/Family Link). Funde documento de cuenta y
 * perfil: mote/avatar/currentCourse viven en la raíz. Exige consentimiento
 * aceptado (ADR-004 §4).
 */
export async function createKidAccount(
  uid: string,
  locale: Language,
  mote: string,
  avatar: string,
  currentCourse: Curso,
): Promise<void> {
  await setDoc(doc(db(), "users", uid), {
    role: "kid",
    locale,
    mote,
    avatar,
    currentCourse,
    consentimiento: { version: CONSENT_VERSION, acceptedAt: serverTimestamp() },
    createdAt: serverTimestamp(),
  });
}

export class ChildLimitReachedError extends Error {
  constructor() {
    super("child-limit-reached");
    this.name = "ChildLimitReachedError";
  }
}

/**
 * Crea un perfil de hijo bajo la cuenta de tutor de forma atómica: incrementa
 * childrenCount y crea el documento en la MISMA transacción, como exigen las
 * reglas (ADR-003 §5). Lanza ChildLimitReachedError si se alcanzó el tope.
 * Devuelve el id del nuevo perfil.
 */
export async function createChildProfile(
  uid: string,
  profile: { mote: string; avatar: string; currentCourse: Curso },
): Promise<string> {
  const childRef = doc(collection(db(), "users", uid, "children"));
  await runTransaction(db(), async (tx) => {
    const userRef = doc(db(), "users", uid);
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("tutor-doc-missing");
    const count = (snap.data().childrenCount as number) ?? 0;
    if (count >= MAX_CHILDREN) throw new ChildLimitReachedError();
    tx.set(childRef, {
      mote: profile.mote,
      avatar: profile.avatar,
      currentCourse: profile.currentCourse,
      createdAt: serverTimestamp(),
    });
    tx.update(userRef, { childrenCount: count + 1 });
  });
  return childRef.id;
}

/** Lista los perfiles de hijo de una cuenta de tutor. */
export async function listChildren(uid: string): Promise<ChildProfile[]> {
  const snap = await getDocs(collection(db(), "users", uid, "children"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      mote: data.mote as string,
      avatar: data.avatar as string,
      currentCourse: data.currentCourse as Curso,
    };
  });
}

/** Ruta del documento de perfil: raíz para el niño, subcolección para el hijo del tutor. */
function coursesPath(uid: string, childId: string | null): string[] {
  return childId === null
    ? ["users", uid, "courses"]
    : ["users", uid, "children", childId, "courses"];
}

/**
 * Carga el CourseState de un curso para un perfil. `childId` null = cuenta de
 * niño (cursos en la raíz); con childId = perfil de hijo bajo el tutor.
 * Devuelve null si ese curso aún no tiene documento en la nube.
 */
export async function loadCourse(
  uid: string,
  childId: string | null,
  curso: Curso,
): Promise<CourseState | null> {
  const [c0, c1, c2, c3, c4] = coursesPath(uid, childId);
  const ref = childId === null ? doc(db(), c0, c1, c2, curso) : doc(db(), c0, c1, c2, c3, c4, curso);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return cloudDocToCourseState(snap.data());
}

/**
 * Como `loadCourse`, pero fuerza la lectura desde el SERVIDOR (`getDocFromServer`),
 * ignorando la caché offline de Firestore. Es la relectura de verificación del
 * traslado (verify-before-delete): con la persistencia offline activada, un
 * `getDoc` normal podría devolver el valor desde la caché local y "confirmar" una
 * escritura que el servidor aún no tiene. Sin red, esta lectura falla (rechaza),
 * lo que deja el curso pendiente — el comportamiento correcto: sin red no se puede
 * afirmar que el servidor lo tiene. Devuelve null si el documento no existe.
 */
export async function loadCourseFromServer(
  uid: string,
  childId: string | null,
  curso: Curso,
): Promise<CourseState | null> {
  const [c0, c1, c2, c3, c4] = coursesPath(uid, childId);
  const ref = childId === null ? doc(db(), c0, c1, c2, curso) : doc(db(), c0, c1, c2, c3, c4, curso);
  const snap = await getDocFromServer(ref);
  if (!snap.exists()) return null;
  return cloudDocToCourseState(snap.data());
}

/** Guarda el CourseState de un curso (minimizado) para un perfil. */
export async function saveCourse(
  uid: string,
  childId: string | null,
  curso: Curso,
  cs: CourseState,
): Promise<void> {
  const [c0, c1, c2, c3, c4] = coursesPath(uid, childId);
  const ref = childId === null ? doc(db(), c0, c1, c2, curso) : doc(db(), c0, c1, c2, c3, c4, curso);
  await setDoc(ref, courseStateToCloudDoc(cs));
}

/** Cambia el curso activo de una cuenta de niño. */
export async function setKidCurrentCourse(uid: string, curso: Curso): Promise<void> {
  await updateDoc(doc(db(), "users", uid), { currentCourse: curso });
}

/** Cambia el curso activo de un perfil de hijo bajo el tutor. */
export async function setChildCurrentCourse(
  uid: string,
  childId: string,
  curso: Curso,
): Promise<void> {
  await updateDoc(doc(db(), "users", uid, "children", childId), { currentCourse: curso });
}
