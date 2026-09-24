import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  BadgeCheck,
  Check,
  CreditCard,
  Database,
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
  FIELD_LABELS,
  FONT_STACKS,
  resolveSteps,
  type Align,
  type CheckoutConfig,
  type Device,
  type FieldKey,
  type SecurityItem,
  type StepItem,
} from "@/lib/checkout-builder";

const SECURITY_ICONS: Record<string, typeof ShieldCheck> = {
  shield: ShieldCheck,
  lock: Lock,
  database: Database,
  badge: BadgeCheck,
};

const STEP_ICONS: Record<string, typeof User> = {
  user: User,
  truck: Truck,
  card: CreditCard,
  circle: Check,
};

function alignItems(a: Align) {
  return a === "left" ? "justify-start" : a === "right" ? "justify-end" : "justify-center";
}
function textAlign(a: Align): CSSProperties["textAlign"] {
  return a;
}

type Props = {
  config: CheckoutConfig;
  device: Device;
  interactive?: boolean;
};

export function CheckoutPreview({ config, device }: Props) {
  const c = config;
  const col = c.colors;
  const mobile = device === "mobile";

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

  const bodySize = c.typography.bodySize;
  const labelSize = c.typography.labelSize;

  return (
    <div className="relative min-h-[420px] w-full" style={rootStyle}>
      {/* barra de avisos */}
      <NoticeBar config={c} />

      {/* banner */}
      <Banner config={c} device={device} />

      <div className="px-4 py-4" style={{ fontSize: bodySize }}>
        <div
          className="mx-auto flex flex-col gap-4"
          style={{ maxWidth: mobile ? "100%" : c.layout.width }}
        >
          {/* cabeçalho */}
          <Header config={c} device={device} />

          {c.divider.enabled ? <DividerLine config={c} /> : null}

          {/* escassez topo */}
          {c.scarcity.enabled && c.scarcity.position === "top" ? <Scarcity config={c} /> : null}

          {/* etapas */}
          {c.steps.enabled ? <Steps config={c} device={device} /> : null}

          {/* card principal */}
          <div className="p-4" style={cardStyle}>
            <Product config={c} />
          </div>

          {/* prova social */}
          {c.social.enabled ? (
            <div className="p-4" style={cardStyle}>
              <SocialProof config={c} />
            </div>
          ) : null}

          {/* formulário */}
          <div className="space-y-4 p-4" style={cardStyle}>
            {c.summary.couponEnabled && c.summary.couponFirst ? <Coupon config={c} /> : null}
            <FormBlock title="Seus dados" fields={c.fields.customer} required={c.fields.required} config={c} labelSize={labelSize} />
            {c.product.kind === "physical" ? (
              <>
                <FormBlock title="Endereço de entrega" fields={c.fields.address} required={c.fields.required} config={c} labelSize={labelSize} />
                <Shipping config={c} labelSize={labelSize} />
              </>
            ) : null}
            <Payment config={c} />
          </div>

          {/* resumo */}
          {c.summary.enabled ? (
            <div className="space-y-3 p-4" style={cardStyle}>
              <Summary config={c} />
            </div>
          ) : null}

          {/* escassez acima do botão */}
          {c.scarcity.enabled && c.scarcity.position === "above-button" ? <Scarcity config={c} /> : null}

          {/* botão */}
          <CTA config={c} />

          {/* segurança */}
          {c.security.enabled ? <Security config={c} /> : null}

          {/* rodapé */}
          {c.footer.enabled ? <Footer config={c} /> : null}
        </div>
      </div>

      {/* compra ao vivo */}
      {c.live.enabled ? <LiveToast config={c} /> : null}
    </div>
  );
}

/* ───────────────────────── seções ───────────────────────── */

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
    <div
      className={cn("flex items-center gap-1.5 px-4 py-2", alignItems(c.notice.align))}
      style={{ background: c.notice.background, color: c.notice.textColor, fontSize: size }}
    >
      {c.notice.icon ? <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-80" /> : null}
      <span className="font-medium">{msg?.text}</span>
    </div>
  );
}

