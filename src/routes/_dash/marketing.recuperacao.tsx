import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, MessageCircle, Mail, Smartphone, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { StatCard } from "@/components/pavox/stat-card";
import { SettingToggle } from "@/components/pavox/marketing/setting-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_dash/marketing/recuperacao")({
  component: RecuperacaoMarketingPage,
  head: () => ({
    meta: [
      { title: "Recuperação · Marketing · PAVOX" },
      {
        name: "description",
        content: "Recupere checkouts abandonados automaticamente por WhatsApp, e-mail e SMS.",
      },
    ],
  }),
});

const CHANNELS: { id: string; icon: LucideIcon; label: string; description: string; on: boolean }[] = [
  {
    id: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    description: "Mensagem automática após 15 minutos de abandono.",
    on: true,
  },
  {
    id: "email",
    icon: Mail,
    label: "E-mail",
    description: "Sequência de 2 e-mails em até 24 horas.",
    on: true,
  },
  {
    id: "sms",
    icon: Smartphone,
    label: "SMS",
    description: "Lembrete curto com link direto para o checkout.",
    on: false,
  },
];

function RecuperacaoMarketingPage() {
  const [channels, setChannels] = useState(() =>
    Object.fromEntries(CHANNELS.map((c) => [c.id, c.on])),
  );

  return (
    <>
      <PageHeader
        title="Recuperação"
        subtitle="Reconquiste clientes que abandonaram o checkout com mensagens automáticas multicanal."
        actions={
          <Button size="sm" onClick={() => toast.success("Configurações de recuperação salvas.")}>
            <Save className="h-4 w-4" /> Salvar alterações
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Checkouts abandonados" value="0" hint="Últimos 30 dias" icon={RotateCcw} />
        <StatCard label="Recuperados" value="0" hint="Últimos 30 dias" icon={RotateCcw} />
        <StatCard label="Taxa de recuperação" value="0,00%" hint="Últimos 30 dias" icon={RotateCcw} />
        <StatCard label="Receita recuperada" value="R$ 0,00" hint="Últimos 30 dias" icon={RotateCcw} />
      </div>

      <section className="surface space-y-4 p-5">
        <div>
          <h2 className="text-[15px] font-semibold">Canais de recuperação</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Escolha por onde as mensagens automáticas serão enviadas aos clientes.
          </p>
        </div>

        <div className="space-y-2">
          {CHANNELS.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <SettingToggle
                  label={c.label}
                  description={c.description}
                  checked={channels[c.id] ?? false}
                  onCheckedChange={(v) => setChannels((prev) => ({ ...prev, [c.id]: v }))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
