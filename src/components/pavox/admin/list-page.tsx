import { useState } from "react";
import { Download, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/pavox/page-header";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPagination,
  AdminStatus,
  PeriodSelect,
} from "./shared";
import { AdminDetail } from "./detail";
import {
  dateTime,
  label,
  merchantName,
  money,
  useAdminList,
  type AdminKind,
  type AdminRow,
  type ListFilters,
} from "@/lib/admin/data";

const config = {
  merchants: {
    title: "Lojistas",
    subtitle: "Consulte as contas da plataforma e registre o acompanhamento de cada loja.",
    headers: ["Lojista", "Plano", "Assinatura", "Checkouts publicados", "Cadastro"],
    statuses: ["active", "pending", "past_due", "canceled", "none"],
  },
  transactions: {
    title: "Transações",
    subtitle: "Acompanhe pedidos e confirmações de pagamento de todos os lojistas.",
    headers: ["Pedido / lojista", "Cliente", "Valor", "Status", "Criado em"],
    statuses: ["Aprovado", "Pendente", "Recusado", "Reembolsado", "Cancelado", "Expirado"],
  },
  subscriptions: {
    title: "Assinaturas",
    subtitle: "Planos, mensalidades e situação de cada conta, conforme o cadastro atual.",
    headers: ["Lojista", "Plano / mensalidade", "Status", "Taxa do plano", "Fim do período"],
    statuses: ["active", "pending", "past_due", "canceled", "none"],
  },
  integrations: {
    title: "Integrações",
    subtitle: "Monitore as conexões dos lojistas e os resultados dos testes registrados.",
    headers: ["Gateway / lojista", "Ambiente", "Status", "Último teste", "Resultado"],
    statuses: ["connected", "disabled", "error", "not_connected"],
  },
  events: {
    title: "Atividade",
    subtitle: "Consulte os eventos de pagamento e as ações registradas pela administração.",
    headers: ["Evento / origem", "Lojista", "Status", "Resultado", "Registrado em"],
    statuses: ["processed", "received", "rejected", "recorded"],
  },
} satisfies Record<
  AdminKind,
  { title: string; subtitle: string; headers: string[]; statuses: string[] }
>;

function cells(row: AdminRow, kind: AdminKind): string[] {
  if ("store_slug" in row)
    return kind === "subscriptions"
      ? [
          merchantName(row),
          `${row.plan || "Sem plano"}${row.monthly_price !== null ? ` · ${money(row.monthly_price)}/mês` : ""}`,
          label(row.status),
          row.transaction_fee_percent === null
            ? "—"
            : `${row.transaction_fee_percent.toLocaleString("pt-BR")}%`,
          dateTime(row.current_period_end),
        ]
      : [
          merchantName(row),
          row.plan || "Sem plano",
          label(row.status),
          String(row.published_checkouts),
          dateTime(row.created_at),
        ];
  if ("reference" in row)
    return [
      row.reference || row.id.slice(0, 8),
      row.customer || "—",
      money(row.amount, row.currency),
      label(row.status),
      dateTime(row.created_at),
    ];
  if ("environment" in row)
    return [
      label(row.provider),
      label(row.environment),
      label(row.status),
      dateTime(row.last_tested_at),
      row.last_test_status ? label(row.last_test_status) : "Não testada",
    ];
  return [
    label(row.action),
    row.merchant,
    label(row.status),
    row.result || (row.source === "admin" ? row.actor || "Administrador" : "—"),
    dateTime(row.created_at),
  ];
}

