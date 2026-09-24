import { BarChart3, Crosshair, Radar } from "lucide-react";
import { Section, SectionHeading } from "../section-kit";
import { Reveal } from "../reveal";
import { MarketingMockup } from "../marketing-mockup";

const POINTS = [
  { icon: Crosshair, title: "Pixels integrados", text: "Conecte Meta, Google, TikTok e outros em poucos cliques." },
  { icon: Radar, title: "Rastreamento de eventos", text: "Acompanhe cada etapa da jornada até a conversão." },
  { icon: BarChart3, title: "Decisões com dados", text: "Otimize campanhas com informações confiáveis de venda." },
];

export function Marketing() {
  return (
    <Section className="overflow-hidden">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Reveal from="left" className="order-2 lg:order-1">
          <MarketingMockup />
        </Reveal>

        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Pavox Marketing"
            title={<>Rastreie, entenda e escale.</>}
            description="Integre seus pixels e acompanhe os eventos do checkout para tomar decisões orientadas por dados."
          />
          <div className="mt-8 space-y-3">
            {POINTS.map((p, i) => (
              <Reveal key={p.title} delay={i * 90} from="right">
                <div className="flex gap-3.5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
                    <p.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-[14.5px] font-semibold text-white">{p.title}</p>
                    <p className="mt-1 text-[13px] leading-5 text-white/50">{p.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
