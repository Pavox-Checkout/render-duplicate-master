import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Loader2, XCircle } from "lucide-react";
import {
  CheckoutPreview,
  type CheckoutSubmission,
} from "@/components/pavox/builder/checkout-preview";
import { normalizeConfig, type CheckoutConfig } from "@/lib/checkout-builder";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { brl } from "@/lib/mock";
import {
  MercadoPagoCardForm,
  type MercadoPagoCardFormHandle,
} from "@/components/pavox/mercadopago-card-form";
import { toast } from "sonner";

type PublicProduct = {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  compare_at: number | null;
  image: string | null;
  available: boolean;
};

type PublicCheckout = {
  checkout: { id: string; name: string; slug: string; config: unknown };
  store: { slug: string; name: string };
  product: PublicProduct | null;
  payment_methods: string[];
  /** Methods whose gateway requires the buyer's CPF/CNPJ (e.g. boleto, Asaas). */
  document_required?: string[];
};

type PublicOrder = {
  id: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  expires_at: string | null;
  paid_at: string | null;
  gateway_payment_id: string | null;
  payment: {
    method?: string;
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string | null;
    expires_at?: string | null;
    // Boleto
    digitable_line?: string;
    // Card
    status_detail?: string;
    installments?: number;
  };
};

const POLL_MS = 5000;

// The demo card fields are never sent: real card payments are typed in the
// gateway's secure form (MercadoPagoCardForm) and arrive here as a token.
const CARD_FIELD_IDS = new Set(["card_number", "card_name", "card_exp", "card_cvv"]);

function buyerFromSubmission(sub: CheckoutSubmission, withAddress: boolean) {
  const v = Object.fromEntries(Object.entries(sub.values).filter(([k]) => !CARD_FIELD_IDS.has(k)));
  const pj = sub.identity === "pj";
  return {
    person_type: pj ? "pj" : "pf",
    name: (pj ? v["razao"] : v["name"]) ?? "",
    email: v["email"] ?? "",
    phone: v["phone"] ?? "",
    document: (pj ? v["cnpj"] : v["doc"]) ?? "",
    ...(withAddress
      ? {
          address: {
            zip: v["zip"] ?? "",
            street: v["street"] ?? "",
            number: v["number"] ?? "",
            complement: v["complement"] ?? "",
            neighborhood: v["neighborhood"] ?? "",
            city: v["city"] ?? "",
            state: v["state"] ?? "",
          },
        }
      : {}),
  };
}

/** Friendly text for a declined card (Mercado Pago status_detail). */
function cardDeclineMessage(detail: string | undefined) {
  const d = (detail ?? "").toLowerCase();
  if (d.includes("insufficient")) return "Saldo ou limite insuficiente. Tente outro cartão.";
  if (d.includes("security_code") || d.includes("cvv"))
    return "Código de segurança inválido. Confira o CVV.";
  if (d.includes("expir")) return "Cartão vencido. Use outro cartão.";
  if (d.includes("date")) return "Data de validade inválida. Confira os dados do cartão.";
  if (d.includes("call_for_authorize"))
    return "O banco pediu para você autorizar a compra. Ligue para o banco ou use outro cartão.";
  if (d.includes("high_risk") || d.includes("fraud"))
    return "Pagamento recusado por segurança. Tente outro cartão ou Pix.";
  return "O pagamento com cartão foi recusado. Confira os dados ou use outro cartão.";
}

async function readFunctionError(
  error: unknown,
): Promise<{ message: string; order?: PublicOrder }> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { message?: string; order?: PublicOrder };
      if (body?.message)
        return { message: body.message, ...(body.order ? { order: body.order } : {}) };
    } catch {
      // fall through
    }
  }
  return {
    message: "Não foi possível concluir sua compra. Verifique sua conexão e tente novamente.",
  };
}

/**
 * Public checkout for /c/{store}/{checkout} and for merchant custom domains.
 * All data (product, price, payment methods) comes from the backend.
 */
