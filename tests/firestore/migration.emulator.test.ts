/*
 * Validación del traslado verify-before-delete contra el EMULADOR real (Épica E).
 *
 * Lo que solo el emulador puede confirmar (el mock unitario no):
 *   1. `getDocFromServer` lee del servidor (ruta de verificación de integridad).
 *   2. El round-trip real de serialización de Firestore — que reordena las claves
 *      de los mapas y puede reordenar arrays — sigue siendo EQUIVALENTE bajo
 *      `courseStatesEquivalent` (comparación estructural, no `JSON.stringify`).
 *   3. Un documento minimizado por `courseStateToCloudDoc` supera `validCourseDoc`
 *      de las reglas (escritura aceptada) en las rutas de Modelo A y Modelo B.
 *
 * Corre con `npm run test:rules` (arranca el emulador de Firestore).
 */
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDocFromServer, Timestamp, type Firestore } from "firebase/firestore";
import { courseStateToCloudDoc, cloudDocToCourseState } from "@/lib/firebase/courseMapping";
import { mergeNonRegressing, courseStatesEquivalent } from "@/lib/firebase/migration";
import { emptyCourseState, type CourseState } from "@/lib/storage";

const PROJECT_ID = "demo-repasos";
const rulesPath = fileURLToPath(new URL("../../firestore.rules", import.meta.url));

let env: RulesTestEnvironment;

const KID_GOOGLE = {
  email: "kid@gmail.com",
  email_verified: true,
  firebase: { sign_in_provider: "google.com" },
};

function db(uid: string): Firestore {
  return env.authenticatedContext(uid, KID_GOOGLE).firestore() as unknown as Firestore;
}

/** Siembra el documento de usuario padre (las reglas leen su `role` vía ownerRole). */
async function seedUser(uid: string, role: "kid" | "tutor"): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const fs = ctx.firestore() as unknown as Firestore;
    const base = {
      role,
      locale: "es",
      consentimiento: { version: "2026-08", acceptedAt: Timestamp.fromMillis(1_700_000_000_000) },
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
    };
    const data =
      role === "kid"
        ? { ...base, mote: "explorer", avatar: "fox", currentCourse: "3" }
        : { ...base, childrenCount: 1 };
    await setDoc(doc(fs, "users", uid), data);
  });
}

/** CourseState con avance rico: varias claves de mapa y arrays (para forzar reordenación). */
function richProgress(): CourseState {
  const cs = emptyCourseState();
  cs.profile = { avatarId: "fox", nicknameId: "explorer", nicknameCustom: "texto libre" };
  cs.streak = { current: 3, longest: 6, lastPlayedDate: "2026-08-04" };
  cs.stars = { total: 42 };
  cs.badges.unlocked = { "first-star": "2026-07-01", streak7: "2026-07-20", explorer: "2026-07-25" };
  cs.dailyGoal = { lastDoneDate: "2026-08-04", totalCompleted: 9 };
  cs.progress.correctByTopic = { sumas: 8, restas: 5, multiplicaciones: 3 };
  cs.progress.correctBySubject = { matematicas: 16, lengua: 4 };
  cs.progress.subjectsTried = ["matematicas", "lengua", "naturales"];
  cs.progress.correctExerciseIds = ["e1", "e2", "e3", "e4"];
  cs.progress.failedExerciseIds = ["e9", "e8"];
  return cs;
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(rulesPath, "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe("verify-before-delete contra el emulador — round-trip real", () => {
  it("Modelo B (kid): escribe minimizado, relee del SERVIDOR y es equivalente", async () => {
    const uid = "kid-uid";
    await seedUser(uid, "kid");
    const intended = courseStateToCloudDoc(richProgress());
    const ref = doc(db(uid), "users", uid, "courses", "3");

    await setDoc(ref, intended);
    const snap = await getDocFromServer(ref);
    expect(snap.exists()).toBe(true);
    const readback = cloudDocToCourseState(snap.data());

    // Firestore puede reordenar claves de mapas; la equivalencia estructural aguanta.
    expect(courseStatesEquivalent(readback, intended)).toBe(true);
  });

  it("Modelo A (tutor/child): misma equivalencia en la ruta anidada", async () => {
    const uid = "tutor-uid";
    await seedUser(uid, "tutor");
    const intended = courseStateToCloudDoc(richProgress());
    const ref = doc(db(uid), "users", uid, "children", "child-1", "courses", "5");

    await setDoc(ref, intended);
    const readback = cloudDocToCourseState((await getDocFromServer(ref)).data());
    expect(courseStatesEquivalent(readback, intended)).toBe(true);
  });

  it("una reescritura idempotente produce un documento equivalente (no corrompe)", async () => {
    const uid = "kid-uid";
    await seedUser(uid, "kid");
    const ref = doc(db(uid), "users", uid, "courses", "3");

    const first = courseStateToCloudDoc(richProgress());
    await setDoc(ref, first);
    const afterFirst = cloudDocToCourseState((await getDocFromServer(ref)).data());

    // Segunda pasada: funde local con lo que hay en nube y reescribe.
    const merged = mergeNonRegressing(richProgress(), afterFirst);
    const second = courseStateToCloudDoc(merged);
    await setDoc(ref, second);
    const afterSecond = cloudDocToCourseState((await getDocFromServer(ref)).data());

    expect(courseStatesEquivalent(afterSecond, afterFirst)).toBe(true);
  });

  it("la fusión anti-retroceso no reduce un progreso de nube mayor", async () => {
    const uid = "kid-uid";
    await seedUser(uid, "kid");
    const ref = doc(db(uid), "users", uid, "courses", "3");

    // Nube ya tiene más estrellas que el local.
    const cloudPrev = richProgress();
    cloudPrev.stars.total = 100;
    await setDoc(ref, courseStateToCloudDoc(cloudPrev));

    const cloudNow = cloudDocToCourseState((await getDocFromServer(ref)).data());
    const merged = mergeNonRegressing(richProgress(), cloudNow); // local tiene 42
    await setDoc(ref, courseStateToCloudDoc(merged));

    const final = cloudDocToCourseState((await getDocFromServer(ref)).data());
    expect(final.stars.total).toBe(100);
  });
});
