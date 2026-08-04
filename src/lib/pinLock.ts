/*
 * PIN-pestillo local del perfil de hijo (ADR-003 §4, ADR-004 §6).
 *
 * El PIN es control de acceso LOCAL del dispositivo: solo evita que un hermano
 * abra el perfil equivocado en el mismo dispositivo. NUNCA sale del dispositivo
 * ni se escribe en Firestore (las reglas rechazan `pin`/`pinHash` en todo
 * documento). Vive en Capacitor Preferences (que en Android usa almacenamiento
 * nativo y en navegador cae a localStorage).
 *
 * Solo aplica a la cuenta de TUTOR con más de un perfil de hijo. La cuenta de
 * niño no tiene PIN (la cuenta ya es de ese niño).
 *
 * El almacén es inyectable para poder testear la lógica sin el runtime de
 * Capacitor; en producción se usa el respaldo por defecto (Preferences).
 */
import { Preferences } from "@capacitor/preferences";

export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const capacitorStore: KeyValueStore = {
  async get(key) {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  },
  async set(key, value) {
    await Preferences.set({ key, value });
  },
  async remove(key) {
    await Preferences.remove({ key });
  },
};

const KEY_PREFIX = "pinlock.";

function keyFor(childId: string): string {
  return `${KEY_PREFIX}${childId}`;
}

/** ¿El PIN tiene forma válida? 4 dígitos. */
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/** Fija (o reemplaza) el PIN de un perfil de hijo en este dispositivo. */
export async function setPin(
  childId: string,
  pin: string,
  store: KeyValueStore = capacitorStore,
): Promise<void> {
  if (!isValidPin(pin)) throw new Error("invalid-pin");
  await store.set(keyFor(childId), pin);
}

/** ¿Este perfil tiene PIN configurado en este dispositivo? */
export async function hasPin(
  childId: string,
  store: KeyValueStore = capacitorStore,
): Promise<boolean> {
  return (await store.get(keyFor(childId))) !== null;
}

/** Verifica el PIN introducido contra el guardado en el dispositivo. */
export async function verifyPin(
  childId: string,
  pin: string,
  store: KeyValueStore = capacitorStore,
): Promise<boolean> {
  const saved = await store.get(keyFor(childId));
  return saved !== null && saved === pin;
}

/** Elimina el PIN de un perfil (p. ej. al borrar el perfil). */
export async function clearPin(
  childId: string,
  store: KeyValueStore = capacitorStore,
): Promise<void> {
  await store.remove(keyFor(childId));
}
