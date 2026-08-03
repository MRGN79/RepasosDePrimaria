/*
 * Botón "atrás" físico de Android (ADR-003, shell Capacitor).
 *
 * La app enruta por estado (sin History API), así que el WebView no tiene
 * historial que consumir: sin este hook, el botón atrás cerraría la app desde
 * cualquier pantalla. Comportamiento: si no estamos en Home, volver a Home; si
 * ya estamos en Home, permitir salir (minimizar la app).
 *
 * Inerte fuera de Android nativo: en web el evento `backButton` no se dispara.
 * El plugin se importa de forma perezosa para no acoplar la app web al nativo.
 */
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function useAndroidBackButton(isHome: boolean, goHome: () => void): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;
    let cancelled = false;

    void import("@capacitor/app").then(({ App }) => {
      if (cancelled) return;
      const handle = App.addListener("backButton", () => {
        if (isHome) {
          void App.exitApp();
        } else {
          goHome();
        }
      });
      remove = () => {
        void handle.then((h) => h.remove());
      };
    });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [isHome, goHome]);
}
