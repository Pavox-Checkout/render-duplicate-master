import { useRef, useState } from "react";
import { AlertCircle, ArrowUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { askPavoxAi, type ChatMessage } from "@/lib/pavox-ai/ai";

const SUGGESTIONS = [
  "Onde estou perdendo vendas?",
  "Como aumentar meu ticket médio?",
  "O que priorizar esta semana?",
  "Minha conversão está boa?",
] as const;

export function ChatPanel({ context }: { context: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));

    try {
      const res = await askPavoxAi({ data: { messages: next, context } });
      setMessages((prev) => [...prev, { role: "assistant", content: res.text }]);
    } catch (err) {
      console.log("[v0] askPavoxAi error:", err);
      setError("Não consegui responder agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="surface flex h-[520px] flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[14px] font-semibold">Converse com a Pavox AI</p>
          <p className="text-[12px] text-muted-foreground">Respostas baseadas nos dados reais da sua loja</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[14px] font-semibold">Pergunte o que quiser sobre a sua operação</p>
              <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-muted-foreground">
                A Pavox AI analisa seus produtos, pedidos e conversão para responder com contexto.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card",
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-[13px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analisando seus dados...
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-[12.5px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Escreva sua pergunta..."
            className="max-h-32 flex-1 resize-none bg-transparent py-1 text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg"
            disabled={!input.trim() || loading}
            onClick={() => void send(input)}
            aria-label="Enviar"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
