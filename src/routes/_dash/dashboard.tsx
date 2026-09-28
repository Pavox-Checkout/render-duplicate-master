import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Clock, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { brl } from "@/lib/mock";
import { useProducts } from "@/lib/pavox-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dash/dashboard")({
  component: Overview,
  head: () => ({
    meta: [
      { title: "Visão geral · PAVOX" },
      {
        name: "description",
        content:
          "Quanto você vendeu, o que está para receber e cada pedido, na hora em que aconteceu.",
      },
    ],
  }),
});

/*
 * The panel reads like a bank statement ("Extrato"): what came in, what is
 * still on the way, and every order in time order. All numbers come from the
 * lojista's own orders; nothing is estimated.
 */

type DashOrder = {
  id: string;
  reference: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
  buyer: { name?: string } | null;
  product_snapshot: { name?: string } | null;
};

type Period = "today" | "7d" | "30d";
const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "today", label: "Hoje", days: 1 },
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
];

const METHOD: Record<string, string> = { pix: "Pix", boleto: "Boleto", card: "Cartão" };
const DAY = 86_400_000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const approvedAt = (o: DashOrder) => new Date(o.paid_at ?? o.created_at).getTime();

function useDashboardOrders() {
  return useQuery({
    queryKey: ["dashboard-orders"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const since = new Date(startOfDay(new Date()).getTime() - 60 * DAY).toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, reference, amount, status, payment_method, created_at, paid_at, expires_at, buyer, product_snapshot",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as DashOrder[];
    },
  });
}

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function statusLine(o: DashOrder, now: number) {
  if (o.status === "Aprovado") return { text: "recebido", tone: "ok" as const };
  if (o.status === "Pendente") {
    if (o.payment_method === "boleto") return { text: "boleto a receber", tone: "wait" as const };
    if (o.expires_at) {
      const left = Math.round((new Date(o.expires_at).getTime() - now) / 60000);
      if (left > 0)
        return {
          text: `vence em ${left} min`,
          tone: left <= 10 ? ("warn" as const) : ("wait" as const),
        };
    }
    return { text: "a receber", tone: "wait" as const };
  }
  if (o.status === "Expirado")
    return {
      text: o.payment_method === "boleto" ? "boleto vencido" : "Pix expirou",
      tone: "off" as const,
    };
  if (o.status === "Recusado") return { text: "cartão recusado", tone: "warn" as const };
  if (o.status === "Reembolsado") return { text: "reembolsado", tone: "off" as const };
  return { text: o.status.toLowerCase(), tone: "off" as const };
}

