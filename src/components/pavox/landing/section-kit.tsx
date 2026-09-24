import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        align === "center" && "mx-auto max-w-2xl",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-balance font-display text-[clamp(1.75rem,3.6vw,2.85rem)] font-bold leading-[1.06] text-white">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-pretty text-[15px] leading-7 text-white/55 sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}

/** Standard vertical rhythm + horizontal container for a landing section. */
export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-24 py-20 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">{children}</div>
    </section>
  );
}
