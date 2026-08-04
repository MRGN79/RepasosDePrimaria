/*
 * Números aleatorios en Matemáticas (ADR-001 §7, D-6).
 * Función pura `generarOperandos(tipo, rango)` con los rangos del ADR.
 * La respuesta se CALCULA a partir de los operandos, no se almacena.
 * Cada repetición genera números distintos.
 *
 * Para la versión imprimible, generarOperandos produce una instancia concreta
 * que se CONGELA (se guardan los valores) para que la ficha y su hoja de
 * soluciones sean coherentes.
 *
 * Módulo puro y testeable. La fuente de aleatoriedad es inyectable (rng) para
 * poder fijar una semilla en tests.
 */

export type MathOpType =
  | "add" // sumas, resultado ≤ 9999
  | "sub" // restas, resultado ≥ 0
  | "times-tables" // factor 1-10 × factor 1-10
  | "multiply-one-digit" // 2-3 cifras × 1 cifra
  | "division-exact" // divisor 1-9, cociente ≤ 99, resto 0
  // --- 2.º de Primaria (números hasta 99, sin llevadas) ---
  | "add-nocarry" // suma de 2 números ≤ 99 sin llevar ninguna columna
  | "sub-noborrow" // resta de 2 números ≤ 99 sin llevar (sin pedir prestado)
  | "times-easy" // tablas iniciales: 2, 5 o 10 × factor 1-10
  // --- 1.º (sumas hasta 10) y 4.º (multiplicación por dos cifras) ---
  | "add-to-ten" // suma de 2 números con resultado ≤ 10
  | "multiply-two-digit"; // 2 cifras × 2 cifras

export interface GeneratedMath {
  type: MathOpType;
  a: number;
  b: number;
  /** símbolo de la operación para la plantilla (+, −, ×, ÷) */
  operator: "+" | "−" | "×" | "÷";
  /** respuesta calculada, nunca almacenada en el contenido */
  answer: number;
}

export type Rng = () => number; // [0, 1)

/** Entero aleatorio en [min, max] inclusivo. */
function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

const ADD_MAX = 9999;

/**
 * Genera operandos válidos para `type` respetando los rangos del ADR.
 * `rng` por defecto es Math.random; se inyecta para tests / semilla imprimible.
 */
export function generarOperandos(
  type: MathOpType,
  rng: Rng = Math.random,
): GeneratedMath {
  switch (type) {
    case "add": {
      // sumandos 1..9999 con resultado ≤ 9999
      const a = randInt(1, ADD_MAX - 1, rng);
      const b = randInt(1, ADD_MAX - a, rng);
      return { type, a, b, operator: "+", answer: a + b };
    }
    case "sub": {
      // minuendo ≥ sustraendo → resultado ≥ 0
      const a = randInt(1, ADD_MAX, rng);
      const b = randInt(0, a, rng);
      return { type, a, b, operator: "−", answer: a - b };
    }
    case "times-tables": {
      const a = randInt(1, 10, rng);
      const b = randInt(1, 10, rng);
      return { type, a, b, operator: "×", answer: a * b };
    }
    case "multiply-one-digit": {
      const a = randInt(10, 999, rng); // 2-3 cifras
      const b = randInt(1, 9, rng); // 1 cifra
      return { type, a, b, operator: "×", answer: a * b };
    }
    case "division-exact": {
      // dividendo = divisor × cociente; divisor 1-9, cociente ≤ 99, resto 0
      const divisor = randInt(1, 9, rng);
      const cociente = randInt(1, 99, rng);
      const dividendo = divisor * cociente;
      return { type, a: dividendo, b: divisor, operator: "÷", answer: cociente };
    }
    case "add-nocarry": {
      // 2.º: dos números ≤ 99 cuya suma no obliga a llevar ninguna columna.
      // a tiene decenas (10-90) y unidades; b se elige para que ninguna columna
      // supere 9. Resultado ≤ 99.
      const aTens = randInt(1, 9, rng);
      const aUnits = randInt(0, 9, rng);
      const bTens = randInt(0, 9 - aTens, rng);
      const bUnits = randInt(0, 9 - aUnits, rng);
      const a = aTens * 10 + aUnits;
      const b = bTens * 10 + bUnits;
      return { type, a, b, operator: "+", answer: a + b };
    }
    case "sub-noborrow": {
      // 2.º: minuendo ≥ sustraendo columna a columna → no hay que pedir prestado.
      const aTens = randInt(1, 9, rng);
      const aUnits = randInt(0, 9, rng);
      const bTens = randInt(0, aTens, rng);
      const bUnits = randInt(0, aUnits, rng);
      const a = aTens * 10 + aUnits;
      const b = bTens * 10 + bUnits;
      return { type, a, b, operator: "−", answer: a - b };
    }
    case "times-easy": {
      // 2.º: tablas iniciales 2, 5 y 10 (LOMLOE 2.º) × factor 1-10.
      const tables = [2, 5, 10] as const;
      const a = tables[Math.floor(rng() * tables.length)];
      const b = randInt(1, 10, rng);
      return { type, a, b, operator: "×", answer: a * b };
    }
    case "add-to-ten": {
      // 1.º: dos sumandos ≥ 1 con resultado ≤ 10.
      const a = randInt(1, 9, rng);
      const b = randInt(1, 10 - a, rng);
      return { type, a, b, operator: "+", answer: a + b };
    }
    case "multiply-two-digit": {
      // 4.º: dos factores de dos cifras (10-99).
      const a = randInt(10, 99, rng);
      const b = randInt(10, 99, rng);
      return { type, a, b, operator: "×", answer: a * b };
    }
  }
}

/** Mapea un id de tema de mates a su tipo de operación generable, o null si no genera. */
const TOPIC_TO_OP: Record<string, MathOpType> = {
  // 3.º
  "operations.add_carry": "add",
  "operations.sub_borrow": "sub",
  "operations.times_tables": "times-tables",
  "operations.multiply": "multiply-one-digit",
  "operations.division_intro": "division-exact",
  // 2.º
  "operations.add_nocarry": "add-nocarry",
  "operations.sub_noborrow": "sub-noborrow",
  "operations.times_2_5_10": "times-easy",
  // 1.º y 4.º
  "operations.add_to_10": "add-to-ten",
  "operations.multiply_2digit": "multiply-two-digit",
};

export function opForTopic(topicId: string): MathOpType | null {
  return TOPIC_TO_OP[topicId] ?? null;
}
