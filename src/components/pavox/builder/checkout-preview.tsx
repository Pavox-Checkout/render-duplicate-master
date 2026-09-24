import { Check, CreditCard, Lock, MapPin, ShieldCheck, Star, Timer, Ticket, Sparkles, User } from "lucide-react";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { PixIcon } from "@/components/pavox/builder/pix-icon";
import {
  BLOCK_LABELS,
  FIELD_LABELS,
  FONT_STACKS,
  type Block,
  type BlockData,
  type BuilderState,
  type Testimonial,
} from "@/lib/checkout-builder";

function isDark(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function alignClass(a?: BlockData["align"]) {
  return a === "left" ? "justify-start" : a === "right" ? "justify-end" : "justify-center";
}

type Ctx = { state: BuilderState; dark: boolean; device: "desktop" | "tablet" | "mobile" };

function Field({ label, dark, radius }: { label: string; dark: boolean; radius: number }) {
  return (
    <div
      className="flex h-10 items-center px-3 text-[12.5px]"
      style={{
        borderRadius: radius * 0.6,
        border: `1px solid ${dark ? "rgba(255,255,255,.14)" : "rgba(15,23,42,.12)"}`,
        background: dark ? "rgba(255,255,255,.04)" : "rgba(15,23,42,.02)",
        color: dark ? "rgba(255,255,255,.5)" : "rgba(15,23,42,.45)",
      }}
    >
      {label}
    </div>
  );
}

function SectionTitle({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <p
      className="text-[11px] font-semibold tracking-[0.1em] uppercase"
      style={{ color: dark ? "rgba(255,255,255,.55)" : "rgba(15,23,42,.5)" }}
    >
      {children}
    </p>
  );
}

/** Cabeçalho de etapas — compacto no mobile. */
function StepsHeader({ d, ctx }: { d: BlockData; ctx: Ctx }) {
  const { state, dark, device } = ctx;
  const a = state.appearance;
  const steps = d.steps ?? [];
  if (!d.stepsEnabled || steps.length === 0) return null;
  const current = 0; // demonstração: primeira etapa ativa
  const mobile = device === "mobile";
  const muted = dark ? "rgba(255,255,255,.55)" : "rgba(15,23,42,.5)";
  const line = dark ? "rgba(255,255,255,.14)" : "rgba(15,23,42,.12)";

  if (d.stepsStyle === "progress") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 flex-col gap-1.5">
              <span
                className="h-1.5 w-full rounded-full transition-colors"
                style={{ background: i <= current ? a.primary : line }}
              />
              {!mobile && (
                <span
                  className="text-[11px] font-medium"
                  style={{ color: i === current ? a.primary : muted }}
                >
                  {d.showNumbers ? `${i + 1}. ` : ""}
                  {s.label}
                </span>
              )}
            </div>
          ))}
        </div>
        {mobile && (
          <p className="text-[11.5px] font-semibold" style={{ color: a.primary }}>
            {d.showNumbers ? `${current + 1}/${steps.length} · ` : ""}
            {steps[current]?.label}
          </p>
        )}
      </div>
    );
  }

  // minimal + numbered compartilham o layout de "chips"
  return (
    <div className={cn("flex items-center", mobile ? "gap-1.5" : "gap-2")}>
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        const numbered = d.stepsStyle === "numbered" || d.showNumbers;
        return (
          <div key={s.id} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              {numbered && (
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold"
                  style={{
                    background: active || done ? a.primary : "transparent",
                    color: active || done ? "#fff" : muted,
                    border: active || done ? "none" : `1.5px solid ${line}`,
                  }}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
              )}
              <span
                className={cn("text-[11.5px] font-medium", mobile && !active && "hidden sm:inline")}
                style={{ color: active ? a.primary : muted }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="text-[11px]" style={{ color: muted }}>
                ›
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SecureBadge({ d, dark }: { d: BlockData; dark: boolean }) {
  if (!d.secureEnabled) return null;
  const color = d.secureColor ?? "#16a34a";
  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        d.secureAlign === "left" ? "justify-start" : d.secureAlign === "right" ? "justify-end" : "justify-center",
      )}
    >
      <Lock className="shrink-0" style={{ color, height: d.secureSize === "md" ? 14 : 12, width: d.secureSize === "md" ? 14 : 12 }} />
      <span
        className="font-medium"
        style={{ color: dark ? "rgba(255,255,255,.7)" : "rgba(15,23,42,.6)", fontSize: d.secureSize === "md" ? 12.5 : 11 }}
      >
        {d.secureText}
      </span>
    </div>
  );
}

