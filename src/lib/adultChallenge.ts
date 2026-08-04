/*
 * Reto de adulto (ADR-003 §4, ADR-004 §1/§7). Una operación aritmética que un
 * niño de primaria no resuelve de memoria — fricción, no prueba criptográfica
 * de adultez (así lo etiqueta Seguridad). Se reutiliza en dos puntos de uso de
 * este incremento:
 *   - El paso "¿tú o tu hijo/a?" del alta con Google, rama "soy el adulto".
 *   - (Preparado para) la puerta parental de acciones sensibles (Inc. 5).
 *
 * Módulo PURO y determinista con un RNG inyectable, para poder testearlo.
 */

export interface AdultChallenge {
  a: number;
  b: number;
  /** Resultado esperado (a × b). */
  answer: number;
}

/**
 * Genera un reto: producto de dos números de dos cifras (11–19). El resultado
 * (121–361) no es una tabla que un niño pequeño tenga memorizada, pero un adulto
 * lo resuelve con la operación a la vista.
 */
export function generateAdultChallenge(rng: () => number = Math.random): AdultChallenge {
  const a = 11 + Math.floor(rng() * 9); // 11..19
  const b = 11 + Math.floor(rng() * 9); // 11..19
  return { a, b, answer: a * b };
}

/** Comprueba la respuesta introducida (string del input) contra el reto. */
export function checkAdultChallenge(challenge: AdultChallenge, input: string): boolean {
  const trimmed = input.trim();
  if (trimmed === "") return false;
  const n = Number(trimmed);
  return Number.isInteger(n) && n === challenge.answer;
}
