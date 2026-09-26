// Mercado Pago Card Payment Brick: the card is typed inside Mercado Pago's own
// secure fields and becomes a single-use token. Card number and CVV never
// reach PAVOX — only the token, brand and installments.
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const SDK_URL = "https://sdk.mercadopago.com/js/v2";

export type TokenizedCard = {
  token: string;
  paymentMethodId: string;
  paymentTypeId: "credit_card" | "debit_card";
  installments: number;
  identification?: { type: string; number: string };
};

export type MercadoPagoCardFormHandle = {
  /** Validates the form and tokenizes the card; null when a field is invalid. */
  tokenize: () => Promise<TokenizedCard | null>;
};

type BrickFormData = {
  token?: string;
  payment_method_id?: string;
  installments?: number | string;
  payer?: { identification?: { type?: string; number?: string } };
};

type BrickController = {
  getFormData: () => Promise<BrickFormData | null | undefined>;
  getAdditionalData?: () => Promise<{ paymentTypeId?: string } | null | undefined>;
  unmount: () => void;
};

type MercadoPagoCtor = new (
  publicKey: string,
  options: { locale: string },
) => {
  bricks: () => {
    create: (
      brick: "cardPayment",
      containerId: string,
      settings: unknown,
    ) => Promise<BrickController>;
  };
};

declare global {
  interface Window {
    MercadoPago?: MercadoPagoCtor;
  }
}

let sdkPromise: Promise<MercadoPagoCtor> | null = null;

function loadSdk(): Promise<MercadoPagoCtor> {
  if (window.MercadoPago) return Promise.resolve(window.MercadoPago);
  sdkPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () =>
      window.MercadoPago ? resolve(window.MercadoPago) : reject(new Error("sdk_unavailable"));
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("sdk_unavailable"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export const MercadoPagoCardForm = forwardRef<
  MercadoPagoCardFormHandle,
  { publicKey: string; amount: number; dark?: boolean }
>(function MercadoPagoCardForm({ publicKey, amount, dark = false }, ref) {
  const containerId = `mp-card-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const controller = useRef<BrickController | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    loadSdk()
      .then((MercadoPago) =>
        new MercadoPago(publicKey, { locale: "pt-BR" })
          .bricks()
          .create("cardPayment", containerId, {
            initialization: { amount },
            customization: {
              visual: { hidePaymentButton: true, style: { theme: dark ? "dark" : "default" } },
              paymentMethods: { maxInstallments: 12, types: { excluded: ["debit_card"] } },
            },
            callbacks: {
              onReady: () => {
                if (!cancelled) setStatus("ready");
              },
              // Submission is driven by the checkout's own button (tokenize()).
              onSubmit: async () => {},
              onError: () => {},
            },
          }),
      )
      .then((c) => {
        if (cancelled) c.unmount();
        else controller.current = c;
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      controller.current?.unmount();
      controller.current = null;
    };
  }, [publicKey, amount, dark, containerId]);

  useImperativeHandle(ref, () => ({
    tokenize: async () => {
      const c = controller.current;
      if (!c) return null;
      try {
        const data = await c.getFormData();
        if (!data?.token || !data.payment_method_id) return null;
        const extra = c.getAdditionalData ? await c.getAdditionalData().catch(() => null) : null;
        const ident = data.payer?.identification;
        return {
          token: data.token,
          paymentMethodId: data.payment_method_id,
          paymentTypeId: extra?.paymentTypeId === "debit_card" ? "debit_card" : "credit_card",
          installments: Number(data.installments) || 1,
          ...(ident?.number
            ? { identification: { type: ident.type ?? "CPF", number: ident.number } }
            : {}),
        };
      } catch {
        // The Brick highlights the invalid fields itself.
        return null;
      }
    },
  }));

  return (
    <div className="space-y-2">
      {status === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-6 text-[12.5px] opacity-70">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando pagamento seguro…
        </div>
      ) : null}
      {status === "error" ? (
        <p className="rounded-lg px-3 py-2.5 text-[12.5px]" style={{ background: "#ef44441a" }}>
          Não foi possível carregar o pagamento com cartão. Recarregue a página ou escolha outra
          forma de pagamento.
        </p>
      ) : null}
      <div id={containerId} />
    </div>
  );
});
