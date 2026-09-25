function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-medium text-foreground">{value}</p>
    </div>
  );
}

export function PavoxSupportSummary({
  reason,
  email,
  message,
}: {
  reason: string;
  email: string;
  message: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3.5">
      <SummaryRow label="Assunto" value={reason} />
      <SummaryRow label="E-mail" value={email || "Não informado"} />
      <SummaryRow label="Mensagem" value={message.trim() || "Não informado"} />
    </div>
  );
}
