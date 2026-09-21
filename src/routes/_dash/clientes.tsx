import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Users, Repeat, Wallet } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatCard } from "@/components/pavox/stat-card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { brl, customers } from "@/lib/mock";

export const Route = createFileRoute("/_dash/clientes")({
  component: Clientes,
  head: () => ({
    meta: [
      { title: "Clientes · PAVOX" },
      {
        name: "description",
        content: "Base de clientes, recorrência de compra e valor gerado por pessoa.",
      },
      { property: "og:title", content: "Clientes · PAVOX" },
      { property: "og:description", content: "Entenda quem compra de você e quanto gera." },
    ],
  }),
});

function Clientes() {
  const [q, setQ] = useState("");
  const rows = customers.filter((c) =>
    (c.name + c.email).toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Clientes" subtitle="Quem compra, com que frequência e quanto gera." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Clientes ativos" value="3.482" delta={9.2} hint="30 dias" icon={Users} />
        <StatCard label="Taxa de recompra" value="27,4%" delta={3.1} hint="30 dias" icon={Repeat} />
        <StatCard label="LTV médio" value="R$ 428,90" delta={6.8} hint="30 dias" icon={Wallet} />
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente"
          className="pl-9"
        />
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Cliente</th>
                <th className="px-5 py-2.5 font-medium">Pedidos</th>
                <th className="px-5 py-2.5 font-medium">Total gasto</th>
                <th className="px-5 py-2.5 font-medium">LTV estimado</th>
                <th className="px-5 py-2.5 font-medium">Última compra</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent text-[11px] font-semibold text-accent-foreground">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-[12px] text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{c.orders}</td>
                  <td className="px-5 py-3 font-semibold">{brl(c.spent)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{brl(c.ltv)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-semibold">Nenhum cliente encontrado</p>
            <p className="text-[13px] text-muted-foreground">Tente outro nome ou e-mail.</p>
          </div>
        )}
      </div>
    </>
  );
}
