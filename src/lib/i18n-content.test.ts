import { describe, it, expect } from "vitest";
import { ALL_EXERCISES, fixedLanguageFor } from "@content/registry";
import { esGenerado, type EjercicioAny } from "@content/types";
import { BADGES } from "./badges";
import { AVATARS, NICKNAMES } from "./profile";
import materias from "@content/materias.json";
import materias2 from "@content/materias-2.json";
import type { CatalogoMaterias } from "@content/types";

import enExercises from "@locales/en/exercises.json";
import esExercises from "@locales/es/exercises.json";
import enQuiz from "@locales/en/quiz.json";
import esQuiz from "@locales/es/quiz.json";
import enContent from "@locales/en/content.json";
import esContent from "@locales/es/content.json";

/*
 * Verificación i18n del contenido (specs i18n, D-1, D-5):
 *  - Toda clave i18n usada por el contenido existe en el/los locale(s) correctos.
 *  - Materias de idioma fijo (Lengua=ES, Natural Science=EN, English=EN) sólo
 *    requieren su idioma; las que siguen la UI (mates, sociales) requieren EN y ES.
 *  - El contenido de Natural Science está en inglés (D-5).
 */

type Bag = Record<string, unknown>;
const bundles: Record<string, Record<"en" | "es", Bag>> = {
  exercises: { en: enExercises as Bag, es: esExercises as Bag },
  quiz: { en: enQuiz as Bag, es: esQuiz as Bag },
  content: { en: enContent as Bag, es: esContent as Bag },
};

/** Resuelve "ns:a.b.c" en el bundle del idioma dado; devuelve el valor o undefined. */
function resolve(fullKey: string, lng: "en" | "es"): unknown {
  const [ns, path] = fullKey.includes(":") ? fullKey.split(":") : ["common", fullKey];
  const bundle = bundles[ns]?.[lng];
  if (!bundle) return undefined;
  return path.split(".").reduce<unknown>((acc, seg) => {
    if (acc && typeof acc === "object" && seg in (acc as Bag)) return (acc as Bag)[seg];
    return undefined;
  }, bundle);
}

function exists(fullKey: string, lng: "en" | "es"): boolean {
  return typeof resolve(fullKey, lng) === "string";
}

/** Reúne todas las claves i18n de un ejercicio (enunciado/plantilla + opciones). */
function keysOf(e: EjercicioAny): string[] {
  if (esGenerado(e)) return [e.plantillaKey];
  const keys = [e.enunciadoKey];
  if (e.opciones) keys.push(...e.opciones.map((o) => o.textoKey));
  return keys;
}

describe("claves i18n del contenido de ejercicios", () => {
  for (const e of ALL_EXERCISES) {
    const fixed = fixedLanguageFor(e.materia); // "en" | "es" | null
    it(`${e.id} (${e.materia}): claves presentes en el/los idioma(s) requerido(s)`, () => {
      for (const key of keysOf(e)) {
        // Las etiquetas compartidas de quiz (true/false) existen en ambos idiomas.
        const isSharedQuiz = key.startsWith("quiz:");
        const langs: ("en" | "es")[] =
          fixed && !isSharedQuiz ? [fixed] : ["en", "es"];
        for (const lng of langs) {
          expect(exists(key, lng), `${key} debe existir en ${lng}`).toBe(true);
        }
      }
    });
  }
});

describe("D-5: contenido de Natural Science en inglés", () => {
  const science = ALL_EXERCISES.filter((e) => e.materia === "ciencias");
  it("hay contenido de ciencias y su idioma fijo es EN", () => {
    expect(science.length).toBeGreaterThan(0);
    expect(fixedLanguageFor("ciencias")).toBe("en");
  });
  it("todas las claves de ciencias resuelven en EN", () => {
    for (const e of science) {
      for (const key of keysOf(e)) {
        if (key.startsWith("quiz:")) continue;
        expect(exists(key, "en"), `${key} debe existir en EN`).toBe(true);
      }
    }
  });
});

describe("D-1: Lengua e Inglés con idioma propio", () => {
  it("Lengua resuelve en ES", () => {
    expect(fixedLanguageFor("lengua")).toBe("es");
    for (const e of ALL_EXERCISES.filter((x) => x.materia === "lengua")) {
      for (const key of keysOf(e)) {
        if (key.startsWith("quiz:")) continue;
        expect(exists(key, "es"), `${key} en ES`).toBe(true);
      }
    }
  });
  it("English resuelve en EN", () => {
    expect(fixedLanguageFor("ingles")).toBe("en");
    for (const e of ALL_EXERCISES.filter((x) => x.materia === "ingles")) {
      for (const key of keysOf(e)) {
        if (key.startsWith("quiz:")) continue;
        expect(exists(key, "en"), `${key} en EN`).toBe(true);
      }
    }
  });
});

describe("claves i18n de medallas, avatares y apodos (content, ambos idiomas)", () => {
  it("medallas: name y hint existen en EN y ES", () => {
    for (const b of BADGES) {
      for (const lng of ["en", "es"] as const) {
        expect(exists(b.nameKey, lng), `${b.nameKey} en ${lng}`).toBe(true);
        expect(exists(b.hintKey, lng), `${b.hintKey} en ${lng}`).toBe(true);
      }
    }
  });
  it("avatares y apodos existen en EN y ES", () => {
    for (const a of AVATARS) {
      for (const lng of ["en", "es"] as const) {
        expect(exists(a.nameKey, lng), `${a.nameKey} en ${lng}`).toBe(true);
      }
    }
    for (const n of NICKNAMES) {
      for (const lng of ["en", "es"] as const) {
        expect(exists(n.labelKey, lng), `${n.labelKey} en ${lng}`).toBe(true);
      }
    }
  });
});

describe("índice de materias/temas: títulos y zonas i18n", () => {
  // Los títulos de materia/tema del menú siguen el idioma de la UI: existen en
  // ambos idiomas para todos los cursos con contenido (3.º y 2.º).
  const catalogs: [string, CatalogoMaterias][] = [
    ["3.º", materias as CatalogoMaterias],
    ["2.º", materias2 as CatalogoMaterias],
  ];
  for (const [curso, catalog] of catalogs) {
    it(`${curso}: cada materia y cada tema tienen tituloKey resoluble en ambos idiomas`, () => {
      for (const m of catalog.materias) {
        for (const lng of ["en", "es"] as const) {
          expect(exists(m.tituloKey, lng), `${m.tituloKey} en ${lng}`).toBe(true);
        }
        for (const tp of m.temas) {
          for (const lng of ["en", "es"] as const) {
            expect(exists(tp.tituloKey, lng), `${tp.tituloKey} en ${lng}`).toBe(true);
          }
        }
      }
    });
  }
});