function Overview() {
  const { profile } = useAuth();
  const { data: orders = [], isLoading, isError, dataUpdatedAt } = useDashboardOrders();
  const { data: products = [] } = useProducts();
  const [period, setPeriod] = useState<Period>("today");

  const now = new Date();
  const days = PERIODS.find((p) => p.id === period)!.days;
  const from = startOfDay(now).getTime() - (days - 1) * DAY;
  const prevFrom = from - days * DAY;
  // Same stretch of the previous period, up to the same time of day.
  const prevTo = now.getTime() - days * DAY;

  const stats = useMemo(() => {
    const approved = orders.filter((o) => o.status === "Aprovado");
    const inPeriod = approved.filter((o) => approvedAt(o) >= from);
    const sold = inPeriod.reduce((s, o) => s + Number(o.amount), 0);
    const prev = approved
      .filter((o) => approvedAt(o) >= prevFrom && approvedAt(o) <= prevTo)
      .reduce((s, o) => s + Number(o.amount), 0);
    const pending = orders.filter((o) => o.status === "Pendente");
    return {
      sold,
      prev,
      count: inPeriod.length,
      pending,
      pendingTotal: pending.reduce((s, o) => s + Number(o.amount), 0),
      approved,
    };
  }, [orders, from, prevFrom, prevTo]);

  const change = stats.prev > 0 ? ((stats.sold - stats.prev) / stats.prev) * 100 : null;
  const pix = stats.pending.filter((o) => o.payment_method === "pix").length;
  const bol = stats.pending.filter((o) => o.payment_method === "boleto").length;
  const other = stats.pending.length - pix - bol;
  const name = (profile?.company_name || profile?.full_name || "").trim().split(" ")[0] ?? "";
  const updated = dataUpdatedAt ? hhmm(new Date(dataUpdatedAt).toISOString()) : null;

  const statement = orders.filter((o) => new Date(o.created_at).getTime() >= from).slice(0, 40);
  const byDay = new Map<number, DashOrder[]>();
  for (const o of statement) {
    const k = startOfDay(new Date(o.created_at)).getTime();
    byDay.set(k, [...(byDay.get(k) ?? []), o]);
  }

  if (!isLoading && !isError && orders.length === 0) {
    return <FirstSteps hasProducts={products.length > 0} name={name} />;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">
            {greeting(now)}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            {updated ? `, atualizado às ${updated}` : ""}
          </p>
        </div>
        <div
          role="group"
          aria-label="Período"
          className="inline-flex self-start rounded-xl bg-secondary p-1 sm:self-auto"
        >
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "h-9 rounded-lg px-3.5 text-[14.5px] font-semibold transition-colors pointer-coarse:h-11",
                period === p.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <p className="rounded-xl border border-destructive/30 px-4 py-3 text-[15px] text-destructive">
          Não foi possível carregar seus pedidos agora. Confira sua conexão e recarregue a página.
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-labelledby="sold-h">
          <h2
            id="sold-h"
            className="font-sans text-[15px] font-semibold tracking-normal text-muted-foreground"
          >
            Vendido {period === "today" ? "hoje" : `nos últimos ${days} dias`}
          </h2>
          <p className="mt-2 font-display text-[clamp(44px,6vw,64px)] font-bold leading-none tracking-[-0.04em] text-[#001848] tabular-nums dark:text-foreground">
            <span className="rounded-md bg-highlight/80 px-1.5 [box-decoration-break:clone]">
              <small className="mr-1 align-top text-[0.38em] font-bold">R$</small>
              {isLoading
                ? "…"
                : stats.sold.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </span>
          </p>
          {change !== null ? (
            <p className="mt-3 flex items-center gap-1.5 text-[15px] text-muted-foreground">
              {change >= 0 ? (
                <ArrowUp className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <ArrowDown className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
              <span
                className={cn("font-semibold", change >= 0 ? "text-primary" : "text-foreground")}
              >
                {Math.abs(change).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
              </span>
              {change >= 0 ? "a mais" : "a menos"} que{" "}
              {period === "today"
                ? `ontem até ${hhmm(now.toISOString())}`
                : `nos ${days} dias anteriores`}
            </p>
          ) : null}
          <p className="mt-2 text-[15px] text-muted-foreground">
            {stats.count} {stats.count === 1 ? "venda aprovada" : "vendas aprovadas"}
            {stats.count ? `, ticket médio de ${brl(stats.sold / stats.count)}` : ""}
          </p>
        </section>

        <section aria-labelledby="pend-h">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="pend-h" className="font-sans text-lg font-bold tracking-normal">
              A receber
            </h2>
            <span className="text-[22px] font-bold tabular-nums">{brl(stats.pendingTotal)}</span>
          </div>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {stats.pending.length === 0
              ? "Nenhum pagamento em aberto."
              : [
                  pix ? `${pix} Pix` : "",
                  bol ? `${bol} ${bol === 1 ? "boleto" : "boletos"}` : "",
                  other ? `${other} no cartão` : "",
                ]
                  .filter(Boolean)
                  .join(" e ") + " aguardando pagamento"}
          </p>
          {stats.pending.length > 0 ? (
            <ul className="mt-3 border-t border-border">
              {stats.pending.slice(0, 3).map((o) => {
                const st = statusLine(o, now.getTime());
                return (
                  <li
                    key={o.id}
                    className="flex items-start justify-between gap-3 border-b border-border py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {o.buyer?.name || o.reference}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-[14px]",
                          st.tone === "warn"
                            ? "font-semibold text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        <Clock className="size-3.5" aria-hidden="true" />
                        {METHOD[o.payment_method] ?? o.payment_method} {st.text}
                      </span>
                    </span>
                    <span className="italic tabular-nums text-muted-foreground">
                      {Number(o.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {stats.pending.length > 3 ? (
            <Link
              to="/pedidos"
              className="mt-3 inline-block py-2 font-semibold text-primary underline decoration-[1.5px] underline-offset-4"
            >
              Ver os {stats.pending.length} pendentes
            </Link>
          ) : null}
        </section>
      </div>

      <SalesChart approved={stats.approved} period={period} days={days} from={from} />

      <section aria-labelledby="stmt-h">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="stmt-h" className="font-sans text-xl font-bold tracking-normal">
              Extrato
            </h2>
            <p className="text-[15px] text-muted-foreground">
              Cada pedido, na hora em que aconteceu.
            </p>
          </div>
          <Link
            to="/pedidos"
            className="whitespace-nowrap py-2 font-semibold text-primary underline decoration-[1.5px] underline-offset-4"
          >
            Todos os pedidos
          </Link>
        </div>

        {statement.length === 0 ? (
          <p className="mt-4 border-t-[1.5px] border-foreground/80 py-6 text-[15px] text-muted-foreground">
            Nenhum pedido neste período.
          </p>
        ) : (
          [...byDay.entries()].map(([day, list]) => {
            const dayTotal = list
              .filter((o) => o.status === "Aprovado")
              .reduce((s, o) => s + Number(o.amount), 0);
            const isToday = day === startOfDay(now).getTime();
            const isYesterday = day === startOfDay(now).getTime() - DAY;
            return (
              <div key={day} className="mt-5">
                <div className="flex items-baseline justify-between gap-3 border-b-[1.5px] border-foreground/80 pb-2">
                  <h3 className="font-sans text-base font-bold tracking-normal">
                    {isToday
                      ? "Hoje"
                      : isYesterday
                        ? "Ontem"
                        : new Date(day).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                  </h3>
                  <span className="text-[14px] text-muted-foreground">
                    saldo do dia <b className="text-foreground tabular-nums">+ {brl(dayTotal)}</b>
                  </span>
                </div>
                <ul>
                  {list.map((o) => {
                    const st = statusLine(o, now.getTime());
                    const paid = o.status === "Aprovado";
                    const refunded = o.status === "Reembolsado";
                    const dead = o.status === "Expirado" || o.status === "Recusado";
                    return (
                      <li key={o.id}>
                        <Link
                          to="/pedidos/$id"
                          params={{ id: o.id }}
                          className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 border-b border-border py-3 hover:bg-secondary/60 sm:px-2"
                        >
                          <span className="truncate font-semibold">
                            {o.buyer?.name || o.reference}
                          </span>
                          <span
                            className={cn(
                              "text-right font-bold tabular-nums",
                              !paid && !refunded && "font-medium italic text-muted-foreground",
                              dead && "line-through",
                              refunded && "text-destructive",
                            )}
                          >
                            {paid ? "+ " : refunded ? "− " : ""}
                            {Number(o.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="flex min-w-0 gap-2.5 text-[14px] text-muted-foreground">
                            <span className="truncate">{o.product_snapshot?.name || "Pedido"}</span>
                            <span className="flex-none">
                              {METHOD[o.payment_method] ?? o.payment_method} às {hhmm(o.created_at)}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "text-right text-[13.5px]",
                              st.tone === "warn"
                                ? "font-semibold text-destructive"
                                : "text-muted-foreground",
                              st.tone === "wait" && "italic",
                            )}
                          >
                            {st.text}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

/* Hoje: cumulative sales by hour, today (blue pen) against yesterday (ochre).
   7 and 30 days: one bar per day. Always paired with a readable summary. */
function SalesChart({
  approved,
  period,
  days,
  from,
}: {
  approved: DashOrder[];
  period: Period;
  days: number;
  from: number;
}) {
  const [table, setTable] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(
      ([e]) => e && setW(Math.max(280, Math.round(e.contentRect.width))),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const now = new Date();
  const H = W < 500 ? 180 : 220;
  const padL = 44;
  const padB = 24;

  if (period === "today") {
    const today0 = startOfDay(now).getTime();
    const yest0 = today0 - DAY;
    const curve = (start: number, until: number) => {
      const pts: number[] = [];
      let acc = 0;
      const sorted = approved
        .map((o) => ({ t: approvedAt(o), v: Number(o.amount) }))
        .filter((x) => x.t >= start && x.t < start + DAY)
        .sort((a, b) => a.t - b.t);
      for (let h = 0; h <= 24; h++) {
        const edge = start + h * 3_600_000;
        if (edge > until) break;
        while (sorted.length && sorted[0]!.t <= edge) acc += sorted.shift()!.v;
        pts.push(acc);
      }
      return pts;
    };
    const today = curve(today0, now.getTime());
    const yesterday = curve(yest0, yest0 + DAY);
    const max = Math.max(1, ...today, ...yesterday);
    const x = (h: number) => padL + (h / 24) * (W - padL - 10);
    const y = (v: number) => H - padB - (v / max) * (H - padB - 12);
    const path = (pts: number[]) =>
      pts.map((v, h) => `${h ? "L" : "M"}${x(h).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const tNow = today.at(-1) ?? 0;
    const yNow = yesterday[Math.min(now.getHours(), 24)] ?? 0;
    return (
      <section aria-labelledby="chart-h" className="border-t border-border pt-8">
        <ChartHead
          title="Vendas ao longo do dia"
          summary={`Aprovadas, somadas hora a hora. Às ${hhmm(now.toISOString())}, hoje está em ${brl(tNow)}; ontem, nesse horário, estava em ${brl(yNow)}.`}
          table={table}
          onToggle={() => setTable((t) => !t)}
          legend={[
            ["Hoje", "#0055fb"],
            ["Ontem", "#c08a2a"],
          ]}
        />
        <div ref={box} className="mt-4 w-full">
          {table ? (
            <DataTable
              head={["Hora", "Hoje", "Ontem"]}
              rows={yesterday.map((v, h) => [
                `${String(h).padStart(2, "0")}h`,
                today[h] != null ? brl(today[h]!) : "—",
                brl(v),
              ])}
            />
          ) : (
            <svg
              viewBox={`0 0 ${W} ${H}`}
              width={W}
              height={H}
              className="block"
              aria-hidden="true"
            >
              {[0, 0.5, 1].map((f) => (
                <g key={f}>
                  <line
                    x1={padL}
                    x2={W - 10}
                    y1={y(max * f)}
                    y2={y(max * f)}
                    className="stroke-border"
                  />
                  <text
                    x={padL - 8}
                    y={y(max * f) + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[12px]"
                  >
                    {max * f >= 1000
                      ? `${((max * f) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
                      : Math.round(max * f)}
                  </text>
                </g>
              ))}
              {[0, 6, 12, 18, 24].map((h) => (
                <text
                  key={h}
                  x={x(h)}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[12px]"
                >
                  {h}h
                </text>
              ))}
              <path d={path(yesterday)} fill="none" stroke="#c08a2a" strokeWidth={2} />
              <path
                d={`${path(today)} L${x(today.length - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                className="fill-primary/10"
              />
              <path d={path(today)} fill="none" className="stroke-primary" strokeWidth={2.5} />
              <circle cx={x(today.length - 1)} cy={y(tNow)} r={4.5} className="fill-primary" />
            </svg>
          )}
        </div>
      </section>
    );
  }

  const bars = Array.from({ length: days }, (_, i) => {
    const d0 = from + i * DAY;
    return {
      d0,
      v: approved
        .filter((o) => approvedAt(o) >= d0 && approvedAt(o) < d0 + DAY)
        .reduce((s, o) => s + Number(o.amount), 0),
    };
  });
  const max = Math.max(1, ...bars.map((b) => b.v));
  const total = bars.reduce((s, b) => s + b.v, 0);
  const best = bars.reduce((a, b) => (b.v > a.v ? b : a), bars[0]!);
  const bw = (W - padL - 10) / days;
  const y = (v: number) => H - padB - (v / max) * (H - padB - 12);
  const d = (t: number) =>
    new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return (
    <section aria-labelledby="chart-h" className="border-t border-border pt-8">
      <ChartHead
        title="Vendas por dia"
        summary={
          total
            ? `Aprovadas em cada dia. Total de ${brl(total)}; o melhor dia foi ${d(best.d0)}, com ${brl(best.v)}.`
            : "Nenhuma venda aprovada neste período."
        }
        table={table}
        onToggle={() => setTable((t) => !t)}
        legend={[]}
      />
      <div ref={box} className="mt-4 w-full">
        {table ? (
          <DataTable head={["Dia", "Vendido"]} rows={bars.map((b) => [d(b.d0), brl(b.v)])} />
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" aria-hidden="true">
            <line x1={padL} x2={W - 10} y1={y(0)} y2={y(0)} className="stroke-border" />
            <text
              x={padL - 8}
              y={y(max) + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[12px]"
            >
              {max >= 1000
                ? `${(max / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
                : Math.round(max)}
            </text>
            {bars.map((b, i) => (
              <rect
                key={b.d0}
                x={padL + i * bw + bw * 0.15}
                width={bw * 0.7}
                y={y(b.v)}
                height={Math.max(0, y(0) - y(b.v))}
                rx={2}
                className="fill-primary"
              />
            ))}
            {bars
              .filter((_, i) => i % Math.ceil(days / 5) === 0 || i === days - 1)
              .map((b) => (
                <text
                  key={b.d0}
                  x={padL + ((b.d0 - from) / DAY) * bw + bw / 2}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[12px]"
                >
                  {d(b.d0)}
                </text>
              ))}
          </svg>
        )}
      </div>
    </section>
  );
}

function ChartHead({
  title,
  summary,
  table,
  onToggle,
  legend,
}: {
  title: string;
  summary: string;
  table: boolean;
  onToggle: () => void;
  legend: [string, string][];
}) {
  return (
    <>
      <h2 id="chart-h" className="font-sans text-xl font-bold tracking-normal">
        {title}
      </h2>
      <p className="mt-1 max-w-[70ch] text-[15px] text-muted-foreground">{summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted-foreground">
        {legend.map(([label, color]) => (
          <span key={label} className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded" style={{ background: color }} aria-hidden="true" />
            {label}
          </span>
        ))}
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={table}
          className="-my-2 py-2 font-semibold text-primary underline decoration-[1.5px] underline-offset-4"
        >
          {table ? "Ver em gráfico" : "Ver em tabela"}
        </button>
      </div>
    </>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-border">
      <table className="w-full text-[14px] tabular-nums">
        <thead className="sticky top-0 bg-secondary text-left">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={cn("px-4 py-2 font-semibold", i && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-border">
              {r.map((c, i) => (
                <td key={i} className={cn("px-4 py-2", i && "text-right")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FirstSteps({ hasProducts, name }: { hasProducts: boolean; name: string }) {
  return (
    <div className="max-w-[640px] space-y-6 py-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">
          {name ? `Olá, ${name}. ` : ""}Seu extrato começa na primeira venda.
        </h1>
        <p className="mt-2 text-[16px] text-muted-foreground">
          Assim que um comprador pagar, a venda aparece aqui com o valor, a forma de pagamento e a
          hora.
        </p>
      </div>
      <ol className="space-y-3 text-[16px]">
        <li className={cn(hasProducts && "text-muted-foreground line-through")}>
          Cadastre o seu produto.
        </li>
        <li>Conecte o gateway que você já usa em Integrações.</li>
        <li>Crie o checkout e divulgue o link.</li>
      </ol>
      <div className="flex flex-wrap gap-3">
        <Button asChild className="h-11 rounded-[10px] px-5 text-[15px] font-bold">
          <Link to={hasProducts ? "/checkouts/novo" : "/produtos"}>
            {hasProducts ? <Plus className="size-4" /> : <Package className="size-4" />}
            {hasProducts ? "Criar checkout" : "Cadastrar produto"}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-[10px] px-5 text-[15px] font-bold"
        >
          <Link to="/integracoes">Conectar gateway</Link>
        </Button>
      </div>
    </div>
  );
}
