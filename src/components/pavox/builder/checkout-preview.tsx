import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Database,
  FlaskConical,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Timer,
  Truck,
  User,
} from "lucide-react";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { PixIcon } from "@/components/pavox/builder/pix-icon";
import {
  ADDRESS_FIELDS,
  CUSTOMER_FIELDS,
  FIELD_LABELS,
  FONT_STACKS,
  isValidCEP,
  isValidCNPJ,
  isValidCPF,
  isValidEmail,
  isValidPhone,
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskPhone,
  resolveSteps,
  type Align,
  type BlockPosition,
  type CheckoutConfig,
  type Device,
  type FieldKey,
  type SecurityItem,
  type StepItem,
  type StepKey,
} from "@/lib/checkout-builder";

/**
 * Renderizador único do checkout — a fonte de verdade visual e funcional.
 *
 * As três superfícies (Preview do Builder, Simulador/"Testar checkout" e o
 * checkout publicado/"Abrir checkout") usam ESTE componente com a MESMA
 * configuração (CheckoutConfig). Não existe lógica paralela nem estrutura
 * antiga: tudo é derivado de `config`.
 *
 * `mode`:
 *  - "design"    → preview em tempo real dentro do Builder (interativo).
 *  - "test"      → simulação (exibe faixa de modo de teste + reinício).
 *  - "published" → representação do checkout publicado (interativo).
 *
 * Os modos acima não criam cliente, pedido, venda ou pagamento. O checkout
 * público real (rota /c/{loja}/{checkout}) usa o modo "published" com
 * `onSubmit`: aí o envio vai para o backend, que cria o pedido.
 */

type PreviewMode = "design" | "test" | "published";
type Identity = "pf" | "pj";

const SECURITY_ICONS: Record<string, typeof ShieldCheck> = {
  shield: ShieldCheck,
  lock: Lock,
  database: Database,
  badge: BadgeCheck,
};

const STEP_CHIP_ICONS: Record<string, typeof User> = {
  user: User,
  truck: Truck,
  card: CreditCard,
  circle: Check,
};

const STEP_ICONS: Record<StepKey, typeof User> = {
  identificacao: User,
  entrega: Truck,
  pagamento: CreditCard,
};

function alignItems(a: Align) {
  return a === "left" ? "justify-start" : a === "right" ? "justify-end" : "justify-center";
}
function textAlign(a: Align): CSSProperties["textAlign"] {
  return a;
}

/* ── validações de campo ── */
const vEmail = (v: string) => (isValidEmail(v) ? null : "E-mail inválido");
const vPhone = (v: string) => (isValidPhone(v) ? null : "Telefone inválido");
const vCPF = (v: string) => (isValidCPF(v) ? null : "CPF inválido");
const vCNPJ = (v: string) => (isValidCNPJ(v) ? null : "CNPJ inválido");
const vCEP = (v: string) => (isValidCEP(v) ? null : "CEP inválido");

type RuntimeField = {
  id: string;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
  mask?: (v: string) => string;
  validate?: (v: string) => string | null;
  required: boolean;
  half?: boolean;
};

const PF_META: Record<FieldKey, Omit<RuntimeField, "required">> = {
  name: { id: "name", label: "Nome completo", placeholder: "Digite seu nome completo" },
  email: { id: "email", label: "E-mail", placeholder: "Digite seu e-mail", type: "email", validate: vEmail },
  phone: { id: "phone", label: "Celular/WhatsApp", placeholder: "(00) 00000-0000", type: "tel", mask: maskPhone, validate: vPhone },
  doc: { id: "doc", label: "CPF", placeholder: "000.000.000-00", mask: maskCPF, validate: vCPF },
  zip: { id: "zip", label: "CEP", placeholder: "00000-000", mask: maskCEP, validate: vCEP },
  street: { id: "street", label: "Endereço", placeholder: "Rua, avenida..." },
  number: { id: "number", label: "Número", placeholder: "Nº", half: true },
  complement: { id: "complement", label: "Complemento", placeholder: "Apto, bloco (opcional)", half: true },
  city: { id: "city", label: "Cidade", placeholder: "Sua cidade", half: true },
  state: { id: "state", label: "Estado", placeholder: "UF", half: true },
};

const SHIPPING = [
  { id: "standard", label: "Entrega padrão", eta: "5 a 8 dias úteis", price: 0 },
  { id: "express", label: "Entrega expressa", eta: "1 a 2 dias úteis", price: 24.9 },
];

const CARD_FIELDS: RuntimeField[] = [
  { id: "card_number", label: "Número do cartão", placeholder: "0000 0000 0000 0000", required: true, validate: (v) => (v.replace(/\D/g, "").length >= 13 ? null : "Número inválido") },
  { id: "card_name", label: "Nome impresso no cartão", placeholder: "Como está no cartão", required: true },
  { id: "card_exp", label: "Validade", placeholder: "MM/AA", required: true, half: true, validate: (v) => (/^\d{2}\/?\d{2}$/.test(v.replace(/\s/g, "")) ? null : "Validade inválida") },
  { id: "card_cvv", label: "CVV", placeholder: "000", required: true, half: true, validate: (v) => (v.replace(/\D/g, "").length >= 3 ? null : "CVV inválido") },
];

// Boleto (Mercado Pago) exige CPF/CNPJ e endereço completo com bairro,
// mesmo quando o produto é digital.
const BOLETO_FIELDS: Omit<RuntimeField, "required">[] = [
  PF_META.doc,
  PF_META.zip,
  PF_META.street,
  PF_META.number,
  { id: "neighborhood", label: "Bairro", placeholder: "Seu bairro", half: true },
  PF_META.city,
  { ...PF_META.state, half: true },
];