function Testimonials({ items, style, ctx }: { items: Testimonial[]; style?: string; ctx: Ctx }) {
  const { dark } = ctx;
  const a = ctx.state.appearance;
  const muted = dark ? "rgba(255,255,255,.6)" : "rgba(15,23,42,.55)";
  const line = dark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.1)";

  const Stars = ({ n }: { n: number }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          style={{ color: "#f59e0b", fill: i < n ? "#f59e0b" : "transparent" }}
        />
      ))}
    </div>
  );

  const Avatar = ({ t }: { t: Testimonial }) => (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
      style={{ background: `${a.primary}1f`, color: a.primary }}
    >
      {t.avatar ? (
        <img src={t.avatar || "/placeholder.svg"} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        (t.name?.[0] ?? "?").toUpperCase()
      )}
    </div>
  );

  if (style === "simple") {
    const t = items[0];
    if (!t) return null;
    return (
      <p className="text-[12.5px] italic" style={{ color: muted }}>
        “{t.text}” — <span className="not-italic font-medium">{t.name}</span>
      </p>
    );
  }

  if (style === "rating") {
    const avg = items.length ? Math.round(items.reduce((s, t) => s + t.rating, 0) / items.length) : 5;
    return (
      <div className="flex items-center gap-2.5">
        <Stars n={avg} />
        <span className="text-[12.5px] font-medium">
          {avg}.0 · {items.length} {items.length === 1 ? "avaliação" : "avaliações"}
        </span>
      </div>
    );
  }

  // card + stacked
  return (
    <div className={cn(style === "stacked" ? "space-y-2" : "")}>
      {(style === "stacked" ? items : items.slice(0, 1)).map((t) => (
        <div
          key={t.id}
          className="p-3"
          style={{ borderRadius: a.radius * 0.7, border: `1px solid ${line}`, background: dark ? "rgba(255,255,255,.03)" : "#fff" }}
        >
          <div className="flex items-center gap-2.5">
            <Avatar t={t} />
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold">{t.name}</p>
              <Stars n={t.rating} />
            </div>
          </div>
          <p className="mt-2 text-[12.5px] leading-snug" style={{ color: muted }}>
            “{t.text}”
          </p>
        </div>
      ))}
    </div>
  );
}

