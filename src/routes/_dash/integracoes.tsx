import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { Button } from "@/components/ui/button";
import { integrations } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/integracoes")({
  component: Integracoes,
  head: () => ({
    meta: [
      { title: "Integrações · PAVOX" },
      {
        name: "description",
        content: "Conecte gateways, plataformas de e-commerce, analytics e marketing à PAVOX.",
      },
      { property: "og:title", content: "Integrações · PAVOX" },
      { property: "og:description", content: "Use seus próprios gateways e ferramentas." },
    ],
  }),
});

const categories = ["Todas", "Pagamentos", "E-commerce", "Analytics", "Marketing"];

function Integracoes() {
  const [cat, setCat] = useState("Todas");
  const rows = integrations.filter((i) => cat === "Todas" || i.category === cat);

  return (
    <>
      <PageHeader
        title="Integrações"
        subtitle="Conecte suas ferramentas e use os gateways que você já possui."
      />

      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              cat === c ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((i) => (
          <div key={i.name} className="surface flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
            <div className="flex items-start justify-between">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                style={{ backgroundColor: i.color }}
              >
                {i.tag}
              </span>
              <StatusBadge status={i.status} />
            </div>
            <h3 className="mt-4 font-semibold">{i.name}</h3>
            <p className="mt-1 flex-1 text-[13px] text-muted-foreground">{i.desc}</p>
            <Button
              variant={i.status === "Conectado" ? "outline" : "default"}
              size="sm"
              className="mt-4"
              onClick={() =>
                toast(
                  i.status === "Conectado"
                    ? `${i.name} já está conectado`
                    : `Conexão com ${i.name} disponível em breve`,
                )
              }
            >
              {i.status === "Conectado" ? "Gerenciar" : "Conectar"}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
