import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, Check, CheckCircle2, CreditCard, FlaskConical, Lock, Ticket, Truck, User } from "lucide-react";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { PixIcon } from "@/components/pavox/builder/pix-icon";
import {
  ADDRESS_FIELDS,
  CUSTOMER_FIELDS,
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
  type CheckoutConfig,
  type Device,
  type FieldKey,
  type StepKey,
} from "@/lib/checkout-builder";

/**
 * Checkout interativo de simulação.
 *
 * Renderiza o checkout com estado real (campos, etapas, validações, PF/PJ e
 * pagamento) usando a MESMA configuração do Builder. É 100% local: nada aqui
 * cria cliente, pedido, venda, pagamento, webhook, automação ou analytics.
 * Serve apenas para o lojista testar o comportamento antes de publicar.
 */

type Mode = "pf" | "pj";

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

const STEP_ICONS: Record<StepKey, typeof User> = {
  identificacao: User,
  entrega: Truck,
  pagamento: CreditCard,
};

const email = (v: string) => (isValidEmail(v) ? null : "E-mail inválido");
const phone = (v: string) => (isValidPhone(v) ? null : "Telefone inválido");
const cpf = (v: string) => (isValidCPF(v) ? null : "CPF inválido");
const cnpj = (v: string) => (isValidCNPJ(v) ? null : "CNPJ inválido");
const cep = (v: string) => (isValidCEP(v) ? null : "CEP inválido");

