import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, ShoppingCart, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatCard } from "@/components/pavox/stat-card";
import { EmptyState } from "@/components/pavox/empty-state";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/recuperacao")({
  component: Recuperacao,
  head: () => ({
    meta: [
      { title: "Recuperação · PAVOX" },
      {
        name: "description",
        content: "Recupere carrinhos abandonados por WhatsApp, e-mail e SMS com a PAVOX.",
      },
      { property: "og:title", content: "Recuperação · PAVOX" },
      { property: "og:description", content: "Transforme abandono em receita recuperada." },
    ],
  }),
});

function Recuperacao() {
  const [channels, setChannels] = useState({ whatsapp: true, email: true, sms: false });

  return (
    <>
      <PageHeader
        title="Recuperação"
        subtitle="Cada carrinho abandonado é uma venda que ainda pode acontecer."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Carrinhos abandonados" value="R$ 0,00" hint="30 dias" icon={ShoppingCart} />
        <StatCard label="Recuperados" value="R$ 0,00" hint="30 dias" icon={RotateCcw} />
        <StatCard label="Taxa de recuperação" value="0,00%" hint="30 dias" icon={TrendingUp} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="surface overflow-hidden">
          <div className="p-5">
            <h2 className="text-base font-semibold">Carrinhos abandonados</h2>
            <p className="text-[13px] text-muted-foreground">
              Contate assim que alguém deixar a compra pela metade.
            </p>
          </div>
          <div className="px-5 pb-5">
            <EmptyState
              icon={RotateCcw}
              title="Sem dados de recuperação ainda."
              description="Quando seus checkouts começarem a receber visitantes, você poderá acompanhar oportunidades de recuperação aqui."
            />
          </div>
        </div>

        <div className="surface h-fit p-5">
          <h2 className="text-base font-semibold">Recuperação automática</h2>
          <p className="text-[13px] text-muted-foreground">
            Dispare mensagens sozinho, no melhor momento.
          </p>
          <div className="mt-5 space-y-4">
            {(
              [
                ["whatsapp", "WhatsApp", "Mensagem 15 min após o abandono"],
                ["email", "E-mail", "Sequência de 3 e-mails em 48h"],
                ["sms", "SMS", "Lembrete final em 24h"],
              ] as const
            ).map(([key, label, desc]) => (
              <div key={key} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-[13.5px] font-medium">{label}</p>
                  <p className="text-[12px] text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={channels[key]}
                  onCheckedChange={(v) => {
                    setChannels((c) => ({ ...c, [key]: v }));
                    toast(`${label} ${v ? "ativado" : "desativado"}`);
                  }}
                />
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-accent p-3 text-[12.5px] text-accent-foreground">
            A configuração completa das automações estará disponível em breve.
          </p>
        </div>
      </div>
    </>
  );
}
