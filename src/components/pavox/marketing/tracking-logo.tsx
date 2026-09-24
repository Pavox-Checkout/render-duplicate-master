import { cn } from "@/lib/utils";

/**
 * Marcas visuais das plataformas de tracking.
 *
 * São ícones ORIGINAIS desenhados para a PAVOX, apenas inspirados nas cores/
 * formas das marcas (UTMify, Otimizey, Wetracked) — não são recortes de
 * screenshot nem cópia da imagem de referência. Cada logo traz seu próprio
 * fundo, então basta definir o tamanho.
 */
export function TrackingLogo({
  id,
  size = 44,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    className: cn("shrink-0", className),
    role: "img" as const,
  };

  switch (id) {
    case "utmify":
      return (
        <svg {...common} aria-label="UTMify">
          <rect width="40" height="40" rx="11" fill="#0B0B0F" />
          <path
            d="M13 11.5v9.2a7 7 0 0 0 14 0V11.5"
            stroke="#fff"
            strokeWidth="4.4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="29.3" cy="12.2" r="2.4" fill="#3B82F6" />
        </svg>
      );

    case "otimizey":
      return (
        <svg {...common} aria-label="Otimizey">
          <defs>
            <linearGradient id="oti-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#1E40AF" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="20" fill="url(#oti-grad)" />
          <circle cx="20" cy="20" r="8.5" stroke="#fff" strokeWidth="4" fill="none" />
          <circle cx="20" cy="20" r="2.6" fill="#fff" />
        </svg>
      );

    case "wetracked":
      return (
        <svg {...common} aria-label="Wetracked">
          <rect width="40" height="40" rx="11" fill="#1D9BF0" />
          <path
            d="M8.5 13.5 13.5 27 20 15.5 26.5 27 31.5 13.5"
            stroke="#fff"
            strokeWidth="3.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    default:
      return null;
  }
}
