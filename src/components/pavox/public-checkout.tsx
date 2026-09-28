import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  CheckoutPreview,
  type CheckoutSubmission,
} from "@/components/pavox/builder/checkout-preview";
import {
  LEGACY_DEFAULT_NOTICES,
  LEGACY_DEFAULT_TESTIMONIALS,
  normalizeConfig,
  type CheckoutConfig,
} from "@/lib/checkout-builder";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MercadoPagoCardForm,
  type MercadoPagoCardFormHandle,
} from "@/components/pavox/mercadopago-card-form";
import { toast } from "sonner";
import { PublicCheckoutFooter } from "@/components/pavox/public-checkout-footer";
import {
  CopyCode,
  Countdown,
  Perf,
  ReceiptFrame,
  ReceiptHead,
  ReceiptLoading,
  ReceiptMessage,
  ReceiptTotal,
  Stamp,
  Steps,
  groundColors,
  useOnline,
} from "@/components/pavox/checkout-receipt";

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
  store: { slug: string; name: string; checkout_display_name?: string | null };
  product: PublicProduct | null;
  payment_methods: string[];
  /** Methods whose gateway requires the buyer's CPF/CNPJ (e.g. boleto, Asaas). */
  document_required?: string[];
  /** Methods whose gateway requires the buyer's phone (HopySplit brands, Garu). */
  phone_required?: string[];
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
    // Drop placeholder reviews and notices the builder used to insert by default.
    const testimonials = base.social.testimonials.filter(
      (t) => !LEGACY_DEFAULT_TESTIMONIALS.has(t.text.trim()),
    );
    const notices = base.notice.messages.filter(
      (m) => m.text.trim() && !LEGACY_DEFAULT_NOTICES.has(m.text.trim()),
    );
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
      summary: { ...base.summary, installmentsEnabled: false },
      coupon: { ...base.coupon, enabled: false },
      // The builder's placeholder name never reaches buyers: use the real store name.
      header: {
        ...base.header,
        storeName:
          !base.header.storeName.trim() || base.header.storeName === "Sua Loja"
            ? data.store.checkout_display_name?.trim() || data.store.name
            : base.header.storeName,
      },
      social: {
        ...base.social,
        enabled: base.social.enabled && testimonials.length > 0,
        testimonials,
      },
      notice: {
        ...base.notice,
        enabled: base.notice.enabled && notices.length > 0,
        messages: notices,
      },
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

  if (query.isLoading) return <ReceiptLoading />;

  if (query.isError) {
    return (
      <ReceiptMessage
        stamp="SEM REDE"
        title="Não foi possível carregar o checkout"
        description="Confira sua conexão com a internet e recarregue a página."
      />
    );
  }

  const data = query.data;
  if (!data) {
    return (
      <ReceiptMessage
        stamp="FORA DO AR"
        title="Checkout indisponível"
        description="Este link não existe ou o checkout não está mais publicado. Confira o link com a loja."
      />
    );
  }

  const storeName = data.store.checkout_display_name?.trim() || data.store.name;

  if (!data.product || !config) {
    return (
      <ReceiptMessage
        stamp="FORA DO AR"
        title="Produto indisponível"
        description="Este checkout ainda não tem um produto à venda. Fale com a loja."
        storeName={storeName}
      />
    );
  }

  if (!data.product.available) {
    return (
      <ReceiptMessage
        stamp="ESGOTADO"
        title="Produto esgotado"
        description="Este produto não está disponível no momento. Fale com a loja para saber quando volta."
        color={config.colors.button}
        storeName={storeName}
      />
    );
  }

  if (order) {
    return (
      <OrderResult
        order={order}
        color={config.colors.button}
        storeName={storeName}
        displayName={data.store.checkout_display_name}
        onUpdate={setOrder}
        onRestart={() => {
          idempotencyKey.current = null;
          setOrder(null);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: config.colors.background }}>
      <CheckoutPreview
        config={config}
        device={mobile ? "mobile" : "desktop"}
        mode="published"
        displayName={data.store.checkout_display_name}
        availableMethods={data.payment_methods}
        documentRequiredMethods={data.document_required ?? ["boleto"]}
        phoneRequiredMethods={data.phone_required ?? []}
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
      {/* The builder draws its own footer when enabled; only fall back to ours when it is off. */}
      {config.footer.enabled ? null : (
        <PublicCheckoutFooter
          displayName={data.store.checkout_display_name}
          color={config.colors.textMuted}
          mutedColor={config.colors.textMuted}
        />
      )}
    </div>
  );
}

