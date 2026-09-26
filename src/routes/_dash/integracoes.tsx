import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { IntegrationStatusBadge } from "@/components/pavox/integration-status-badge";
import { IntegrationConnectDialog } from "@/components/pavox/integration-connect-dialog";
import { IntegrationManageDialog } from "@/components/pavox/integration-manage-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  PROVIDERS,
  PAYMENT_METHOD_LABELS,
  type ProviderDef,
  type SavedIntegration,
} from "@/lib/payments/catalog";
import { useIntegrations } from "@/lib/payments/use-integrations";

export const Route = createFileRoute("/_dash/integracoes")({
  component: Integracoes,
  head: () => ({
    meta: [
      { title: "Integrações · PAVOX" },
      {
        name: "description",
        content: "Conecte e gerencie seus próprios gateways de pagamento na PAVOX.",
      },
    ],
  }),
});

const CATEGORIES = ["Todas", "Pagamentos", "E-commerce"] as const;

// Result of "Conectar com Mercado Pago" (the backend sends ?mp=<result>).
const OAUTH_RESULTS: Record<string, { ok: boolean; message: string }> = {
  connected: {
    ok: true,
    message: "Mercado Pago conectado! Suas vendas com Pix já usam essa conta.",
  },
  denied: { ok: false, message: "A conexão foi cancelada no Mercado Pago." },
  not_brazil: { ok: false, message: "Essa conta do Mercado Pago não é do Brasil." },
  not_configured: {
    ok: false,
    message: "A conexão automática com o Mercado Pago ainda não está disponível.",
  },
  error: {
    ok: false,
    message: "Não foi possível concluir a conexão com o Mercado Pago. Tente de novo.",
  },
};

function Integracoes() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todas");
  const { data: saved, isLoading, isError, refetch } = useIntegrations();

  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("mp");
    if (!result) return;
    const info = OAUTH_RESULTS[result] ?? OAUTH_RESULTS["error"]!;
    if (info.ok) toast.success(info.message);
    else toast.error(info.message);
    url.searchParams.delete("mp");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    void refetch();
  }, [refetch]);

  const [connect, setConnect] = useState<{
    provider: ProviderDef;
    existing?: SavedIntegration;
  } | null>(null);
  const [manage, setManage] = useState<SavedIntegration | null>(null);

  const savedByProvider = useMemo(() => {
    const map = new Map<string, SavedIntegration>();
    (saved ?? []).forEach((i) => map.set(i.provider, i));
    return map;
  }, [saved]);

  const rows = PROVIDERS.filter((p) => cat === "Todas" || p.category === cat);

  return (
    <>
      <PageHeader
        title="Integrações"
        subtitle="Conecte suas próprias contas de gateway e administre cada conexão. A PAVOX orquestra os pagamentos — as contas são suas."
      />

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-[13px] font-medium transition",
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Não foi possível carregar as integrações"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[168px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((p) => {
            const integ = savedByProvider.get(p.id);
            // Gateways sem adaptador no backend aparecem como "Em breve" (sem conexão fictícia).
            const isPayment = p.kind === "payment" && p.live;
            const connected = isPayment && integ && integ.status !== "not_connected";
            return (
              <div
                key={p.id}
                className="surface flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                    style={{ backgroundColor: p.color }}
                    aria-hidden
                  >
                    {p.tag}
                  </span>
                  {isPayment ? (
                    <IntegrationStatusBadge status={integ?.status ?? "not_connected"} />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[12px] font-semibold text-muted-foreground">
                      Em breve
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-[15px] font-semibold">{p.name}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{p.desc}</p>

                {isPayment ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(connected ? integ!.enabledMethods : p.methods).map((m) => (
                      <span
                        key={m}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          connected
                            ? "bg-secondary text-foreground"
                            : "border border-dashed border-border text-muted-foreground",
                        )}
                      >
                        {PAYMENT_METHOD_LABELS[m]}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex-1" />
                <div className="pt-1">
                  {!isPayment ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => toast.info(`Integração ${p.name} disponível em breve.`)}
                    >
                      Conectar
                    </Button>
                  ) : connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setManage(integ!)}
                    >
                      Gerenciar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setConnect({ provider: p })}
                    >
                      Conectar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {connect ? (
        <IntegrationConnectDialog
          provider={connect.provider}
          existing={connect.existing}
          open
          onOpenChange={(o) => {
            if (!o) setConnect(null);
          }}
        />
      ) : null}

      {manage ? (
        <IntegrationManageDialog
          integration={manage}
          open
          onOpenChange={(o) => {
            if (!o) setManage(null);
          }}
          onEdit={(provider, existing) => {
            setManage(null);
            setConnect({ provider, existing });
          }}
        />
      ) : null}
    </>
  );
}
