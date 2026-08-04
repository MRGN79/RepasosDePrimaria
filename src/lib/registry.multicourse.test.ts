import { describe, it, expect } from "vitest";
import {
  ALL_EXERCISES,
  exercisesByTopic,
  exercisesBySubject,
  topicsWithContent,
  coursesWithContent,
} from "@content/registry";
import type { Materia } from "@content/types";
import { buildSession, buildDailySession, ALL_SUBJECTS } from "@/lib/session";

/*
 * Aislamiento multi-curso (ADR-002 + adenda). El registro filtra el contenido
 * por curso (`nivel`). Estas pruebas fijan que 2.º y 3.º nunca se contaminan:
 * era el bug latente que motivó el refactor (el registro filtraba sólo por
 * materia+tema, sin curso).
 */

const SUBJECTS: Materia[] = ["matematicas", "lengua", "ciencias", "sociales", "ingles"];

describe("cursos con contenido", () => {
  it("se derivan del propio contenido: 2.º y 3.º", () => {
    const set = coursesWithContent();
    expect(set.has("2")).toBe(true);
    expect(set.has("3")).toBe(true);
  });
});

describe("ids de ejercicio globalmente únicos", () => {
  it("no hay ids duplicados entre cursos ni dentro de un curso", () => {
    const ids = ALL_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("exercisesBySubject filtra por curso", () => {
  for (const materia of SUBJECTS) {
    it(`${materia}: 2.º devuelve sólo nivel "2" y 3.º sólo nivel "3"`, () => {
      const c2 = exercisesBySubject("2", materia);
      const c3 = exercisesBySubject("3", materia);
      expect(c2.length).toBeGreaterThan(0);
      expect(c3.length).toBeGreaterThan(0);
      expect(c2.every((e) => e.nivel === "2")).toBe(true);
      expect(c3.every((e) => e.nivel === "3")).toBe(true);
      // Conjuntos de ids disjuntos: ningún ejercicio se cuela en el otro curso.
      const ids2 = new Set(c2.map((e) => e.id));
      expect(c3.some((e) => ids2.has(e.id))).toBe(false);
    });
  }
});

describe("exercisesByTopic no mezcla cursos", () => {
  it("un tema de 2.º sólo devuelve ejercicios de 2.º", () => {
    const items = exercisesByTopic("2", "matematicas", "numbers.count_100");
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((e) => e.nivel === "2")).toBe(true);
  });

  it("pedir un tema de 3.º bajo el curso 2 no devuelve nada", () => {
    // 'numbers.even_odd' es un tema de 3.º; no existe en 2.º.
    expect(exercisesByTopic("2", "matematicas", "numbers.even_odd")).toEqual([]);
  });

  it("pedir un tema de 2.º bajo el curso 3 no devuelve nada", () => {
    expect(exercisesByTopic("3", "matematicas", "numbers.count_100")).toEqual([]);
  });
});

describe("topicsWithContent es por curso", () => {
  it("los temas de 2.º y de 3.º no se solapan en matemáticas", () => {
    const t2 = topicsWithContent("2", "matematicas");
    const t3 = topicsWithContent("3", "matematicas");
    expect(t2).toContain("numbers.count_100");
    expect(t3).toContain("numbers.even_odd");
    expect(t2).not.toContain("numbers.even_odd");
    expect(t3).not.toContain("numbers.count_100");
  });
});

describe("las sesiones respetan el curso", () => {
  it("buildSession de 2.º sólo usa contenido de 2.º", () => {
    for (const materia of ALL_SUBJECTS) {
      const items = buildSession("2", materia, null, 6);
      for (const it of items) {
        expect(it.exercise.nivel).toBe("2");
        expect(it.exercise.materia).toBe(materia);
      }
    }
  });

  it("la misión diaria de 2.º nunca incluye ejercicios de 3.º", () => {
    const daily = buildDailySession("2", 3);
    expect(daily.length).toBeGreaterThan(0);
    expect(daily.every((p) => p.exercise.nivel === "2")).toBe(true);
  });

  it("la misión diaria de 3.º nunca incluye ejercicios de 2.º", () => {
    const daily = buildDailySession("3", 3);
    expect(daily.length).toBeGreaterThan(0);
    expect(daily.every((p) => p.exercise.nivel === "3")).toBe(true);
  });
});
