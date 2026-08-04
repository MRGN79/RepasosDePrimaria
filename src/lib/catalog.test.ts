import { describe, it, expect } from "vitest";
import {
  buildSubjectVMs,
  buildTopicVMs,
  courseHasContent,
  courseLabelKey,
} from "./catalog";

/*
 * Catálogo dependiente del curso (ADR-002 + adenda multi-curso con contenido).
 * Tras el MVP ligero de 1.º/4.º/5.º/6.º, los seis cursos tienen contenido y
 * muestran sus temas jugables. Qué cursos tienen contenido se deriva del
 * registro, no de una constante fija: activar un curso sólo requiere su índice
 * y su contenido. La rama "curso sin contenido" (5 troncales "Pronto", sin
 * relleno) sigue viva como comportamiento por defecto para cualquier curso
 * futuro que aún no tenga su paquete.
 */

// Stub de traducción: devuelve la propia clave, suficiente para inspeccionar
// estructura (ids, soon) sin depender de i18n.
const t = (key: string) => key;

describe("courseHasContent", () => {
  it("los seis cursos de Primaria tienen contenido", () => {
    for (const c of ["1", "2", "3", "4", "5", "6"] as const) {
      expect(courseHasContent(c)).toBe(true);
    }
  });
});

describe("courseLabelKey", () => {
  it("apunta a la clave i18n del curso", () => {
    expect(courseLabelKey("3")).toBe("content:course.3");
    expect(courseLabelKey("2")).toBe("content:course.2");
  });
});

describe("buildSubjectVMs por curso", () => {
  it("curso 3: matemáticas tiene contenido y no está marcada Pronto", () => {
    const subjects = buildSubjectVMs("3", t);
    const math = subjects.find((s) => s.id === "matematicas");
    expect(math).toBeDefined();
    expect(math!.soon).toBe(false);
  });

  it("curso 2: las 5 troncales tienen contenido, ninguna marcada Pronto", () => {
    const subjects = buildSubjectVMs("2", t);
    const ids = subjects.map((s) => s.id).sort();
    expect(ids).toEqual(["ciencias", "ingles", "lengua", "matematicas", "sociales"]);
    expect(subjects.every((s) => s.soon === false)).toBe(true);
    // La zona-preview "cuarto" es propia de 3.º; no aparece en 2.º.
    expect(subjects.some((s) => s.id === "cuarto")).toBe(false);
  });

  it("curso 5 (MVP ligero): las 5 troncales con contenido, ninguna Pronto y sin 'cuarto'", () => {
    const subjects = buildSubjectVMs("5", t);
    const ids = subjects.map((s) => s.id).sort();
    expect(ids).toEqual(["ciencias", "ingles", "lengua", "matematicas", "sociales"]);
    expect(subjects.every((s) => s.soon === false)).toBe(true);
    expect(subjects.some((s) => s.id === "cuarto")).toBe(false);
  });
});

describe("buildTopicVMs por curso", () => {
  it("curso 5 (MVP ligero): su tema de matemáticas tiene contenido (no Pronto)", () => {
    const topics = buildTopicVMs("5", "matematicas", t);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.some((tp) => tp.soon === false)).toBe(true);
  });

  it("curso 3: hay temas disponibles (no todos Pronto)", () => {
    const topics = buildTopicVMs("3", "matematicas", t);
    expect(topics.some((tp) => tp.soon === false)).toBe(true);
  });

  it("curso 2: usa SU propio índice de temas (los de 2.º, no los de 3.º)", () => {
    const topics = buildTopicVMs("2", "matematicas", t);
    const ids = topics.map((tp) => tp.id);
    // Temas propios de 2.º
    expect(ids).toContain("numbers.count_100");
    expect(ids).toContain("operations.add_nocarry");
    // Temas de 3.º que NO deben aparecer en el índice de 2.º
    expect(ids).not.toContain("numbers.even_odd");
    expect(ids).not.toContain("operations.add_carry");
    // Y tienen contenido: no todos son Pronto
    expect(topics.some((tp) => tp.soon === false)).toBe(true);
  });
});
