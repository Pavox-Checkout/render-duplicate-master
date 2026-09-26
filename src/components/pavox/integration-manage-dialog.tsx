import { useState } from "react";
import { Copy, Loader2, Pencil, Power, RotateCcw, Wifi } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { IntegrationStatusBadge } from "./integration-status-badge";
import { ProviderLogo } from "@/components/pavox/provider-logo";
import {
  ENVIRONMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  getProvider,
  type Environment,
  type ProviderDef,
  type SavedIntegration,
} from "@/lib/payments/catalog";
import {
  integrationWebhookUrl,
  useSetIntegrationStatus,
  useTestIntegration,
} from "@/lib/payments/use-integrations";
import { useAuth } from "@/hooks/useAuth";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function IntegrationManageDialog({
  integration,
  open,
  onOpenChange,
  onEdit,
}: {
  integration: SavedIntegration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (provider: ProviderDef, existing: SavedIntegration) => void;
}) {
  const provider = getProvider(integration.provider);
  const { user } = useAuth();
  const test = useTestIntegration();
  const setStatus = useSetIntegrationStatus();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!provider) return null;

  const isActive = integration.status === "connected";
  const isOAuth = integration.connectionType === "oauth";
  // OAuth connections use the PAVOX application's webhook — nothing to configure.
  const webhookUrl = user && !isOAuth ? integrationWebhookUrl(integration.provider, user.id) : "";

  const onTest = async () => {
    try {
      const res = await test.mutateAsync({ provider: integration.provider });
      if (res.result === "connected") toast.success(res.message);
      else toast.error(res.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível testar a conexão agora.");
    }
  };

  const changeStatus = async (status: "connected" | "disabled") => {
    try {
      await setStatus.mutateAsync({ id: integration.id, status });
      toast.success(status === "disabled" ? "Integração desativada." : "Integração reativada.");
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("integration_not_verified")
          ? "Teste a conexão com sucesso antes de reativar."
          : "Não foi possível atualizar a integração.";
      toast.error(msg);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <ProviderLogo provider={provider} className="h-8 w-8 rounded-lg" />
              {provider.name}
            </DialogTitle>
            <DialogDescription>Gerencie esta conexão de gateway.</DialogDescription>
          </DialogHeader>

          <dl className="divide-y divide-border rounded-lg border border-border text-[13px]">
            <Row label="Status" value={<IntegrationStatusBadge status={integration.status} />} />
            <Row
              label="Ambiente"
              value={ENVIRONMENT_LABELS[integration.environment as Environment]}
            />
            <Row
              label="Métodos habilitados"
              value={
                <div className="flex flex-wrap justify-end gap-1.5">
                  {integration.enabledMethods.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium"
                    >
                      {PAYMENT_METHOD_LABELS[m]}
                    </span>
                  ))}
                </div>
              }
            />
            {integration.accountLabel ? (
              <Row label="Conta" value={integration.accountLabel} />
            ) : null}
            <Row
              label="Conexão"
              value={isOAuth ? `Pelo login do ${provider.name}` : "Chaves coladas manualmente"}
            />
            <Row
              label="Taxa PAVOX"
              value={
                isOAuth
                  ? "Descontada automaticamente em cada venda"
                  : "Não descontada automaticamente"
              }
            />
            <Row label="Conectado em" value={formatDate(integration.createdAt)} />
            <Row label="Atualizado em" value={formatDate(integration.updatedAt)} />
            {(isOAuth ? [] : provider.credentialFields).map((field) => (
              <Row
                key={field.key}
                label={field.label}
                value={
                  <span className="font-mono text-[12px]">
                    {integration.maskedCredentials[field.key] ?? "—"}
                  </span>
                }
              />
            ))}
          </dl>

          {webhookUrl ? (
            <div className="space-y-1.5 rounded-lg border border-border p-3 text-[12.5px]">
              <p className="font-medium">URL de notificações (webhook)</p>
              <p className="text-muted-foreground">
                No painel do {provider.name}, em Suas integrações › Webhooks, cadastre esta URL com
                o evento
                <strong> Order (Mercado Pago)</strong>. Assim os pedidos pagos são confirmados na
                hora.
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-secondary px-2 py-1 font-mono text-[11.5px]">
                  {webhookUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(webhookUrl);
                    toast.success("URL copiada");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onTest()}
              disabled={test.isPending}
            >
              {test.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testando
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" />
                  Testar conexão
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(provider, integration)}>
              <Pencil className="h-4 w-4" />
              {isOAuth ? "Reconectar" : "Editar configuração"}
            </Button>
            <div className="ml-auto">
              {isActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                  disabled={setStatus.isPending}
                >
                  <Power className="h-4 w-4" />
                  Desativar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void changeStatus("connected")}
                  disabled={setStatus.isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reativar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar {provider.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Novos pagamentos deixarão de ser roteados por esta conexão. O histórico é preservado e
              você pode reativar quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void changeStatus("disabled");
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
