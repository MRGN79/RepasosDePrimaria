/*
 * Catálogo de materias/temas como view-models para la UI. Lee los índices
 * ligeros por curso (materias-N.json) y construye los datos que consumen
 * SubjectSelect y Print. Resuelve qué temas tienen contenido real (registry)
 * para marcar "Pronto".
 *
 * Multi-curso con contenido (ADR-002 + adenda). Cada curso con contenido tiene
 * su propio índice de materias/temas; qué cursos tienen contenido se DERIVA del
 * registro (coursesWithContent), no de una constante fija: añadir un curso nuevo
 * sólo requiere su índice y su contenido, sin tocar esta lógica. Los cursos sin
 * contenido ofrecen las 5 materias troncales marcadas "Pronto", sin relleno.
 */
import materias3Data from "@content/materias.json";
import materias2Data from "@content/materias-2.json";
import materias1Data from "@content/materias-1.json";
import materias4Data from "@content/materias-4.json";
import materias5Data from "@content/materias-5.json";
import materias6Data from "@content/materias-6.json";
import type { CatalogoMaterias, Materia } from "@content/types";
import { topicsWithContent, coursesWithContent } from "@content/registry";
import type { Curso } from "@/lib/storage";

/** Índice de materias/temas por curso. Los cursos ausentes no tienen contenido. */
const CATALOGS: Partial<Record<Curso, CatalogoMaterias>> = {
  "1": materias1Data as CatalogoMaterias,
  "2": materias2Data as CatalogoMaterias,
  "3": materias3Data as CatalogoMaterias,
  "4": materias4Data as CatalogoMaterias,
  "5": materias5Data as CatalogoMaterias,
  "6": materias6Data as CatalogoMaterias,
};

/**
 * Catálogo base para cursos SIN contenido: se reutiliza la metadata de materia
 * (icono, color, título) de 3.º, ya que es común a toda Primaria. Sólo se usa
 * para pintar las 5 troncales en "Pronto"; nunca aporta temas jugables.
 */
const baseCatalog = materias3Data as CatalogoMaterias;

/** materia id → namespace de contenido en content.json */
const CONTENT_KEY: Record<Materia, string> = {
  matematicas: "math",
  lengua: "spanish",
  ciencias: "science",
  sociales: "social",
  ingles: "english",
  cuarto: "cuarto4",
};

/** Materias troncales de Primaria (excluye la zona-preview "cuarto", propia de 3.º). */
const CORE_SUBJECTS: Materia[] = ["matematicas", "lengua", "ciencias", "sociales", "ingles"];

export function courseHasContent(curso: Curso): boolean {
  return coursesWithContent().has(curso);
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
 * VMs de materia para un curso. En un curso con contenido, se recorre SU propio
 * índice y una materia es "soon" si no tiene temas con contenido para ese curso;
 * en los cursos sin contenido, se muestran las 5 troncales, todas "Pronto".
 */
export function buildSubjectVMs(curso: Curso, t: TFn): SubjectVM[] {
  const catalog = CATALOGS[curso];
  if (catalog && courseHasContent(curso)) {
    return catalog.materias.map((m) =>
      subjectVM(m, t, topicsWithContent(curso, m.id).length === 0),
    );
  }
  return baseCatalog.materias
    .filter((m) => CORE_SUBJECTS.includes(m.id))
    .map((m) => subjectVM(m, t, true));
}

/**
 * VMs de tema para una materia dentro de un curso, marcando "Pronto" los que no
 * tienen contenido PARA ESE CURSO. Fuera de un curso con contenido, todos los
 * temas son "Pronto" (se usa el índice base sólo para poblar nombres).
 */
export function buildTopicVMs(curso: Curso, materia: Materia, t: TFn): TopicVM[] {
  const hasContent = courseHasContent(curso);
  const catalog = (hasContent ? CATALOGS[curso] : undefined) ?? baseCatalog;
  const m = catalog.materias.find((x) => x.id === materia);
  if (!m) return [];
  const withContent = hasContent
    ? new Set(topicsWithContent(curso, materia))
    : new Set<string>();
  return m.temas.map((tp) => ({
    id: tp.id,
    title: t(tp.tituloKey),
    challengeG4: tp.reto4,
    soon: !hasContent || !withContent.has(tp.id) || !tp.disponible,
  }));
}

export function subjectColorToken(materia: Materia): string {
  return baseCatalog.materias.find((m) => m.id === materia)?.colorToken ?? "--tdp-subject-math";
}

export function subjectTitleKey(materia: Materia): string {
  return baseCatalog.materias.find((m) => m.id === materia)?.tituloKey ?? "";
}
