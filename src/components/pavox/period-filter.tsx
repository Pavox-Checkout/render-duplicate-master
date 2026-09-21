import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const options = ["Hoje", "7 dias", "30 dias", "Personalizado"];

export function PeriodFilter({ initial = "30 dias" }: { initial?: string }) {
  const [active, setActive] = useState(initial);
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-[var(--shadow-card)]">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => {
            setActive(o);
            if (o === "Personalizado") toast("Seletor de datas em breve");
          }}
          className={cn(
            "rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
            active === o
              ? "bg-secondary text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