function OrderResult({
  order,
  color,
  storeName,
  displayName,
  onUpdate,
  onRestart,
}: {
  order: PublicOrder;
  color: string;
  storeName: string;
  displayName?: string | null | undefined;
  onUpdate: (order: PublicOrder) => void;
  onRestart: () => void;
}) {
  const online = useOnline();
  const pending = order.status === "Pendente";
  const paid = order.status === "Aprovado";
  const expired = order.status === "Expirado";
  const refunded = order.status === "Reembolsado";
  const qr = order.payment?.qr_code ?? "";
  const pix = order.payment_method === "pix" || !!qr;
  const boleto = order.payment_method === "boleto";
  const card = order.payment_method === "card";
  const line = order.payment?.digitable_line ?? "";
  // The stamp lands only when the payment turns paid while the buyer watches.
  const [landed] = useState(() => !paid);

  // While the payment is open, ask the backend to re-check the charge with the
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
      : expired
        ? boleto
          ? "Este boleto venceu"
          : "Este Pix expirou"
        : refunded
          ? "Pagamento reembolsado"
          : "Pagamento não concluído";
  const description = paid
    ? "O banco confirmou seu pagamento e a loja já recebeu seu pedido. Guarde o número do pedido abaixo."
    : pending
      ? qr
        ? "Abra o app do seu banco, escolha Pix copia e cola e cole o código. Esta página confirma sozinha."
        : boleto
          ? "Pague o boleto no app do seu banco ou em uma lotérica. A confirmação leva até 2 dias úteis."
          : card
            ? "O pagamento com cartão está sendo analisado. Esta página se atualiza sozinha."
            : "Seu pedido foi registrado e está aguardando pagamento."
      : expired
        ? "O prazo acabou e nenhum valor foi cobrado. Faça um novo pedido para pagar."
        : refunded
          ? "O valor foi devolvido pela loja. O prazo para aparecer depende do seu banco."
          : "Este pagamento não foi concluído e nada foi cobrado. Você pode fazer um novo pedido.";

  const stamp = paid ? (
    <Stamp
      big="PAGO"
      small={
        order.paid_at
          ? new Date(order.paid_at).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined
      }
      land={landed}
    />
  ) : expired ? (
    <Stamp big={boleto ? "VENCIDO" : "EXPIRADO"} small="SEM COBRANÇA" tone="off" />
  ) : refunded ? (
    <Stamp big="DEVOLVIDO" tone="off" />
  ) : !pending ? (
    <Stamp big="NÃO PAGO" small="NADA COBRADO" tone="bad" />
  ) : null;

  const { soft } = groundColors(color);

  return (
    <ReceiptFrame
      color={color}
      storeName={storeName}
      footer={<PublicCheckoutFooter displayName={displayName} color={soft} mutedColor={soft} />}
    >
      <ReceiptHead
        storeName={storeName}
        {...(order.paid_at ? { at: new Date(order.paid_at) } : {})}
      />
      <Perf />
      <ReceiptTotal amount={Number(order.amount)} />
      <Perf />

      <h1 className="cr-title">{title}</h1>
      <p className="cr-sub">{description}</p>

      {qr && (pending || paid || expired) && order.payment.qr_code_base64 ? (
        <div className={`cr-qr ${pending ? "" : "spent"}`}>
          <img src={`data:image/png;base64,${order.payment.qr_code_base64}`} alt="QR Code Pix" />
          {stamp}
        </div>
      ) : stamp ? (
        <div className="cr-stamp-row">{stamp}</div>
      ) : null}

      {pending && qr ? (
        <>
          <CopyCode
            text={qr}
            label="Copiar código Pix"
            doneLabel="Código copiado"
            failHint="Não deu para copiar sozinho. O código ficou selecionado: toque e segure para copiar."
          />
          {order.expires_at ? <Countdown until={order.expires_at} /> : null}
          <p className="cr-wait">
            Aguardando o banco
            <span className="dots" aria-hidden="true" />
          </p>
        </>
      ) : null}

      {pending && boleto && (line || order.payment?.ticket_url) ? (
        <>
          {line ? (
            <CopyCode
              text={line}
              label="Copiar linha digitável"
              doneLabel="Linha copiada"
              failHint="Não deu para copiar sozinho. A linha ficou selecionada: toque e segure para copiar."
            />
          ) : null}
          {order.payment?.ticket_url ? (
            <a
              href={order.payment.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cr-btn ghost"
            >
              <ExternalLink className="size-5" aria-hidden="true" /> Abrir boleto em PDF
            </a>
          ) : null}
          {order.expires_at ? (
            <p className="cr-note">
              Vence em{" "}
              <span className="num">{new Date(order.expires_at).toLocaleDateString("pt-BR")}</span>
            </p>
          ) : null}
        </>
      ) : null}

      {pending && !online ? (
        <p className="cr-note" role="status">
          Sem internet agora. Se você já pagou, fique tranquilo: quando a conexão voltar, esta
          página confere de novo.
        </p>
      ) : null}

      {!pending && !paid ? (
        <button type="button" className="cr-btn" style={{ marginTop: 20 }} onClick={onRestart}>
          Fazer novo pedido
        </button>
      ) : null}

      {pix || boleto || card ? (
        <>
          <Perf />
          <Steps
            items={[
              {
                label: pix ? "Pix gerado" : boleto ? "Boleto gerado" : "Cartão enviado",
                state: "done",
              },
              {
                label: "Aguardando o banco",
                state: pending ? "now" : "done",
              },
              paid
                ? { label: "Pagamento confirmado", state: "ok" }
                : pending
                  ? { label: "Pagamento confirmado", state: "todo" }
                  : {
                      label: expired
                        ? "Prazo encerrado, sem cobrança"
                        : refunded
                          ? "Valor devolvido"
                          : "Pagamento não concluído",
                      state: "done",
                    },
            ]}
          />
        </>
      ) : null}

      {pending && qr ? (
        <>
          <Perf />
          <h2 className="cr-sec">Como pagar</h2>
          <ol className="cr-howto">
            <li>Abra o app do seu banco e entre na área Pix.</li>
            <li>Escolha Pix copia e cola e cole o código.</li>
            <li>Confira o valor e confirme. Esta tela muda sozinha.</li>
          </ol>
        </>
      ) : null}

      <Perf />
      <dl className="cr-kv">
        <div>
          <dt>Pedido</dt>
          <dd className="num">{order.reference}</dd>
        </div>
        <div>
          <dt>Forma de pagamento</dt>
          <dd>
            {pix ? "Pix" : boleto ? "Boleto" : card ? "Cartão de crédito" : order.payment_method}
          </dd>
        </div>
        {card && order.payment?.installments && order.payment.installments > 1 ? (
          <div>
            <dt>Parcelas</dt>
            <dd>{order.payment.installments}x no cartão</dd>
          </div>
        ) : null}
        {order.gateway_payment_id ? (
          <div>
            <dt>Transação</dt>
            <dd className="num" style={{ fontSize: 12.5 }}>
              {order.gateway_payment_id}
            </dd>
          </div>
        ) : null}
      </dl>
    </ReceiptFrame>
  );
}
