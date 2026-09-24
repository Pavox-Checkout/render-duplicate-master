import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DEMO_CHECKOUTS,
  PAVOX_CNAME_TARGET,
  PAVOX_DOMAIN_SUFFIX,
  type DemoDomain,
  type DomainType,
} from "@/lib/domains-demo";

type Step = "choose" | "pavox" | "custom-input" | "custom-dns" | "checkout";

export function DomainAddDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (domain: DemoDomain) => void;
}) {
  const [step, setStep] = useState<Step>("choose");
  const [type, setType] = useState<DomainType>("custom");
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [checkout, setCheckout] = useState<string>(DEMO_CHECKOUTS[0]);

  function reset() {
    setStep("choose");
    setType("custom");
    setSubdomain("");
    setCustomDomain("");
    setCheckout(DEMO_CHECKOUTS[0]);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // pequeno atraso evita "flash" do primeiro passo durante o fade-out
      setTimeout(reset, 180);
    }
    onOpenChange(next);
  }

  function finish() {
    const isPavox = type === "pavox";
    const domainLabel = isPavox
      ? `${PAVOX_DOMAIN_SUFFIX}/${subdomain.trim() || "seu-checkout"}`
      : customDomain.trim() || "checkout.sualoja.com.br";

    onAdd({
      id: `dom-${Date.now()}`,
      domain: domainLabel,
      type,
      status: isPavox ? "connected" : "awaiting_dns",
      checkout,
      isPrimary: false,
      connectedAt: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    });

    toast.success(isPavox ? "Domínio PAVOX adicionado" : "Domínio adicionado. Configure o DNS para conectar.");
    handleOpenChange(false);
  }

  function copyValue(value: string) {
    void navigator.clipboard?.writeText(value);
    toast.success("Copiado");
  }

  const stepMeta: Record<Step, { title: string; description: string }> = {
    choose: {
      title: "Adicionar domínio",
      description: "Escolha como deseja publicar seus checkouts.",
    },
    pavox: {
      title: "Domínio PAVOX",
      description: "Defina o endereço do seu checkout no domínio da PAVOX.",
    },
    "custom-input": {
      title: "Conectar domínio próprio",
      description: "Informe o domínio da sua marca que será usado no checkout.",
    },
    "custom-dns": {
      title: "Configure seu DNS",
      description: "Adicione o registro abaixo no painel do seu provedor de domínio.",
    },
    checkout: {
      title: "Escolha o checkout",
      description: "Selecione qual checkout será publicado neste domínio.",
    },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-[18px]">{stepMeta[step].title}</DialogTitle>
          <DialogDescription className="text-[13px]">{stepMeta[step].description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {step === "choose" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                icon={Sparkles}
                title="Domínio PAVOX"
                description="Use um domínio da PAVOX e publique seu checkout rapidamente."
                example={`${PAVOX_DOMAIN_SUFFIX}/seu-checkout`}
                benefits={["Configuração simplificada", "HTTPS/SSL incluído", "Pronto para publicar"]}
                cta="Usar domínio PAVOX"
                onSelect={() => {
                  setType("pavox");
                  setStep("pavox");
                }}
              />
              <OptionCard
                icon={Store}
                title="Seu domínio"
                description="Use o domínio da sua própria marca para publicar seus checkouts."
                example="checkout.sualoja.com.br"
                benefits={["Sua marca", "Experiência personalizada", "URL própria"]}
                cta="Conectar domínio"
                highlighted
                onSelect={() => {
                  setType("custom");
                  setStep("custom-input");
                }}
              />
            </div>
          ) : null}

          {step === "pavox" ? (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>Endereço do checkout</Label>
                <div className="flex items-center overflow-hidden rounded-lg border border-border bg-secondary/50 focus-within:ring-2 focus-within:ring-ring/40">
                  <span className="whitespace-nowrap border-r border-border px-3 py-2 text-[13px] text-muted-foreground">
                    {PAVOX_DOMAIN_SUFFIX}/
                  </span>
                  <input
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                    placeholder="seu-checkout"
                    className="w-full bg-transparent px-3 py-2 text-[13.5px] outline-none"
                  />
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Somente letras, números e hífens. Este endereço já vem com HTTPS/SSL.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/8 px-3 py-2.5 text-[12.5px] text-success">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Domínios PAVOX são conectados automaticamente, sem configuração de DNS.
              </div>
            </div>
          ) : null}

          {step === "custom-input" ? (
            <div className="space-y-2">
              <Label>Digite seu domínio</Label>
              <Input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value.trim().toLowerCase())}
                placeholder="checkout.sualoja.com.br"
                autoFocus
              />
              <p className="text-[12px] text-muted-foreground">
                Recomendamos usar um subdomínio, como <span className="font-medium">checkout.</span>suamarca.com.br
              </p>
            </div>
          ) : null}

          {step === "custom-dns" ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <span>Tipo</span>
                  <span>Nome</span>
                  <span>Valor</span>
                  <span className="sr-only">Ações</span>
                </div>
                <div className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2 px-4 py-3 font-mono text-[12.5px]">
                  <span className="font-semibold">CNAME</span>
                  <span className="flex items-center gap-1.5">
                    checkout
                    <button
                      type="button"
                      aria-label="Copiar nome"
                      onClick={() => copyValue("checkout")}
                      className="text-muted-foreground transition hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </span>
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{PAVOX_CNAME_TARGET}</span>
                    <button
                      type="button"
                      aria-label="Copiar valor"
                      onClick={() => copyValue(PAVOX_CNAME_TARGET)}
                      className="shrink-0 text-muted-foreground transition hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </span>
                  <Button variant="outline" size="sm" className="h-7" onClick={() => copyValue(PAVOX_CNAME_TARGET)}>
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2.5 text-[12.5px] text-muted-foreground">
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" />
                Aguardando configuração — após configurar o DNS, a propagação pode levar algum tempo.
              </div>
            </div>
          ) : null}

          {step === "checkout" ? (
            <div className="space-y-2">
              <Label>Selecionar checkout</Label>
              <Select value={checkout} onValueChange={setCheckout}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar checkout" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_CHECKOUTS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[12px] text-muted-foreground">
                Você poderá trocar o checkout associado a qualquer momento.
              </p>
            </div>
          ) : null}
        </div>

        {step !== "choose" ? (
          <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-4">
            <Button variant="ghost" size="sm" onClick={() => goBack(step, setStep)}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            {step === "pavox" ? (
              <Button size="sm" onClick={() => setStep("checkout")}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}

            {step === "custom-input" ? (
              <Button size="sm" disabled={!customDomain.trim()} onClick={() => setStep("custom-dns")}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}

            {step === "custom-dns" ? (
              <Button size="sm" onClick={() => setStep("checkout")}>
                Já configurei o DNS <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}

            {step === "checkout" ? (
              <Button size="sm" onClick={finish}>
                <Check className="h-4 w-4" /> Concluir
              </Button>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function goBack(step: Step, setStep: (s: Step) => void) {
  if (step === "pavox" || step === "custom-input") setStep("choose");
  else if (step === "custom-dns") setStep("custom-input");
  else if (step === "checkout") setStep("choose");
}

function OptionCard({
  icon: Icon,
  title,
  description,
  example,
  benefits,
  cta,
  onSelect,
  highlighted,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
  example: string;
  benefits: string[];
  cta: string;
  onSelect: () => void;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4 transition-shadow hover:shadow-[var(--shadow-lift)]",
        highlighted ? "border-primary/40 bg-accent/40" : "border-border",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          highlighted ? "bg-brand-gradient text-primary-foreground" : "bg-secondary text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{description}</p>
      <code className="mt-3 block truncate rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 font-mono text-[11.5px] text-muted-foreground">
        {example}
      </code>
      <ul className="mt-3 space-y-1.5">
        {benefits.map((b) => (
          <li key={b} className="flex items-center gap-1.5 text-[12.5px]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex-1" />
      <Button className="mt-2 w-full" variant={highlighted ? "default" : "outline"} onClick={onSelect}>
        {cta}
      </Button>
    </div>
  );
}
