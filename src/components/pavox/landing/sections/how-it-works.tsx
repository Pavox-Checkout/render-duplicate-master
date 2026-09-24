import { Section, SectionHeading } from "../section-kit";
import { Reveal } from "../reveal";

const STEPS = [
  {
    step: "1",
    title: "Crie sua conta",
    text: "Cadastre-se em minutos e acesse o painel da PAVOX.",
  },
  {
    step: "2",
    title: "Monte seu checkout",
    text: "Personalize etapas, cores e blocos de conversão no Builder.",
  },
  {
    step: "3",
    title: "Conecte pagamentos e pixels",
    text: "Ative PIX e cartão e integre suas ferramentas de marketing.",
  },
  {
    step: "4",
    title: "Comece a vender",
    text: "Publique e acompanhe suas vendas em tempo real.",
  },
];

export function HowItWorks() {
  return (
    <Section id="como-funciona">
      <SectionHeading
        align="center"
        eyebrow="Como funciona"
        title={<>Do cadastro à primeira venda.</>}
        description="Um fluxo simples para colocar seu checkout no ar rapidamente."
      />

      <div className="relative mt-14">
        {/* connecting line */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block"
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 100}>
              <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-primary/30 bg-[oklch(0.17_0.02_264)] font-display text-lg font-bold text-primary shadow-[0_0_0_6px_oklch(0.16_0.015_264)]">
                  {s.step}
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-6 text-white/55">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
