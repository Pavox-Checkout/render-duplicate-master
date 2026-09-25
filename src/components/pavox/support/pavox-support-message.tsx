import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PavoxSupportMessage({
  from,
  children,
}: {
  from: "bot" | "user";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300",
        from === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          from === "user"
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-secondary text-secondary-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
