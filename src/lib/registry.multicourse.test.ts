import { describe, it, expect } from "vitest";
import {
  ALL_EXERCISES,
  exercisesByTopic,
  exercisesBySubject,
  topicsWithContent,
  coursesWithContent,
} from "@content/registry";
import type { Materia, Nivel } from "@content/types";
import { buildSession, buildDailySession, ALL_SUBJECTS } from "@/lib/session";

/*
 * Aislamiento multi-curso (ADR-002 + adenda). El registro filtra el contenido
 * por curso (`nivel`). Estas pruebas fijan que ningún par de cursos se contamina:
 * era el bug latente que motivó el refactor (el registro filtraba sólo por
 * materia+tema, sin curso). Tras el MVP ligero, los seis cursos tienen contenido.
 */

const SUBJECTS: Materia[] = ["matematicas", "lengua", "ciencias", "sociales", "ingles"];
const COURSES: Nivel[] = ["1", "2", "3", "4", "5", "6"];

describe("cursos con contenido", () => {
  it("se derivan del propio contenido: los seis cursos de Primaria", () => {
    const set = coursesWithContent();
    for (const c of COURSES) {
      expect(set.has(c)).toBe(true);
    }
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
    it(`${materia}: cada curso devuelve sólo su propio nivel`, () => {
      for (const curso of COURSES) {
        const items = exercisesBySubject(curso, materia);
        expect(items.length).toBeGreaterThan(0);
        expect(items.every((e) => e.nivel === curso)).toBe(true);
      }
    });

    it(`${materia}: los conjuntos de ids de cada curso son disjuntos`, () => {
      const seen = new Map<string, Nivel>();
      for (const curso of COURSES) {
        for (const e of exercisesBySubject(curso, materia)) {
          // Ningún id aparece bajo dos cursos distintos.
          expect(seen.has(e.id)).toBe(false);
          seen.set(e.id, curso);
        }
      }
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

  it("un tema de 6.º (porcentajes) no aparece bajo 5.º", () => {
    expect(exercisesByTopic("6", "matematicas", "numbers.percentages").length).toBeGreaterThan(0);
    expect(exercisesByTopic("5", "matematicas", "numbers.percentages")).toEqual([]);
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

  it("cada curso del MVP ligero expone su tema propio de matemáticas", () => {
    expect(topicsWithContent("1", "matematicas")).toEqual(["operations.add_to_10"]);
    expect(topicsWithContent("4", "matematicas")).toEqual(["operations.multiply_2digit"]);
    expect(topicsWithContent("5", "matematicas")).toEqual(["numbers.decimals"]);
    expect(topicsWithContent("6", "matematicas")).toEqual(["numbers.percentages"]);
  });
});

describe("las sesiones respetan el curso", () => {
  for (const curso of COURSES) {
    it(`buildSession de ${curso}.º sólo usa contenido de ${curso}.º`, () => {
      for (const materia of ALL_SUBJECTS) {
        const items = buildSession(curso, materia, null, 6);
        for (const it of items) {
          expect(it.exercise.nivel).toBe(curso);
          expect(it.exercise.materia).toBe(materia);
        }
      }
    });

    it(`la misión diaria de ${curso}.º sólo incluye ejercicios de ${curso}.º`, () => {
      const daily = buildDailySession(curso, 3);
      expect(daily.length).toBeGreaterThan(0);
      expect(daily.every((p) => p.exercise.nivel === curso)).toBe(true);
    });
  }
});
