import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Gauge, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/pavox-ai")({
  component: PavoxAI,
  head: () => ({
    meta: [
      { title: "Pavox AI · Seu checkout começa a pensar" },
      {
        name: "description",
        content:
          "A inteligência da PAVOX analisa o comportamento dos clientes e aponta oportunidades de conversão.",
      },
      { property: "og:title", content: "Pavox AI · Seu checkout começa a pensar" },
      { property: "og:description", content: "Diagnóstico, previsão e recomendações de conversão." },
    ],
  }),
});

const cards = [
  {
    icon: Brain,
    title: "Diagnóstico automático",
    text: "Encontramos 3 oportunidades de melhoria.",
  },
  {
    icon: Gauge,
    title: "Previsão de conversão",
    text: "Seu checkout pode alcançar 5,4% de conversão.",
  },
  {
    icon: Lightbulb,
    title: "Recomendação",
    text: "Reduzir campos do formulário pode diminuir o abandono.",
  },
];

const findings = [
  {
    title: "Campo de CPF causa 11% do abandono",
    text: "Clientes mobile desistem ao preencher documento antes do pagamento.",
    impact: "+0,42 p.p. de conversão",
  },
  {
    title: "Pix sem destaque visual",
    text: "48% das vendas são Pix, mas o método aparece em terceiro lugar no checkout.",
    impact: "+0,31 p.p. de conversão",
  },
  {
    title: "Recuperação por WhatsApp desativada",
    text: "R$ 18.400 em carrinhos abandonados sem nenhum contato nas últimas 4 semanas.",
    impact: "+R$ 5.700 em receita",
  },
];

function PavoxAI() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const run = () => {
    setState("loading");
    setTimeout(() => {
      setState("done");
      toast.success("Análise concluída", { description: "3 oportunidades identificadas." });
    }, 1800);
  };

  return (
    <>
      <section className="surface grid-noise relative overflow-hidden px-6 py-12 text-center sm:px-10 sm:py-16">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-[var(--shadow-glow)]">
          <Sparkles className="h-6 w-6" />
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl text-3xl font-bold sm:text-[40px] sm:leading-[1.1]">
          <span className="text-gradient-brand">Seu checkout começa a pensar.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground">
          A inteligência da PAVOX analisa o comportamento dos seus clientes e identifica
          oportunidades para aumentar sua conversão.
        </p>
        <div className="mt-7">
          <Button size="lg" onClick={run} disabled={state === "loading"}>
            {state === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Executar análise
              </>
            )}
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="surface p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <c.icon className="h-[18px] w-[18px]" />
            </span>
            <h3 className="mt-4 font-semibold">{c.title}</h3>
            <p className="mt-1 text-[13.5px] text-muted-foreground">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="surface p-5">
        <h2 className="text-base font-semibold">Oportunidades detectadas</h2>
        <p className="text-[13px] text-muted-foreground">
          Resultados priorizados por impacto estimado na receita.
        </p>

        {state === "idle" && (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="font-semibold">Nenhuma análise executada ainda</p>
            <p className="max-w-sm text-[13px] text-muted-foreground">
              Execute a análise para a PAVOX examinar os últimos 30 dias do seu checkout.
            </p>
          </div>
        )}

        {state === "loading" && (
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        )}

        {state === "done" && (
          <div className="mt-5 space-y-3">
            {findings.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-[13px] text-muted-foreground">{f.text}</p>
                </div>
                <span className="w-fit rounded-full bg-success/12 px-3 py-1 text-[12.5px] font-semibold text-success">
                  {f.impact}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