function Banner({ config: c, device }: { config: CheckoutConfig; device: Device }) {
  if (!c.banner.enabled) return null;
  const url = device === "mobile" && c.banner.mobileUrl ? c.banner.mobileUrl : c.banner.desktopUrl;
  const objectFit: CSSProperties["objectFit"] =
    c.banner.fit === "contain" ? "contain" : c.banner.fit === "original" ? "none" : "cover";
  return (
    <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: c.banner.spacing, paddingBottom: 0 }}>
      <div
        className="mx-auto flex items-center justify-center overflow-hidden"
        style={{
          maxWidth: device === "mobile" ? "100%" : c.layout.width,
          height: c.banner.height,
          borderRadius: c.banner.radius,
          background: `${c.colors.primary}12`,
        }}
      >
        {url ? (
          <img
            src={url || "/placeholder.svg"}
            alt="Banner"
            className="h-full w-full"
            style={{ objectFit, objectPosition: c.banner.position }}
          />
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
    <div
      className="space-y-2 rounded-xl px-4 py-3"
      style={{ background: h.background, color: h.textColor, borderRadius: c.layout.radius }}
    >
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
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${tint}1f`, color: tint }}
        >
          <Timer className="h-3.5 w-3.5" /> {c.scarcity.text} {mm}:{ss}
        </span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold"
      style={{ background: `${tint}1f`, color: tint, borderRadius: c.layout.radius * 0.6 }}
    >
      <Timer className="h-4 w-4" /> {c.scarcity.text} <span className="tabular-nums">{mm}:{ss}</span>
    </div>
  );
}

function Steps({ config: c, device }: { config: CheckoutConfig; device: Device }) {
  const items = resolveSteps(c);
  if (items.length === 0) return null;
  const current = 0;
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

function StepChips({
  items,
  current,
  config: c,
  mobile,
}: {
  items: StepItem[];
  current: number;
  config: CheckoutConfig;
  mobile: boolean;
}) {
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
        const Icon = STEP_ICONS[s.icon] ?? Check;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold"
                style={{
                  background: active || done ? primary : "transparent",
                  color: active || done ? "#fff" : muted,
                  border: active || done ? "none" : `1.5px solid ${line}`,
                }}
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
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden"
        style={{ borderRadius: c.layout.radius * 0.7, background: `${col.primary}1a`, color: col.primary }}
      >
        {p.image ? (
          <img src={p.image || "/placeholder.svg"} alt={p.title} className="h-full w-full object-cover" />
        ) : (
          <Sparkles className="h-6 w-6" />
        )}
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
          <div
            className="mt-2 inline-flex items-center gap-3 px-2 py-1 text-[12px]"
            style={{ border: `1px solid ${col.border}`, borderRadius: c.layout.radius * 0.5 }}
          >
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

  // card
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
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
      style={{ background: `${primary}1f`, color: primary }}
    >
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

function FormBlock({
  title,
  fields,
  required,
  config: c,
  labelSize,
}: {
  title: string;
  fields: FieldKey[];
  required: FieldKey[];
  config: CheckoutConfig;
  labelSize: number;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="font-semibold uppercase tracking-[0.08em]" style={{ color: c.colors.textMuted, fontSize: labelSize - 1 }}>
        {title}
      </p>
      <div className="grid gap-2">
        {fields.map((f) => (
          <Field key={f} label={FIELD_LABELS[f] + (required.includes(f) ? " *" : "")} config={c} />
        ))}
      </div>
    </div>
  );
}

function Field({ label, config: c }: { label: string; config: CheckoutConfig }) {
  return (
    <div
      className="flex h-10 items-center px-3"
      style={{
        borderRadius: c.layout.radius * 0.6,
        border: `1px solid ${c.colors.border}`,
        background: `${c.colors.text}05`,
        color: `${c.colors.textMuted}`,
        fontSize: c.typography.labelSize,
      }}
    >
      {label}
    </div>
  );
}

function Payment({ config: c }: { config: CheckoutConfig }) {
  const col = c.colors;
  const methods: { key: string; label: string; sub: string; icon: ReactNode }[] = [];
  if (c.payment.pix) methods.push({ key: "pix", label: "PIX", sub: "Pagamento instantâneo", icon: <PixIcon className="h-5 w-5" /> });
  if (c.payment.card) methods.push({ key: "card", label: "Cartão de crédito", sub: "Em até 12x", icon: <CreditCard className="h-5 w-5" /> });
  if (c.payment.boleto) methods.push({ key: "boleto", label: "Boleto", sub: "Compensa em 1 dia útil", icon: <Ticket className="h-5 w-5" /> });

  return (
    <div className="space-y-2">
      <p className="font-semibold uppercase tracking-[0.08em]" style={{ color: col.textMuted, fontSize: c.typography.labelSize - 1 }}>
        Pagamento
      </p>
      <div className="grid gap-2">
        {methods.map((m, i) => {
          const active = i === 0;
          return (
            <div
              key={m.key}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{
                borderRadius: c.layout.radius * 0.6,
                border: `1.5px solid ${active ? col.primary : col.border}`,
                background: active ? `${col.primary}0d` : undefined,
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: active ? col.primary : `${col.primary}14`, color: active ? "#fff" : col.primary }}
              >
                {m.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold" style={{ color: active ? col.primary : col.text }}>
                  {m.label}
                </p>
                <p className="text-[11px]" style={{ color: col.textMuted }}>
                  {m.sub}
                </p>
              </div>
              <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ border: `1.5px solid ${active ? col.primary : col.border}` }}>
                {active ? <span className="h-2 w-2 rounded-full" style={{ background: col.primary }} /> : null}
              </span>
            </div>
          );
        })}
        {methods.length === 0 ? (
          <p className="text-[12px]" style={{ color: col.textMuted }}>
            Nenhum método ativo. Ative ao menos um na seção Pagamento.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Shipping({ config: c, labelSize }: { config: CheckoutConfig; labelSize: number }) {
  const col = c.colors;
  const options = [
    { label: "Entrega padrão", eta: "5 a 8 dias úteis", price: "Grátis" },
    { label: "Entrega expressa", eta: "1 a 2 dias úteis", price: brl(24.9) },
  ];
  return (
    <div className="space-y-2">
      <p className="font-semibold uppercase tracking-[0.08em]" style={{ color: col.textMuted, fontSize: labelSize - 1 }}>
        Opções de frete
      </p>
      <div className="grid gap-2">
        {options.map((o, i) => {
          const active = i === 0;
          return (
            <div
              key={o.label}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{
                borderRadius: c.layout.radius * 0.6,
                border: `1.5px solid ${active ? col.primary : col.border}`,
                background: active ? `${col.primary}0d` : undefined,
              }}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ border: `1.5px solid ${active ? col.primary : col.border}` }}>
                {active ? <span className="h-2 w-2 rounded-full" style={{ background: col.primary }} /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold" style={{ color: active ? col.primary : col.text }}>
                  {o.label}
                </p>
                <p className="text-[11px]" style={{ color: col.textMuted }}>
                  {o.eta}
                </p>
              </div>
              <span className="text-[12.5px] font-semibold" style={{ color: o.price === "Grátis" ? col.success : col.text }}>
                {o.price}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Coupon({ config: c }: { config: CheckoutConfig }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Field label="Tem um cupom de desconto?" config={c} />
      </div>
      <div
        className="flex h-10 items-center gap-1.5 px-3 text-[12.5px] font-medium"
        style={{ borderRadius: c.layout.radius * 0.6, border: `1px solid ${c.colors.border}` }}
      >
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
      {c.summary.couponEnabled && !c.summary.couponFirst ? <Coupon config={c} /> : null}
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

function CTA({ config: c }: { config: CheckoutConfig }) {
  return (
    <div className={cn("flex", c.button.full ? "" : "justify-center")}>
      <button
        type="button"
        className={cn("inline-flex items-center justify-center gap-2 px-6 text-white transition-transform active:scale-[0.99]", c.button.full && "w-full")}
        style={{
          height: c.button.height,
          borderRadius: c.button.radius,
          background: c.colors.button,
          fontSize: c.typography.buttonSize,
          fontWeight: c.typography.buttonWeight,
          boxShadow: `0 10px 24px -12px ${c.colors.button}`,
        }}
      >
        {c.button.icon ? <Lock className="h-4 w-4" /> : null}
        {c.button.label}
      </button>
    </div>
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
        <span
          key={it.id}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium"
          style={{ background: `${color}14`, color, fontSize }}
        >
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

function LiveToast({ config: c }: { config: CheckoutConfig }) {
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
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 max-w-[240px] transition-all duration-500",
        pos.includes("bottom") ? "bottom-3" : "top-3",
        pos.includes("left") ? "left-3" : "right-3",
        visible ? "translate-y-0 opacity-100" : (pos.includes("bottom") ? "translate-y-2" : "-translate-y-2") + " opacity-0",
      )}
    >
      <div
        className="flex items-center gap-2.5 rounded-xl p-2.5 shadow-[var(--shadow-lift)]"
        style={{ background: c.colors.surface, border: `1px solid ${c.colors.border}`, color: c.colors.text }}
      >
        {c.live.showAvatar ? <Avatar name={c.live.name} primary={c.colors.primary} /> : null}
        <div className="min-w-0">
          <p className="text-[11.5px] leading-tight">
            <span className="font-semibold">{c.live.name}</span> {phrase}{" "}
            <span className="font-semibold">{c.live.product}</span>
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
      <span className="mt-1 block text-center text-[9px] font-medium uppercase tracking-wide" style={{ color: c.colors.textMuted }}>
        Prévia
      </span>
    </div>
  );
}