// Escapes quotes/newlines and neutralizes formulas when opened in a spreadsheet.
function exportPage(rows: AdminRow[], kind: AdminKind) {
  const quote = (value: string) =>
    `"${(/^[\s]*[=+@-]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  const content = [config[kind].headers, ...rows.map((row) => cells(row, kind))]
    .map((row) => row.map(quote).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pavox-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AdminListPage({ kind }: { kind: AdminKind }) {
  const pageConfig = config[kind];
  const [draft, setDraft] = useState("");
  const [filters, setFilters] = useState<ListFilters>({ query: "", status: "", page: 1, days: 30 });
  const [selected, setSelected] = useState<AdminRow | null>(null);
  const query = useAdminList(kind, filters);
  const hasPeriod = kind === "transactions" || kind === "events";
  const filtered = !!filters.query || !!filters.status;
  return (
    <>
      <PageHeader
        title={pageConfig.title}
        subtitle={pageConfig.subtitle}
        actions={
          <Button
            variant="outline"
            className="h-11"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className="size-4" />
            Atualizar
          </Button>
        }
      />
      <section className="surface overflow-hidden" aria-label={pageConfig.title}>
        <div className="flex flex-wrap items-end gap-3 border-b border-border p-4 sm:p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setFilters((f) => ({ ...f, query: draft.trim(), page: 1 }));
            }}
            className="min-w-0 flex-1 basis-64"
          >
            <Label htmlFor={`admin-search-${kind}`} className="mb-2 block text-xs">
              {kind === "transactions"
                ? "Buscar por pedido, cliente ou lojista"
                : kind === "events"
                  ? "Buscar por evento, pedido ou lojista"
                  : "Buscar por nome, e-mail ou identificador"}
            </Label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id={`admin-search-${kind}`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={120}
                  placeholder="Digite sua busca…"
                  className="h-11 bg-background pl-9"
                />
              </div>
              <Button type="submit" className="h-11">
                Buscar
              </Button>
            </div>
          </form>
          <div>
            <Label htmlFor={`admin-status-${kind}`} className="mb-2 block text-xs">
              {kind === "merchants" ? "Assinatura" : "Status"}
            </Label>
            <select
              id={`admin-status-${kind}`}
              value={filters.status}
              onChange={(event) =>
                setFilters((f) => ({ ...f, status: event.target.value, page: 1 }))
              }
              className="h-11 max-w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos os status</option>
              {pageConfig.statuses.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </select>
          </div>
          {hasPeriod && (
            <PeriodSelect
              value={filters.days}
              onChange={(days) => setFilters((f) => ({ ...f, days, page: 1 }))}
            />
          )}
          <Button
            variant="outline"
            className="h-11"
            disabled={!query.data?.rows.length || query.isFetching || query.isError}
            onClick={() => query.data && exportPage(query.data.rows, kind)}
          >
            <Download className="size-4" />
            Exportar página
          </Button>
        </div>
        {filtered && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-5 py-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            <span>
              Filtros ativos{filters.query ? ` · “${filters.query}”` : ""}
              {filters.status ? ` · ${label(filters.status)}` : ""}
            </span>
            <Button
              variant="ghost"
              className="ml-auto min-h-11 text-xs"
              onClick={() => {
                setDraft("");
                setFilters((f) => ({ ...f, query: "", status: "", page: 1 }));
              }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
        {query.isError ? (
          <div className="p-5">
            <AdminError error={query.error} retry={() => void query.refetch()} />
          </div>
        ) : query.isPending ? (
          <AdminLoading />
        ) : (
          <>
            {!query.data?.rows.length ? (
              <AdminEmpty filtered={filtered} />
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[740px] text-left text-sm">
                  <caption className="sr-only">
                    {pageConfig.title} · Página {filters.page}
                  </caption>
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      {pageConfig.headers.map((header) => (
                        <th key={header} scope="col" className="px-5 py-3 font-medium">
                          {header}
                        </th>
                      ))}
                      <th scope="col" className="px-5 py-3">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {query.data.rows.map((row) => {
                      const values = cells(row, kind);
                      const statusIndex = kind === "transactions" ? 3 : 2;
                      return (
                        <tr key={row.id} className="transition-colors hover:bg-muted/30">
                          {values.map((value, index) => (
                            <td
                              key={index}
                              className={`px-5 py-4 ${index === 0 ? "max-w-64" : "whitespace-nowrap"}`}
                            >
                              {index === statusIndex ? (
                                <AdminStatus status={row.status} />
                              ) : (
                                <span
                                  className={
                                    index === 0 ? "block break-words font-semibold" : "tabular-nums"
                                  }
                                >
                                  {value}
                                </span>
                              )}
                              {index === 0 && (
                                <span className="mt-1 block max-w-64 truncate text-xs text-muted-foreground">
                                  {"store_slug" in row
                                    ? row.email
                                    : "merchant" in row && !("source" in row)
                                      ? row.merchant
                                      : "source" in row
                                        ? label(row.source)
                                        : ""}
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="px-5 py-4 text-right">
                            <Button
                              variant="ghost"
                              className="min-h-11"
                              onClick={() => setSelected(row)}
                              aria-label={`Ver detalhes de ${values[0]}`}
                            >
                              Detalhes
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <AdminPagination
              page={filters.page}
              total={query.data?.total ?? 0}
              onChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          </>
        )}
      </section>
      <p className="text-xs leading-5 text-muted-foreground">
        {hasPeriod
          ? "O período considera a data de criação dos registros. Horários de Brasília."
          : "Os filtros consultam todo o histórico cadastrado."}{" "}
        A exportação inclui os registros da página atual.
      </p>
      {selected && (
        <AdminDetail key={selected.id} row={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
