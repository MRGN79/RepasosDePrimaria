import { describe, it, expect } from "vitest";
import { generateAdultChallenge, checkAdultChallenge } from "./adultChallenge";

describe("generateAdultChallenge", () => {
  it("produce factores de dos cifras (11–19) y el producto correcto", () => {
    const seq = [0, 0.999];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const ch = generateAdultChallenge(rng);
    expect(ch.a).toBe(11);
    expect(ch.b).toBe(19);
    expect(ch.answer).toBe(11 * 19);
  });

  it("el resultado nunca es una tabla básica memorizable (>= 121)", () => {
    for (let s = 0; s < 1; s += 0.05) {
      const ch = generateAdultChallenge(() => s);
      expect(ch.answer).toBe(ch.a * ch.b);
      expect(ch.answer).toBeGreaterThanOrEqual(11 * 11);
      expect(ch.a).toBeGreaterThanOrEqual(11);
      expect(ch.a).toBeLessThanOrEqual(19);
    }
  });
});

describe("checkAdultChallenge", () => {
  const ch = { a: 13, b: 12, answer: 156 };

  it("acepta la respuesta correcta", () => {
    expect(checkAdultChallenge(ch, "156")).toBe(true);
    expect(checkAdultChallenge(ch, " 156 ")).toBe(true);
  });

  it("rechaza respuestas incorrectas, vacías o no numéricas", () => {
    expect(checkAdultChallenge(ch, "155")).toBe(false);
    expect(checkAdultChallenge(ch, "")).toBe(false);
    expect(checkAdultChallenge(ch, "  ")).toBe(false);
    expect(checkAdultChallenge(ch, "abc")).toBe(false);
    expect(checkAdultChallenge(ch, "156.0")).toBe(true); // Number("156.0")===156
    expect(checkAdultChallenge(ch, "15 6")).toBe(false);
  });
});
