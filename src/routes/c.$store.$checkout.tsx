import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { CheckoutPreview, type CheckoutSubmission } from "@/components/pavox/builder/checkout-preview";
import { normalizeConfig, type CheckoutConfig } from "@/lib/checkout-builder";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { brl } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/c/$store/$checkout")({
  component: PublicCheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout seguro" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

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
};

// Sensitive card data never leaves the browser towards PAVOX: card payments
// will use the gateway's tokenization.
const CARD_FIELD_IDS = new Set(["card_number", "card_name", "card_exp", "card_cvv"]);

function buyerFromSubmission(sub: CheckoutSubmission, physical: boolean) {
  const v = Object.fromEntries(Object.entries(sub.values).filter(([k]) => !CARD_FIELD_IDS.has(k)));
  const pj = sub.identity === "pj";
  return {
    person_type: pj ? "pj" : "pf",
    name: (pj ? v["razao"] : v["name"]) ?? "",
    email: v["email"] ?? "",
    phone: v["phone"] ?? "",
    document: (pj ? v["cnpj"] : v["doc"]) ?? "",
    ...(physical
      ? {
          address: {
            zip: v["zip"] ?? "",
            street: v["street"] ?? "",
            number: v["number"] ?? "",
            complement: v["complement"] ?? "",
            city: v["city"] ?? "",
            state: v["state"] ?? "",
          },
        }
      : {}),
  };
}

async function readFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { message?: string };
      if (body?.message) return body.message;
    } catch {
      // fall through
    }
  }
  return "Não foi possível concluir sua compra. Verifique sua conexão e tente novamente.";
}

function PublicCheckoutPage() {
  const { store, checkout } = Route.useParams();
  const mobile = useIsMobile();
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["public-checkout", store, checkout],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_checkout" as never, {
        p_store_slug: store,
        p_checkout_slug: checkout,
      } as never);
      if (error) throw error;
      return (data ?? null) as PublicCheckout | null;
    },
    retry: 1,
  });

  const product = query.data?.product ?? null;
  const imagePath = product?.image ?? null;
  const image = useQuery({
    queryKey: ["public-checkout-image", imagePath],
    enabled: !!imagePath,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("product-images").createSignedUrl(imagePath!, 60 * 60);
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
    idempotencyKey.current ??= crypto.randomUUID();
    setSubmitting(true);
    const { data: result, error } = await supabase.functions.invoke("public-checkout", {
      body: {
        checkoutId: data.checkout.id,
        paymentMethod: submission.method,
        idempotencyKey: idempotencyKey.current,
        buyer: buyerFromSubmission(submission, data.product.type === "fisico"),
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(await readFunctionError(error));
      return;
    }
    setOrder((result as { order: PublicOrder }).order);
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
    return <Message title="Produto esgotado" description="Este produto não está disponível no momento." />;
  }

  if (order) {
    return <OrderResult order={order} config={config} />;
  }

  return (
    <div className="min-h-screen" style={{ background: config.colors.background }}>
      <CheckoutPreview
        config={config}
        device={mobile ? "mobile" : "desktop"}
        mode="published"
        availableMethods={data.payment_methods}
        onSubmit={(s) => void submit(s)}
        submitting={submitting}
      />
    </div>
  );
}

function OrderResult({ order, config }: { order: PublicOrder; config: CheckoutConfig }) {
  const col = config.colors;
  const paid = order.status === "Aprovado";
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: col.background, color: col.text }}>
      <div
        className="w-full max-w-[440px] p-6 text-center"
        style={{ background: col.surface, border: `1px solid ${col.border}`, borderRadius: config.layout.radius }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: `${paid ? col.success : col.warning}1f`, color: paid ? col.success : col.warning }}
        >
          {paid ? <CheckCircle2 className="h-7 w-7" /> : <Loader2 className="h-7 w-7" />}
        </div>
        <p className="mt-4 text-[17px] font-bold">{paid ? "Pagamento confirmado" : "Pedido registrado"}</p>
        <p className="mt-1.5 text-[13.5px]" style={{ color: col.textMuted }}>
          {paid
            ? "Obrigado pela compra! Você receberá os detalhes por e-mail."
            : "Seu pedido foi registrado e está aguardando pagamento."}
        </p>
        <dl className="mt-5 space-y-2 text-left text-[13.5px]">
          <div className="flex justify-between gap-3">
            <dt style={{ color: col.textMuted }}>Pedido</dt>
            <dd className="font-semibold">{order.reference}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt style={{ color: col.textMuted }}>Total</dt>
            <dd className="font-semibold">{brl(Number(order.amount))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt style={{ color: col.textMuted }}>Status</dt>
            <dd className="font-semibold">{paid ? "Pago" : "Aguardando pagamento"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4">{children}</div>;
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
