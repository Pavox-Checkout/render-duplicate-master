import { Link } from "@tanstack/react-router";
import { ArrowRight, MousePointerClick, Palette, Smartphone, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "../section-kit";
import { Reveal } from "../reveal";
import { BuilderMockup } from "../builder-mockup";

const POINTS = [
  { icon: MousePointerClick, label: "Editor visual", text: "Monte o checkout arrastando e configurando cada bloco." },
  { icon: Palette, label: "Personalização", text: "Logo, cores e identidade da sua marca em todo o fluxo." },
  { icon: Workflow, label: "Etapas inteligentes", text: "Defina as etapas conforme o tipo de produto." },
  { icon: Smartphone, label: "Experiência responsiva", text: "Perfeito no desktop e no celular, sem ajustes." },
];

export function Product() {
  return (
    <Section id="plataforma" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="landing-glow pointer-events-none absolute left-[-8%] top-1/3 h-[380px] w-[380px] opacity-40"
      />
      <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <SectionHeading
            eyebrow="A plataforma"
            title={<>O checkout do seu jeito.</>}
            description="Crie, personalize e publique experiências de compra sem depender de layouts engessados."
          />

          <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {POINTS.map((p, i) => (
              <Reveal key={p.label} delay={i * 80}>
                <div className="flex h-full gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-white">{p.label}</p>
                    <p className="mt-1 text-[12.5px] leading-5 text-white/50">{p.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-8">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group h-12 border-primary/40 bg-primary/[0.06] px-6 text-white hover:bg-primary/12"
            >
              <Link to="/cadastro">
                Conhecer o Builder
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        <Reveal from="right" delay={120}>
          <BuilderMockup />
        </Reveal>
      </div>
    </Section>
  );
}