function BlockBody({ block, ctx }: { block: Block; ctx: Ctx }) {
  const { state, dark } = ctx;
  const a = state.appearance;
  const d = block.data;
  const bump = state.blocks.find((b) => b.type === "bump" && b.data.enabled);
  const product = state.blocks.find((b) => b.type === "product");
  const total = (product?.data.price ?? 0) + (bump ? (bump.data.price ?? 0) : 0);
  const muted = dark ? "rgba(255,255,255,.6)" : "rgba(15,23,42,.55)";
  const line = dark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.1)";

  switch (block.type) {
    case "header": {
      const name = d.brandName ?? d.logo ?? "Loja Demo";
      return (
        <div className="space-y-2">
          <div className={cn("flex items-center gap-2", alignClass(d.align))}>
            {d.identity === "logo" && d.logoUrl ? (
              <img
                src={d.logoUrl || "/placeholder.svg"}
                alt={name}
                className="h-auto object-contain"
                style={{ maxWidth: d.logoWidth ?? 120, maxHeight: 56 }}
              />
            ) : (
              <span
                className="leading-none"
                style={{ fontSize: d.size === "lg" ? 24 : d.size === "sm" ? 15 : 19, fontWeight: d.fontWeight ?? 700 }}
              >
                {name}
              </span>
            )}
          </div>
          <SecureBadge d={d} dark={dark} />
        </div>
      );
    }

    case "divider":
      return (
        <div style={{ paddingTop: d.spacingTop ?? 12, paddingBottom: d.spacingBottom ?? 12 }}>
          <div
            style={{
              height: d.thickness ?? 1,
              background: d.color ?? (dark ? "#ffffff" : "#0f172a"),
              opacity: (d.opacity ?? 10) / 100,
            }}
          />
        </div>
      );

    case "steps":
      return <StepsHeader d={d} ctx={ctx} />;

    case "product":
      return (
        <div className="flex gap-3">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden"
            style={{ borderRadius: a.radius * 0.7, background: `${a.primary}1a`, color: a.primary }}
          >
            {d.image ? (
              <img src={d.image || "/placeholder.svg"} alt={d.title} className="h-full w-full object-cover" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">{d.title}</p>
            <p className="mt-0.5 text-[12px] leading-snug" style={{ color: muted }}>
              {d.description}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[16px] font-bold">{brl(d.price ?? 0)}</span>
              {d.showCompare && d.compareAt ? (
                <span className="text-[12px] line-through" style={{ color: muted }}>
                  {brl(d.compareAt)}
                </span>
              ) : null}
              {d.showDiscount && d.compareAt && d.price ? (
                <span
                  className="px-1.5 py-0.5 text-[10.5px] font-semibold"
                  style={{ borderRadius: 999, background: "#16a34a1f", color: "#15803d" }}
                >
                  -{Math.round((1 - d.price / d.compareAt) * 100)}%
                </span>
              ) : null}
            </div>
            {d.showQuantity && (
              <div
                className="mt-2 inline-flex items-center gap-3 px-2 py-1 text-[12px]"
                style={{ border: `1px solid ${line}`, borderRadius: a.radius * 0.5 }}
              >
                <span style={{ color: muted }}>−</span>
                <span className="font-medium">1</span>
                <span style={{ color: muted }}>+</span>
              </div>
            )}
          </div>
        </div>
      );

    case "offer":
      return (
        <div
          className="px-3 py-2 text-center text-[12.5px] font-medium"
          style={{ borderRadius: a.radius * 0.6, background: `${a.primary}14`, color: a.primary }}
        >
          {d.title} — {d.description}
        </div>
      );

    case "customer":
    case "address":
      return (
        <div className="space-y-2">
          <SectionTitle dark={dark}>
            {block.type === "customer" ? "Seus dados" : "Endereço de entrega"}
          </SectionTitle>
          <div className="grid gap-2">
            {(d.fields ?? []).map((f) => (
              <Field
                key={f}
                dark={dark}
                radius={a.radius}
                label={FIELD_LABELS[f] + ((d.required ?? []).includes(f) ? " *" : "")}
              />
            ))}
          </div>
        </div>
      );

    case "payment": {
      const methods: { key: string; label: string; sub: string; icon: React.ReactNode }[] = [];
      if (d.pix)
        methods.push({ key: "pix", label: "PIX", sub: "Pagamento imediato", icon: <PixIcon className="h-5 w-5" /> });
      if (d.card)
        methods.push({ key: "card", label: "Cartão de crédito", sub: "Em até 12x", icon: <CreditCard className="h-5 w-5" /> });
      if (d.boleto)
        methods.push({ key: "boleto", label: "Boleto", sub: "Compensa em 1 dia útil", icon: <Ticket className="h-5 w-5" /> });
      return (
        <div className="space-y-2">
          <SectionTitle dark={dark}>Pagamento</SectionTitle>
          <div className="grid gap-2">
            {methods.map((m, i) => {
              const active = i === 0;
              return (
                <div
                  key={m.key}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{
                    borderRadius: a.radius * 0.6,
                    border: `1.5px solid ${active ? a.primary : line}`,
                    background: active ? `${a.primary}0d` : undefined,
                  }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: active ? a.primary : `${a.primary}14`, color: active ? "#fff" : a.primary }}
                  >
                    {m.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold" style={{ color: active ? a.primary : undefined }}>
                      {m.label}
                    </p>
                    <p className="text-[11px]" style={{ color: muted }}>
                      {m.sub}
                    </p>
                  </div>
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ border: `1.5px solid ${active ? a.primary : line}` }}
                  >
                    {active && <span className="h-2 w-2 rounded-full" style={{ background: a.primary }} />}
                  </span>
                </div>
              );
            })}
            {methods.length === 0 && (
              <p className="text-[12px]" style={{ color: muted }}>
                Nenhum método ativo. Ative ao menos um no painel à direita.
              </p>
            )}
          </div>
        </div>
      );
    }

    case "bump":
      if (!d.enabled) return null;
      return (
        <div
          className="flex items-start gap-3 p-3"
          style={{ borderRadius: a.radius * 0.7, border: `1.5px dashed ${a.primary}`, background: `${a.primary}0d` }}
        >
          <div className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px]" style={{ background: a.primary }} />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold">{d.title}</p>
            <p className="text-[11.5px]" style={{ color: muted }}>
              {d.description}
            </p>
          </div>
          <span className="text-[12.5px] font-semibold">+{brl(d.price ?? 0)}</span>
        </div>
      );

    case "upsell":
      return d.enabled ? (
        <p className="text-center text-[11.5px]" style={{ color: muted }}>
          Após a compra, o cliente verá: {d.title}
        </p>
      ) : null;

    case "coupon":
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Field label={d.title ?? "Cupom"} dark={dark} radius={a.radius} />
          </div>
          <div
            className="flex h-10 items-center gap-1.5 px-3 text-[12.5px] font-medium"
            style={{ borderRadius: a.radius * 0.6, border: `1px solid ${line}` }}
          >
            <Ticket className="h-3.5 w-3.5" /> Aplicar
          </div>
        </div>
      );

    case "countdown":
      return (
        <div
          className="flex items-center justify-center gap-2 py-2 text-[12.5px] font-semibold"
          style={{ borderRadius: a.radius * 0.6, background: "#f59e0b1f", color: "#b45309" }}
        >
          <Timer className="h-4 w-4" /> {d.title} {d.text}
        </div>
      );

    case "social": {
      const items =
        d.testimonials && d.testimonials.length
          ? d.testimonials
          : [{ id: "compat", name: d.author ?? "Cliente verificado", text: d.text ?? "", rating: d.rating ?? 5 }];
      return <Testimonials items={items} style={d.socialStyle ?? "card"} ctx={ctx} />;
    }

    case "live":
      return (
        <LiveCard d={d} ctx={ctx} inline />
      );

    case "summary":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5 text-[12.5px]" style={{ color: muted }}>
            <div className="flex justify-between">
              <span>{product?.data.title ?? "Produto"}</span>
              <span>{brl(product?.data.price ?? 0)}</span>
            </div>
            {bump && (
              <div className="flex justify-between">
                <span>{bump.data.title}</span>
                <span>{brl(bump.data.price ?? 0)}</span>
              </div>
            )}
          </div>
          <div
            className="flex justify-between pt-2 text-[15px] font-bold"
            style={{ borderTop: `1px solid ${line}` }}
          >
            <span>Total</span>
            <span>{brl(total)}</span>
          </div>
          <div className={cn("flex", d.buttonFull ? "" : alignClass(d.align))}>
            <button
              className={cn(
                "group inline-flex items-center justify-center gap-2 px-6 text-[14.5px] font-semibold text-white transition-transform active:scale-[0.99]",
                d.buttonFull && "w-full",
              )}
              style={{
                height: d.buttonHeight ?? 52,
                borderRadius: d.buttonRadius ?? a.radius * 0.75,
                background: d.buttonColor ?? a.button,
                boxShadow: `0 10px 24px -12px ${d.buttonColor ?? a.button}`,
              }}
            >
              {d.buttonIcon && <Lock className="h-4 w-4" />}
              {d.buttonLabel}
            </button>
          </div>
        </div>
      );

    case "guarantee":
      return (
        <div
          className="flex items-start gap-2.5 p-3"
          style={{ borderRadius: a.radius * 0.7, background: dark ? "rgba(255,255,255,.05)" : "#16a34a0f" }}
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#16a34a" }} />
          <div>
            <p className="text-[12.5px] font-semibold">{d.title}</p>
            <p className="text-[11.5px]" style={{ color: muted }}>
              {d.description}
            </p>
          </div>
        </div>
      );

    case "security": {
      const color = d.securityColor ?? "#16a34a";
      const items = (d.text ?? "").split("·").map((s) => s.trim()).filter(Boolean);
      if (d.securityStyle === "inline") {
        return (
          <p
            className={cn("flex flex-wrap items-center gap-1.5", alignClass(d.securityAlign))}
            style={{ color: muted, fontSize: d.securitySize === "md" ? 12 : 11 }}
          >
            <Lock className="h-3 w-3" style={{ color }} /> {d.text}
          </p>
        );
      }
      return (
        <div className={cn("flex flex-wrap gap-2", alignClass(d.securityAlign))}>
          {items.map((it) => (
            <span
              key={it}
              className="inline-flex items-center gap-1.5 px-2.5 py-1"
              style={{
                borderRadius: 999,
                border: `1px solid ${color}33`,
                background: `${color}12`,
                color: dark ? "rgba(255,255,255,.75)" : "#0f172a",
                fontSize: d.securitySize === "md" ? 12 : 11,
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" style={{ color }} /> {it}
            </span>
          ))}
        </div>
      );
    }

    case "footer":
      return (
        <p className="text-center text-[11px]" style={{ color: muted }}>
          {d.text}
        </p>
      );
  }
}

