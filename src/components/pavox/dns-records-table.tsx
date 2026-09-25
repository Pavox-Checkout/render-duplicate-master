import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { DnsRecord } from "@/lib/domains";

/** DNS records the merchant must create at their domain provider. */
export function DnsRecordsTable({ records }: { records: DnsRecord[] }) {
  const copy = (value: string) => {
    void navigator.clipboard?.writeText(value);
    toast.success("Copiado");
  };

  if (records.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-[64px_1fr_1.4fr] gap-2 border-b border-border bg-secondary/60 px-3 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <span>Tipo</span>
        <span>Nome</span>
        <span>Valor</span>
      </div>
      {records.map((r) => (
        <div
          key={`${r.type}-${r.name}-${r.value}`}
          className="grid grid-cols-[64px_1fr_1.4fr] items-center gap-2 border-b border-border px-3 py-2.5 font-mono text-[12px] last:border-0"
        >
          <span className="font-semibold">{r.type}</span>
          <button
            type="button"
            onClick={() => copy(r.name)}
            className="flex min-w-0 items-center gap-1.5 text-left hover:text-primary"
            aria-label={`Copiar nome ${r.name}`}
          >
            <span className="truncate">{r.name}</span>
            <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => copy(r.value)}
            className="flex min-w-0 items-center gap-1.5 text-left hover:text-primary"
            aria-label={`Copiar valor ${r.value}`}
          >
            <span className="truncate">{r.value}</span>
            <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function DnsHelp({ records }: { records: DnsRecord[] }) {
  const hasTxt = records.some((r) => r.purpose === "ownership");
  return (
    <ul className="list-disc space-y-1 pl-4 text-[12.5px] text-muted-foreground">
      <li>
        No painel onde você comprou o domínio (Registro.br, GoDaddy, Hostinger, Cloudflare…), abra a
        zona de DNS e crie {hasTxt ? "os registros" : "o registro"} acima.
      </li>
      {hasTxt ? (
        <li>
          O registro TXT prova que o domínio é seu. Ele pode ser apagado depois que o domínio
          conectar.
        </li>
      ) : null}
      <li>Na Cloudflare, deixe a nuvem cinza (“DNS only”), sem proxy.</li>
      <li>
        A propagação costuma levar de alguns minutos a algumas horas. O HTTPS (cadeado) é emitido
        automaticamente.
      </li>
    </ul>
  );
}
