import { describe, it, expect, beforeEach } from "vitest";
import {
  isValidPin,
  setPin,
  hasPin,
  verifyPin,
  clearPin,
  type KeyValueStore,
} from "./pinLock";

function memoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    get: async (k) => (map.has(k) ? map.get(k)! : null),
    set: async (k, v) => void map.set(k, v),
    remove: async (k) => void map.delete(k),
  };
}

describe("isValidPin", () => {
  it("solo acepta 4 dígitos", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("0000")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});

describe("pin lock por perfil en el dispositivo", () => {
  let store: KeyValueStore;
  beforeEach(() => {
    store = memoryStore();
  });

  it("fija, detecta y verifica el PIN de un perfil", async () => {
    expect(await hasPin("child-a", store)).toBe(false);
    await setPin("child-a", "1234", store);
    expect(await hasPin("child-a", store)).toBe(true);
    expect(await verifyPin("child-a", "1234", store)).toBe(true);
    expect(await verifyPin("child-a", "0000", store)).toBe(false);
  });

  it("aísla el PIN entre perfiles", async () => {
    await setPin("child-a", "1111", store);
    await setPin("child-b", "2222", store);
    expect(await verifyPin("child-a", "1111", store)).toBe(true);
    expect(await verifyPin("child-a", "2222", store)).toBe(false);
    expect(await verifyPin("child-b", "2222", store)).toBe(true);
  });

  it("rechaza fijar un PIN mal formado", async () => {
    await expect(setPin("child-a", "12", store)).rejects.toThrow("invalid-pin");
  });

  it("clearPin elimina el pestillo", async () => {
    await setPin("child-a", "1234", store);
    await clearPin("child-a", store);
    expect(await hasPin("child-a", store)).toBe(false);
    expect(await verifyPin("child-a", "1234", store)).toBe(false);
  });
});
