import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderLogo } from "@/components/pavox/provider-logo";
import type { ProviderDef } from "@/lib/payments/catalog";
import type { PaymentMethod } from "@/components/pavox/payment-routing-section";

type ActiveGatewaysSummaryProps = {
  selectedGateways: Partial<Record<PaymentMethod, string>>;
  gateways: ProviderDef[];
  onChangeGateway: (method: "pix" | "card") => void;
};

const summaryMethods = [
  {
    id: "pix" as const,
    label: "PIX",
    description: "Gateway responsável pelos pagamentos via PIX.",
    empty: "Configure um gateway para começar a processar pagamentos via PIX.",
  },
  {
    id: "card" as const,
    label: "Cartão",
    description: "Gateway responsável por cartão de crédito e débito.",
    empty: "Configure um gateway para processar pagamentos com cartão.",
  },
];

export function ActiveGatewaysSummary({
  selectedGateways,
  gateways,
  onChangeGateway,
}: ActiveGatewaysSummaryProps) {
  return (
    <section className="border-t border-border/70 pt-8" aria-labelledby="active-gateways-title">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Resumo operacional
        </p>
        <h2 id="active-gateways-title" className="mt-2 text-xl font-semibold tracking-tight">
          Gateways em uso
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Veja quais gateways estão ativos em cada método de pagamento da sua operação.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {summaryMethods.map((method) => {
          const gateway = gateways.find((item) => item.id === selectedGateways[method.id]);
          return (
            <Card key={method.id} className="flex min-h-[220px] flex-col">
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="text-base uppercase tracking-[0.08em]">
                  {method.label}
                </CardTitle>
                {gateway ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CircleCheck className="size-4" aria-hidden="true" /> ATIVA
                  </span>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                {gateway ? (
                  <>
                    <div className="flex items-center gap-3">
                      <ProviderLogo provider={gateway} className="size-12 rounded-xl" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gateway selecionado</p>
                        <p className="font-semibold">{gateway.name}</p>
                      </div>
                    </div>
                    <p className="mt-5 text-sm text-muted-foreground">{method.description}</p>
                    <Button
                      variant="link"
                      className="mt-auto h-auto self-end p-0"
                      onClick={() => onChangeGateway(method.id)}
                    >
                      Alterar gateway <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold">Não configurado</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{method.empty}</p>
                    </div>
                    <Button
                      variant="link"
                      className="mt-auto h-auto self-end p-0"
                      onClick={() => onChangeGateway(method.id)}
                    >
                      Configurar gateway <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
