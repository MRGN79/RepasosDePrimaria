import { describe, it, expect } from "vitest";
import enAuth from "@locales/en/auth.json";
import esAuth from "@locales/es/auth.json";

/*
 * Paridad EN/ES del namespace "auth" (i18n, regla del proyecto: toda clave
 * visible existe en ambos idiomas). Recorre la estructura y compara el conjunto
 * de rutas de claves; además verifica que las claves de error que el servicio
 * de auth puede devolver existen en ambos locales.
 */

type Bag = Record<string, unknown>;

function keyPaths(obj: Bag, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object" && !Array.isArray(v)
      ? keyPaths(v as Bag, path)
      : [path];
  });
}

describe("i18n auth: paridad EN/ES", () => {
  it("EN y ES tienen exactamente el mismo conjunto de claves", () => {
    const en = keyPaths(enAuth as Bag).sort();
    const es = keyPaths(esAuth as Bag).sort();
    expect(es).toEqual(en);
  });

  it("todos los valores son cadenas no vacías en ambos idiomas", () => {
    for (const bag of [enAuth, esAuth] as Bag[]) {
      for (const path of keyPaths(bag)) {
        const value = path
          .split(".")
          .reduce<unknown>((acc, seg) => (acc as Bag)?.[seg], bag);
        expect(typeof value, `${path} debe ser cadena`).toBe("string");
        expect((value as string).length, `${path} no debe estar vacía`).toBeGreaterThan(0);
      }
    }
  });

  it("las claves de error del servicio de auth existen en ambos locales", () => {
    const errorKeys = [
      "errors.emailInUse",
      "errors.invalidEmail",
      "errors.weakPassword",
      "errors.invalidCredentials",
      "errors.tooManyRequests",
      "errors.network",
      "errors.requiresRecentLogin",
      "errors.cancelled",
      "errors.generic",
    ];
    for (const bag of [enAuth, esAuth] as Bag[]) {
      for (const key of errorKeys) {
        const value = key.split(".").reduce<unknown>((acc, seg) => (acc as Bag)?.[seg], bag);
        expect(typeof value, `${key} presente`).toBe("string");
      }
    }
  });
});