const PF_META: Record<FieldKey, Omit<RuntimeField, "required">> = {
  name: { id: "name", label: "Nome completo", placeholder: "Digite seu nome completo" },
  email: { id: "email", label: "E-mail", placeholder: "Digite seu e-mail", type: "email", validate: email },
  phone: { id: "phone", label: "Celular/WhatsApp", placeholder: "(00) 00000-0000", type: "tel", mask: maskPhone, validate: phone },
  doc: { id: "doc", label: "CPF", placeholder: "000.000.000-00", mask: maskCPF, validate: cpf },
  zip: { id: "zip", label: "CEP", placeholder: "00000-000", mask: maskCEP, validate: cep },
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

type Props = {
  config: CheckoutConfig;
  device: Device;
};

export function CheckoutRuntime({ config, device }: Props) {
  const c = config;
  const col = c.colors;
  const steps = useMemo(() => resolveSteps(c), [c]);
  const stepped = c.steps.enabled && steps.length > 1;
  const mobile = device === "mobile";

  const [mode, setMode] = useState<Mode>("pf");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [method, setMethod] = useState<string>(c.payment.pix ? "pix" : c.payment.card ? "card" : "boleto");
  const [shipping, setShipping] = useState(SHIPPING[0]!.id);
  const [finished, setFinished] = useState(false);

  const identityFields = useMemo<RuntimeField[]>(() => {
    if (mode === "pj") {
      return [
        { id: "razao", label: "Razão social", placeholder: "Nome registrado da empresa", required: true },
        { id: "fantasia", label: "Nome fantasia (opcional)", placeholder: "Nome comercial", required: false },
        { id: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00", mask: maskCNPJ, validate: cnpj, required: true },
        { id: "email", label: "E-mail", placeholder: "Digite seu e-mail", type: "email", validate: email, required: true },
        { id: "phone", label: "Celular/WhatsApp", placeholder: "(00) 00000-0000", type: "tel", mask: maskPhone, validate: phone, required: c.fields.required.includes("phone") },
      ];
    }
    return CUSTOMER_FIELDS.filter((f) => c.fields.customer.includes(f)).map((f) => ({
      ...PF_META[f],
      required: c.fields.required.includes(f),
    }));
  }, [mode, c.fields.customer, c.fields.required]);

  const addressFields = useMemo<RuntimeField[]>(
    () =>
      ADDRESS_FIELDS.filter((f) => c.fields.address.includes(f)).map((f) => ({
        ...PF_META[f],
        required: c.fields.required.includes(f),
      })),
    [c.fields.address, c.fields.required],
  );

  const cardFields = method === "card" ? CARD_FIELDS : [];

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

  function fieldsForStep(key: StepKey): RuntimeField[] {
    if (key === "identificacao") return identityFields;
    if (key === "entrega") return addressFields;
    if (key === "pagamento") return cardFields;
    return [];
  }

  const allFields = useMemo(
    () => steps.flatMap((s) => fieldsForStep(s.key)),
    [steps, identityFields, addressFields, cardFields],
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
    const toCheck = stepped ? fieldsForStep(steps[stepIndex]!.key) : allFields;
    const next = validate(toCheck);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (!stepped || stepIndex >= steps.length - 1) {
      setFinished(true);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function reset() {
    setValues({});
    setErrors({});
    setStepIndex(0);
    setMode("pf");
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="min-h-[420px] w-full" style={rootStyle}>
        <TestBanner col={col} />
        <div className="flex min-h-[380px] items-center justify-center px-4 py-10">
          <div className="w-full max-w-[420px] p-6 text-center" style={cardStyle}>
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: `${col.success}1f`, color: col.success }}
            >
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="mt-4 text-[16px] font-bold">Compra simulada com sucesso</p>
            <p className="mt-1.5 text-[13px]" style={{ color: col.textMuted }}>
              Este é apenas um teste — nenhum pedido, pagamento ou cliente foi criado.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg text-[14px] font-semibold text-white transition-transform active:scale-[0.99]"
              style={{ background: col.button, borderRadius: c.button.radius }}
            >
              Recomeçar teste
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = steps[stepIndex];

  return (
    <div className="min-h-[420px] w-full" style={rootStyle}>
      <TestBanner col={col} />

      <div className="px-4 py-4" style={{ fontSize: c.typography.bodySize }}>
        <div className="mx-auto flex flex-col gap-4" style={{ maxWidth: mobile ? "100%" : c.layout.width }}>
          {/* cabeçalho */}
          <div
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3"
            style={{ background: c.header.background, color: c.header.textColor, borderRadius: c.layout.radius }}
          >
            {c.header.logoUrl ? (
              <img src={c.header.logoUrl || "/placeholder.svg"} alt={c.header.storeName} className="h-auto object-contain" style={{ maxWidth: 150, maxHeight: 44 }} />
            ) : (
              <span style={{ fontSize: c.typography.headingSize, fontWeight: c.typography.headingWeight }}>{c.header.storeName}</span>
            )}
          </div>

          {/* stepper (apenas etapas) */}
          {stepped ? <Stepper steps={steps} current={stepIndex} col={col} /> : null}

          {/* card do produto */}
          <div className="flex gap-3 p-4" style={cardStyle}>
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden"
              style={{ borderRadius: c.layout.radius * 0.7, background: `${col.primary}1a`, color: col.primary }}
            >
              {c.product.image ? (
                <img src={c.product.image || "/placeholder.svg"} alt={c.product.title} className="h-full w-full object-cover" />
              ) : (
                <FlaskConical className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">{c.product.title}</p>
              <p className="mt-1 text-[15px] font-bold">{brl(c.product.price)}</p>
            </div>
          </div>

          {/* corpo — etapas ou página única */}
          <div className="space-y-4 p-4" style={cardStyle}>
            {stepped && current ? (
              <StepBody
                stepKey={current.key}
                index={stepIndex}
                total={steps.length}
                label={current.label}
              />
            ) : (
              steps.map((s, i) => <StepBody key={s.key} stepKey={s.key} index={i} total={steps.length} label={s.label} sectioned />)
            )}

            {/* navegação */}
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
                className={cn("inline-flex items-center justify-center gap-2 px-6 text-white transition-transform active:scale-[0.99]", c.button.full && "flex-1")}
                style={{
                  height: c.button.height,
                  borderRadius: c.button.radius,
                  background: col.button,
                  fontSize: c.typography.buttonSize,
                  fontWeight: c.typography.buttonWeight,
                }}
              >
                {c.button.icon ? <Lock className="h-4 w-4" /> : null}
                {primaryLabel()}
              </button>
            </div>
          </div>

          {/* total */}
          {c.summary.enabled ? (
            <div className="flex items-center justify-between p-4" style={cardStyle}>
              <span className="text-[13px] font-bold">Total</span>
              <span className="text-[15px] font-bold">{brl(c.product.price)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  function primaryLabel() {
    if (!stepped || stepIndex >= steps.length - 1) return c.button.label;
    const next = steps[stepIndex + 1];
    return `Continuar para ${(next?.label ?? "").toLowerCase()}`;
  }

  /* ── corpo de uma etapa ── */
  function StepBody({
    stepKey,
    index,
    total,
    label,
    sectioned,
  }: {
    stepKey: StepKey;
    index: number;
    total: number;
    label: string;
    sectioned?: boolean;
  }) {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: col.primary }}
            >
              {index + 1}
            </span>
            <div>
              <p className="text-[15px] font-bold leading-tight">{label}</p>
            </div>
          </div>
          {!sectioned ? (
            <span className="text-[12px] font-medium" style={{ color: col.textMuted }}>
              {index + 1} de {total}
            </span>
          ) : null}
        </div>

        {stepKey === "identificacao" ? <Identification /> : null}
        {stepKey === "entrega" ? <Delivery /> : null}
        {stepKey === "pagamento" ? <Payment /> : null}
      </div>
    );
  }

  /* ── identificação ── */
  function Identification() {
    return (
      <div className="space-y-3">
        {c.identification.allowCNPJ ? (
          <div className="grid grid-cols-2 gap-1 rounded-lg p-1" style={{ background: `${col.text}0a`, borderRadius: c.layout.radius * 0.6 }}>
            {(["pf", "pj"] as Mode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setErrors({});
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-md py-2 text-[12.5px] font-semibold transition-colors"
                  style={{
                    background: active ? col.surface : "transparent",
                    color: active ? col.text : col.textMuted,
                    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {m === "pf" ? <User className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                  {m === "pf" ? "Pessoa física" : "Pessoa jurídica"}
                </button>
              );
            })}
          </div>
        ) : null}

        <FieldGrid fields={identityFields} />

        {c.payment.pix ? (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px]"
            style={{ background: `${col.text}08`, borderRadius: c.layout.radius * 0.6 }}
          >
            <PixIcon className="h-4 w-4 shrink-0" />
            <span>
              Você ganhou <strong style={{ color: col.success }}>1% de desconto</strong> pagando com Pix
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  /* ── entrega (somente físico) ── */
  function Delivery() {
    return (
      <div className="space-y-3">
        <FieldGrid fields={addressFields} />
        <div className="space-y-2">
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
        </div>
      </div>
    );
  }

  /* ── pagamento ── */
  function Payment() {
    const methods: { key: string; label: string; sub: string; icon: ReactNode }[] = [];
    if (c.payment.pix) methods.push({ key: "pix", label: "PIX", sub: "Pagamento instantâneo", icon: <PixIcon className="h-5 w-5" /> });
    if (c.payment.card) methods.push({ key: "card", label: "Cartão de crédito", sub: "Em até 12x", icon: <CreditCard className="h-5 w-5" /> });
    if (c.payment.boleto) methods.push({ key: "boleto", label: "Boleto", sub: "Compensa em 1 dia útil", icon: <Ticket className="h-5 w-5" /> });

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
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                style={{
                  borderRadius: c.layout.radius * 0.6,
                  border: `1.5px solid ${active ? col.primary : col.border}`,
                  background: active ? `${col.primary}0d` : "transparent",
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: active ? col.primary : `${col.primary}14`, color: active ? "#fff" : col.primary }}
                >
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
              </button>
            );
          })}
          {methods.length === 0 ? (
            <p className="text-[12px]" style={{ color: col.textMuted }}>
              Nenhum método de pagamento ativo.
            </p>
          ) : null}
        </div>

        {method === "card" ? <FieldGrid fields={cardFields} /> : null}
        {method === "pix" ? (
          <div className="flex flex-col items-center gap-2 rounded-lg py-4" style={{ border: `1px dashed ${col.border}`, borderRadius: c.layout.radius * 0.6 }}>
            <div className="grid h-24 w-24 place-items-center rounded-md" style={{ background: `${col.text}0d` }}>
              <PixIcon className="h-10 w-10" />
            </div>
            <p className="text-[11.5px]" style={{ color: col.textMuted }}>
              QR Code de simulação — não gera cobrança real.
            </p>
          </div>
        ) : null}
        {method === "boleto" ? (
          <p className="rounded-lg px-3 py-2.5 text-[12px]" style={{ background: `${col.text}08`, color: col.textMuted, borderRadius: c.layout.radius * 0.6 }}>
            O boleto seria gerado após a confirmação. Simulação — sem cobrança real.
          </p>
        ) : null}
      </div>
    );
  }

  /* ── grid de campos ── */
  function FieldGrid({ fields }: { fields: RuntimeField[] }) {
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

function Stepper({ steps, current, col }: { steps: ReturnType<typeof resolveSteps>; current: number; col: CheckoutConfig["colors"] }) {
  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        const Icon = STEP_ICONS[s.key] ?? User;
        return (
          <div key={s.key} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: active || done ? col.primary : `${col.text}0d`,
                  color: active || done ? "#fff" : col.textMuted,
                }}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: active ? col.text : col.textMuted }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span className="mx-1 mb-5 h-0.5 flex-1 rounded-full" style={{ background: done ? col.primary : col.border }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function TestBanner({ col }: { col: CheckoutConfig["colors"] }) {
  return (
    <div
      className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-[11.5px] font-medium"
      style={{ background: `${col.warning}1f`, color: col.warning }}
    >
      <FlaskConical className="h-3.5 w-3.5" />
      Modo de teste — os dados preenchidos aqui são apenas para simulação.
    </div>
  );
}
