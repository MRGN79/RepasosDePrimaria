import { describe, it, expect } from "vitest";
import {
  buildSession,
  prepareExercise,
  checkOptionAnswer,
  checkNumericAnswer,
  checkMatchAnswer,
  matchLeftIds,
  DEFAULT_SESSION_LENGTH,
  type MatchAnswer,
} from "./session";
import { buildPrintSheet } from "./printSheet";
import { exerciseById } from "@content/registry";
import { esGenerado, type Ejercicio, type EjercicioGenerado } from "@content/types";
import type { Rng } from "./randomMath";

/*
 * Tests de integración del motor de quiz: los 4 tipos del MVP (opción múltiple,
 * verdadero/falso, respuesta numérica, emparejar) se resuelven y dan el feedback
 * de acierto/error esperado, usando contenido real del registro.
 */

/** RNG determinista para sesiones reproducibles. */
function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function get(id: string) {
  const e = exerciseById(id);
  if (!e) throw new Error(`Exercise ${id} no existe en el registro`);
  return e;
}

describe("opción múltiple (checkOptionAnswer)", () => {
  const ex = get("mat-3-evenodd-003") as Ejercicio; // respuestaCorrecta: "b"
  it("acierto cuando la opción seleccionada es la correcta", () => {
    expect(checkOptionAnswer(ex, "b")).toBe(true);
  });
  it("error cuando la opción es incorrecta", () => {
    expect(checkOptionAnswer(ex, "a")).toBe(false);
    expect(checkOptionAnswer(ex, "c")).toBe(false);
  });
  it("error con opción inexistente o vacía", () => {
    expect(checkOptionAnswer(ex, "z")).toBe(false);
    expect(checkOptionAnswer(ex, "")).toBe(false);
  });
});

describe("verdadero / falso (checkOptionAnswer)", () => {
  const exTrue = get("mat-3-evenodd-001") as Ejercicio; // correcta: "true"
  const exFalse = get("mat-3-evenodd-002") as Ejercicio; // correcta: "false"
  it("resuelve correctamente ambos sentidos", () => {
    expect(checkOptionAnswer(exTrue, "true")).toBe(true);
    expect(checkOptionAnswer(exTrue, "false")).toBe(false);
    expect(checkOptionAnswer(exFalse, "false")).toBe(true);
    expect(checkOptionAnswer(exFalse, "true")).toBe(false);
  });
});

describe("respuesta numérica (checkNumericAnswer)", () => {
  const gen = get("mat-3-times-gen") as EjercicioGenerado;
  it("acierto cuando el número coincide con la respuesta calculada", () => {
    const prepared = prepareExercise(gen, seededRng(7));
    expect(prepared.math).toBeDefined();
    const correct = String(prepared.math!.answer);
    expect(checkNumericAnswer(prepared, correct)).toBe(true);
  });
  it("error cuando el número no coincide", () => {
    const prepared = prepareExercise(gen, seededRng(7));
    const wrong = String(prepared.math!.answer + 1);
    expect(checkNumericAnswer(prepared, wrong)).toBe(false);
  });
  it("tolera espacios alrededor pero rechaza cadena vacía", () => {
    const prepared = prepareExercise(gen, seededRng(7));
    const correct = prepared.math!.answer;
    expect(checkNumericAnswer(prepared, `  ${correct}  `)).toBe(true);
    expect(checkNumericAnswer(prepared, "")).toBe(false);
    expect(checkNumericAnswer(prepared, "   ")).toBe(false);
  });
  it("para cada operación generada, la respuesta congelada se valida correctamente", () => {
    for (const id of ["mat-3-add-gen", "mat-3-times-gen", "mat-3-div-gen"]) {
      const e = get(id) as EjercicioGenerado;
      const prepared = prepareExercise(e, seededRng(123));
      expect(checkNumericAnswer(prepared, String(prepared.math!.answer))).toBe(true);
    }
  });
});

describe("emparejar (checkMatchAnswer)", () => {
  const ex = get("sci-3-animals-003") as Ejercicio; // ["l1:r3","l2:r1","l3:r2"]
  it("acierto cuando todos los pares coinciden", () => {
    const answer: MatchAnswer = { l1: "r3", l2: "r1", l3: "r2" };
    expect(checkMatchAnswer(ex, answer)).toBe(true);
  });
  it("error si algún par es incorrecto", () => {
    expect(checkMatchAnswer(ex, { l1: "r1", l2: "r3", l3: "r2" })).toBe(false);
  });
  it("error si faltan pares (emparejado incompleto)", () => {
    expect(checkMatchAnswer(ex, { l1: "r3", l2: "r1" })).toBe(false);
  });
  it("error si hay pares de más", () => {
    expect(checkMatchAnswer(ex, { l1: "r3", l2: "r1", l3: "r2", lX: "rX" })).toBe(false);
  });
  it("matchLeftIds extrae las columnas izquierdas en orden", () => {
    expect(matchLeftIds(ex)).toEqual(["l1", "l2", "l3"]);
  });
});

describe("buildSession (construcción de la tanda)", () => {
  it("tema generado produce N instancias con respuesta numérica válida", () => {
    const items = buildSession("3", "matematicas", "operations.times_tables", 5, seededRng(1));
    expect(items).toHaveLength(5);
    for (const it of items) {
      expect(esGenerado(it.exercise)).toBe(true);
      expect(it.math).toBeDefined();
      expect(checkNumericAnswer(it, String(it.math!.answer))).toBe(true);
    }
  });

  it("tema estático devuelve hasta `length` ejercicios del tema", () => {
    const items = buildSession("3", "matematicas", "numbers.even_odd", 5, seededRng(2));
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(5);
    for (const it of items) {
      expect(it.exercise.tema).toBe("numbers.even_odd");
    }
  });

  it("usa la longitud por defecto cuando no se especifica", () => {
    const items = buildSession("3", "matematicas", "operations.add_carry");
    expect(items).toHaveLength(DEFAULT_SESSION_LENGTH);
  });

  it("tema sin contenido devuelve sesión vacía sin lanzar", () => {
    expect(buildSession("3", "matematicas", "tema.inexistente", 5, seededRng(3))).toEqual([]);
  });

  it("mezcla de materia entera produce ejercicios de esa materia", () => {
    const items = buildSession("3", "ciencias", null, 6, seededRng(9));
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(it.exercise.materia).toBe("ciencias");
    }
  });
});

describe("buildPrintSheet (ficha congelada y coherente)", () => {
  it("genera la cantidad pedida y congela los operandos de mates", () => {
    const sheet = buildPrintSheet("3", "matematicas", "operations.division_intro", 10, seededRng(4));
    expect(sheet).toHaveLength(10);
    for (const item of sheet) {
      expect(esGenerado(item.exercise)).toBe(true);
      expect(item.math).toBeDefined();
      // coherencia: la respuesta congelada corresponde a los operandos congelados
      expect(item.math!.a / item.math!.b).toBe(item.math!.answer);
    }
  });

  it("solo incluye ejercicios imprimibles", () => {
    const sheet = buildPrintSheet("3", "lengua", "vocabulary.synonyms_antonyms", 4, seededRng(5));
    expect(sheet.length).toBeGreaterThan(0);
    for (const item of sheet) {
      expect(item.exercise.imprimible).toBe(true);
    }
  });

  it("tema sin contenido imprimible devuelve ficha vacía", () => {
    expect(buildPrintSheet("3", "matematicas", "tema.inexistente", 10, seededRng(6))).toEqual([]);
  });
});
