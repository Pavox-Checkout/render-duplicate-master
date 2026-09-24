import { Section, SectionHeading } from "../section-kit";
import { Reveal } from "../reveal";

const PILLARS = [
  {
    num: "01",
    title: "Mais controle",
    text: "Tenha liberdade para configurar a experiência de compra.",
  },
  {
    num: "02",
    title: "Mais personalização",
    text: "Adapte o checkout à identidade da sua marca.",
  },
  {
    num: "03",
    title: "Mais conversão",
    text: "Use ferramentas criadas para reduzir atrito e aumentar oportunidades de venda.",
  },
];

export function Pillars() {
  return (
    <Section>
      <SectionHeading
        title={<>Seu checkout não deveria limitar suas vendas.</>}
        description="Crie uma experiência de compra rápida, personalizada e preparada para conversão."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.num} delay={i * 90}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-primary/30 hover:bg-white/[0.035]">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-4 font-display text-[5.5rem] font-bold leading-none text-white/[0.04] transition-colors group-hover:text-primary/10"
              >
                {p.num}
              </span>
              <span className="relative text-sm font-semibold text-primary">{p.num}</span>
              <h3 className="relative mt-4 font-display text-xl font-bold text-white">{p.title}</h3>
              <p className="relative mt-2.5 text-[14.5px] leading-6 text-white/55">{p.text}</p>
              <span className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
