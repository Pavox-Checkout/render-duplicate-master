import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { IntegrationConnectDialog } from "@/components/pavox/integration-connect-dialog";
import { IntegrationManageDialog } from "@/components/pavox/integration-manage-dialog";
import { IntegrationStatusBadge } from "@/components/pavox/integration-status-badge";
import {
  PaymentRoutingSection,
  type PaymentMethod,
} from "@/components/pavox/payment-routing-section";
import { ProviderLogo } from "@/components/pavox/provider-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UI_GATEWAYS } from "@/lib/payments/integration-ui-catalog";
import {
  PAYMENT_METHOD_LABELS,
  PROVIDERS,
  type ProviderDef,
  type SavedIntegration,
} from "@/lib/payments/catalog";
import { useIntegrations, useSetPaymentRoute } from "@/lib/payments/use-integrations";
import { cn } from "@/lib/utils";

// Result of "Conectar com Mercado Pago" (the backend sends ?mp=<result>).
const OAUTH_RESULTS: Record<string, { ok: boolean; message: string }> = {
  connected: { ok: true, message: "Mercado Pago conectado! Suas vendas já usam essa conta." },
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

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

// Catalog names already served by a real adapter (same company / API).
const LIVE_ALIASES: Record<string, string[]> = {
  asaas: ["asaassandbox"],
  beehive: ["beehivepay", "beehive"],
  axionpay: ["axionpay"],
  pagou: ["pagou"],
  credwave: ["credwave"],
  appmax: ["appmax"],
  garu: ["garupay"],
  pagouv2: ["pagouv2", "pagouai"],
  fastpay: ["fastpaybrasil"],
  blackcat: ["blackcatv2"],
};

const LIVE_PROVIDERS: ProviderDef[] = PROVIDERS.filter((p) => p.kind === "payment" && p.live).map(
  (provider) => {
    // Reuse the catalog artwork when the brand has one.
    const aliases = LIVE_ALIASES[provider.id] ?? [norm(provider.name)];
    const art = UI_GATEWAYS.find((g) => aliases.includes(norm(g.name)) && g.referenceLogo);
    return art?.referenceLogo ? { ...provider, referenceLogo: art.referenceLogo } : provider;
  },
);

const TAKEN = new Set(Object.values(LIVE_ALIASES).flat());
const COMING_SOON: ProviderDef[] = [
  ...PROVIDERS.filter((p) => p.kind === "payment" && !p.live),
  ...UI_GATEWAYS.filter((g) => !TAKEN.has(norm(g.name))),
];

export function IntegrationHub() {
  const [query, setQuery] = useState("");
  const { data: saved, isLoading, isError, refetch } = useIntegrations();
  const setRoute = useSetPaymentRoute();
  const [connect, setConnect] = useState<{
    provider: ProviderDef;
    existing?: SavedIntegration;
  } | null>(null);
  const [manage, setManage] = useState<SavedIntegration | null>(null);

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

  const savedByProvider = useMemo(() => {
    const map = new Map<string, SavedIntegration>();
    (saved ?? []).forEach((integration) => map.set(integration.provider, integration));
    return map;
  }, [saved]);

  const matches = (p: ProviderDef) => norm(p.name).includes(norm(query));
  const live = LIVE_PROVIDERS.filter(matches);
  const soon = COMING_SOON.filter(matches);

  // Routing: connected gateways and the method each one was chosen for.
  const connected = LIVE_PROVIDERS.filter((p) => savedByProvider.get(p.id)?.status === "connected");
  const savedRoutes = useMemo(() => {
    const routes: Partial<Record<PaymentMethod, string>> = {};
    for (const integration of saved ?? []) {
      const primary = integration.routing["primary"];
      if (integration.status !== "connected" || !Array.isArray(primary)) continue;
      for (const method of primary) {
        if (method === "pix" || method === "card" || method === "boleto")
          routes[method] = integration.provider;
      }
    }
    return routes;
  }, [saved]);
  const compatibility = useMemo(() => {
    const supports = (method: PaymentMethod) => (gateway: ProviderDef) =>
      savedByProvider.get(gateway.id)?.enabledMethods.includes(method) ?? false;
    return { pix: supports("pix"), card: supports("card"), boleto: supports("boleto") };
  }, [savedByProvider]);

  const saveRoutes = async (changes: Partial<Record<PaymentMethod, string | null>>) => {
    try {
      for (const [method, provider] of Object.entries(changes)) {
        await setRoute.mutateAsync({ method: method as PaymentMethod, provider: provider ?? null });
      }
      toast.success("Roteamento salvo. O checkout já usa essa escolha.");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o roteamento.");
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        subtitle="Conecte suas próprias contas de gateway. A PAVOX orquestra os pagamentos — as contas são suas."
      />

      <div
        id="gateway-catalog"
        className="scroll-mt-6 surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-semibold">Catálogo de gateways</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {LIVE_PROVIDERS.length} disponíveis para conectar · {COMING_SOON.length} em breve
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar gateway..."
            className="pl-9"
            aria-label="Pesquisar gateway"
          />
        </div>
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {live.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {live.map((provider) => {
                const integration = savedByProvider.get(provider.id);
                return (
                  <LiveGatewayCard
                    key={provider.id}
                    provider={provider}
                    integration={integration}
                    onConnect={() => setConnect({ provider })}
                    onManage={() => integration && setManage(integration)}
                  />
                );
              })}
            </div>
          ) : null}

          <PaymentRoutingSection
            availableGateways={connected}
            compatibility={compatibility}
            savedGateways={savedRoutes}
            onSave={saveRoutes}
            saving={setRoute.isPending}
          />

          {soon.length ? (
            <section className="space-y-3 border-t border-border/70 pt-8">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Em breve</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Estes gateways ainda não têm integração na PAVOX. Nenhuma conexão é feita com eles
                por enquanto.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {soon.map((gateway) => (
                  <div
                    key={gateway.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 opacity-80"
                  >
                    <ProviderLogo provider={gateway} className="h-9 w-9 rounded-lg" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                      {gateway.name}
                    </span>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      Em breve
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {!live.length && !soon.length ? (
            <div className="surface py-16 text-center">
              <p className="font-medium">Nenhum gateway encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Tente buscar por outro nome.</p>
            </div>
          ) : null}
        </>
      )}

      {connect ? (
        <IntegrationConnectDialog
          provider={connect.provider}
          existing={connect.existing}
          open
          onOpenChange={(open) => {
            if (!open) setConnect(null);
          }}
        />
      ) : null}

      {manage ? (
        <IntegrationManageDialog
          integration={manage}
          open
          onOpenChange={(open) => {
            if (!open) setManage(null);
          }}
          onEdit={(provider, existing) => {
            setManage(null);
            setConnect({ provider, existing });
          }}
        />
      ) : null}
    </div>
  );
}

function LiveGatewayCard({
  provider,
  integration,
  onConnect,
  onManage,
}: {
  provider: ProviderDef;
  integration?: SavedIntegration | undefined;
  onConnect: () => void;
  onManage: () => void;
}) {
  const isConnected = Boolean(integration && integration.status !== "not_connected");
  return (
    <article className="surface group flex min-h-[180px] flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <ProviderLogo provider={provider} className="h-11 w-11 rounded-xl" />
        <IntegrationStatusBadge status={integration?.status ?? "not_connected"} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold">{provider.name}</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">{provider.desc}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(isConnected ? integration!.enabledMethods : provider.methods).map((method) => (
          <span
            key={method}
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              isConnected
                ? "bg-secondary text-foreground"
                : "border border-dashed border-border text-muted-foreground",
            )}
          >
            {PAYMENT_METHOD_LABELS[method]}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-4">
        {isConnected ? (
          <Button variant="outline" size="sm" className="w-full" onClick={onManage}>
            Gerenciar
          </Button>
        ) : (
          <Button size="sm" className="w-full" onClick={onConnect}>
            Conectar
          </Button>
        )}
      </div>
    </article>
  );
}
