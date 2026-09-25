import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Globe,
  Layers,
  Link2,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { DomainStatusBadge } from "@/components/pavox/domain-status-badge";
import { DomainAddDialog } from "@/components/pavox/domain-add-dialog";
import { CheckoutSelect } from "@/components/pavox/checkout-select";
import { DnsHelp, DnsRecordsTable } from "@/components/pavox/dns-records-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  PLAN_DOMAIN_LIMITS,
  useDomains,
  useRemoveDomain,
  useSetDomainCheckout,
  useSetPrimaryDomain,
  useVerifyDomain,
  type Domain,
} from "@/lib/domains";
import { useSubscription } from "@/lib/billing";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_dash/dominios")({
  component: Dominios,
  head: () => ({
    meta: [
      { title: "Domínios · PAVOX" },
      {
        name: "description",
        content: "Conecte o domínio da sua marca aos seus checkouts na PAVOX.",
      },
    ],
  }),
});

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function Dominios() {
  const { data: domains = [], isLoading, isError, refetch } = useDomains();
  const { data: subscription } = useSubscription();
  const { profile } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<Domain | null>(null);
  const remove = useRemoveDomain();

  const planSlug = subscription?.plan?.slug ?? "free";
  const planName = subscription?.plan?.name ?? "Free";
  const domainLimit = PLAN_DOMAIN_LIMITS[planSlug] ?? 1;
  const currentDomains = domains.length;
  const available = Math.max(domainLimit - currentDomains, 0);
  const limitReached = currentDomains >= domainLimit;
  const primary = domains.find((d) => d.is_primary);
  const pavoxBase =
    typeof window !== "undefined" && profile?.store_slug
      ? `${window.location.host}/c/${profile.store_slug}/`
      : "";

  const summary = useMemo(
    () => [
      {
        label: "Domínios utilizados",
        value: `${currentDomains}`,
        icon: Globe,
        hint: `de ${domainLimit}`,
      },
      {
        label: "Limite do plano",
        value: `${domainLimit}`,
        icon: Layers,
        hint: `plano ${planName}`,
      },
      {
        label: "Domínios disponíveis",
        value: `${available}`,
        icon: Plus,
        hint: available === 1 ? "vaga" : "vagas",
      },
      {
        label: "Domínio principal",
        value: primary ? "Definido" : "—",
        icon: Star,
        hint: primary?.hostname ?? "nenhum",
      },
    ],
    [currentDomains, domainLimit, available, planName, primary],
  );

  async function confirmRemove() {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success("Domínio removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o domínio.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Domínios"
        subtitle="Use o domínio da sua marca para abrir seus checkouts."
        actions={
          <Button onClick={() => setAddOpen(true)} disabled={limitReached || isLoading}>
            <Plus className="h-4 w-4" /> Adicionar domínio
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="surface p-4">
            <div className="flex items-start justify-between">
              <span className="text-[12.5px] font-medium text-muted-foreground">{s.label}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-3 font-display text-[22px] leading-none font-bold tracking-tight">
              {s.value}
            </p>
            <p className="mt-1.5 truncate text-[12px] text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Link PAVOX — sempre disponível, sem configuração */}
      {pavoxBase ? (
        <div className="surface flex items-start gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Link2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold">Link PAVOX (sempre ativo)</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Todo checkout publicado já funciona em{" "}
              <span className="font-mono text-foreground">{pavoxBase}nome-do-checkout</span>. O
              domínio próprio é opcional.
            </p>
          </div>
        </div>
      ) : null}

      <div className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13.5px] font-semibold">
              {currentDomains} de {domainLimit}{" "}
              {domainLimit === 1 ? "domínio utilizado" : "domínios utilizados"}
            </p>
            <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              Plano {planName}
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full max-w-md overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                limitReached ? "bg-warning" : "bg-brand-gradient",
              )}
              style={{ width: `${Math.min((currentDomains / domainLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
        {limitReached ? (
          <div className="flex items-center gap-3">
            <p className="text-[12.5px] font-medium text-[oklch(0.52_0.13_75)]">
              Limite de domínios atingido
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/planos">
                Fazer upgrade <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        ) : null}
      </div>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Seus domínios</h2>

        {isLoading ? (
          <div className="surface flex items-center justify-center p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <div className="surface flex items-center justify-between gap-3 p-5 text-[13px]">
            <span className="text-destructive">Não foi possível carregar seus domínios.</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : domains.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="Você ainda não conectou um domínio"
            description="Conecte um endereço da sua marca, como checkout.sualoja.com.br."
            action={
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> Adicionar domínio
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {domains.map((d) => (
              <DomainRow key={d.id} domain={d} onRemove={() => setRemoving(d)} />
            ))}
          </div>
        )}
      </section>

      <DomainAddDialog open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover domínio?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{removing?.hostname}</span> deixará de
              abrir seu checkout. Lembre de apagar os registros DNS no seu provedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmRemove();
              }}
              disabled={remove.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DomainRow({ domain, onRemove }: { domain: Domain; onRemove: () => void }) {
  const verify = useVerifyDomain();
  const setCheckout = useSetDomainCheckout();
  const setPrimary = useSetPrimaryDomain();
  const [showDns, setShowDns] = useState(domain.status !== "active");
  const active = domain.status === "active";

  async function runVerify() {
    try {
      const next = await verify.mutateAsync(domain.id);
      if (next.status === "active") toast.success("Domínio conectado!");
      else toast.info("O DNS ainda não está pronto. A propagação pode levar algum tempo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível verificar agora.");
    }
  }

  async function changeCheckout(checkoutId: string) {
    try {
      await setCheckout.mutateAsync({ domainId: domain.id, checkoutId });
      toast.success("Checkout do domínio atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar.");
    }
  }

  async function makePrimary() {
    try {
      await setPrimary.mutateAsync(domain.id);
      toast.success("Domínio principal atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar.");
    }
  }

  return (
    <div className="surface p-4 transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Globe className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[14.5px] font-semibold">{domain.hostname}</p>
              {domain.is_primary ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  <Star className="h-3 w-3 fill-current" /> Principal
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {active
                ? `Conectado em ${formatDate(domain.verified_at)}`
                : `Adicionado em ${formatDate(domain.created_at)}`}
            </p>
            <div className="mt-2">
              <DomainStatusBadge status={verify.isPending ? "verifying" : domain.status} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
          <div className="min-w-0 sm:w-64">
            <label
              htmlFor={`checkout-${domain.id}`}
              className="mb-1 block text-[11.5px] font-medium text-muted-foreground"
            >
              Checkout que abre neste domínio
            </label>
            <CheckoutSelect
              id={`checkout-${domain.id}`}
              value={domain.checkout_id}
              onChange={(c) => void changeCheckout(c)}
            />
          </div>

          <div className="flex items-center gap-2 sm:self-end">
            {active ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://${domain.hostname}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void runVerify()}
                disabled={verify.isPending}
              >
                {verify.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Verificar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Mais ações">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem disabled={domain.is_primary} onClick={() => void makePrimary()}>
                  <Star className="mr-2 h-4 w-4" />
                  {domain.is_primary ? "Já é o principal" : "Definir como principal"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void runVerify()}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Verificar agora
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDns((v) => !v)}>
                  <ChevronDown className="mr-2 h-4 w-4" />{" "}
                  {showDns ? "Ocultar DNS" : "Ver registros DNS"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onRemove}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remover domínio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {active && !domain.checkout_id ? (
        <p className="mt-3 text-[12.5px] text-[oklch(0.52_0.13_75)]">
          Escolha um checkout publicado para este domínio abrir.
        </p>
      ) : null}

      {showDns && domain.dns_records.length > 0 ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <DnsRecordsTable records={domain.dns_records} />
          {!active ? <DnsHelp records={domain.dns_records} /> : null}
          {domain.last_error ? (
            <p className="text-[12.5px] text-destructive">{domain.last_error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
