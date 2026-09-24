import { useState } from "react";
import { AlertCircle, Check, Copy, Loader2, PenLine, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePavoxContent } from "@/lib/pavox-ai/ai";

type Kind = "descricao" | "checkout" | "recuperacao" | "email";

const KINDS: { value: Kind; label: string; placeholder: string }[] = [
  { value: "descricao", label: "Descrição de produto", placeholder: "Ex: Curso de tráfego pago para iniciantes" },
  { value: "checkout", label: "Título de checkout", placeholder: "Ex: Checkout do plano anual" },
  { value: "recuperacao", label: "Recuperação de carrinho", placeholder: "Ex: Cliente que abandonou o ebook" },
  { value: "email", label: "E-mail de marketing", placeholder: "Ex: Reengajar clientes inativos" },
];

export function ContentGenerator({ context }: { context: string }) {
  const [kind, setKind] = useState<Kind>("descricao");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const active = KINDS.find((k) => k.value === kind)!;

  const generate = async () => {
    if (loading) return;
    setError(null);
    setResult("");
    setLoading(true);
    try {
      const res = await generatePavoxContent({ data: { kind, topic, context } });
      setResult(res.text);
    } catch (err) {
      console.log("[v0] generatePavoxContent error:", err);
      setError("Não consegui gerar o conteúdo agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="surface flex flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <PenLine className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[14px] font-semibold">Gerar conteúdo</p>
          <p className="text-[12px] text-muted-foreground">Textos de venda no tom da sua loja</p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={active.placeholder}
            className="h-9 rounded-lg border border-border bg-card px-3 text-[13.5px] outline-none focus:border-primary/50"
          />
        </div>

        <Button onClick={() => void generate()} disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "Gerando..." : "Gerar conteúdo"}
        </Button>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-[12.5px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-[12px] font-semibold text-muted-foreground">Resultado</span>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px]" onClick={() => void copy()}>
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap px-4 py-3 text-[13.5px] leading-relaxed">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
