import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Globe,
  Layers,
  Link2,
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DEMO_CHECKOUTS,
  DEMO_PLAN_NAME,
  DOMAIN_TYPE_LABEL,
  INITIAL_DEMO_DOMAINS,
  PLAN_DOMAIN_LIMITS,
  type DemoDomain,
} from "@/lib/domains-demo";

export const Route = createFileRoute("/_dash/dominios")({
  component: Dominios,
  head: () => ({
    meta: [
      { title: "Domínios · PAVOX" },
      {
        name: "description",
        content: "Gerencie os domínios utilizados para publicar seus checkouts na PAVOX.",
      },
      { property: "og:title", content: "Domínios · PAVOX" },
      { property: "og:description", content: "Domínio PAVOX ou domínio próprio para seus checkouts." },
    ],
  }),
});

function Dominios() {
  // Estado local apenas para demonstrar a interface — nada é persistido.
  const [domains, setDomains] = useState<DemoDomain[]>(INITIAL_DEMO_DOMAINS);
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<DemoDomain | null>(null);

  const planName = DEMO_PLAN_NAME;
  const domainLimit = PLAN_DOMAIN_LIMITS[planName] ?? 1;
  const currentDomains = domains.length;
  const available = Math.max(domainLimit - currentDomains, 0);
  const limitReached = currentDomains >= domainLimit;
  const primary = domains.find((d) => d.isPrimary);

  const summary = useMemo(
    () => [
      { label: "Domínios utilizados", value: `${currentDomains}`, icon: Globe, hint: `de ${domainLimit}` },
      { label: "Limite do plano", value: `${domainLimit}`, icon: Layers, hint: `plano ${planName}` },
      { label: "Domínios disponíveis", value: `${available}`, icon: Plus, hint: available === 1 ? "vaga" : "vagas" },
      {
        label: "Domínio principal",
        value: primary ? "Definido" : "—",
        icon: Star,
        hint: primary ? primary.domain.replace(/^checkout\./, "") : "nenhum",
      },
    ],
    [currentDomains, domainLimit, available, planName, primary],
  );

  function addDomain(domain: DemoDomain) {
    setDomains((prev) => [...prev, domain]);
  }

  function setPrimary(id: string) {
    setDomains((prev) => prev.map((d) => ({ ...d, isPrimary: d.id === id })));
    toast.success("Domínio principal atualizado");
  }

  function updateCheckout(id: string, checkout: string) {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, checkout } : d)));
    toast.success("Checkout associado atualizado");
  }

  function verifyDomain(id: string) {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, status: "verifying" } : d)));
    toast.info("Verificando configuração de DNS…");
    // Simulação puramente visual dos estados (sem verificação real de DNS).
    window.setTimeout(() => {
      setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, status: "connected" } : d)));
      toast.success("Domínio conectado");
    }, 1600);
  }

  function confirmRemove() {
    if (!removing) return;
    const wasPrimary = removing.isPrimary;
    setDomains((prev) => {
      const next = prev.filter((d) => d.id !== removing.id);
      // se removeu o principal, promove o primeiro restante
      const first = next[0];
      if (wasPrimary && first && !next.some((d) => d.isPrimary)) {
        next[0] = { ...first, isPrimary: true };
      }
      return next;
    });
    toast.success("Domínio removido");
    setRemoving(null);
  }

  return (
    <>
      <PageHeader
        title="Domínios"
        subtitle="Gerencie os domínios utilizados para publicar seus checkouts."
        actions={
          <Button onClick={() => setAddOpen(true)} disabled={limitReached}>
            <Plus className="h-4 w-4" /> Adicionar domínio
          </Button>
        }
      />

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="surface p-4">
            <div className="flex items-start justify-between">
              <span className="text-[12.5px] font-medium text-muted-foreground">{s.label}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-3 font-display text-[22px] leading-none font-bold tracking-tight">{s.value}</p>
            <p className="mt-1.5 truncate text-[12px] text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Uso do plano */}
      <div className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13.5px] font-semibold">
              {currentDomains} de {domainLimit} {domainLimit === 1 ? "domínio utilizado" : "domínios utilizados"}
            </p>
            <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              Plano {planName}
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full max-w-md overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all", limitReached ? "bg-warning" : "bg-brand-gradient")}
              style={{ width: `${Math.min((currentDomains / domainLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
        {limitReached ? (
          <div className="flex items-center gap-3">
            <p className="text-[12.5px] font-medium text-[oklch(0.52_0.13_75)]">Limite de domínios atingido</p>
            <Button variant="outline" size="sm" asChild>
              <a href="/planos">
                Fazer upgrade <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        ) : null}
      </div>

      {/* Lista */}
      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Seus domínios</h2>

        {domains.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="Você ainda não possui domínios"
            description="Adicione um domínio PAVOX ou conecte seu domínio próprio para começar."
            action={
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> Adicionar domínio
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {domains.map((d) => (
              <DomainRow
                key={d.id}
                domain={d}
                onSetPrimary={() => setPrimary(d.id)}
                onUpdateCheckout={(c) => updateCheckout(d.id, c)}
                onVerify={() => verifyDomain(d.id)}
                onRemove={() => setRemoving(d)}
              />
            ))}
          </div>
        )}
      </section>

      <DomainAddDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addDomain} />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover domínio?</AlertDialogTitle>
            <AlertDialogDescription>
              O domínio <span className="font-medium text-foreground">{removing?.domain}</span> deixará de publicar
              seus checkouts. Você poderá adicioná-lo novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DomainRow({
  domain,
  onSetPrimary,
  onUpdateCheckout,
  onVerify,
  onRemove,
}: {
  domain: DemoDomain;
  onSetPrimary: () => void;
  onUpdateCheckout: (checkout: string) => void;
  onVerify: () => void;
  onRemove: () => void;
}) {
  const canVerify = domain.status === "awaiting_dns" || domain.status === "error";

  return (
    <div className="surface p-4 sm:p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Identidade do domínio */}
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Globe className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[14.5px] font-semibold">{domain.domain}</p>
              {domain.isPrimary ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  <Star className="h-3 w-3 fill-current" /> Principal
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
              <span>{DOMAIN_TYPE_LABEL[domain.type]}</span>
              <span aria-hidden>·</span>
              <span>Conectado em {domain.connectedAt}</span>
            </div>
            <div className="mt-2">
              <DomainStatusBadge status={domain.status} />
            </div>
          </div>
        </div>

        {/* Checkout associado + ações */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
          <div className="min-w-0 sm:w-56">
            <label className="mb-1 block text-[11.5px] font-medium text-muted-foreground">
              Checkout associado
            </label>
            <Select value={domain.checkout} onValueChange={onUpdateCheckout}>
              <SelectTrigger className="h-9">
                <span className="flex items-center gap-1.5 truncate">
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Selecionar checkout" />
                </span>
              </SelectTrigger>
              <SelectContent>
                {DEMO_CHECKOUTS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 sm:self-end">
            {canVerify ? (
              <Button variant="outline" size="sm" onClick={onVerify}>
                <RefreshCw className="h-3.5 w-3.5" /> Verificar
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => toast.info("Abrindo gerenciamento do domínio…")}>
                Gerenciar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Mais ações">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem disabled={domain.isPrimary} onClick={onSetPrimary}>
                  <Star className="mr-2 h-4 w-4" />
                  {domain.isPrimary ? "Já é o principal" : "Definir como principal"}
                </DropdownMenuItem>
                {domain.status === "connected" ? (
                  <DropdownMenuItem onClick={() => toast.success("Domínio verificado novamente")}>
                    <Check className="mr-2 h-4 w-4" /> Revalidar conexão
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={onVerify}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Verificar agora
                  </DropdownMenuItem>
                )}
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
    </div>
  );
}