export function PublicCheckout({ store, checkout }: { store: string; checkout: string }) {
  const mobile = useIsMobile();
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const cardForm = useRef<MercadoPagoCardFormHandle>(null);

  const query = useQuery({
    queryKey: ["public-checkout", store, checkout],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_checkout", {
        p_store_slug: store,
        p_checkout_slug: checkout,
      });
      if (error) throw error;
      return (data ?? null) as unknown as PublicCheckout | null;
    },
    retry: 1,
  });

  // Public key of the store's gateway, used by the browser to tokenize cards.
  const offersCard = query.data?.payment_methods.includes("card") ?? false;
  const cardConfig = useQuery({
    queryKey: ["public-checkout-card", query.data?.checkout.id],
    enabled: offersCard,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("public-checkout", {
        body: { action: "config", checkoutId: query.data!.checkout.id },
      });
      if (error) return null;
      return (data as { card: { provider: string; publicKey: string } | null }).card;
    },
  });

  const product = query.data?.product ?? null;
  const imagePath = product?.image ?? null;
  const image = useQuery({
    queryKey: ["public-checkout-image", imagePath],
    enabled: !!imagePath,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("product-images")
        .createSignedUrl(imagePath!, 60 * 60);
      if (error) return null;
      return data.signedUrl;
    },
  });

  // The builder config drives the look; product data, price and the payment
  // methods the backend accepts always come from the server.
  const config = useMemo<CheckoutConfig | null>(() => {
    const data = query.data;
    if (!data?.product) return null;
    const base = normalizeConfig(data.checkout.config);
    const p = data.product;
    const hasCompare = p.compare_at != null && p.compare_at > p.price;
    return {
      ...base,
      product: {
        ...base.product,
        kind: p.type === "fisico" ? "physical" : "digital",
        title: p.name,
        description: p.description,
        price: p.price,
        compareAt: hasCompare ? p.compare_at! : 0,
        showCompare: base.product.showCompare && hasCompare,
        showDiscount: base.product.showDiscount && hasCompare,
        showQuantity: false,
        image: image.data ?? undefined,
      },
      // Not implemented server-side yet — hidden instead of faking them.
      summary: { ...base.summary, couponEnabled: false, installmentsEnabled: false },
      live: { ...base.live, enabled: false },
      scarcity: { ...base.scarcity, enabled: false },
    };
  }, [query.data, image.data]);

  const submit = async (submission: CheckoutSubmission) => {
    const data = query.data;
    if (!data?.product || submitting) return;
    setSubmitting(true);
    let card = null;
    if (submission.method === "card") {
      card = (await cardForm.current?.tokenize()) ?? null;
      if (!card) {
        setSubmitting(false);
        toast.error("Confira os dados do cartão.");
        return;
      }
    }
    idempotencyKey.current ??= crypto.randomUUID();
    const { data: result, error } = await supabase.functions.invoke("public-checkout", {
      body: {
        checkoutId: data.checkout.id,
        paymentMethod: submission.method,
        idempotencyKey: idempotencyKey.current,
        buyer: buyerFromSubmission(
          submission,
          data.product.type === "fisico" || submission.method === "boleto",
        ),
        ...(card ? { card } : {}),
      },
    });
    setSubmitting(false);
    if (error) {
      // On a gateway failure the order exists but has no charge yet: the same
      // idempotency key retries the charge for that same order.
      toast.error((await readFunctionError(error)).message);
      return;
    }
    const next = (result as { order: PublicOrder }).order;
    if (next.payment_method === "card" && next.status === "Recusado") {
      // Declined card: stay on the form; the next attempt is a new order.
      idempotencyKey.current = null;
      toast.error(cardDeclineMessage(next.payment?.status_detail));
      return;
    }
    setOrder(next);
  };

  if (query.isLoading) {
    return (
      <Centered>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Centered>
    );
  }

  if (query.isError) {
    return (
      <Message
        title="Não foi possível carregar o checkout"
        description="Verifique sua conexão e recarregue a página."
      />
    );
  }

  const data = query.data;
  if (!data) {
    return (
      <Message
        title="Checkout indisponível"
        description="Este link não existe ou o checkout não está mais publicado."
      />
    );
  }

  if (!data.product || !config) {
    return (
      <Message
        title="Produto indisponível"
        description="Este checkout ainda não tem um produto ativo à venda."
      />
    );
  }

  if (!data.product.available) {
    return (
      <Message
        title="Produto esgotado"
        description="Este produto não está disponível no momento."
      />
    );
  }

  if (order) {
    return <OrderResult order={order} config={config} onUpdate={setOrder} />;
  }

  return (
    <div className="min-h-screen" style={{ background: config.colors.background }}>
      <CheckoutPreview
        config={config}
        device={mobile ? "mobile" : "desktop"}
        mode="published"
        availableMethods={data.payment_methods}
        documentRequiredMethods={data.document_required ?? ["boleto"]}
        onSubmit={(s) => void submit(s)}
        submitting={submitting}
        cardSlot={
          cardConfig.data ? (
            <MercadoPagoCardForm
              ref={cardForm}
              publicKey={cardConfig.data.publicKey}
              amount={Number(data.product.price)}
            />
          ) : cardConfig.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin opacity-60" />
            </div>
          ) : (
            <p className="text-[12.5px] opacity-70">
              Pagamento com cartão indisponível no momento. Escolha outra forma de pagamento.
            </p>
          )
        }
      />
    </div>
  );
}

