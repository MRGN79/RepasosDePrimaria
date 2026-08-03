import { describe, it, expect } from "vitest";
import {
  buildSubjectVMs,
  buildTopicVMs,
  courseHasContent,
  courseLabelKey,
} from "./catalog";

/*
 * Catálogo dependiente del curso (ADR-002). Sólo el curso "3" tiene contenido;
 * el resto ofrecen las materias troncales marcadas "Pronto", sin contenido
 * inventado. Estas pruebas fijan ese comportamiento.
 */

// Stub de traducción: devuelve la propia clave, suficiente para inspeccionar
// estructura (ids, soon) sin depender de i18n.
const t = (key: string) => key;

describe("courseHasContent", () => {
  it("sólo el curso 3 tiene contenido en esta fase", () => {
    expect(courseHasContent("3")).toBe(true);
    for (const c of ["1", "2", "4", "5", "6"] as const) {
      expect(courseHasContent(c)).toBe(false);
    }
  });
});

describe("courseLabelKey", () => {
  it("apunta a la clave i18n del curso", () => {
    expect(courseLabelKey("3")).toBe("content:course.3");
  });
});

describe("buildSubjectVMs por curso", () => {
  it("curso 3: incluye las materias con contenido no marcadas Pronto", () => {
    const subjects = buildSubjectVMs("3", t);
    const math = subjects.find((s) => s.id === "matematicas");
    expect(math).toBeDefined();
    expect(math!.soon).toBe(false); // matemáticas tiene contenido real
  });

  it("otros cursos: sólo las 5 materias troncales, todas Pronto y sin 'cuarto'", () => {
    const subjects = buildSubjectVMs("5", t);
    const ids = subjects.map((s) => s.id).sort();
    expect(ids).toEqual(["ciencias", "ingles", "lengua", "matematicas", "sociales"]);
    expect(subjects.every((s) => s.soon === true)).toBe(true);
    expect(subjects.some((s) => s.id === "cuarto")).toBe(false);
  });
});

describe("buildTopicVMs por curso", () => {
  it("fuera del curso con contenido, todos los temas son Pronto", () => {
    const topics = buildTopicVMs("2", "matematicas", t);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.every((tp) => tp.soon === true)).toBe(true);
  });

  it("en el curso con contenido, hay temas disponibles (no todos Pronto)", () => {
    const topics = buildTopicVMs("3", "matematicas", t);
    expect(topics.some((tp) => tp.soon === false)).toBe(true);
  });
});