export type CheckoutSubmission = {
  identity: Identity;
  method: string;
  values: Record<string, string>;
};

type Props = {
  config: CheckoutConfig;
  device: Device;
  mode?: PreviewMode;
  /** Checkout público real: métodos que o backend aceita para esta loja. */
  availableMethods?: string[];
  /** Checkout público real: envia os dados ao backend (cria o pedido). */
  onSubmit?: (submission: CheckoutSubmission) => void;
  submitting?: boolean;
  /** Checkout público real: formulário seguro do gateway para cartão (substitui os campos de demonstração). */
  cardSlot?: ReactNode;
};

export function CheckoutPreview({
  config,
  device,
  mode = "design",
  availableMethods,
  onSubmit,
  submitting = false,
  cardSlot,
}: Props) {
  const c = config;
  const col = c.colors;
  const mobile = device === "mobile";
  const testMode = mode === "test";
  const live = mode === "published" && !!onSubmit;
  const isOffered = (key: "pix" | "card" | "boleto") =>
    c.payment[key] && (!live || (availableMethods ?? []).includes(key));

  const steps = useMemo(() => resolveSteps(c), [c]);
  const stepped = c.steps.enabled && steps.length > 1;

  const [identity, setIdentity] = useState<Identity>("pf");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [method, setMethod] = useState<string>(isOffered("pix") ? "pix" : isOffered("card") ? "card" : "boleto");
  const [shipping, setShipping] = useState(SHIPPING[0]!.id);
  const [finished, setFinished] = useState(false);

  // Se a configuração de PJ for desativada enquanto o comprador estava em PJ,
  // volta imediatamente para PF (mantém o preview coerente em tempo real).
  useEffect(() => {
    if (!c.identification.allowCNPJ && identity === "pj") setIdentity("pf");
  }, [c.identification.allowCNPJ, identity]);

  // Mantém o método de pagamento válido conforme os métodos ativos mudam.
  useEffect(() => {
    const active = (["pix", "card", "boleto"] as const).filter((k) => isOffered(k)) as string[];
    if (active.length > 0 && !active.includes(method)) setMethod(active[0]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.payment.pix, c.payment.card, c.payment.boleto, availableMethods, live, method]);

  // Ajusta o índice de etapa caso o número de etapas mude (ex.: físico↔digital).
  useEffect(() => {
    if (stepIndex > steps.length - 1) setStepIndex(Math.max(0, steps.length - 1));
  }, [steps.length, stepIndex]);

  const rootStyle: CSSProperties = {
    background: col.background,
    fontFamily: FONT_STACKS[c.typography.fontFamily],
    color: col.text,
    lineHeight: c.typography.lineHeight,
  };
  const cardStyle: CSSProperties = {
    background: col.surface,
    border: `1px solid ${col.border}`,
    borderRadius: c.layout.radius,
    color: col.text,
  };

  const identityFields = useMemo<RuntimeField[]>(() => {
    if (identity === "pj") {
      return [
        { id: "razao", label: "Razão social", placeholder: "Nome registrado da empresa", required: true },
        { id: "fantasia", label: "Nome fantasia (opcional)", placeholder: "Nome comercial", required: false },
        { id: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00", mask: maskCNPJ, validate: vCNPJ, required: true },
        { id: "email", label: "E-mail", placeholder: "Digite seu e-mail", type: "email", validate: vEmail, required: true },
        { id: "phone", label: "Celular/WhatsApp", placeholder: "(00) 00000-0000", type: "tel", mask: maskPhone, validate: vPhone, required: c.fields.required.includes("phone") },
      ];
    }
    // Boleto exige CPF mesmo quando o lojista deixou o campo opcional.
    const boletoLive = live && method === "boleto";
    return CUSTOMER_FIELDS.filter((f) => c.fields.customer.includes(f)).map((f) => ({
      ...PF_META[f],
      required: c.fields.required.includes(f) || (boletoLive && f === "doc"),
    }));
  }, [identity, c.fields.customer, c.fields.required, live, method]);

  const addressFields = useMemo<RuntimeField[]>(
    () =>
      ADDRESS_FIELDS.filter((f) => c.fields.address.includes(f)).map((f) => ({
        ...PF_META[f],
        required: c.fields.required.includes(f),
      })),
    [c.fields.address, c.fields.required],
  );

  // No checkout publicado o cartão é digitado no formulário seguro do gateway.
  const cardFields = method === "card" && !live ? CARD_FIELDS : [];

  // Boleto: pede só o que ainda não foi pedido nas outras etapas.
  const boletoFields = useMemo<RuntimeField[]>(() => {
    if (!live || method !== "boleto") return [];
    const asked = new Set([
      ...identityFields.map((f) => f.id),
      ...(c.product.kind === "physical" ? addressFields.map((f) => f.id) : []),
    ]);
    return BOLETO_FIELDS.filter((f) => !asked.has(f.id) && !(f.id === "doc" && identity === "pj")).map(
      (f) => ({ ...f, required: true }),
    );
  }, [live, method, identityFields, addressFields, c.product.kind, identity]);

  const paymentFields = useMemo(() => [...cardFields, ...boletoFields], [cardFields, boletoFields]);

  function fieldsForStep(key: StepKey): RuntimeField[] {
    if (key === "identificacao") return identityFields;
    if (key === "entrega") return addressFields;
    if (key === "pagamento") return paymentFields;
    return [];
  }

  const allFields = useMemo(
    () => steps.flatMap((s) => fieldsForStep(s.key)),
    [steps, identityFields, addressFields, paymentFields],
  );

  function setValue(id: string, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  }

  function validate(fields: RuntimeField[]) {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const raw = (values[f.id] ?? "").trim();
      if (f.required && !raw) {
        next[f.id] = "Campo obrigatório";
        continue;
      }
      if (raw && f.validate) {
        const err = f.validate(raw);
        if (err) next[f.id] = err;
      }
    }
    return next;
  }

  function goPrimary() {
    if (submitting) return;
    const toCheck = stepped ? fieldsForStep(steps[stepIndex]!.key) : allFields;
    const next = validate(toCheck);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (!stepped || stepIndex >= steps.length - 1) {
      if (live) {
        if (!isOffered(method as "pix" | "card" | "boleto")) return;
        onSubmit?.({ identity, method, values });
        return;
      }
      setFinished(true);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function reset() {
    setValues({});
    setErrors({});
    setStepIndex(0);
    setIdentity("pf");
    setFinished(false);
  }

  function primaryLabel() {
    if (!stepped || stepIndex >= steps.length - 1) return c.button.label;
    const next = steps[stepIndex + 1];
    return `Continuar para ${(next?.label ?? "").toLowerCase()}`;
  }

  /**
   * Renderiza Resumo/Cupom em uma âncora específica. Cada bloco tem sua
   * própria posição (`c.summary.position` / `c.coupon.position`), então o
   * lojista pode movê-los livremente pelo checkout. `after-summary` é um
   * valor especial de cupom: sempre "cola" imediatamente depois do resumo,
   * onde quer que ele esteja — não é uma âncora física própria.
   */
  function renderSlot(position: BlockPosition, opts: { card?: boolean } = {}): ReactNode {
    const showSummary = c.summary.enabled && c.summary.position === position;
    const showCoupon =
      c.coupon.enabled && (c.coupon.position === position || (c.coupon.position === "after-summary" && showSummary));
    if (!showSummary && !showCoupon) return null;
    const card = opts.card !== false;
    return (
      <div className={card ? "space-y-3 p-4" : "space-y-3"} style={card ? cardStyle : undefined}>
        {showSummary ? <Summary config={c} /> : null}
        {showCoupon ? <Coupon config={c} /> : null}
      </div>
    );
  }

  /* ───────────── tela de conclusão ───────────── */
  if (finished) {
    return (
      <div className="relative min-h-[420px] w-full" style={rootStyle}>
        {testMode ? <TestBanner col={col} /> : null}
        <div className="flex min-h-[380px] items-center justify-center px-4 py-10">
          <div className="w-full max-w-[420px] p-6 text-center" style={cardStyle}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${col.success}1f`, color: col.success }}>
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="mt-4 text-[16px] font-bold">{testMode ? "Compra simulada com sucesso" : "Tudo certo!"}</p>
            <p className="mt-1.5 text-[13px]" style={{ color: col.textMuted }}>
              {testMode
                ? "Este é apenas um teste — nenhum pedido, pagamento ou cliente foi criado."
                : "Pré-visualização do fluxo concluída. É exatamente assim que o cliente avança pelo checkout."}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg text-[14px] font-semibold text-white transition-transform active:scale-[0.99]"
              style={{ background: col.button, borderRadius: c.button.radius }}
            >
              Recomeçar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = steps[stepIndex];
  const bodySize = c.typography.bodySize;
  const labelSize = c.typography.labelSize;

  return (
    <div className="relative min-h-[420px] w-full" style={rootStyle}>
      {testMode ? <TestBanner col={col} /> : null}

      {/* barra de avisos */}
      <NoticeBar config={c} />

      {/* banner */}
      <Banner config={c} device={device} />

      <div className="px-4 py-4" style={{ fontSize: bodySize }}>
        <div className="mx-auto flex flex-col gap-4" style={{ maxWidth: mobile ? "100%" : c.layout.width }}>
          {/* cabeçalho */}
          <Header config={c} device={device} />

          {c.divider.enabled ? <DividerLine config={c} /> : null}

          {/* escassez topo */}
          {c.scarcity.enabled && c.scarcity.position === "top" ? <Scarcity config={c} /> : null}

          {/* stepper — apenas em modo etapas */}
          {stepped ? <Steps config={c} device={device} current={stepIndex} /> : null}

          {renderSlot("before-product")}

          {/* card do produto */}
          <div className="p-4" style={cardStyle}>
            <Product config={c} />
          </div>

          {renderSlot("after-product")}

          {/* prova social */}
          {c.social.enabled ? (
            <div className="p-4" style={cardStyle}>
              <SocialProof config={c} />
            </div>
          ) : null}

          {/* formulário — etapas ou página única */}
          <div className="space-y-4 p-4" style={cardStyle}>
            {stepped && current ? (
              StepSection({
                numbered: true,
                index: stepIndex,
                total: steps.length,
                label: current.label,
                children:
                  current.key === "identificacao" ? (
                    <>
                      {renderSlot("before-identification", { card: false })}
                      {Identification()}
                      {renderSlot("after-identification", { card: false })}
                    </>
                  ) : current.key === "entrega" ? (
                    Delivery()
                  ) : current.key === "pagamento" ? (
                    <>
                      {renderSlot("before-payment", { card: false })}
                      {Payment()}
                      {renderSlot("after-payment", { card: false })}
                    </>
                  ) : null,
              })
            ) : (
              <>
                {renderSlot("before-identification", { card: false })}
                {StepSection({ label: "Identificação", children: Identification() })}
                {renderSlot("after-identification", { card: false })}
                {c.product.kind === "physical" ? StepSection({ label: "Entrega", children: Delivery() }) : null}
                {renderSlot("before-payment", { card: false })}
                {StepSection({ label: "Pagamento", children: Payment() })}
                {renderSlot("after-payment", { card: false })}
              </>
            )}

            {/* navegação / CTA */}
            <div className="flex items-center gap-2 pt-1">
              {stepped && stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border px-4 text-[13px] font-semibold transition-colors"
                  style={{ borderColor: col.border, color: col.text }}
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
              ) : null}
              <button
                type="button"
                onClick={goPrimary}
                disabled={submitting}
                className={cn("inline-flex items-center justify-center gap-2 px-6 text-white transition-transform active:scale-[0.99] disabled:opacity-70", c.button.full && "flex-1")}
                style={{
                  height: c.button.height,
                  borderRadius: c.button.radius,
                  background: col.button,
                  fontSize: c.typography.buttonSize,
                  fontWeight: c.typography.buttonWeight,
                  boxShadow: `0 10px 24px -12px ${col.button}`,
                }}
              >
                {c.button.icon ? <Lock className="h-4 w-4" /> : null}
                {submitting ? "Processando…" : primaryLabel()}
              </button>
            </div>
          </div>

          {/* resumo/cupom — posição padrão (antes do rodapé) */}
          {renderSlot("before-footer")}

          {/* escassez acima do botão */}
          {c.scarcity.enabled && c.scarcity.position === "above-button" ? <Scarcity config={c} /> : null}

          {/* segurança */}
          {c.security.enabled ? <Security config={c} /> : null}

          {/* rodapé */}
          {c.footer.enabled ? <Footer config={c} /> : null}

          {/* resumo/cupom — final do checkout */}
          {renderSlot("end")}
        </div>
      </div>

      {/* compra ao vivo */}
      {c.live.enabled ? <LiveToast config={c} showPreviewTag={mode !== "published"} /> : null}
    </div>
  );

  /* ───────────── seções interativas (fecham sobre o estado) ─────────────
     São chamadas como funções ({Payment()}), nunca como <Payment />: declaradas
     aqui dentro, ganhariam um tipo novo a cada render e o React remontaria os
     inputs a cada tecla — o campo perde o foco e o teclado do celular fecha. */

  function StepSection({
    label,
    numbered,
    index,
    total,
    children,
  }: {
    label: string;
    numbered?: boolean;
    index?: number;
    total?: number;
    children: ReactNode;
  }) {
    return (
      <div className="space-y-3">
        {numbered ? (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: col.primary }}>
                {(index ?? 0) + 1}
              </span>
              <p className="text-[15px] font-bold leading-tight">{label}</p>
            </div>
            <span className="text-[12px] font-medium" style={{ color: col.textMuted }}>
              {(index ?? 0) + 1} de {total}
            </span>
          </div>
        ) : (
          <p className="font-semibold uppercase tracking-[0.08em]" style={{ color: col.textMuted, fontSize: labelSize - 1 }}>
            {label}
          </p>
        )}
        {children}
      </div>
    );
  }

  function Identification() {
    return (
      <div className="space-y-3">
        {c.identification.allowCNPJ ? (
          <div className="grid grid-cols-2 gap-1 rounded-lg p-1" style={{ background: `${col.text}0a`, borderRadius: c.layout.radius * 0.6 }}>
            {(["pf", "pj"] as Identity[]).map((m) => {
              const active = identity === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setIdentity(m);
                    setErrors({});
                  }}
                  aria-pressed={active}
                  className="flex items-center justify-center gap-1.5 rounded-md py-2 text-[12.5px] font-semibold transition-colors"
                  style={{
                    background: active ? col.surface : "transparent",
                    color: active ? col.text : col.textMuted,
                    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {m === "pf" ? <User className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                  {m === "pf" ? "Pessoa física" : "Pessoa jurídica"}
                </button>
              );
            })}
          </div>
        ) : null}

        {FieldGrid(identityFields)}

        {c.payment.pix && !live ? (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px]" style={{ background: `${col.text}08`, borderRadius: c.layout.radius * 0.6 }}>
            <PixIcon className="h-4 w-4 shrink-0" />
            <span>
              Você ganhou <strong style={{ color: col.success }}>1% de desconto</strong> pagando com Pix
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  function Delivery() {
    return (
      <div className="space-y-3">
        {FieldGrid(addressFields)}
        {live ? null : <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: col.textMuted }}>
            Opções de frete
          </p>
          {SHIPPING.map((o) => {
            const active = shipping === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setShipping(o.id)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                style={{
                  borderRadius: c.layout.radius * 0.6,
                  border: `1.5px solid ${active ? col.primary : col.border}`,
                  background: active ? `${col.primary}0d` : "transparent",
                }}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ border: `1.5px solid ${active ? col.primary : col.border}` }}>
                  {active ? <span className="h-2 w-2 rounded-full" style={{ background: col.primary }} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold" style={{ color: active ? col.primary : col.text }}>
                    {o.label}
                  </span>
                  <span className="block text-[11px]" style={{ color: col.textMuted }}>
                    {o.eta}
                  </span>
                </span>
                <span className="text-[12.5px] font-semibold" style={{ color: o.price === 0 ? col.success : col.text }}>
                  {o.price === 0 ? "Grátis" : brl(o.price)}
                </span>
              </button>
            );
          })}
        </div>}
      </div>
    );
  }

  function Payment() {
    const methods: { key: string; label: string; sub: string; icon: ReactNode }[] = [];
    if (isOffered("pix")) methods.push({ key: "pix", label: "PIX", sub: "Pagamento instantâneo", icon: <PixIcon className="h-5 w-5" /> });
    if (isOffered("card")) methods.push({ key: "card", label: "Cartão de crédito", sub: "Em até 12x", icon: <CreditCard className="h-5 w-5" /> });
    if (isOffered("boleto")) methods.push({ key: "boleto", label: "Boleto", sub: "Aprovação em até 2 dias úteis", icon: <Ticket className="h-5 w-5" /> });

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {methods.map((m) => {
            const active = method === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setMethod(m.key);
                  setErrors({});
                }}
                aria-pressed={active}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                style={{
                  borderRadius: c.layout.radius * 0.6,
                  border: `1.5px solid ${active ? col.primary : col.border}`,
                  background: active ? `${col.primary}0d` : "transparent",
                }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: active ? col.primary : `${col.primary}14`, color: active ? "#fff" : col.primary }}>
                  {m.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold" style={{ color: active ? col.primary : col.text }}>
                    {m.label}
                  </span>
                  <span className="block text-[11px]" style={{ color: col.textMuted }}>
                    {m.sub}
                  </span>
                </span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ border: `1.5px solid ${active ? col.primary : col.border}` }}>
                  {active ? <span className="h-2 w-2 rounded-full" style={{ background: col.primary }} /> : null}
                </span>
              </button>
            );
          })}
          {methods.length === 0 ? (
            <p className="text-[12px]" style={{ color: col.textMuted }}>
              {live
                ? "Pagamento online indisponível no momento. Tente novamente mais tarde."
                : "Nenhum método ativo. Ative ao menos um na seção Pagamento."}
            </p>
          ) : null}
        </div>

        {method === "card" ? (live && cardSlot ? cardSlot : FieldGrid(cardFields)) : null}
        {method === "boleto" && boletoFields.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px]" style={{ color: col.textMuted }}>
              Para gerar o boleto precisamos do seu documento e endereço.
            </p>
            {FieldGrid(boletoFields)}
          </div>
        ) : null}
        {method === "boleto" && live ? (
          <p
            className="rounded-lg px-3 py-2.5 text-[12px]"
            style={{ background: `${col.text}08`, color: col.textMuted, borderRadius: c.layout.radius * 0.6 }}
          >
            O boleto é gerado ao finalizar a compra e vence em 3 dias úteis.
          </p>
        ) : null}
        {method === "pix" && live && methods.length > 0 ? (
          <p className="rounded-lg px-3 py-2.5 text-[12px]" style={{ background: `${col.text}08`, color: col.textMuted, borderRadius: c.layout.radius * 0.6 }}>
            O QR Code Pix é gerado ao finalizar a compra.
          </p>
        ) : null}
        {method === "pix" && !live ? (
          <div className="flex flex-col items-center gap-2 rounded-lg py-4" style={{ border: `1px dashed ${col.border}`, borderRadius: c.layout.radius * 0.6 }}>
            <div className="grid h-24 w-24 place-items-center rounded-md" style={{ background: `${col.text}0d` }}>
              <PixIcon className="h-10 w-10" />
            </div>
            <p className="text-[11.5px]" style={{ color: col.textMuted }}>
              QR Code de demonstração — não gera cobrança real.
            </p>
          </div>
        ) : null}
        {method === "boleto" && !live ? (
          <p className="rounded-lg px-3 py-2.5 text-[12px]" style={{ background: `${col.text}08`, color: col.textMuted, borderRadius: c.layout.radius * 0.6 }}>
            O boleto seria gerado após a confirmação. Demonstração — sem cobrança real.
          </p>
        ) : null}
      </div>
    );
  }

  function FieldGrid(fields: RuntimeField[]) {
    if (fields.length === 0) return null;
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {fields.map((f) => {
          const err = errors[f.id];
          return (
            <div key={f.id} className={cn("space-y-1", !f.half && "col-span-2")}>
              <label className="block text-[12px] font-semibold" style={{ color: col.text }}>
                {f.label}
                {f.required ? " *" : ""}
              </label>
              <input
                value={values[f.id] ?? ""}
                type={f.type ?? "text"}
                inputMode={f.type === "tel" ? "numeric" : f.type === "email" ? "email" : undefined}
                placeholder={f.placeholder}
                onChange={(e) => setValue(f.id, f.mask ? f.mask(e.target.value) : e.target.value)}
                className="h-10 w-full px-3 text-[13px] outline-none"
                style={{
                  borderRadius: c.layout.radius * 0.6,
                  border: `1.5px solid ${err ? col.error : col.border}`,
                  background: col.surface,
                  color: col.text,
                }}
              />
              {err ? (
                <p className="text-[11px] font-medium" style={{ color: col.error }}>
                  {err}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }
}

/* ───────────────────────── seções decorativas ───────────────────────── */

function TestBanner({ col }: { col: CheckoutConfig["colors"] }) {
  return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-[11.5px] font-medium" style={{ background: `${col.warning}1f`, color: col.warning }}>
      <FlaskConical className="h-3.5 w-3.5" />
      Modo de teste — os dados preenchidos aqui são apenas para simulação.
    </div>
  );
}

function NoticeBar({ config: c }: { config: CheckoutConfig }) {
  const [i, setI] = useState(0);
  const messages = c.notice.messages;
  useEffect(() => {
    if (!c.notice.enabled || messages.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % messages.length), 3500);
    return () => clearInterval(t);
  }, [c.notice.enabled, messages.length]);

  if (!c.notice.enabled || messages.length === 0) return null;
  const size = c.notice.size === "lg" ? 13.5 : c.notice.size === "md" ? 12.5 : 11.5;
  const msg = messages[i % messages.length];
  return (
    <div className={cn("flex items-center gap-1.5 px-4 py-2", alignItems(c.notice.align))} style={{ background: c.notice.background, color: c.notice.textColor, fontSize: size }}>
      {c.notice.icon ? <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-80" /> : null}
      <span className="font-medium">{msg?.text}</span>
    </div>
  );
}

function Banner({ config: c, device }: { config: CheckoutConfig; device: Device }) {
  if (!c.banner.enabled) return null;
  const url = device === "mobile" && c.banner.mobileUrl ? c.banner.mobileUrl : c.banner.desktopUrl;
  const objectFit: CSSProperties["objectFit"] = c.banner.fit === "contain" ? "contain" : c.banner.fit === "original" ? "none" : "cover";
  return (
    <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: c.banner.spacing, paddingBottom: 0 }}>
      <div
        className="mx-auto flex items-center justify-center overflow-hidden"
        style={{ maxWidth: device === "mobile" ? "100%" : c.layout.width, height: c.banner.height, borderRadius: c.banner.radius, background: `${c.colors.primary}12` }}
      >
        {url ? (
          <img src={url || "/placeholder.svg"} alt="Banner" className="h-full w-full" style={{ objectFit, objectPosition: c.banner.position }} />
        ) : (
          <span className="text-[12px]" style={{ color: c.colors.textMuted }}>
            Banner ({device === "mobile" ? "mobile" : "desktop"})
          </span>
        )}
      </div>
    </div>
  );
}

function Header({ config: c, device }: { config: CheckoutConfig; device: Device }) {
  const h = c.header;
  const width = device === "mobile" ? h.logoWidthMobile : h.logoWidthDesktop;
  return (
    <div className="space-y-2 rounded-xl px-4 py-3" style={{ background: h.background, color: h.textColor, borderRadius: c.layout.radius }}>
      <div className={cn("flex items-center gap-2", alignItems(h.logoAlign))}>
        {h.logoUrl ? (
          <img src={h.logoUrl || "/placeholder.svg"} alt={h.storeName} className="h-auto object-contain" style={{ maxWidth: width, maxHeight: 56 }} />
        ) : h.showStoreName ? (
          <span style={{ fontSize: c.typography.headingSize, fontWeight: c.typography.headingWeight }}>{h.storeName}</span>
        ) : (
          <span className="opacity-40" style={{ fontSize: 13 }}>
            Sua logo aqui
          </span>
        )}
      </div>
      {h.secureEnabled ? (
        <div className={cn("flex items-center gap-1.5", alignItems(h.secureAlign))}>
          <Lock style={{ color: h.secureColor, height: h.secureSize === "md" ? 14 : 12, width: h.secureSize === "md" ? 14 : 12 }} />
          <span style={{ color: h.secureColor, fontSize: h.secureSize === "md" ? 12.5 : 11, fontWeight: 500 }}>{h.secureText}</span>
        </div>
      ) : null}
    </div>
  );
}

function DividerLine({ config: c }: { config: CheckoutConfig }) {
  return (
    <div style={{ paddingTop: c.divider.spacingTop, paddingBottom: c.divider.spacingBottom }}>
      <div style={{ height: c.divider.thickness, background: c.divider.color, opacity: c.divider.opacity / 100 }} />
    </div>
  );
}

function Scarcity({ config: c }: { config: CheckoutConfig }) {
  const seconds = c.scarcity.duration * 60;
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const t = setInterval(() => setLeft((v) => (v <= 1 ? seconds : v - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const tint = c.scarcity.color;

  if (c.scarcity.style === "badge") {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${tint}1f`, color: tint }}>
          <Timer className="h-3.5 w-3.5" /> {c.scarcity.text} {mm}:{ss}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold" style={{ background: `${tint}1f`, color: tint, borderRadius: c.layout.radius * 0.6 }}>
      <Timer className="h-4 w-4" /> {c.scarcity.text} <span className="tabular-nums">{mm}:{ss}</span>
    </div>
  );
}

function Steps({ config: c, device, current }: { config: CheckoutConfig; device: Device; current: number }) {
  const items = resolveSteps(c);
  if (items.length === 0) return null;
  const primary = c.colors.primary;
  const muted = c.colors.textMuted;
  const line = c.colors.border;
  const mobile = device === "mobile";

  if (c.steps.style === "line") {
    return (
      <div className="space-y-2">
        {c.steps.showProgress ? (
          <div className="flex items-center gap-1.5">
            {items.map((s, i) => (
              <div key={s.key} className="flex flex-1 flex-col gap-1.5">
                <span className="h-1.5 w-full rounded-full" style={{ background: i <= current ? primary : line }} />
                {!mobile ? (
                  <span className="text-[11px] font-medium" style={{ color: i === current ? primary : muted }}>
                    {c.steps.showNumbers ? `${i + 1}. ` : ""}
                    {s.label}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <StepChips items={items} current={current} config={c} mobile={mobile} />
        )}
        {mobile && c.steps.showProgress ? (
          <p className="text-[11.5px] font-semibold" style={{ color: primary }}>
            {current + 1}/{items.length} · {items[current]?.label}
          </p>
        ) : null}
      </div>
    );
  }

  return <StepChips items={items} current={current} config={c} mobile={mobile} />;
}

function StepChips({ items, current, config: c, mobile }: { items: StepItem[]; current: number; config: CheckoutConfig; mobile: boolean }) {
  const primary = c.colors.primary;
  const muted = c.colors.textMuted;
  const line = c.colors.border;
  const numbered = c.steps.style === "numbered" || c.steps.showNumbers;
  const compact = c.steps.style === "compact";
  return (
    <div className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")}>
      {items.map((s, i) => {
        const active = i === current;
        const done = i < current;
        const Icon = STEP_CHIP_ICONS[s.icon] ?? Check;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold"
                style={{ background: active || done ? primary : "transparent", color: active || done ? "#fff" : muted, border: active || done ? "none" : `1.5px solid ${line}` }}
              >
                {done ? <Check className="h-3 w-3" /> : numbered ? i + 1 : <Icon className="h-3 w-3" />}
              </span>
              {!compact ? (
                <span className={cn("text-[11.5px] font-medium", mobile && !active && "hidden sm:inline")} style={{ color: active ? primary : muted }}>
                  {s.label}
                </span>
              ) : null}
            </div>
            {i < items.length - 1 ? (
              <span className="text-[11px]" style={{ color: muted }}>
                ›
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Product({ config: c }: { config: CheckoutConfig }) {
  const p = c.product;
  const col = c.colors;
  const discount = p.showDiscount && p.compareAt && p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  return (
    <div className="flex gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden" style={{ borderRadius: c.layout.radius * 0.7, background: `${col.primary}1a`, color: col.primary }}>
        {p.image ? <img src={p.image || "/placeholder.svg"} alt={p.title} className="h-full w-full object-cover" /> : <Sparkles className="h-6 w-6" />}
      </div>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: c.typography.bodySize + 1, fontWeight: 600 }}>{p.title}</p>
        <p className="mt-0.5 leading-snug" style={{ color: col.textMuted, fontSize: c.typography.bodySize - 1 }}>
          {p.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span style={{ fontSize: c.typography.bodySize + 3, fontWeight: 700 }}>{brl(p.price)}</span>
          {p.showCompare && p.compareAt ? (
            <span className="line-through" style={{ color: col.textMuted, fontSize: c.typography.bodySize - 1 }}>
              {brl(p.compareAt)}
            </span>
          ) : null}
          {discount > 0 ? (
            <span className="rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold" style={{ background: `${col.success}1f`, color: col.success }}>
              -{discount}%
            </span>
          ) : null}
        </div>
        {p.showQuantity ? (
          <div className="mt-2 inline-flex items-center gap-3 px-2 py-1 text-[12px]" style={{ border: `1px solid ${col.border}`, borderRadius: c.layout.radius * 0.5 }}>
            <span style={{ color: col.textMuted }}>−</span>
            <span className="font-medium">1</span>
            <span style={{ color: col.textMuted }}>+</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SocialProof({ config: c }: { config: CheckoutConfig }) {
  const items = c.social.testimonials;
  const col = c.colors;
  if (items.length === 0) return null;

  const Stars = ({ n }: { n: number }) =>
    c.social.showStars ? (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5" style={{ color: c.colors.warning, fill: i < n ? c.colors.warning : "transparent" }} />
        ))}
      </div>
    ) : null;

  if (c.social.layout === "rating") {
    const avg = Math.round(items.reduce((s, t) => s + t.rating, 0) / items.length);
    return (
      <div className="flex items-center gap-2.5">
        <Stars n={avg} />
        <span className="text-[12.5px] font-medium">
          {avg}.0 · {items.length} {items.length === 1 ? "avaliação" : "avaliações"}
        </span>
      </div>
    );
  }

  if (c.social.layout === "list") {
    return (
      <div className="space-y-2.5">
        {items.map((t) => (
          <div key={t.id} className="flex items-start gap-2.5">
            {c.social.showPhoto ? <Avatar name={t.name} primary={col.primary} /> : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[12.5px] font-semibold">{t.name}</p>
                <Stars n={t.rating} />
              </div>
              <p className="text-[12px] leading-snug" style={{ color: col.textMuted }}>
                {t.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((t) => (
        <div key={t.id} className="p-3" style={{ borderRadius: c.layout.radius * 0.7, border: `1px solid ${col.border}` }}>
          <div className="flex items-center gap-2.5">
            {c.social.showPhoto ? <Avatar name={t.name} primary={col.primary} /> : null}
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold">{t.name}</p>
              <Stars n={t.rating} />
            </div>
          </div>
          <p className="mt-2 text-[12.5px] leading-snug" style={{ color: col.textMuted }}>
            “{t.text}”
          </p>
        </div>
      ))}
    </div>
  );
}

function Avatar({ name, primary }: { name: string; primary: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: `${primary}1f`, color: primary }}>
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

function Coupon({ config: c }: { config: CheckoutConfig }) {
  const col = c.colors;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div
          className="flex h-10 items-center px-3"
          style={{ borderRadius: c.layout.radius * 0.6, border: `1px solid ${col.border}`, background: `${col.text}05`, color: col.textMuted, fontSize: c.typography.labelSize }}
        >
          Tem um cupom de desconto?
        </div>
      </div>
      <div className="flex h-10 items-center gap-1.5 px-3 text-[12.5px] font-medium" style={{ borderRadius: c.layout.radius * 0.6, border: `1px solid ${col.border}` }}>
        <Ticket className="h-3.5 w-3.5" /> Aplicar
      </div>
    </div>
  );
}

function Summary({ config: c }: { config: CheckoutConfig }) {
  const col = c.colors;
  const p = c.product;
  const total = p.price;
  return (
    <>
      <div className="space-y-1.5 text-[12.5px]" style={{ color: col.textMuted }}>
        <div className="flex justify-between">
          <span>{p.title}</span>
          <span>{brl(p.price)}</span>
        </div>
        {p.showCompare && p.compareAt && p.compareAt > p.price ? (
          <div className="flex justify-between">
            <span>Desconto</span>
            <span style={{ color: col.success }}>-{brl(p.compareAt - p.price)}</span>
          </div>
        ) : null}
      </div>
      <div className="flex items-end justify-between pt-2" style={{ borderTop: `1px solid ${col.border}` }}>
        <span className="text-[13px] font-bold">Total</span>
        <div className="text-right">
          <span className="text-[15px] font-bold">{brl(total)}</span>
          {c.summary.installmentsEnabled ? (
            <p className="text-[11px]" style={{ color: col.textMuted }}>
              ou 12x de {brl(total / 12)}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Security({ config: c }: { config: CheckoutConfig }) {
  const items = c.security.items.filter((i) => i.enabled);
  if (items.length === 0) return null;
  const color = c.security.color;
  const fontSize = c.security.size === "md" ? 12.5 : 11;

  if (c.security.style === "inline") {
    return (
      <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", alignItems(c.security.align))} style={{ color: c.colors.textMuted, fontSize, textAlign: textAlign(c.security.align) }}>
        {items.map((it, idx) => (
          <span key={it.id} className="inline-flex items-center gap-1">
            <SecurityGlyph item={it} color={color} />
            {it.label}
            {idx < items.length - 1 ? <span className="mx-1 opacity-40">·</span> : null}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", alignItems(c.security.align))}>
      {items.map((it) => (
        <span key={it.id} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium" style={{ background: `${color}14`, color, fontSize }}>
          <SecurityGlyph item={it} color={color} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function SecurityGlyph({ item, color }: { item: SecurityItem; color: string }) {
  const Icon = SECURITY_ICONS[item.icon] ?? ShieldCheck;
  return <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />;
}

function Footer({ config: c }: { config: CheckoutConfig }) {
  return (
    <div className="space-y-1.5 pt-1" style={{ color: c.footer.color, textAlign: textAlign(c.footer.align) }}>
      {c.footer.showLinks ? (
        <div className={cn("flex flex-wrap gap-x-4 gap-y-1", alignItems(c.footer.align))}>
          <span className="text-[11.5px] underline underline-offset-2">{c.footer.privacyLabel}</span>
          <span className="text-[11.5px] underline underline-offset-2">{c.footer.termsLabel}</span>
        </div>
      ) : null}
      <p className="text-[11px]">{c.footer.text}</p>
    </div>
  );
}

function LiveToast({ config: c, showPreviewTag = true }: { config: CheckoutConfig; showPreviewTag?: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const cycle = setInterval(
      () => {
        setVisible(false);
        setTimeout(() => setVisible(true), 600);
      },
      Math.max(c.live.interval, c.live.duration + 1) * 1000,
    );
    return () => clearInterval(cycle);
  }, [c.live.interval, c.live.duration]);

  const pos = c.live.position;
  const phrase = c.live.customPhrase.trim() || c.live.phrase;
  const floating = c.live.floating !== false;

  const card = (
    <div className="flex items-center gap-2.5 rounded-xl p-2.5 shadow-[var(--shadow-lift)]" style={{ background: c.colors.surface, border: `1px solid ${c.colors.border}`, color: c.colors.text }}>
      {c.live.showAvatar ? <Avatar name={c.live.name} primary={c.colors.primary} /> : null}
      <div className="min-w-0">
        <p className="text-[11.5px] leading-tight">
          <span className="font-semibold">{c.live.name}</span> {phrase} <span className="font-semibold">{c.live.product}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10.5px]" style={{ color: c.colors.textMuted }}>
          {c.live.showLocation ? (
            <>
              <MapPin className="h-3 w-3" /> {c.live.location} ·{" "}
            </>
          ) : null}
          <span>agora mesmo</span>
        </p>
      </div>
    </div>
  );

  if (!floating) {
    return (
      <div className={cn("px-4 pb-2 transition-opacity duration-500 motion-reduce:transition-none", visible ? "opacity-100" : "opacity-0")}>
        {card}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 max-w-[240px] transition-all duration-500 motion-reduce:transition-none",
        pos.includes("bottom") ? "bottom-3" : "top-3",
        pos.includes("left") ? "left-3" : "right-3",
        visible ? "translate-y-0 opacity-100" : (pos.includes("bottom") ? "translate-y-2" : "-translate-y-2") + " opacity-0",
      )}
    >
      {card}
      {showPreviewTag ? (
        <span className="mt-1 block text-center text-[9px] font-medium uppercase tracking-wide" style={{ color: c.colors.textMuted }}>
          Prévia
        </span>
      ) : null}
    </div>
  );
}
