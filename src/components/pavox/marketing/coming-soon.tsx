import { toast } from "sonner";

/** Honest notice for marketing tools that have no backend yet. */
export function ComingSoonNotice() {
  return (
    <div
      role="note"
      className="rounded-xl border border-warning/50 bg-warning/10 px-4 py-3 text-[15px] text-foreground"
    >
      <b>Em desenvolvimento.</b> Esta ferramenta ainda não funciona no checkout e nada do que você
      configurar aqui é salvo. Ela aparece para você conhecer o que vem por aí.
    </div>
  );
}

/** Replaces fake "salvo com sucesso" messages: tells the truth instead. */
export function notYet() {
  toast.info("Esta ferramenta ainda está em desenvolvimento", {
    description: "Nada foi salvo. Ela ainda não funciona no checkout.",
  });
}
