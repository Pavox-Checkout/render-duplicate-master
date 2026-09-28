import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Copy, Lock } from "lucide-react";

/*
 * "Comprovante" world for the buyer: every payment screen is a receipt slip
 * on the store's own color (PAVOX blue when the store has none). The payment
 * state shown always comes from the server; this file only draws it.
 */

const DEFAULT_GROUND = "#0055fb";
const INK = "#141518";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1]!;
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return (
    "#" +
    a
      .map((v, i) =>
        Math.round(v * (1 - t) + b[i]! * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/** Colors for text on the store color: ink or white, and a tinted soft tone kept at 4.5:1. */
export function groundColors(color: string | undefined) {
  const ground = color && hexToRgb(color) ? color : DEFAULT_GROUND;
  const g = hexToRgb(ground)!;
  const L = luminance(g);
  const inkL = luminance(hexToRgb(INK)!);
  const onIsInk = (L + 0.05) / (inkL + 0.05) >= 1.05 / (L + 0.05);
  const on = onIsInk ? INK : "#ffffff";
  const onRgb = hexToRgb(on)!;
  const ratio = (hex: string) => {
    const x = luminance(hexToRgb(hex)!);
    return (Math.max(x, L) + 0.05) / (Math.min(x, L) + 0.05);
  };
  let soft = on;
  for (let t = 0.26; t >= 0; t -= 0.02) {
    const m = mix(onRgb, g, t);
    if (ratio(m) >= 4.6) {
      soft = m;
      break;
    }
  }
  return { ground, on, soft };
}

const CSS = `
.cr { min-height: 100svh; display: flex; flex-direction: column; align-items: center; padding: 28px 12px 0; background: var(--cr-ground); color: var(--cr-on); font-family: "Schibsted Grotesk", "Hanken Grotesk", ui-sans-serif, system-ui, sans-serif; font-size: 16px; line-height: 1.45; -webkit-font-smoothing: antialiased; }
.cr ::selection { background: #cddcff; color: ${INK}; }
.cr .num { font-family: "Martian Mono", ui-monospace, Menlo, monospace; font-stretch: 87.5%; font-variant-numeric: tabular-nums; }
.cr-top { width: 100%; max-width: 460px; display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; font-weight: 700; }
.cr-top .nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 18px; letter-spacing: -0.01em; }
.cr-top .sec { flex: none; display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; white-space: nowrap; }
.cr-paper { position: relative; width: 100%; max-width: 460px; background: #fbfcfd; color: ${INK}; border-radius: 4px 4px 0 0; padding: 22px 24px 28px; box-shadow: 0 18px 30px -18px rgb(0 0 0 / 0.35); }
.cr-paper::after { content: ""; position: absolute; left: 0; right: 0; bottom: -10px; height: 10px; background: radial-gradient(circle at 7px 0, transparent 6.5px, #fbfcfd 7px) 0 0 / 14px 10px repeat-x; }
.cr-head { text-align: center; }
.cr-head .store { font-weight: 800; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase; overflow-wrap: anywhere; }
.cr-head .meta { margin-top: 4px; font-size: 12.5px; font-weight: 600; color: #6b707b; }
.cr-perf { position: relative; height: 0; margin: 18px -24px; border-top: 2px dashed #c9cdd4; }
.cr-perf::before, .cr-perf::after { content: ""; position: absolute; top: -9px; width: 16px; height: 16px; border-radius: 50%; background: var(--cr-ground); }
.cr-perf::before { left: -8px; } .cr-perf::after { right: -8px; }
.cr-total { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.cr-total .l { font-weight: 800; font-size: 16px; }
.cr-total .v { font-size: 28px; font-weight: 700; letter-spacing: -0.03em; }
.cr-total .v small { font-size: 0.5em; margin-right: 3px; }
.cr-title { margin: 0; text-align: center; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
.cr-sub { margin: 8px auto 0; max-width: 34ch; text-align: center; color: #4a4e57; }
.cr-qr { position: relative; width: 208px; margin: 18px auto 0; }
.cr-qr img { display: block; width: 100%; height: auto; padding: 6px; background: #fff; border: 1.5px solid #c9cdd4; border-radius: 6px; }
.cr-qr.spent img { opacity: 0.16; filter: grayscale(1); }
.cr-stamp-row { display: flex; justify-content: center; padding: 22px 0 14px; }
.cr-stamp { display: grid; justify-items: center; padding: 8px 16px 6px; border: 4px double currentColor; border-radius: 10px; color: #1b7443; transform: rotate(-9deg); filter: url(#cr-ink); mix-blend-mode: multiply; }
.cr-qr .cr-stamp { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-9deg); }
.cr-stamp.bad { color: #b8322a; } .cr-stamp.off { color: #5d626d; }
.cr-stamp b { font-family: "Bricolage Grotesque", "Schibsted Grotesk", sans-serif; font-size: 40px; line-height: 0.95; font-weight: 800; letter-spacing: 0.04em; }
.cr-stamp small { font-family: "Martian Mono", monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; margin-top: 2px; }
.cr-stamp.land { animation: cr-stamp 0.62s cubic-bezier(0.16, 1, 0.3, 1) both; }
.cr-qr .cr-stamp.land { animation-name: cr-stamp-c; }
@keyframes cr-stamp { 0% { opacity: 0; transform: rotate(-16deg) scale(1.9); } 55% { opacity: 1; transform: rotate(-8deg) scale(0.96); } 100% { opacity: 1; transform: rotate(-9deg) scale(1); } }
@keyframes cr-stamp-c { 0% { opacity: 0; transform: translate(-50%, -50%) rotate(-16deg) scale(1.9); } 55% { opacity: 1; transform: translate(-50%, -50%) rotate(-8deg) scale(0.96); } 100% { opacity: 1; transform: translate(-50%, -50%) rotate(-9deg) scale(1); } }
.cr-code { margin-top: 16px; padding: 12px 14px; border-radius: 6px; background: #eef0f3; font-size: 12.5px; line-height: 1.6; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; user-select: all; }
.cr-btn { margin-top: 12px; width: 100%; min-height: 52px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; border: 1.5px solid var(--cr-edge); background: var(--cr-ground); color: var(--cr-on); font: inherit; font-size: 17px; font-weight: 800; cursor: pointer; text-decoration: none; }
.cr-btn:hover { filter: brightness(1.05); }
.cr-btn.ghost { background: transparent; color: ${INK}; border-color: #b9bec7; }
.cr-btn:focus-visible, .cr a:focus-visible { outline: 2px solid ${INK}; outline-offset: 3px; }
.cr-note { margin: 10px 0 0; text-align: center; font-size: 14px; color: #4a4e57; }
.cr-note.warn { color: #b8322a; font-weight: 600; }
.cr-wait { margin: 12px 0 0; text-align: center; font-size: 14px; color: #4a4e57; }
.cr-wait .dots::after { content: "…"; display: inline-block; width: 1.1em; text-align: left; overflow: hidden; vertical-align: bottom; animation: cr-dots 1.4s steps(4, end) infinite; }
@keyframes cr-dots { from { width: 0; } to { width: 1.1em; } }
.cr-sec { margin: 0 0 10px; font-size: 16px; font-weight: 800; }
.cr-steps { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.cr-steps li { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.cr-steps .dot { flex: none; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; border: 1.5px solid #b9bec7; color: #fff; }
.cr-steps .done .dot { background: ${INK}; border-color: ${INK}; }
.cr-steps .ok .dot { background: #1b7443; border-color: #1b7443; }
.cr-steps .now .dot { border: 5px solid ${INK}; }
.cr-steps .todo { color: #6b707b; }
.cr-howto { margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: 15px; color: #33363d; }
.cr-kv { margin: 0; display: grid; gap: 8px; font-size: 14.5px; }
.cr-kv div { display: flex; justify-content: space-between; gap: 12px; }
.cr-kv dt { color: #6b707b; }
.cr-kv dd { margin: 0; font-weight: 600; text-align: right; min-width: 0; overflow-wrap: anywhere; }
.cr-foot { color: var(--cr-soft); }
.cr-skel { display: grid; gap: 10px; }
.cr-skel i { display: block; height: 14px; border-radius: 4px; background: #e6e8ec; animation: cr-sh 1.4s ease-in-out infinite; }
@keyframes cr-sh { 50% { opacity: 0.45; } }
@media (min-width: 600px) { .cr { padding-top: 48px; } .cr-paper { padding: 26px 32px 32px; } .cr-perf { margin: 20px -32px; } }
@media (prefers-reduced-motion: reduce) { .cr-stamp.land, .cr-qr .cr-stamp.land, .cr-wait .dots::after, .cr-skel i { animation: none; } }
`;

export function ReceiptFrame({
  color,
  storeName,
  children,
  footer,
}: {
  color?: string | undefined;
  storeName?: string | null | undefined;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { ground, on, soft } = groundColors(color);
  const edge =
    luminance(hexToRgb(ground)!) > 0.6
      ? `color-mix(in srgb, ${ground} 55%, ${INK})`
      : `color-mix(in srgb, ${ground} 80%, ${INK})`;
  const style = {
    "--cr-ground": ground,
    "--cr-on": on,
    "--cr-soft": soft,
    "--cr-edge": edge,
  } as CSSProperties;
  return (
    <div className="cr" style={style}>
      <style>{CSS}</style>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="cr-ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2"
            numOctaves={2}
            seed={11}
            result="n"
          />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.9 1.45"
            result="m"
          />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </svg>
      <header className="cr-top">
        <span className="nm">{storeName?.trim() || "Checkout"}</span>
        <span className="sec">
          <Lock className="size-4" aria-hidden="true" /> Compra segura
        </span>
      </header>
      <main className="cr-paper">{children}</main>
      <div className="cr-foot w-full">{footer}</div>
    </div>
  );
}

export function ReceiptHead({
  storeName,
  at,
}: {
  storeName?: string | null | undefined;
  at?: Date;
}) {
  const d = at ?? new Date();
  return (
    <div className="cr-head">
      <div className="store">{storeName?.trim() || "Checkout"}</div>
      <div className="meta">
        Via do cliente,{" "}
        <span className="num">
          {d.toLocaleDateString("pt-BR")}{" "}
          {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

export const Perf = () => <div className="cr-perf" aria-hidden="true" />;

export function ReceiptTotal({ amount }: { amount: number }) {
  return (
    <div className="cr-total">
      <span className="l">Total</span>
      <span className="v num">
        <small>R$</small>
        {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

export function Stamp({
  big,
  small,
  tone = "ok",
  land = false,
}: {
  big: string;
  small?: string | undefined;
  tone?: "ok" | "bad" | "off";
  land?: boolean;
}) {
  return (
    <div
      className={`cr-stamp ${tone === "ok" ? "" : tone} ${land ? "land" : ""}`}
      role="img"
      aria-label={small ? `${big}, ${small}` : big}
    >
      <b aria-hidden="true">{big}</b>
      {small ? <small aria-hidden="true">{small}</small> : null}
    </div>
  );
}

/** Copy button that only claims success when the clipboard accepted the text. */
export function CopyCode({
  text,
  label,
  doneLabel,
  failHint,
}: {
  text: string;
  label: string;
  doneLabel: string;
  failHint: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), state === "done" ? 2600 : 6000);
    return () => clearTimeout(t);
  }, [state]);
  const copy = () => {
    const fail = () => {
      setState("fail");
      const el = document.getElementById("cr-code-text");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    };
    if (!navigator.clipboard?.writeText) return fail();
    navigator.clipboard.writeText(text).then(() => setState("done"), fail);
  };
  return (
    <>
      <div className="cr-code num" id="cr-code-text">
        {text}
      </div>
      <button type="button" className="cr-btn" onClick={copy}>
        {state === "done" ? (
          <Check className="size-5" aria-hidden="true" />
        ) : (
          <Copy className="size-5" aria-hidden="true" />
        )}
        {state === "done" ? doneLabel : label}
      </button>
      <p className="cr-note warn" role="status" aria-live="polite">
        {state === "fail" ? failHint : ""}
      </p>
    </>
  );
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export function Countdown({ until }: { until: string }) {
  const end = new Date(until).getTime();
  const [left, setLeft] = useState(() => Math.max(0, end - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(t);
  }, [end]);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const at = new Date(until).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return (
    <p className="cr-note">
      Faltam{" "}
      <span className="num">{`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`}</span>{" "}
      (válido até <span className="num">{at}</span>)
    </p>
  );
}

export function Steps({
  items,
}: {
  items: { label: string; state: "done" | "ok" | "now" | "todo" }[];
}) {
  return (
    <>
      <h2 className="cr-sec">Andamento</h2>
      <ol className="cr-steps">
        {items.map((it) => (
          <li key={it.label} className={it.state}>
            <span className="dot" aria-hidden="true">
              {it.state === "done" || it.state === "ok" ? (
                <Check className="size-3" strokeWidth={3} />
              ) : null}
            </span>
            {it.label}
            {it.state === "now" ? <span className="sr-only"> (agora)</span> : null}
          </li>
        ))}
      </ol>
    </>
  );
}

export function ReceiptLoading() {
  return (
    <ReceiptFrame>
      <div className="cr-skel" aria-busy="true" aria-label="Carregando o checkout">
        <i style={{ width: "46%", margin: "0 auto" }} />
        <i style={{ width: "30%", margin: "0 auto" }} />
        <Perf />
        <i style={{ width: "80%" }} />
        <i style={{ width: "62%" }} />
        <Perf />
        <i style={{ height: 48 }} />
        <i style={{ height: 48 }} />
      </div>
    </ReceiptFrame>
  );
}

export function ReceiptMessage({
  stamp,
  title,
  description,
  color,
  storeName,
}: {
  stamp: string;
  title: string;
  description: string;
  color?: string | undefined;
  storeName?: string | null | undefined;
}) {
  return (
    <ReceiptFrame color={color} storeName={storeName}>
      <ReceiptHead storeName={storeName} />
      <Perf />
      <div className="cr-stamp-row">
        <Stamp big={stamp} small="NENHUMA COBRANÇA" tone="off" />
      </div>
      <h1 className="cr-title" style={{ marginTop: 14 }}>
        {title}
      </h1>
      <p className="cr-sub">{description}</p>
    </ReceiptFrame>
  );
}
