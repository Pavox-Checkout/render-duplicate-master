import { useState } from "react";
import { CheckCircle2, Globe, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckoutSelect } from "@/components/pavox/checkout-select";
import { DnsHelp, DnsRecordsTable } from "@/components/pavox/dns-records-table";
import { DomainStatusBadge } from "@/components/pavox/domain-status-badge";
import { useAddDomain, useVerifyDomain, type Domain } from "@/lib/domains";

/**
 * Connect a merchant's own domain: the backend attaches it to the PAVOX
 * project on Vercel and returns the exact DNS records to create.
 */
export function DomainAddDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAddDomain();
  const verify = useVerifyDomain();
  const [hostname, setHostname] = useState("");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTimeout(() => {
        setHostname("");
        setCheckoutId(null);
        setDomain(null);
      }, 180);
    }
    onOpenChange(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hostname.trim()) return;
    try {
      setDomain(await add.mutateAsync({ hostname, checkoutId }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível adicionar o domínio.");
    }
  }

  async function check() {
    if (!domain) return;
    try {
      const next = await verify.mutateAsync(domain.id);
      setDomain(next);
      if (next.status === "active") toast.success("Domínio conectado!");
      else toast.info("O DNS ainda não está pronto. Pode levar alguns minutos.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível verificar agora.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />{" "}
            {domain ? "Configure seu DNS" : "Conectar domínio próprio"}
          </DialogTitle>
          <DialogDescription>
            {domain
              ? "Crie os registros abaixo no painel do seu provedor de domínio e clique em Verificar."
              : "Use um endereço da sua marca, como checkout.sualoja.com.br, para abrir seu checkout."}
          </DialogDescription>
        </DialogHeader>

        {!domain ? (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="domain-hostname">Domínio</Label>
              <Input
                id="domain-hostname"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="checkout.sualoja.com.br"
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <p className="text-[12px] text-muted-foreground">
                Recomendamos um subdomínio (ex.: <span className="font-medium">checkout.</span>
                sualoja.com.br). Assim o site principal da sua loja continua funcionando.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Checkout que abre neste domínio</Label>
              <CheckoutSelect
                value={checkoutId}
                onChange={setCheckoutId}
                triggerClassName="w-full"
              />
              <p className="text-[12px] text-muted-foreground">
                O checkout precisa estar publicado.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={add.isPending || !hostname.trim()}>
                {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continuar
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-mono text-[13.5px] font-semibold">{domain.hostname}</p>
              <DomainStatusBadge status={domain.status} />
            </div>
            {domain.status === "active" ? (
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-[13px]">
                <CheckCircle2 className="h-4 w-4 text-success" /> Tudo certo! Seu checkout já abre
                em https://
                {domain.hostname}
              </div>
            ) : (
              <>
                <DnsRecordsTable records={domain.dns_records} />
                <DnsHelp records={domain.dns_records} />
                {domain.last_error ? (
                  <p className="text-[12.5px] text-destructive">{domain.last_error}</p>
                ) : null}
              </>
            )}
            <DialogFooter>
              {domain.status === "active" ? (
                <Button onClick={() => handleOpenChange(false)}>Concluir</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                    Configurar depois
                  </Button>
                  <Button onClick={() => void check()} disabled={verify.isPending}>
                    {verify.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Verificar
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
