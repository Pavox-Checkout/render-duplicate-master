import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { team } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/equipe")({
  component: Equipe,
  head: () => ({
    meta: [
      { title: "Equipe · PAVOX" },
      { name: "description", content: "Convide pessoas e defina permissões de acesso na PAVOX." },
      { property: "og:title", content: "Equipe · PAVOX" },
      { property: "og:description", content: "Gestão de acessos do seu time." },
    ],
  }),
});

function Equipe() {
  return (
    <>
      <PageHeader
        title="Equipe"
        subtitle="Controle quem acessa sua operação e com quais permissões."
        actions={
          <Button onClick={() => toast.success("Convite enviado (protótipo)")}>
            <UserPlus className="h-4 w-4" /> Convidar pessoa
          </Button>
        }
      />

      <div className="surface divide-y divide-border">
        {team.map((m) => (
          <div key={m.email} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-accent text-[12px] font-semibold text-accent-foreground">
                  {m.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[14px] font-medium">{m.name}</p>
                <p className="text-[12.5px] text-muted-foreground">{m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-muted-foreground">{m.role}</span>
              <StatusBadge status={m.status} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
