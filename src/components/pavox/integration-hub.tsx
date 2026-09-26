import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Search,
  ShieldCheck,
  Webhook,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { ProviderLogo } from "@/components/pavox/provider-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UI_GATEWAYS,
  UI_PAYMENT_METHODS,
  getUiGateway,
} from "@/lib/payments/integration-ui-catalog";
import type { ProviderDef } from "@/lib/payments/catalog";
import { cn } from "@/lib/utils";

export function IntegrationHub() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ProviderDef | null>(null);
  const filtered = useMemo(
    () => UI_GATEWAYS.filter((gateway) => gateway.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        subtitle="Organize os gateways da sua operação e prepare cada conexão para uma implementação segura."
      />
      <div className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Catálogo de gateways</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {UI_GATEWAYS.length} provedores disponíveis para configuração.
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
      {filtered.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((gateway) => (
            <GatewayCard
              key={gateway.id}
              gateway={gateway}
              onConfigure={() => setSelected(gateway)}
            />
          ))}
        </div>
      ) : (
        <div className="surface py-16 text-center">
          <p className="font-medium">Nenhum gateway encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente buscar por outro nome.</p>
        </div>
      )}
      <GatewayConfigPanel gateway={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function GatewayCard({ gateway, onConfigure }: { gateway: ProviderDef; onConfigure: () => void }) {
  return (
    <article className="surface group flex min-h-[164px] flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <ProviderLogo provider={gateway} className="h-11 w-11 rounded-xl" />
        <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Não configurado
        </span>
      </div>
      <h3 className="mt-4 text-[15px] font-semibold">{gateway.name}</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">{gateway.desc}</p>
      <div className="mt-auto pt-4">
        <Button variant="outline" size="sm" className="w-full" onClick={onConfigure}>
          Configurar <ChevronRight className="ml-auto h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

function GatewayConfigPanel({
  gateway,
  onClose,
}: {
  gateway: ProviderDef | null;
  onClose: () => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [additional, setAdditional] = useState(false);
  const [methods, setMethods] = useState<string[]>([]);
  const [installments, setInstallments] = useState(false);
  const [saved, setSaved] = useState(false);
  if (!gateway) return null;
  const toggle = (method: string) =>
    setMethods((current) =>
      current.includes(method) ? current.filter((item) => item !== method) : [...current, method],
    );
  return (
    <Dialog open={Boolean(gateway)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b border-border bg-gradient-to-br from-primary/[0.08] to-transparent p-6 pr-12">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <ProviderLogo provider={gateway} className="h-12 w-12 rounded-2xl" />
              <div>
                <DialogTitle>{gateway.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  Configuração preparada para integração futura.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Nenhuma credencial foi cadastrada. Esta tela é apenas a estrutura visual para o time
              técnico conectar o gateway posteriormente.
            </span>
          </div>
          <section className="space-y-3">
            <SectionTitle icon={KeyRound} title="Credenciais" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chave pública" placeholder="A definir pelo desenvolvedor" />
              <div className="space-y-2">
                <Label>Chave secreta</Label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    placeholder="A definir pelo desenvolvedor"
                    disabled
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showSecret ? "Ocultar chave" : "Mostrar chave"}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </section>
          <section className="space-y-3">
            <SectionTitle title="Métodos de pagamento" />
            <p className="text-xs text-muted-foreground">
              A disponibilidade de cada método será definida pelo adaptador do gateway.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {UI_PAYMENT_METHODS.map(([id, label]) => (
                <label
                  key={id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-sm",
                    methods.includes(id) && "border-primary/50 bg-primary/[0.04]",
                  )}
                >
                  <span>{label}</span>
                  <Switch
                    checked={methods.includes(id)}
                    onCheckedChange={() => toggle(id)}
                    aria-label={label}
                  />
                </label>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <SectionTitle title="Parcelamento" />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Permitir parcelamento</p>
                <p className="text-xs text-muted-foreground">
                  Valores e regras serão definidos posteriormente.
                </p>
              </div>
              <Switch checked={installments} onCheckedChange={setInstallments} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Número máximo de parcelas"
                placeholder="Não definido"
                disabled={!installments}
              />
              <Field label="Juros / taxa (%)" placeholder="Não definido" disabled={!installments} />
            </div>
          </section>
          <section className="overflow-hidden rounded-xl border">
            <button
              type="button"
              onClick={() => setAdditional(!additional)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="text-sm font-semibold">Configurações adicionais</span>
              {additional ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {additional && (
              <div className="border-t px-4 py-5 text-xs text-muted-foreground">
                Nenhum parâmetro adicional definido. Este espaço está reservado para configurações
                específicas deste gateway.
              </div>
            )}
          </section>
          <section className="space-y-3">
            <SectionTitle icon={Webhook} title="Webhook" />
            <div className="rounded-xl border border-dashed p-4">
              <p className="text-sm font-medium">Disponível após integração</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A URL, o token e os eventos serão exibidos quando o backend estiver conectado.
              </p>
            </div>
          </section>
          <section className="space-y-3">
            <SectionTitle title="Status da integração" />
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Não configurado</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Este estado não altera pagamentos nem o checkout.
                </p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            </div>
          </section>
          <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => setSaved(true)}>
              {saved ? "Alterações registradas localmente" : "Salvar configuração"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  placeholder,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input placeholder={placeholder} disabled={disabled} />
    </div>
  );
}
function SectionTitle({ icon: Icon, title }: { icon?: typeof KeyRound; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
      {title}
    </div>
  );
}
