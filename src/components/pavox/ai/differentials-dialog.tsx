import type { ReactNode } from "react";
import {
  BrainCircuit,
  MessagesSquare,
  PenLine,
  Radar,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DIFFERENTIALS = [
  {
    icon: MessagesSquare,
    title: "Analista de dados no chat",
    description:
      "Converse com a IA sobre a sua operação. Ela responde com base nos seus produtos, pedidos e conversão reais — não em respostas genéricas.",
  },
  {
    icon: Radar,
    title: "Detecção de oportunidades",
    description:
      "A Pavox AI cruza seus números e aponta onde há receita parada: pedidos pendentes, quedas de conversão e produtos parados.",
  },
  {
    icon: PenLine,
    title: "Geração de conteúdo",
    description:
      "Descrições de produto, títulos de checkout e mensagens de recuperação escritas para você, já no tom certo para converter.",
  },
  {
    icon: TrendingUp,
    title: "Recomendações acionáveis",
    description:
      "Cada insight vem com o próximo passo prático: order bump, upsell, reposição de estoque ou recuperação de carrinho.",
  },
  {
    icon: BrainCircuit,
    title: "Inteligência contínua",
    description:
      "Quanto mais sua loja vende, mais precisas ficam as análises — a IA acompanha a evolução da sua operação em tempo real.",
  },
  {
    icon: ShieldCheck,
    title: "Seus dados, com segurança",
    description:
      "A análise usa apenas métricas agregadas da sua conta. Nenhum dado sensível de cliente é exposto no processamento.",
  },
] as const;

export function DifferentialsDialog({
  open,
  onOpenChange,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  footer?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-2xl">
        <div className="bg-brand-gradient grid-noise -mx-6 -mt-6 mb-6 px-6 pt-6 pb-7 text-primary-foreground">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase opacity-90">
            Pavox AI · Plano Pro
          </p>
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-2xl font-bold text-primary-foreground">
              O que você desbloqueia com a Pavox AI
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/85">
              Inteligência aplicada aos dados reais da sua operação, feita para transformar números em mais vendas.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DIFFERENTIALS.map((d) => (
            <div key={d.title} className="rounded-xl border border-border p-4">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <d.icon className="h-4.5 w-4.5" />
              </span>
              <p className="text-[14px] font-semibold">{d.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{d.description}</p>
            </div>
          ))}
        </div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
