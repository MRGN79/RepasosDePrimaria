/*
 * Iconos del sistema. Línea gruesa, estilo plano, esquinas redondeadas
 * (coherente con la personalidad visual §1). currentColor para heredar el color
 * del contexto. Decorativos por defecto (aria-hidden); el significado vive en el
 * texto adyacente (regla "no solo color / no solo icono").
 *
 * Las formas de check (✓) y cross (✗) son CLARAMENTE distintas, no dos círculos
 * parecidos: superan el test de escala de grises (A11Y-COLOR-01/02).
 */
import type { SVGProps } from "react";

export type IconName =
  | "check"
  | "cross"
  | "retry"
  | "star"
  | "star-outline"
  | "streak"
  | "lock"
  | "cloud"
  | "rocket"
  | "sound-on"
  | "sound-off"
  | "home"
  | "back"
  | "settings"
  | "backpack"
  | "thumb-up"
  | "thumb-down"
  | "delete"
  | "chevron-right";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  /** tamaño en px; el hit-area lo controla el componente contenedor */
  size?: number;
};

const PATHS: Record<IconName, JSX.Element> = {
  check: <path d="M5 13l4 4L19 7" />,
  cross: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  retry: (
    <>
      <path d="M20 11a8 8 0 10-2.3 5.6" />
      <path d="M20 4v6h-6" />
    </>
  ),
  star: (
    <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />
  ),
  "star-outline": (
    <path d="M12 4l2.3 5 5.4.6-4 3.7 1.1 5.3L12 16.2 7.2 18.6l1.1-5.3-4-3.7 5.4-.6z" />
  ),
  streak: (
    <path d="M12 3c1 3-1 4-1 6a3 3 0 003 3c0-1 1-2 1-3 2 2 3 4 3 6a6 6 0 11-12 0c0-4 4-6 6-12z" />
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  cloud: (
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  ),
  rocket: (
    <>
      <path d="M5 19l3-1 1-3" />
      <path d="M14 4c4 0 6 2 6 6-2 4-7 8-9 9l-6-6c1-2 5-7 9-9z" />
      <circle cx="14" cy="10" r="1.6" />
    </>
  ),
  "sound-on": (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16 8a5 5 0 010 8" />
    </>
  ),
  "sound-off": (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16 9l5 6" />
      <path d="M21 9l-5 6" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" />,
  back: <path d="M15 5l-7 7 7 7" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </>
  ),
  backpack: (
    <>
      <path d="M7 9a5 5 0 0110 0v10a1 1 0 01-1 1H8a1 1 0 01-1-1z" />
      <path d="M10 9h4M9 14h6" />
    </>
  ),
  "thumb-up": (
    <path d="M7 11v8H4v-8zM7 11l4-7c1.5 0 2 1 2 2v3h5a2 2 0 012 2l-1.5 6a2 2 0 01-2 1.5H7" />
  ),
  "thumb-down": (
    <path d="M17 13V5h3v8zM17 13l-4 7c-1.5 0-2-1-2-2v-3H6a2 2 0 01-2-2l1.5-6A2 2 0 017.5 4H17" />
  ),
  delete: (
    <>
      <path d="M9 6l-5 6 5 6h10a1 1 0 001-1V7a1 1 0 00-1-1z" />
      <path d="M13 10l4 4M17 10l-4 4" />
    </>
  ),
  "chevron-right": <path d="M9 5l7 7-7 7" />,
};

export function Icon({ name, size = 24, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
