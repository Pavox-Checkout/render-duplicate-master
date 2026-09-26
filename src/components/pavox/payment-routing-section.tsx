import { useMemo, useState } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, Route, Settings2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderLogo } from "@/components/pavox/provider-logo";
import type { ProviderDef } from "@/lib/payments/catalog";
import { cn } from "@/lib/utils";

type PaymentMethod = "pix" | "card" | "boleto";

type PaymentRoutingSectionProps = {
  availableGateways?: ProviderDef[];
  compatibility?: Partial<Record<PaymentMethod, (gateway: ProviderDef) => boolean>>;
  selectedGateways?: Partial<Record<PaymentMethod, string>>;
  onSelectedGatewaysChange?: (selected: Partial<Record<PaymentMethod, string>>) => void;
};

const NONE_GATEWAY = "__none__";

const routingMethods: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
  emptyMessage: string;
}> = [
  {
    id: "pix",
    label: "PIX",
    description: "Selecione o gateway que processará seus pagamentos via PIX.",
    emptyMessage: "Você ainda não possui um gateway configurado para PIX.",
  },
  {
    id: "card",
    label: "Cartão",
    description: "Selecione o gateway que processará seus pagamentos com cartão.",
    emptyMessage: "Você ainda não possui um gateway configurado para cartão.",
  },
  {
    id: "boleto",
    label: "Boleto",
    description: "Selecione o gateway que processará seus pagamentos via boleto.",
    emptyMessage: "Você ainda não possui um gateway configurado para boleto.",
  },
];

export function PaymentRoutingSection({
  availableGateways = [],
  compatibility,
  selectedGateways: controlledSelectedGateways,
  onSelectedGatewaysChange,
}: PaymentRoutingSectionProps) {
  const [localSelectedGateways, setLocalSelectedGateways] = useState<
    Partial<Record<PaymentMethod, string>>
  >({});
  const selectedGateways = controlledSelectedGateways ?? localSelectedGateways;
  const updateSelectedGateways = (next: Partial<Record<PaymentMethod, string>>) => {
    if (onSelectedGatewaysChange) onSelectedGatewaysChange(next);
    else setLocalSelectedGateways(next);
  };
  const [saved, setSaved] = useState(false);

  const gatewayOptions = useMemo(
    () =>
      Object.fromEntries(
        routingMethods.map(({ id }) => [
          id,
          availableGateways.filter((gateway) => compatibility?.[id]?.(gateway) ?? true),
        ]),
      ) as Record<PaymentMethod, ProviderDef[]>,
    [availableGateways, compatibility],
  );

  const hasChanges = Object.keys(selectedGateways).length > 0;

  return (
    <section className="border-t border-border/70 pt-8" aria-labelledby="payment-routing-title">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Route className="size-4" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Configuração operacional
            </span>
          </div>
          <h2 id="payment-routing-title" className="text-xl font-semibold tracking-tight">
            Roteamento de pagamentos
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Defina qual gateway será utilizado para cada método de pagamento.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
        >
          <CheckCircle2 className="size-3.5" aria-hidden="true" />3 métodos disponíveis
        </Badge>
      </div>

      <Alert className="mb-5 border-primary/20 bg-primary/[0.04]">
        <Settings2 className="size-4 text-primary" aria-hidden="true" />
        <AlertTitle>Gateway selecionado por método</AlertTitle>
        <AlertDescription>
          Cartão inclui pagamentos de crédito e débito. A disponibilidade de cada gateway será
          definida pelos dados reais da conta.
        </AlertDescription>
      </Alert>

      {Object.values(selectedGateways).length === routingMethods.length &&
        Object.values(selectedGateways).every((gatewayId) => gatewayId === NONE_GATEWAY) && (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Nenhum método de pagamento está ativo.</AlertTitle>
            <AlertDescription>
              Configure pelo menos um método para permitir pagamentos.
            </AlertDescription>
          </Alert>
        )}

      <div className="grid gap-4 xl:grid-cols-3">
        {routingMethods.map((method) => (
          <PaymentRoutingCard
            key={method.id}
            method={method}
            gateways={gatewayOptions[method.id]}
            selectedGateway={selectedGateways[method.id]}
            onSelect={(gatewayId) => {
              setSaved(false);
              updateSelectedGateways({ ...selectedGateways, [method.id]: gatewayId });
            }}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          disabled={!hasChanges}
          onClick={() => {
            updateSelectedGateways({});
            setSaved(false);
          }}
        >
          Cancelar
        </Button>
        <Button disabled={!hasChanges} onClick={() => setSaved(true)}>
          {saved ? "Alterações registradas localmente" : "Salvar alterações"}
        </Button>
      </div>
    </section>
  );
}

function PaymentRoutingCard({
  method,
  gateways,
  selectedGateway,
  onSelect,
}: {
  method: (typeof routingMethods)[number];
  gateways: ProviderDef[];
  selectedGateway?: string;
  onSelect: (gatewayId: string) => void;
}) {
  const selected = gateways.find((gateway) => gateway.id === selectedGateway);
  const isDisabled = selectedGateway === NONE_GATEWAY;
  const hasGateways = gateways.length > 0;

  return (
    <Card
      id={`routing-${method.id}`}
      tabIndex={-1}
      className={cn(
        "flex min-h-[278px] flex-col transition-colors",
        selected && "border-primary/40",
        isDisabled && "border-muted-foreground/30 bg-muted/10",
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.08] text-sm font-bold text-primary">
            {method.label === "Cartão" ? "CC" : method.label.slice(0, 2)}
          </div>
          <Badge
            variant={selected ? "default" : isDisabled ? "outline" : "secondary"}
            className="rounded-full"
          >
            {selected ? "Configurado" : isDisabled ? "Não utilizado" : "Não configurado"}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-base">{method.label}</CardTitle>
          <CardDescription className="mt-1 leading-5">{method.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end gap-3">
        <Select value={selectedGateway} onValueChange={onSelect} disabled={!hasGateways}>
          <SelectTrigger aria-label={`Gateway para ${method.label}`}>
            <SelectValue
              placeholder={hasGateways ? "Selecionar gateway" : "Nenhum gateway configurado"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_GATEWAY}>Nenhum</SelectItem>
            {gateways.map((gateway) => (
              <SelectItem key={gateway.id} value={gateway.id}>
                <span className="flex items-center gap-2">
                  <ProviderLogo provider={gateway} className="size-5 rounded-md" />
                  {gateway.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-2.5 text-xs text-muted-foreground">
            <ProviderLogo provider={selected} className="size-7 rounded-lg" />
            <span>
              <strong className="font-semibold text-foreground">{selected.name}</strong> será usado
              neste método.
            </span>
          </div>
        ) : isDisabled ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
            Este método de pagamento não está sendo utilizado.
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-xs leading-5 text-muted-foreground">
            {method.emptyMessage}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 px-6 py-3">
        {hasGateways ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ArrowDown className="size-3.5" aria-hidden="true" />
            Apenas gateways compatíveis serão exibidos
          </span>
        ) : (
          <Button variant="link" className="h-auto p-0 text-xs" asChild>
            <a href="#gateway-catalog">
              Configurar gateway <ArrowRight className="ml-1 size-3.5" aria-hidden="true" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export type { PaymentMethod };