/** Notificação de compra ao vivo — estado demonstrativo (dados reais depois). */
function LiveCard({ d, ctx, inline }: { d: BlockData; ctx: Ctx; inline?: boolean }) {
  const { state, dark } = ctx;
  const a = state.appearance;
  const muted = dark ? "rgba(255,255,255,.6)" : "rgba(15,23,42,.55)";
  const name = d.liveName ?? "Maria";
  return (
    <div
      className={cn("relative flex items-center gap-3 p-2.5 pr-4", inline && "w-full")}
      style={{
        borderRadius: a.radius * 0.8,
        border: `1px solid ${dark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.08)"}`,
        background: dark ? "rgba(255,255,255,.06)" : "#ffffff",
        boxShadow: "0 12px 32px -18px rgba(15,23,42,.4)",
        maxWidth: 300,
      }}
    >
      {d.liveShowAvatar && (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
          style={{ background: `${a.primary}1f`, color: a.primary }}
        >
          {name[0]?.toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[12.5px] leading-snug">
          <span className="font-semibold">{name}</span> {d.livePhrase}
          {d.liveShowProduct && d.liveProduct ? (
            <>
              {" "}
              <span className="font-semibold">{d.liveProduct}</span>
            </>
          ) : null}
        </p>
        {d.liveShowLocation && d.liveLocation && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: muted }}>
            <MapPin className="h-3 w-3" /> {d.liveLocation} · agora
          </p>
        )}
      </div>
      {inline && (
        <span
          className="absolute top-1.5 right-2 rounded px-1.5 py-0.5 text-[8.5px] font-bold tracking-wide uppercase"
          style={{ background: dark ? "rgba(255,255,255,.1)" : "rgba(15,23,42,.06)", color: muted }}
        >
          Demonstração
        </span>
      )}
    </div>
  );
}

