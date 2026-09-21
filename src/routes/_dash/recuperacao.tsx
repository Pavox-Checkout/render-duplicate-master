import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link2, Mail, MessageCircle, RotateCcw, ShoppingCart, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatCard } from "@/components/pavox/stat-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { abandoned, brl } from "@/lib/mock";
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
        <StatCard label="Carrinhos abandonados" value="R$ 42.830" delta={-6.2} hint="30 dias" icon={ShoppingCart} />
        <StatCard label="Recuperados" value="R$ 13.420" delta={21.5} hint="30 dias" icon={RotateCcw} />
        <StatCard label="Taxa de recuperação" value="31,3%" delta={4.4} hint="30 dias" icon={TrendingUp} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="surface overflow-hidden">
          <div className="p-5">
            <h2 className="text-base font-semibold">Carrinhos abandonados</h2>
            <p className="text-[13px] text-muted-foreground">Contate agora, enquanto o interesse é alto.</p>
          </div>
          <div className="divide-y divide-border border-t border-border">
            {abandoned.map((a) => (
              <div key={a.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {a.product} · {brl(a.amount)} · parou em {a.step} · {a.time}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success(`WhatsApp aberto para ${a.name}`)}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("E-mail de recuperação enviado")}>
                    <Mail className="h-4 w-4" /> E-mail
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`https://pay.pavox.app/c/${a.id}`);
                      toast.success("Link do checkout copiado");
                    }}
                  >
                    <Link2 className="h-4 w-4" /> Link
                  </Button>
                </div>
              </div>
            ))}
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
