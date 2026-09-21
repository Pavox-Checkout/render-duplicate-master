import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BadgePercent, CircleSlash, ShieldCheck, Receipt, Wallet, HeartHandshake } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { PeriodFilter } from "@/components/pavox/period-filter";
import { StatCard } from "@/components/pavox/stat-card";
import {
  deviceData,
  hourData,
  paymentMix,
  productConversion,
  salesSeries,
  sourceData,
} from "@/lib/mock";

export const Route = createFileRoute("/_dash/analytics")({
  component: Analytics,
  head: () => ({
    meta: [
      { title: "Analytics · PAVOX" },
      {
        name: "description",
        content: "Conversão por dispositivo, origem, produto e horário do seu checkout.",
      },
      { property: "og:title", content: "Analytics · PAVOX" },
      { property: "og:description", content: "Dados que mostram onde sua conversão vaza." },
    ],
  }),
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
  boxShadow: "var(--shadow-lift)",
};

const palette = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-[13px] text-muted-foreground">{subtitle}</p>
      <div className="mt-5 h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Analytics() {
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Entenda o comportamento de quem passa pelo seu checkout."
        actions={<PeriodFilter />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Conversão" value="4,82%" delta={0.74} hint="30 dias" icon={BadgePercent} />
        <StatCard label="Abandono" value="42,1%" delta={-3.2} hint="30 dias" icon={CircleSlash} />
        <StatCard label="Aprovação" value="92,7%" delta={1.9} hint="30 dias" icon={ShieldCheck} />
        <StatCard label="Ticket médio" value="R$ 100,04" delta={4.6} hint="30 dias" icon={Receipt} />
        <StatCard label="Receita" value="R$ 128.450,90" delta={18.4} hint="30 dias" icon={Wallet} />
        <StatCard label="LTV médio" value="R$ 428,90" delta={6.8} hint="30 dias" icon={HeartHandshake} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Conversão por dispositivo" subtitle="Onde seu cliente compra melhor">
          <BarChart data={deviceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Conversão"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--color-chart-1)" />
          </BarChart>
        </Panel>

        <Panel title="Conversão por origem" subtitle="Canais que mais convertem">
          <BarChart data={sourceData} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Conversão"]} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="var(--color-chart-1)" />
          </BarChart>
        </Panel>

        <Panel title="Conversão por produto" subtitle="Qual oferta performa melhor">
          <BarChart data={productConversion}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
            <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Conversão"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--color-chart-3)" />
          </BarChart>
        </Panel>

        <Panel title="Conversão por horário" subtitle="Melhores janelas para anunciar">
          <LineChart data={hourData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Conversão"]} />
            <Line type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2.4} dot={false} />
          </LineChart>
        </Panel>

        <Panel title="Método de pagamento" subtitle="Participação nas vendas aprovadas">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Participação"]} />
            <Pie data={paymentMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {paymentMix.map((entry, i) => (
                <Cell key={entry.name} fill={palette[i % palette.length]} />
              ))}
            </Pie>
          </PieChart>
        </Panel>

        <Panel title="Desempenho do checkout" subtitle="Pedidos aprovados por dia">
          <LineChart data={salesSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" interval={5} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
            <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Pedidos"]} />
            <Line type="monotone" dataKey="pedidos" stroke="var(--color-chart-2)" strokeWidth={2.4} dot={false} />
          </LineChart>
        </Panel>
      </div>

      <div className="surface flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-base font-semibold">Mobile converte 29% melhor que desktop</h2>
          <p className="text-[13px] text-muted-foreground">
            Concentre investimento em campanhas mobile e reduza campos do formulário.
          </p>
        </div>
        <span className="rounded-full bg-success/12 px-3 py-1 text-[12.5px] font-semibold text-success">
          Oportunidade identificada
        </span>
      </div>
    </>
  );
}