export function CheckoutPreview({
  state,
  device = "desktop",
  selectedId,
  onSelect,
  interactive = true,
}: {
  state: BuilderState;
  device?: "desktop" | "tablet" | "mobile";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  interactive?: boolean;
}) {
  const a = state.appearance;
  const dark = isDark(a.background);
  const width = device === "mobile" ? 380 : device === "tablet" ? Math.min(a.width, 620) : a.width;
  const ctx: Ctx = { state, dark, device };

  return (
    <div
      className="w-full py-8"
      style={{ background: a.background, fontFamily: FONT_STACKS[a.font], color: dark ? "#f8fafc" : "#0f172a" }}
    >
      <div className="mx-auto w-full px-4" style={{ maxWidth: width }}>
        <div
          className="overflow-hidden"
          style={{
            borderRadius: a.radius,
            background: dark ? "rgba(255,255,255,.06)" : "#ffffff",
            border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(15,23,42,.08)"}`,
            boxShadow: dark ? "none" : "0 12px 40px -24px rgba(15,23,42,.35)",
          }}
        >
          <div className="h-1 w-full" style={{ background: a.primary }} />
          <div className="space-y-4 p-5 sm:p-6">
            {state.blocks.map((b) => {
              const body = <BlockBody block={b} ctx={ctx} />;
              if (!interactive) return <div key={b.id}>{body}</div>;
              return (
                <div
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect?.(b.id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect?.(b.id)}
                  className={cn(
                    "relative -m-1 cursor-pointer rounded-lg p-1 outline-none transition-all",
                    selectedId === b.id ? "ring-2 ring-offset-2" : "hover:ring-1 hover:ring-offset-2",
                  )}
                  style={
                    {
                      "--tw-ring-color": a.primary,
                      "--tw-ring-offset-color": dark ? "rgba(255,255,255,.06)" : "#ffffff",
                    } as React.CSSProperties
                  }
                >
                  {selectedId === b.id && (
                    <span
                      className="absolute -top-2.5 left-1 z-10 rounded px-1.5 py-0.5 text-[9.5px] font-semibold text-white"
                      style={{ background: a.primary }}
                    >
                      {BLOCK_LABELS_LOCAL[b.type]}
                    </span>
                  )}
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// mantém referência local para o rótulo do selo (evita import circular de labels grandes)
import { BLOCK_LABELS as BLOCK_LABELS_LOCAL } from "@/lib/checkout-builder";
