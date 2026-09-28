import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CreditCard, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/pavox/page-header";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminStatus,
  PeriodSelect,
} from "@/components/pavox/admin/shared";
import {
  count,
  dateTime,
  label,
  money,
  useAdminList,
  useAdminOverview,
  type AdminDays,
  type TransactionRow,
} from "@/lib/admin/data";

export const Route = createFileRoute("/admin/")({ component: AdminOverviewPage });

function AdminOverviewPage() {
  const [days, setDays] = useState<AdminDays>(30);
  const query = useAdminOverview(days);
  const recent = useAdminList("transactions", { query: "", status: "", page: 1, days });
  const data = query.data;
  const refresh = () => {
    void query.refetch();
    void recent.refetch();
  };
  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle="Acompanhe os lojistas, os pagamentos e a operação da Pavox."
        actions={
          <>
            <PeriodSelect value={days} onChange={setDays} />
            <Button
              className="h-11"
              variant="outline"
              disabled={query.isFetching || recent.isFetching}
              onClick={refresh}
            >
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
          </>
        }
      />
      {query.isError ? (
        <AdminError error={query.error} retry={refresh} />
      ) : query.isPending ? (
        <AdminLoading />
      ) : (
        data && (
          <>
            <section aria-labelledby="vol-h" className="border-b border-border pb-8">
              <h2
                id="vol-h"
                className="font-sans text-[15px] font-semibold tracking-normal text-muted-foreground"
              >
                Volume aprovado
              </h2>
              <p className="mt-1 font-display text-[clamp(40px,5.5vw,60px)] font-bold leading-none tracking-[-0.04em] text-[#001848] tabular-nums dark:text-foreground">
                {money(data.volume)}
              </p>
              <p className="mt-2 text-[15px] text-muted-foreground">
                {count(data.paid_orders)} pagamentos aprovados no período
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:max-w-[760px]">
                {[
                  ["Taxas registradas", money(data.fees), "dos pagamentos aprovados"],
                  [
                    "Pedidos criados",
                    count(data.orders),
                    `${count(data.pending_orders)} ${data.pending_orders === 1 ? "pendente" : "pendentes"}`,
                  ],
                  [
                    "Lojistas",
                    count(data.merchants),
                    `${count(data.new_merchants)} ${data.new_merchants === 1 ? "novo" : "novos"} no período`,
                  ],
                ].map(([k, v, h]) => (
                  <div key={k} className="border-t border-border pt-3">
                    <dt className="text-[13.5px] text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-xl font-bold tabular-nums">{v}</dd>
                    {h ? <dd className="text-[13px] text-muted-foreground">{h}</dd> : null}
                  </div>
                ))}
              </dl>
            </section>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <figure className="surface min-w-0 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Volume de pagamentos</h2>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Aprovados em cada dia, no horário de Brasília
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary" />
                    Volume aprovado
                  </span>
                </div>
                {data.paid_orders === 0 ? (
                  <AdminEmpty />
                ) : (
                  <div className="mt-6 h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.series}
                        accessibilityLayer
                        margin={{ top: 10, right: 8, bottom: 0, left: 4 }}
                      >
                        <CartesianGrid
                          stroke="var(--border)"
                          vertical={false}
                          strokeDasharray="4 4"
                        />
                        <XAxis
                          dataKey="day"
                          tickFormatter={(v) =>
                            `${String(v).slice(8, 10)}/${String(v).slice(5, 7)}`
                          }
                          axisLine={false}
                          tickLine={false}
                          minTickGap={30}
                          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        />
                        <YAxis
                          width={60}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(
                              Number(v),
                            )
                          }
                          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(v) => [money(Number(v)), "Aprovado"]}
                          labelFormatter={(v) => String(v).split("-").reverse().join("/")}
                          contentStyle={{
                            background: "var(--popover)",
                            color: "var(--popover-foreground)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Bar
                          dataKey="amount"
                          fill="var(--primary)"
                          radius={[3, 3, 0, 0]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <figcaption className="mt-3 text-xs leading-5 text-muted-foreground">
                  Considera a data de aprovação. Pedidos reembolsados não entram no volume. Taxas
                  registradas não representam saldo disponível para saque.
                </figcaption>
                <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer py-2 focus-visible:outline-2 focus-visible:outline-ring">
                    Ver valores do gráfico
                  </summary>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left">
                      <caption className="sr-only">Volume aprovado diário</caption>
                      <thead>
                        <tr>
                          <th className="p-2" scope="col">
                            Data
                          </th>
                          <th className="p-2" scope="col">
                            Valor
                          </th>
                          <th className="p-2" scope="col">
                            Pagamentos
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.series.map((day) => (
                          <tr key={day.day}>
                            <td className="p-2">{day.day.split("-").reverse().join("/")}</td>
                            <td className="p-2">{money(day.amount)}</td>
                            <td className="p-2">{day.orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </figure>
              <div className="surface flex flex-col p-5 sm:p-6">
                <h2 className="text-base font-semibold">Resumo da operação</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">Pontos para acompanhar</p>
                <div className="my-5 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Checkouts publicados</span>
                    <span className="font-semibold tabular-nums">
                      {count(data.published_checkouts)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Integrações com erro</span>
                    <span className="font-semibold tabular-nums">
                      {count(data.integration_errors)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      Webhooks rejeitados
                      <span className="block text-xs">No período selecionado</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {count(data.webhook_rejections)}
                    </span>
                  </div>
                </div>
                <div className="mt-auto space-y-2 border-t border-border pt-4">
                  <Button asChild variant="outline" className="h-11 w-full justify-between">
                    <Link to="/admin/integracoes">
                      Ver integrações
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="h-11 w-full justify-between">
                    <Link to="/admin/atividade">
                      Consultar atividade
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Período: {dateTime(data.from)} até {dateTime(data.to)}
              </span>
              <span>Atualizado às {dateTime(new Date(query.dataUpdatedAt).toISOString())}</span>
            </div>
          </>
        )
      )}
      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            <h2 className="text-base font-semibold">Transações recentes</h2>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/admin/transacoes">
              Ver todas
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {recent.isError ? (
          <div className="p-4">
            <AdminError error={recent.error} retry={() => void recent.refetch()} />
          </div>
        ) : recent.isPending ? (
          <AdminLoading />
        ) : recent.data?.rows.length === 0 ? (
          <AdminEmpty />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-sm">
              <caption className="sr-only">Cinco transações mais recentes do período</caption>
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  {["Pedido / lojista", "Meio", "Valor", "Status"].map((h) => (
                    <th key={h} scope="col" className="px-5 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(recent.data?.rows as TransactionRow[]).slice(0, 5).map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4">
                      <span className="font-semibold">{row.reference || row.id.slice(0, 8)}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {row.merchant}
                      </span>
                    </td>
                    <td className="px-5 py-4">{label(row.payment_method)}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold tabular-nums">
                      {money(row.amount, row.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatus status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
