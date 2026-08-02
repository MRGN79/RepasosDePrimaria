/*
 * Catálogo de materias/temas como view-models para la UI. Lee materias.json
 * (índice ligero) y construye los datos que consumen SubjectSelect y Print.
 * Resuelve qué temas tienen contenido real (registry) para marcar "Pronto".
 *
 * Multi-curso (ADR-002): sólo el curso "3" tiene contenido en esta fase. El
 * resto de cursos ofrecen las materias troncales de Primaria marcadas "Pronto",
 * sin contenido inventado. El catálogo es, por tanto, dependiente del curso.
 */
import materiasData from "@content/materias.json";
import type { CatalogoMaterias, Materia } from "@content/types";
import { topicsWithContent } from "@content/registry";
import type { Curso } from "@/lib/storage";

const catalog = materiasData as CatalogoMaterias;

/** materia id → namespace de contenido en content.json */
const CONTENT_KEY: Record<Materia, string> = {
  matematicas: "math",
  lengua: "spanish",
  ciencias: "science",
  sociales: "social",
  ingles: "english",
  cuarto: "cuarto4",
};

/** Curso con contenido real. En esta fase, sólo 3.º de Primaria. */
export const COURSE_WITH_CONTENT: Curso = "3";

/** Materias troncales de Primaria (excluye la zona-preview "cuarto", propia de 3.º). */
const CORE_SUBJECTS: Materia[] = ["matematicas", "lengua", "ciencias", "sociales", "ingles"];

export function courseHasContent(curso: Curso): boolean {
  return curso === COURSE_WITH_CONTENT;
}

/** Clave i18n de la etiqueta larga de un curso (namespace content). */
export function courseLabelKey(curso: Curso): string {
  return `content:course.${curso}`;
}

export function contentKeyFor(materia: Materia): string {
  return CONTENT_KEY[materia];
}

export interface SubjectVM {
  id: Materia;
  title: string;
  zone: string;
  icon: string;
  colorToken: string;
  langTag?: string;
  soon?: boolean;
}

export interface TopicVM {
  id: string;
  title: string;
  challengeG4?: boolean;
  soon?: boolean;
}

export type TFn = (key: string, opts?: Record<string, unknown>) => string;

function subjectVM(m: CatalogoMaterias["materias"][number], t: TFn, soon: boolean): SubjectVM {
  return {
    id: m.id,
    title: t(m.tituloKey),
    zone: t(`content:${CONTENT_KEY[m.id]}.zone`),
    icon: m.icon,
    colorToken: m.colorToken,
    langTag: m.langTagKey ? t(m.langTagKey) : undefined,
    soon,
  };
}

/**
 * VMs de materia para un curso. En el curso con contenido, una materia es "soon"
 * si no tiene temas con contenido; en el resto de cursos, todas las materias
 * troncales aparecen marcadas "Pronto".
 */
export function buildSubjectVMs(curso: Curso, t: TFn): SubjectVM[] {
  if (courseHasContent(curso)) {
    return catalog.materias.map((m) => subjectVM(m, t, topicsWithContent(m.id).length === 0));
  }
  return catalog.materias
    .filter((m) => CORE_SUBJECTS.includes(m.id))
    .map((m) => subjectVM(m, t, true));
}

/**
 * VMs de tema para una materia dentro de un curso, marcando "Pronto" los que no
 * tienen contenido. Fuera del curso con contenido, todos los temas son "Pronto".
 */
export function buildTopicVMs(curso: Curso, materia: Materia, t: TFn): TopicVM[] {
  const m = catalog.materias.find((x) => x.id === materia);
  if (!m) return [];
  const hasContent = courseHasContent(curso);
  const withContent = hasContent ? new Set(topicsWithContent(materia)) : new Set<string>();
  return m.temas.map((tp) => ({
    id: tp.id,
    title: t(tp.tituloKey),
    challengeG4: tp.reto4,
    soon: !hasContent || !withContent.has(tp.id) || !tp.disponible,
  }));
}

export function subjectColorToken(materia: Materia): string {
  return catalog.materias.find((m) => m.id === materia)?.colorToken ?? "--tdp-subject-math";
}

export function subjectTitleKey(materia: Materia): string {
  return catalog.materias.find((m) => m.id === materia)?.tituloKey ?? "";
}
