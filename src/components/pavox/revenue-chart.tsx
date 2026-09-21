import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl, salesSeries } from "@/lib/mock";
import { cn } from "@/lib/utils";

type Key = "faturamento" | "pedidos" | "ticket";

const tabs: { key: Key; label: string }[] = [
  { key: "faturamento", label: "Faturamento" },
  { key: "pedidos", label: "Pedidos" },
  { key: "ticket", label: "Ticket médio" },
];

export function RevenueChart() {
  const [key, setKey] = useState<Key>("faturamento");
  const money = key !== "pedidos";

  return (
    <div className="surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Desempenho de vendas</h2>
          <p className="text-[13px] text-muted-foreground">Últimos 30 dias</p>
        </div>
        <div className="inline-flex rounded-lg bg-secondary p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setKey(t.key)}
              className={cn(
                "rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                key === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesSeries} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="pavoxArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              interval={4}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={58}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(v: number) => (money ? `R$ ${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.3 }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
                boxShadow: "var(--shadow-lift)",
              }}
              formatter={(v: number) => [money ? brl(v) : v, tabs.find((t) => t.key === key)!.label]}
            />
            <Area
              type="monotone"
              dataKey={key}
              stroke="var(--color-primary)"
              strokeWidth={2.4}
              fill="url(#pavoxArea)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
