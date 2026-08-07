import { describe, it, expect } from "vitest";
import { extractCode, errorKeyFromCode } from "./auth";

/*
 * Lógica pura de traducción de errores de auth.ts (sin SDK de Firebase real).
 * Cubre en particular la detección de cancelación del picker nativo de Google
 * Sign-In (ADR-006), que no siempre expone `.code` y depende de reconocer
 * "cancel" en `.message` (ver comentario en auth.ts).
 */

describe("extractCode", () => {
  it("usa .code cuando está presente", () => {
    expect(extractCode({ code: "auth/invalid-email" })).toBe("auth/invalid-email");
  });

  it("ignora .message si .code ya está presente", () => {
    expect(extractCode({ code: "auth/network-request-failed", message: "cancel" })).toBe(
      "auth/network-request-failed",
    );
  });

  it("reconoce la cancelación nativa del picker (Android) por .message", () => {
    expect(extractCode({ message: "Authorization canceled." })).toBe("auth/popup-closed-by-user");
  });

  it("reconoce 'cancel' en .message sin distinguir mayúsculas", () => {
    expect(extractCode({ message: "User CANCELLED the flow" })).toBe("auth/popup-closed-by-user");
  });

  it("cae a 'unknown' con un mensaje que no menciona cancelación", () => {
    expect(extractCode({ message: "Network error" })).toBe("unknown");
  });

  it("cae a 'unknown' sin .code ni .message", () => {
    expect(extractCode({})).toBe("unknown");
    expect(extractCode(null)).toBe("unknown");
    expect(extractCode(undefined)).toBe("unknown");
    expect(extractCode("boom")).toBe("unknown");
  });
});

describe("errorKeyFromCode", () => {
  it("mapea auth/popup-closed-by-user a la clave de cancelación", () => {
    expect(errorKeyFromCode("auth/popup-closed-by-user")).toBe("auth:errors.cancelled");
  });

  it("mapea códigos conocidos a sus claves i18n", () => {
    expect(errorKeyFromCode("auth/email-already-in-use")).toBe("auth:errors.emailInUse");
    expect(errorKeyFromCode("auth/wrong-password")).toBe("auth:errors.invalidCredentials");
    expect(errorKeyFromCode("auth/invalid-credential")).toBe("auth:errors.invalidCredentials");
  });

  it("cae al mensaje genérico para códigos no contemplados", () => {
    expect(errorKeyFromCode("auth/no-credential")).toBe("auth:errors.generic");
    expect(errorKeyFromCode("unknown")).toBe("auth:errors.generic");
  });
});
