/*
 * Modelo de datos de contenido (ADR-001 §3).
 * El contenido vive en JSON estático validado por estos tipos.
 * Jerarquía: Materia → Tema → Ejercicio.
 *
 * Maquetador deja el esquema y la estructura de carpetas.
 * Frontend implementa la carga bajo demanda, la validación en CI,
 * el tipo EjercicioGenerado (mates D-6) y rellena el contenido real.
 */

export type Materia =
  | "matematicas"
  | "lengua"
  | "ingles"
  | "ciencias"
  | "sociales"
  | "cuarto";

/*
 * Nivel = curso de Primaria al que pertenece un ejercicio. Se alinea con el
 * rango de `Curso` (src/lib/storage) para poder filtrar el contenido por curso
 * en el registro (ADR-002, adenda multi-curso con contenido). El registro usa
 * `Ejercicio.nivel` como discriminador de curso: dos cursos con contenido activo
 * nunca mezclan sus ejercicios aunque compartan id de tema.
 */
export type Nivel = "1" | "2" | "3" | "4" | "5" | "6";

export type TipoEjercicio =
  | "opcion-multiple"
  | "verdadero-falso"
  | "respuesta-corta"
  | "emparejar";

export interface Opcion {
  /** ej. "a", "b", "c" */
  id: string;
  /** clave i18n del texto de la opción */
  textoKey: string;
}

export interface Ejercicio {
  /** estable y único, ej. "mat-3-sumas-001" */
  id: string;
  materia: Materia;
  /** clave de tema, ej. "sumas-llevando" */
  tema: string;
  nivel: Nivel;
  tipo: TipoEjercicio;
  /** clave i18n del enunciado */
  enunciadoKey: string;
  /** para opcion-multiple / verdadero-falso / emparejar */
  opciones?: Opcion[];
  /** id(s) de opción correcta, o texto normalizado */
  respuestaCorrecta: string | string[];
  /** clave i18n de pista opcional */
  pistaKey?: string;
  /** si aparece en la versión en papel */
  imprimible: boolean;
}

/*
 * Ejercicio generado (mates D-6, ADR §7). En lugar de enunciado y respuesta
 * fijos, declara una operación generable; Frontend produce los operandos al
 * montar (o congelados para imprimir) y CALCULA la respuesta.
 */
export type OperacionMate =
  | "add"
  | "sub"
  | "times-tables"
  | "multiply-one-digit"
  | "division-exact"
  // 2.º de Primaria (números hasta 99, sin llevadas)
  | "add-nocarry"
  | "sub-noborrow"
  | "times-easy"
  // 1.º de Primaria (sumas hasta 10) y 4.º (multiplicación por dos cifras)
  | "add-to-ten"
  | "multiply-two-digit";

export interface EjercicioGenerado {
  id: string;
  materia: "matematicas";
  tema: string;
  nivel: Nivel;
  tipo: "respuesta-corta";
  /** operación a generar (ver randomMath.ts) */
  operacion: OperacionMate;
  /** plantilla i18n con interpolación, ej. "math.template.operation" = "{{a}} {{op}} {{b}}" */
  plantillaKey: string;
  imprimible: boolean;
}

/** Cualquier ejercicio del contenido: estático o generado. */
export type EjercicioAny = Ejercicio | EjercicioGenerado;

export function esGenerado(e: EjercicioAny): e is EjercicioGenerado {
  return (e as EjercicioGenerado).operacion !== undefined;
}

/** Entrada del índice ligero de materias/temas (materias.json). */
export interface TemaIndice {
  /** clave de tema, ej. "sumas-llevando" */
  id: string;
  /** clave i18n del título del tema (namespace content) */
  tituloKey: string;
  /** marca de Reto de 4º (icono + texto, nunca solo color) */
  reto4?: boolean;
  /** tema sin contenido aún → estado "Pronto" en la UI */
  disponible: boolean;
}

export interface MateriaIndice {
  id: Materia;
  /** clave i18n del título de la materia (namespace content) */
  tituloKey: string;
  /** token de color de materia, ej. "--tdp-subject-math" */
  colorToken: string;
  /** nombre de icono del sistema de diseño */
  icon: string;
  /** micro-etiqueta de idioma fijo (ej. clave de "EN") para science/english */
  langTagKey?: string;
  temas: TemaIndice[];
}

export interface CatalogoMaterias {
  materias: MateriaIndice[];
}