function OrderResult({
  order,
  config,
  onUpdate,
}: {
  order: PublicOrder;
  config: CheckoutConfig;
  onUpdate: (order: PublicOrder) => void;
}) {
  const col = config.colors;
  const pending = order.status === "Pendente";
  const paid = order.status === "Aprovado";
  const qr = order.payment?.qr_code ?? "";
  const boleto = order.payment_method === "boleto";
  const card = order.payment_method === "card";
  const line = order.payment?.digitable_line ?? "";

  // While the Pix is open, ask the backend to re-check the charge with the
  // gateway. The status shown here always comes from the server.
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(
      async () => {
        const { data } = await supabase.functions.invoke("public-checkout", {
          body: { action: "status", orderId: order.id },
        });
        const next = (data as { order?: PublicOrder } | null)?.order;
        if (next && next.status !== order.status) onUpdate(next);
      },
      boleto ? POLL_MS * 6 : POLL_MS,
    );
    return () => clearInterval(timer);
  }, [pending, boleto, order.id, order.status, onUpdate]);

  const tone = paid ? col.success : pending ? col.warning : col.error;
  const title = paid
    ? "Pagamento confirmado"
    : pending
      ? qr
        ? "Pague com Pix"
        : boleto
          ? "Boleto gerado"
          : card
            ? "Pagamento em análise"
            : "Pedido registrado"
      : order.status === "Expirado"
        ? boleto
          ? "Boleto vencido"
          : "Pix expirado"
        : order.status === "Reembolsado"
          ? "Pagamento reembolsado"
          : "Pagamento não concluído";
  const description = paid
    ? "Obrigado pela compra! Seu pagamento foi confirmado e o vendedor já recebeu seu pedido. Guarde o número do pedido abaixo."
    : pending
      ? qr
        ? "Escaneie o QR Code ou copie o código Pix no app do seu banco. A confirmação aparece aqui automaticamente."
        : boleto
          ? "Pague o boleto no app do seu banco ou em uma lotérica. A confirmação leva até 2 dias úteis após o pagamento."
          : card
            ? "O pagamento com cartão está sendo analisado. Esta página se atualiza sozinha."
            : "Seu pedido foi registrado e está aguardando pagamento."
      : "Este pagamento não foi concluído. Você pode fazer um novo pedido.";

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: col.background, color: col.text }}
    >
      <div
        className="w-full max-w-[440px] p-6 text-center"
        style={{
          background: col.surface,
          border: `1px solid ${col.border}`,
          borderRadius: config.layout.radius,
        }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: `${tone}1f`, color: tone }}
        >
          {paid ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : pending ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <XCircle className="h-7 w-7" />
          )}
        </div>
        <p className="mt-4 text-[17px] font-bold">{title}</p>
        <p className="mt-1.5 text-[13.5px]" style={{ color: col.textMuted }}>
          {description}
        </p>

        {pending && qr ? (
          <div className="mt-5 space-y-3">
            {order.payment.qr_code_base64 ? (
              <img
                src={`data:image/png;base64,${order.payment.qr_code_base64}`}
                alt="QR Code Pix"
                className="mx-auto h-52 w-52 rounded-md bg-white p-2"
              />
            ) : null}
            <div
              className="flex items-center gap-2 rounded-lg p-2 text-left"
              style={{ border: `1px solid ${col.border}` }}
            >
              <code className="min-w-0 flex-1 truncate text-[11.5px]">{qr}</code>
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold text-white"
                style={{ background: col.button }}
                onClick={() => {
                  void navigator.clipboard?.writeText(qr);
                  toast.success("Código Pix copiado");
                }}
              >
                <Copy className="h-4 w-4" /> Copiar
              </button>
            </div>
            {order.expires_at ? (
              <p className="text-[12px]" style={{ color: col.textMuted }}>
                Válido até{" "}
                {new Date(order.expires_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
          </div>
        ) : null}

        {pending && boleto && (line || order.payment?.ticket_url) ? (
          <div className="mt-5 space-y-3">
            {line ? (
              <div
                className="flex items-center gap-2 rounded-lg p-2 text-left"
                style={{ border: `1px solid ${col.border}` }}
              >
                <code className="min-w-0 flex-1 break-all text-[11.5px]">{line}</code>
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold text-white"
                  style={{ background: col.button }}
                  onClick={() => {
                    void navigator.clipboard?.writeText(line);
                    toast.success("Linha digitável copiada");
                  }}
                >
                  <Copy className="h-4 w-4" /> Copiar
                </button>
              </div>
            ) : null}
            {order.payment?.ticket_url ? (
              <a
                href={order.payment.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-[13px] font-semibold"
                style={{ border: `1px solid ${col.border}` }}
              >
                <ExternalLink className="h-4 w-4" /> Abrir boleto
              </a>
            ) : null}
            {order.expires_at ? (
              <p className="text-[12px]" style={{ color: col.textMuted }}>
                Vence em {new Date(order.expires_at).toLocaleDateString("pt-BR")}
              </p>
            ) : null}
          </div>
        ) : null}

        <dl className="mt-5 space-y-2 text-left text-[13.5px]">
          <div className="flex justify-between gap-3">
            <dt style={{ color: col.textMuted }}>Pedido</dt>
            <dd className="font-semibold">{order.reference}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt style={{ color: col.textMuted }}>Total</dt>
            <dd className="font-semibold">{brl(Number(order.amount))}</dd>
          </div>
          {card && order.payment?.installments && order.payment.installments > 1 ? (
            <div className="flex justify-between gap-3">
              <dt style={{ color: col.textMuted }}>Parcelas</dt>
              <dd className="font-semibold">{order.payment.installments}x no cartão</dd>
            </div>
          ) : null}
          {order.gateway_payment_id ? (
            <div className="flex justify-between gap-3">
              <dt style={{ color: col.textMuted }}>Transação</dt>
              <dd className="truncate font-mono text-[12px]">{order.gateway_payment_id}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {children}
    </div>
  );
}

function Message({ title, description }: { title: string; description: string }) {
  return (
    <Centered>
      <div className="max-w-sm text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold text-foreground">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </Centered>
  );
}
