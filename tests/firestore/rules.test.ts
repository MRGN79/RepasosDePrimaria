/*
 * Tests de las reglas de seguridad de Firestore (ADR-003 §3 + ADR-004 §2, Inc. 3).
 *
 * Es el entregable más crítico del Incremento 3. Cubren:
 *   - Frontera de acceso (uid + email_verified) y aislamiento entre cuentas.
 *   - Creación de documentos de usuario con verificación cruzada proveedor↔rol
 *     ASIMÉTRICA (password⟹tutor, kid⟹google.com, (google.com,tutor) admitido).
 *   - Inmutabilidad de role / consentimiento / createdAt y allowlist de campos.
 *   - Ramificación por rol: tutor con children/ (sin courses/ directo); kid con
 *     courses/ directo (sin children/).
 *   - Tope de hijos por contador transaccional coherente (getAfter).
 *   - Prohibición de PII (email/displayName/photoURL/…/PIN) en todo documento.
 *
 * Corren contra el emulador de Firestore. Lanzar con `npm run test:rules`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
  type RulesTestContext,
} from "@firebase/rules-unit-testing";
import {
  doc,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  runTransaction,
  Timestamp,
  type Firestore,
} from "firebase/firestore";

const PROJECT_ID = "demo-repasos";
const rulesPath = fileURLToPath(new URL("../../firestore.rules", import.meta.url));

let env: RulesTestEnvironment;

// --- Tokens de autenticación (segundo argumento de authenticatedContext) ------
// El emulador rellena request.auth.token con estas opciones. El proveedor real
// no falsificable vive en firebase.sign_in_provider.
const TUTOR_PW = { email: "parent@example.com", email_verified: true, firebase: { sign_in_provider: "password" } };
const TUTOR_GOOGLE = { email: "parent@gmail.com", email_verified: true, firebase: { sign_in_provider: "google.com" } };
const KID_GOOGLE = { email: "kid@gmail.com", email_verified: true, firebase: { sign_in_provider: "google.com" } };
const UNVERIFIED_PW = { email: "parent@example.com", email_verified: false, firebase: { sign_in_provider: "password" } };

// --- Builders de documentos válidos ------------------------------------------
const consent = () => ({ version: "2026-08", acceptedAt: Timestamp.fromMillis(1_700_000_000_000) });

const tutorDoc = (over: Record<string, unknown> = {}) => ({
  role: "tutor",
  locale: "es",
  consentimiento: consent(),
  createdAt: Timestamp.fromMillis(1_700_000_000_000),
  childrenCount: 0,
  ...over,
});

const kidDoc = (over: Record<string, unknown> = {}) => ({
  role: "kid",
  locale: "es",
  consentimiento: consent(),
  createdAt: Timestamp.fromMillis(1_700_000_000_000),
  mote: "explorer",
  avatar: "fox",
  currentCourse: "3",
  ...over,
});

const childDoc = (over: Record<string, unknown> = {}) => ({
  mote: "captain",
  avatar: "owl",
  currentCourse: "2",
  createdAt: Timestamp.fromMillis(1_700_000_000_000),
  ...over,
});

// CourseState (ADR-002) serializado: exactamente las 6 claves de primer nivel.
const courseDoc = (over: Record<string, unknown> = {}) => ({
  profile: { avatarId: "fox", nicknameId: "explorer", nicknameCustom: null },
  streak: { current: 0, longest: 0, lastPlayedDate: null },
  stars: { total: 0 },
  badges: { unlocked: {} },
  dailyGoal: { lastDoneDate: null, totalCompleted: 0 },
  progress: {
    correctByTopic: {},
    correctBySubject: {},
    subjectsTried: [],
    correctExerciseIds: [],
    failedExerciseIds: [],
  },
  ...over,
});

// Siembra un documento saltándose las reglas (estado de partida de un test).
async function seed(path: string, data: Record<string, unknown>): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, path), data);
  });
}

function db(token: object | null, uid = "u-owner"): Firestore {
  const ctx: RulesTestContext =
    token === null ? env.unauthenticatedContext() : env.authenticatedContext(uid, token);
  return ctx.firestore() as unknown as Firestore;
}

// Crea un hijo de forma coherente con el contador (misma transacción), como
// hará la app. Devuelve la promesa para envolver en assertSucceeds/assertFails.
function createChildTransaction(database: Firestore, uid: string, child = childDoc()) {
  return runTransaction(database, async (tx) => {
    const userRef = doc(database, `users/${uid}`);
    const snap = await tx.get(userRef);
    const count = (snap.data()?.childrenCount as number) ?? 0;
    const childRef = doc(collection(database, `users/${uid}/children`));
    tx.set(childRef, child);
    tx.update(userRef, { childrenCount: count + 1 });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(rulesPath, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe("Frontera de acceso (uid + email_verified)", () => {
  it("deniega lectura/escritura sin autenticar", async () => {
    await seed("users/u-owner", tutorDoc());
    const anon = db(null);
    await assertFails(getDoc(doc(anon, "users/u-owner")));
    await assertFails(setDoc(doc(anon, "users/u-owner"), tutorDoc()));
  });

  it("deniega a un usuario autenticado pero con email sin verificar", async () => {
    const unverified = db(UNVERIFIED_PW, "u-owner");
    await assertFails(setDoc(doc(unverified, "users/u-owner"), tutorDoc()));
  });

  it("permite al dueño leer su propio documento", async () => {
    await seed("users/u-owner", tutorDoc());
    await assertSucceeds(getDoc(doc(db(TUTOR_PW, "u-owner"), "users/u-owner")));
  });

  it("deniega leer/escribir el árbol de OTRO uid", async () => {
    await seed("users/u-other", tutorDoc());
    const intruder = db(TUTOR_PW, "u-owner");
    await assertFails(getDoc(doc(intruder, "users/u-other")));
    await assertFails(setDoc(doc(intruder, "users/u-other"), tutorDoc()));
  });

  it("una cuenta kid no puede leer el subárbol de una cuenta tutor ajena", async () => {
    await seed("users/u-tutor", tutorDoc());
    await seed("users/u-tutor/children/c1", childDoc());
    const kid = db(KID_GOOGLE, "u-kid");
    await assertFails(getDoc(doc(kid, "users/u-tutor/children/c1")));
  });
});

describe("Creación del documento de usuario — verificación cruzada proveedor↔rol", () => {
  it("password + role tutor + childrenCount 0 → permitido", async () => {
    await assertSucceeds(setDoc(doc(db(TUTOR_PW, "u1"), "users/u1"), tutorDoc()));
  });

  it("google.com + role tutor → permitido (asimetría: la UI gobierna, no la regla)", async () => {
    await assertSucceeds(setDoc(doc(db(TUTOR_GOOGLE, "u1"), "users/u1"), tutorDoc()));
  });

  it("google.com + role kid → permitido", async () => {
    await assertSucceeds(setDoc(doc(db(KID_GOOGLE, "u1"), "users/u1"), kidDoc()));
  });

  it("password + role kid → DENEGADO (kid ⟹ google.com)", async () => {
    await assertFails(setDoc(doc(db(UNVERIFIED_PW, "u1"), "users/u1"), kidDoc()));
    // incluso con email verificado por contraseña, un kid no puede existir:
    const pwVerified = { email: "x@y.com", email_verified: true, firebase: { sign_in_provider: "password" } };
    await assertFails(setDoc(doc(db(pwVerified, "u1"), "users/u1"), kidDoc()));
  });

  it("tutor con childrenCount != 0 en la creación → DENEGADO", async () => {
    await assertFails(setDoc(doc(db(TUTOR_PW, "u1"), "users/u1"), tutorDoc({ childrenCount: 3 })));
  });

  it("role desconocido → DENEGADO", async () => {
    await assertFails(setDoc(doc(db(TUTOR_PW, "u1"), "users/u1"), tutorDoc({ role: "admin" })));
  });

  it("sin consentimiento → DENEGADO (no hay escritura en nube antes de consentir)", async () => {
    const { consentimiento, ...noConsent } = tutorDoc() as Record<string, unknown>;
    void consentimiento;
    await assertFails(setDoc(doc(db(TUTOR_PW, "u1"), "users/u1"), noConsent));
  });

  it("campo desconocido extra → DENEGADO (allowlist)", async () => {
    await assertFails(setDoc(doc(db(TUTOR_PW, "u1"), "users/u1"), tutorDoc({ nickname: "papa" })));
  });

  it("kid con forma de tutor (childrenCount) → DENEGADO (allowlist por rol)", async () => {
    await assertFails(setDoc(doc(db(KID_GOOGLE, "u1"), "users/u1"), kidDoc({ childrenCount: 0 })));
  });

  it("locale inválido → DENEGADO", async () => {
    await assertFails(setDoc(doc(db(TUTOR_PW, "u1"), "users/u1"), tutorDoc({ locale: "fr" })));
  });
});

describe("Prohibición de PII / credenciales en todo documento", () => {
  for (const field of ["email", "displayName", "photoURL", "name", "birthDate", "pin", "pinHash"]) {
    it(`documento de usuario con '${field}' → DENEGADO`, async () => {
      await assertFails(setDoc(doc(db(TUTOR_GOOGLE, "u1"), "users/u1"), tutorDoc({ [field]: "x" })));
    });
  }

  it("perfil de hijo con photoURL → DENEGADO", async () => {
    await seed("users/u-tutor", tutorDoc());
    const database = db(TUTOR_PW, "u-tutor");
    await assertFails(
      runTransaction(database, async (tx) => {
        const userRef = doc(database, "users/u-tutor");
        const childRef = doc(collection(database, "users/u-tutor/children"));
        tx.set(childRef, childDoc({ photoURL: "http://x/pic.jpg" }));
        tx.update(userRef, { childrenCount: 1 });
      }),
    );
  });

  it("documento de curso con email → DENEGADO", async () => {
    await seed("users/u-kid", kidDoc());
    await assertFails(
      setDoc(doc(db(KID_GOOGLE, "u-kid"), "users/u-kid/courses/3"), courseDoc({ email: "kid@gmail.com" })),
    );
  });
});

describe("Inmutabilidad y actualización", () => {
  beforeEach(async () => {
    await seed("users/u-owner", tutorDoc());
  });

  it("cambiar role → DENEGADO", async () => {
    await assertFails(updateDoc(doc(db(TUTOR_PW, "u-owner"), "users/u-owner"), { role: "kid" }));
  });

  it("cambiar consentimiento → DENEGADO", async () => {
    await assertFails(
      updateDoc(doc(db(TUTOR_PW, "u-owner"), "users/u-owner"), {
        consentimiento: { version: "otra", acceptedAt: Timestamp.fromMillis(1) },
      }),
    );
  });

  it("cambiar createdAt → DENEGADO", async () => {
    await assertFails(
      updateDoc(doc(db(TUTOR_PW, "u-owner"), "users/u-owner"), { createdAt: Timestamp.fromMillis(1) }),
    );
  });

  it("cambiar locale → permitido", async () => {
    await assertSucceeds(updateDoc(doc(db(TUTOR_PW, "u-owner"), "users/u-owner"), { locale: "en" }));
  });

  it("añadir campo prohibido en update → DENEGADO", async () => {
    await assertFails(updateDoc(doc(db(TUTOR_PW, "u-owner"), "users/u-owner"), { email: "p@x.com" }));
  });
});

describe("Ramificación por rol", () => {
  it("tutor: crear hijo con contador coherente (transacción) → permitido", async () => {
    await seed("users/u-tutor", tutorDoc());
    await assertSucceeds(createChildTransaction(db(TUTOR_PW, "u-tutor"), "u-tutor"));
  });

  it("tutor: crear hijo SIN bump del contador (set suelto) → DENEGADO", async () => {
    await seed("users/u-tutor", tutorDoc());
    const database = db(TUTOR_PW, "u-tutor");
    await assertFails(setDoc(doc(database, "users/u-tutor/children/c1"), childDoc()));
  });

  it("tutor: escribir courses/{curso} directo en la raíz → DENEGADO", async () => {
    await seed("users/u-tutor", tutorDoc());
    await assertFails(setDoc(doc(db(TUTOR_PW, "u-tutor"), "users/u-tutor/courses/3"), courseDoc()));
  });

  it("tutor: escribir progreso bajo children/{childId}/courses/{curso} → permitido", async () => {
    await seed("users/u-tutor", tutorDoc());
    await seed("users/u-tutor/children/c1", childDoc());
    await assertSucceeds(
      setDoc(doc(db(TUTOR_PW, "u-tutor"), "users/u-tutor/children/c1/courses/3"), courseDoc()),
    );
  });

  it("kid: escribir courses/{curso} directo → permitido", async () => {
    await seed("users/u-kid", kidDoc());
    await assertSucceeds(setDoc(doc(db(KID_GOOGLE, "u-kid"), "users/u-kid/courses/3"), courseDoc()));
  });

  it("kid: crear subcolección children → DENEGADO", async () => {
    await seed("users/u-kid", kidDoc());
    await assertFails(setDoc(doc(db(KID_GOOGLE, "u-kid"), "users/u-kid/children/c1"), childDoc()));
  });

  it("curso inválido (7) → DENEGADO", async () => {
    await seed("users/u-kid", kidDoc());
    await assertFails(setDoc(doc(db(KID_GOOGLE, "u-kid"), "users/u-kid/courses/7"), courseDoc()));
  });

  it("documento de curso con clave de primer nivel desconocida → DENEGADO", async () => {
    await seed("users/u-kid", kidDoc());
    await assertFails(
      setDoc(doc(db(KID_GOOGLE, "u-kid"), "users/u-kid/courses/3"), courseDoc({ extra: 1 })),
    );
  });
});

describe("Tope de hijos (contador transaccional)", () => {
  it("crear hijos hasta el tope → permitido; el que excede → DENEGADO", async () => {
    await seed("users/u-tutor", tutorDoc({ childrenCount: 5 }));
    // 6.º hijo: contador pasa de 5 a 6 (== tope) → permitido
    await assertSucceeds(createChildTransaction(db(TUTOR_PW, "u-tutor"), "u-tutor"));
    // Ahora el contador está en 6; el 7.º debe fallar
    await assertFails(createChildTransaction(db(TUTOR_PW, "u-tutor"), "u-tutor"));
  });

  it("update del documento de tutor que salta el contador (+3) → DENEGADO", async () => {
    await seed("users/u-tutor", tutorDoc({ childrenCount: 1 }));
    await assertFails(updateDoc(doc(db(TUTOR_PW, "u-tutor"), "users/u-tutor"), { childrenCount: 4 }));
  });
});
