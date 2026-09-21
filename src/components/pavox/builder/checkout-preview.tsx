import { Lock, ShieldCheck, Star, Timer, Ticket, Sparkles } from "lucide-react";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";
import {
  BLOCK_LABELS,
  FIELD_LABELS,
  FONT_STACKS,
  type Block,
  type BuilderState,
} from "@/lib/checkout-builder";

function isDark(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

type Ctx = { state: BuilderState; dark: boolean };

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
    case "header":
      return (
        <div
          className={cn(
            "flex items-center gap-2",
            d.align === "center" && "justify-center",
            d.align === "right" && "justify-end",
          )}
        >
          <span
            className="font-semibold"
            style={{ fontSize: d.size === "lg" ? 22 : d.size === "sm" ? 14 : 18 }}
          >
            {d.logo}
          </span>
        </div>
      );

    case "product":
      return (
        <div className="flex gap-3">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center"
            style={{ borderRadius: a.radius * 0.7, background: `${a.primary}1a`, color: a.primary }}
          >
            <Sparkles className="h-6 w-6" />
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

    case "payment":
      return (
        <div className="space-y-2">
          <SectionTitle dark={dark}>Pagamento</SectionTitle>
          <div className="grid grid-cols-3 gap-2 text-center text-[12px] font-medium">
            {[
              ["Pix", d.pix],
              ["Cartão", d.card],
              ["Boleto", d.boleto],
            ]
              .filter(([, on]) => on)
              .map(([label], i) => (
                <div
                  key={label as string}
                  className="py-2"
                  style={{
                    borderRadius: a.radius * 0.55,
                    border: `1.5px solid ${i === 0 ? a.primary : line}`,
                    color: i === 0 ? a.primary : undefined,
                    background: i === 0 ? `${a.primary}0f` : undefined,
                  }}
                >
                  {label as string}
                </div>
              ))}
          </div>
        </div>
      );

    case "bump":
      if (!d.enabled) return null;
      return (
        <div
          className="flex items-start gap-3 p-3"
          style={{
            borderRadius: a.radius * 0.7,
            border: `1.5px dashed ${a.primary}`,
            background: `${a.primary}0d`,
          }}
        >
          <div
            className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px]"
            style={{ background: a.primary }}
          />
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

    case "social":
      return (
        <div className="p-3" style={{ borderRadius: a.radius * 0.7, border: `1px solid ${line}` }}>
          <div className="flex gap-0.5">
            {Array.from({ length: d.rating ?? 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: "#f59e0b" }} />
            ))}
          </div>
          <p className="mt-1.5 text-[12.5px] italic">“{d.text}”</p>
          <p className="mt-1 text-[11.5px]" style={{ color: muted }}>
            — {d.author}
          </p>
        </div>
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
          <div className={cn("flex", d.align === "left" ? "justify-start" : d.align === "right" ? "justify-end" : "justify-center")}>
            <button
              className={cn("px-6 text-[14px] font-semibold text-white", d.buttonFull && "w-full")}
              style={{
                height: d.buttonHeight ?? 48,
                borderRadius: a.radius * 0.75,
                background: a.button,
              }}
            >
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

    case "security":
      return (
        <p className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: muted }}>
          <Lock className="h-3 w-3" /> {d.text}
        </p>
      );

    case "footer":
      return (
        <p className="text-center text-[11px]" style={{ color: muted }}>
          {d.text}
        </p>
      );
  }
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

  return (
    <div
      className="w-full py-8"
      style={{
        background: a.background,
        fontFamily: FONT_STACKS[a.font],
        color: dark ? "#f8fafc" : "#0f172a",
      }}
    >
      <div
        className="mx-auto w-full px-4"
        style={{ maxWidth: width }}
      >
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
              const body = <BlockBody block={b} ctx={{ state, dark }} />;
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
                    selectedId === b.id
                      ? "ring-2 ring-offset-2"
                      : "hover:ring-1 hover:ring-offset-2",
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
                      {BLOCK_LABELS[b.type]}
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
