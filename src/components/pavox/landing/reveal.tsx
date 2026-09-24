import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** delay in ms before the element animates in */
  delay?: number;
  /** vertical travel distance; use "none" for a pure fade */
  from?: "up" | "down" | "left" | "right" | "none";
};

const OFFSET: Record<NonNullable<RevealProps["from"]>, string> = {
  up: "translate-y-8",
  down: "-translate-y-8",
  left: "translate-x-8",
  right: "-translate-x-8",
  none: "",
};

/**
 * Wraps content and reveals it (fade + slide) the first time it enters the
 * viewport. Purely presentational; motion is disabled for reduced-motion users
 * via the CSS transition falling back to the resting state instantly.
 */
export function Reveal({ children, className, delay = 0, from = "up" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none",
        visible ? "translate-x-0 translate-y-0 opacity-100 blur-0" : cn("opacity-0 blur-[2px]", OFFSET[from]),
        className,
      )}
    >
      {children}
    </div>
  );
}
