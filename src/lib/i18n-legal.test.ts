import { describe, it, expect } from "vitest";

/*
 * Verificación i18n del copy legal y de privacidad (Inc. 6, US-D3).
 *  - El namespace "legal" (política de privacidad) resuelve en EN y ES con las
 *    MISMAS claves y con los tipos correctos (string / lista de strings).
 *  - Las claves que consume PrivacyPolicyScreen existen en ambos idiomas.
 *  - El copy de privacidad reescrito (footer y enlace de Ajustes) existe en
 *    EN y ES.
 * Test de datos (sin DOM), en línea con src/lib/i18n-content.test.ts.
 */

import enLegal from "@locales/en/legal.json";
import esLegal from "@locales/es/legal.json";
import enCommon from "@locales/en/common.json";
import esCommon from "@locales/es/common.json";
import enSettings from "@locales/en/settings.json";
import esSettings from "@locales/es/settings.json";
import enAuth from "@locales/en/auth.json";
import esAuth from "@locales/es/auth.json";

type Json = Record<string, unknown>;

function get(bundle: Json, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, seg) => {
    if (acc && typeof acc === "object" && seg in (acc as Json)) return (acc as Json)[seg];
    return undefined;
  }, bundle);
}

/** Rutas de todas las hojas (string) de un objeto, para comparar estructura. */
function leafPaths(obj: unknown, prefix = ""): string[] {
  if (Array.isArray(obj)) return [prefix];
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Json).flatMap(([k, v]) =>
      leafPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

// Debe reflejar SECTIONS de PrivacyPolicyScreen.tsx.
const PLAIN_SECTIONS = ["design", "legalBasis", "location", "retention", "security", "contact"];
const BULLET_SECTIONS = ["whatWeProcess", "whatWeDont", "rights"];

describe("namespace legal: paridad EN/ES de la política de privacidad", () => {
  it("EN y ES tienen exactamente las mismas claves", () => {
    const en = leafPaths(enLegal).sort();
    const es = leafPaths(esLegal).sort();
    expect(es).toEqual(en);
  });

  for (const [lng, bundle] of [
    ["en", enLegal],
    ["es", esLegal],
  ] as const) {
    it(`(${lng}) cabecera de la política presente y no vacía`, () => {
      for (const key of ["privacy.title", "privacy.updated", "privacy.intro"]) {
        const v = get(bundle as Json, key);
        expect(typeof v, `${key} en ${lng}`).toBe("string");
        expect((v as string).length, `${key} en ${lng} no vacío`).toBeGreaterThan(0);
      }
    });

    it(`(${lng}) cada sección de PrivacyPolicyScreen tiene título y cuerpo`, () => {
      for (const id of [...PLAIN_SECTIONS, ...BULLET_SECTIONS]) {
        expect(typeof get(bundle as Json, `privacy.${id}.title`), `${id}.title/${lng}`).toBe("string");
        expect(typeof get(bundle as Json, `privacy.${id}.body`), `${id}.body/${lng}`).toBe("string");
      }
    });

    it(`(${lng}) las secciones con lista tienen bullets no vacíos (string[])`, () => {
      for (const id of BULLET_SECTIONS) {
        const bullets = get(bundle as Json, `privacy.${id}.bullets`);
        expect(Array.isArray(bullets), `${id}.bullets/${lng} es array`).toBe(true);
        const arr = bullets as unknown[];
        expect(arr.length, `${id}.bullets/${lng} no vacío`).toBeGreaterThan(0);
        for (const item of arr) expect(typeof item).toBe("string");
      }
    });
  }
});

describe("copy de privacidad reescrito (Inc. 6): presente en EN y ES", () => {
  it("footer.privacy existe y ya no promete que nada sale del dispositivo", () => {
    for (const [lng, bundle] of [
      ["en", enCommon],
      ["es", esCommon],
    ] as const) {
      const v = get(bundle as Json, "footer.privacy");
      expect(typeof v, `footer.privacy/${lng}`).toBe("string");
    }
    // La antigua promesa absoluta ("only on this device" / "Todo se guarda
    // únicamente en este dispositivo") no debe seguir en el footer.
    expect((get(enCommon as Json, "footer.privacy") as string).toLowerCase()).not.toContain(
      "only on this device",
    );
    expect(get(esCommon as Json, "footer.privacy") as string).not.toContain(
      "Todo se guarda únicamente en este dispositivo",
    );
  });

  it("enlace a la política en Ajustes existe en EN y ES", () => {
    for (const [lng, bundle] of [
      ["en", enSettings],
      ["es", esSettings],
    ] as const) {
      expect(typeof get(bundle as Json, "about.label"), `about.label/${lng}`).toBe("string");
      expect(typeof get(bundle as Json, "about.privacy"), `about.privacy/${lng}`).toBe("string");
    }
  });

  it("el enlace a la política de la pantalla de consentimiento sigue disponible (EN y ES)", () => {
    for (const [lng, bundle] of [
      ["en", enAuth],
      ["es", esAuth],
    ] as const) {
      expect(typeof get(bundle as Json, "consent.privacyLink"), `consent.privacyLink/${lng}`).toBe(
        "string",
      );
    }
  });
});
