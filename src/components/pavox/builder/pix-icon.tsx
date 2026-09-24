import type { CSSProperties } from "react";

/**
 * Marca visual do Pix (aproximação geométrica das quatro pontas do símbolo).
 * Usa currentColor para herdar a cor do contexto.
 */
export function PixIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.05 2.5a2.4 2.4 0 0 1 1.7.7l2.25 2.25 2.25-2.25a2.4 2.4 0 0 1 1.7-.7l-3.24 3.24a1 1 0 0 1-1.42 0L8.05 2.5Z" />
      <path d="M8.05 21.5a2.4 2.4 0 0 0 1.7-.7l2.25-2.25 2.25 2.25a2.4 2.4 0 0 0 1.7.7l-3.24-3.24a1 1 0 0 0-1.42 0L8.05 21.5Z" />
      <path d="M2.5 8.05a2.4 2.4 0 0 1 .7 1.7l.9.9 2.29 2.29a1 1 0 0 1 0 1.42l-3.19 3.19a2.4 2.4 0 0 1-.7-1.7v-7.79Z" transform="rotate(0 12 12)" />
      <path d="M5.29 8.34 3.2 6.25a2.4 2.4 0 0 0-.7 1.7v8.1a2.4 2.4 0 0 0 .7 1.7l2.09-2.09a2 2 0 0 0 .59-1.42v-4.48a2 2 0 0 0-.59-1.42Z" />
      <path d="M18.71 8.34l2.09-2.09a2.4 2.4 0 0 1 .7 1.7v8.1a2.4 2.4 0 0 1-.7 1.7l-2.09-2.09a2 2 0 0 1-.59-1.42v-4.48a2 2 0 0 1 .59-1.42Z" />
      <path d="M12 7.9a2 2 0 0 1 1.42.59l2.3 2.3a2 2 0 0 0 1.41.58h.99a2 2 0 0 0-.58 1.41v.44a2 2 0 0 1-.83-.5l-2.3-2.3a2 2 0 0 0-2.82 0l-2.3 2.3a2 2 0 0 1-.83.5v-.44a2 2 0 0 0-.58-1.41h.99a2 2 0 0 0 1.41-.58l2.3-2.3A2 2 0 0 1 12 7.9Z" />
    </svg>
  );
}
