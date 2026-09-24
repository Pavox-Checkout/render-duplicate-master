import { Box, GraduationCap, Package, Repeat } from "lucide-react";
import { Section, SectionHeading } from "../section-kit";
import { Reveal } from "../reveal";

const TYPES = [
  { icon: Box, title: "Produtos digitais", text: "E-books, cursos, templates e downloads." },
  { icon: Package, title: "Produtos físicos", text: "Com etapas de entrega e frete no fluxo." },
  { icon: Repeat, title: "Assinaturas", text: "Cobranças recorrentes para receita previsível." },
  { icon: GraduationCap, title: "Infoprodutos", text: "Mentorias, comunidades e área de membros." },
];

export function ProductTypes() {
  return (
    <Section>
      <SectionHeading
        align="center"
        eyebrow="Para todo tipo de negócio"
        title={<>Um checkout para cada modelo de venda.</>}
        description="Seja qual for o seu produto, a PAVOX se adapta à sua operação."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((t, i) => (
          <Reveal key={t.title} delay={i * 80}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.035]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                <t.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-[16px] font-bold text-white">{t.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-white/55">{t.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
