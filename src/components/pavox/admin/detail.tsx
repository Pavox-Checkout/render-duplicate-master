import { useState, type ReactNode } from "react";
import { ExternalLink, Loader2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminError, AdminLoading, AdminStatus } from "./shared";
import {
  adminErrorMessage,
  count,
  dateTime,
  label,
  merchantName,
  money,
  useAddAdminNote,
  useAdminAccess,
  useAdminMerchant,
  type AdminRow,
  type MerchantRow,
} from "@/lib/admin/data";
import { toast } from "sonner";

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{title}</dt>
      <dd className="mt-1 break-words text-sm font-medium">
        {children === "" || children == null ? "—" : children}
      </dd>
    </div>
  );
}

function MerchantOperations({ merchant }: { merchant: MerchantRow }) {
  const query = useAdminMerchant(merchant.id);
  const access = useAdminAccess();
  const note = useAddAdminNote();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (body.trim().length < 3) {
      setError("Escreva uma nota com pelo menos 3 caracteres.");
      return;
    }
    try {
      await note.mutateAsync({ merchantId: merchant.id, body: body.trim() });
      setBody("");
      toast.success("Nota interna salva");
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  };
  return (
    <div className="space-y-5 border-t border-border pt-5">
      {query.isError ? (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <AdminLoading />
      ) : (
        query.data && (
          <>
            <dl className="grid grid-cols-2 gap-4">
              <Field title="Pedidos · todo o histórico">{count(query.data.orders)}</Field>
              <Field title="Volume aprovado · todo o histórico">{money(query.data.volume)}</Field>
            </dl>
            <section>
              <h3 className="mb-3 text-sm font-semibold">Checkouts recentes</h3>
              {query.data.checkouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum checkout cadastrado.</p>
              ) : (
                <ul className="space-y-2">
                  {query.data.checkouts.map((checkout) => (
                    <li
                      key={checkout.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <span className="min-w-0 text-sm">
                        <span className="block break-words font-medium">{checkout.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {checkout.published ? "Publicado" : "Não publicado"}
                        </span>
                      </span>
                      {checkout.published && (
                        <Button asChild variant="ghost" size="icon" className="size-11 shrink-0">
                          <a
                            href={`/c/${encodeURIComponent(merchant.store_slug)}/${encodeURIComponent(checkout.slug)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Abrir checkout ${checkout.name}`}
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="text-sm font-semibold">Notas internas</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Últimas 50 notas, visíveis apenas para a administração.
              </p>
              {access.data?.role === "admin" && (
                <form className="mt-4 space-y-2" onSubmit={(event) => void submit(event)}>
                  <Label htmlFor="admin-note">Adicionar nota</Label>
                  <Textarea
                    id="admin-note"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={2000}
                    disabled={note.isPending}
                    placeholder="Registre o acompanhamento deste lojista…"
                    aria-invalid={!!error}
                    aria-describedby={error ? "admin-note-error" : "admin-note-hint"}
                    className="min-h-24"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span id="admin-note-hint" className="text-xs text-muted-foreground">
                      {body.length}/2000 caracteres
                    </span>
                    <Button type="submit" disabled={note.isPending} className="min-h-11">
                      {note.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MessageSquarePlus className="size-4" />
                      )}
                      Salvar nota
                    </Button>
                  </div>
                  {error && (
                    <p id="admin-note-error" role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                </form>
              )}
              <ul className="mt-4 space-y-3">
                {query.data.notes.map((item) => (
                  <li key={item.id} className="rounded-lg border border-border bg-card p-3">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.actor || "Administrador"} · {dateTime(item.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
              {query.data.notes.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">Nenhuma nota registrada.</p>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}

export function AdminDetail({ row, onClose }: { row: AdminRow; onClose: () => void }) {
  const title =
    "store_slug" in row
      ? merchantName(row)
      : "reference" in row
        ? row.reference || "Detalhes da transação"
        : "provider" in row && "environment" in row
          ? label(row.provider)
          : "Detalhes da atividade";
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl sm:max-w-xl [&>button]:size-11 [&>button]:right-1 [&>button]:top-1 [&>button]:grid [&>button]:place-items-center">
        <DialogHeader className="pr-8">
          <DialogTitle className="break-words leading-6">{title}</DialogTitle>
          <DialogDescription>Informações registradas na plataforma Pavox.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field title="Status">
            <AdminStatus status={row.status} />
          </Field>
          <Field title="Cadastro / registro">{dateTime(row.created_at)}</Field>
          {"store_slug" in row ? (
            <>
              <Field title="Responsável">{row.full_name}</Field>
              <Field title="E-mail">{row.email}</Field>
              <Field title="Identificador da loja">{row.store_slug}</Field>
              <Field title="Plano">{row.plan || "Sem plano"}</Field>
              <Field title="Mensalidade do plano">
                {row.monthly_price === null ? "—" : money(row.monthly_price)}
              </Field>
              <Field title="Taxa do plano">
                {row.transaction_fee_percent === null
                  ? "—"
                  : `${row.transaction_fee_percent.toLocaleString("pt-BR")}%`}
              </Field>
              <Field title="Fim do período">{dateTime(row.current_period_end)}</Field>
              <Field title="Checkouts publicados">{row.published_checkouts}</Field>
            </>
          ) : "reference" in row ? (
            <>
              <Field title="Lojista">{row.merchant}</Field>
              <Field title="Cliente">{row.customer}</Field>
              <Field title="E-mail do cliente">{row.customer_email}</Field>
              <Field title="Valor">{money(row.amount, row.currency)}</Field>
              <Field title="Taxa registrada">{money(row.platform_fee, row.currency)}</Field>
              <Field title="Pagamento">{label(row.payment_method)}</Field>
              <Field title="Gateway">{label(row.gateway)}</Field>
              <Field title="Aprovado em">{dateTime(row.paid_at)}</Field>
            </>
          ) : "environment" in row ? (
            <>
              <Field title="Lojista">{row.merchant}</Field>
              <Field title="Ambiente">{label(row.environment)}</Field>
              <Field title="Meios habilitados">
                {row.enabled_payment_methods.map(label).join(", ") || "Nenhum"}
              </Field>
              <Field title="Último teste">{dateTime(row.last_tested_at)}</Field>
              <Field title="Resultado do teste">
                {row.last_test_status ? label(row.last_test_status) : "Ainda não testada"}
              </Field>
            </>
          ) : (
            <>
              <Field title="Origem">{label(row.source)}</Field>
              <Field title="Lojista">{row.merchant}</Field>
              <Field title="Evento">{label(row.action)}</Field>
              <Field title="Resultado">{row.result}</Field>
              <Field title="Gateway">{label(row.provider)}</Field>
              <Field title="Responsável">{row.actor}</Field>
              <Field title="Pedido">{row.order_id}</Field>
            </>
          )}
          <div className="sm:col-span-2">
            <Field title="ID do registro">
              <span className="font-mono text-xs">{row.id}</span>
            </Field>
          </div>
        </dl>
        {"store_slug" in row && <MerchantOperations merchant={row} />}
      </DialogContent>
    </Dialog>
  );
}
