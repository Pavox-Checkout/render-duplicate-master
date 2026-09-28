import { ArrowUpRight, CreditCard, Gauge, Smartphone, Target, Zap } from "lucide-react";
import { Reveal } from "../reveal";

const highlights = [
  {
    icon: Zap,
    title: "Menos atrito",
    description: "Uma jornada de pagamento simples e objetiva.",
  },
  {
    icon: CreditCard,
    title: "Mais opções",
    description: "Pix, cartão e boleto em um único checkout.",
  },
  {
    icon: Smartphone,
    title: "Experiência mobile",
    description: "Checkout preparado para compras pelo celular.",
  },
  {
    icon: Target,
    title: "Foco em conversão",
    description: "Recursos pensados para transformar visitas em vendas.",
  },
];

export function PaymentConversion() {
  return (
    <section
      id="conversao"
      aria-labelledby="conversion-title"
      className="relative overflow-hidden bg-[#071127] py-24 text-white sm:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_38%,rgb(0_85_251/0.16),transparent_34%)]"
      />
      <div className="relative mx-auto grid w-full max-w-[1120px] gap-14 px-5 md:px-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center lg:gap-20">
        <Reveal from="left">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#4d8dff]/30 bg-[#0055fb]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8db8ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4d8dff]" />
              Alta conversão
            </span>
            <h2
              id="conversion-title"
              className="mt-6 max-w-[14ch] text-balance font-sans text-[clamp(32px,4.6vw,52px)] font-bold leading-[1.02] tracking-[-0.04em]"
            >
              Mais conversão em cada pagamento.
            </h2>
            <p className="mt-6 max-w-[44ch] text-[17px] leading-7 text-white/60">
              Uma experiência de checkout pensada para reduzir atritos, facilitar o pagamento e
              ajudar seu negócio a vender mais.
            </p>
            <div className="mt-9 border-l-2 border-[#0055fb] pl-5">
              <p className="text-base font-bold text-white">Checkout otimizado para conversão</p>
              <p className="mt-2 max-w-[40ch] text-[15px] leading-6 text-white/55">
                Pix, cartão e boleto em uma experiência simples, rápida e preparada para diferentes
                jornadas de compra.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal from="right" delay={120}>
          <div className="relative rounded-[26px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_30px_100px_-35px_rgb(0_85_251/0.65)] sm:p-4">
            <div className="rounded-[19px] border border-white/10 bg-[#0c1933] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-white/45">Visão do checkout</p>
                  <h3 className="mt-1 text-lg font-bold text-white">Performance de pagamentos</h3>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-[#0055fb]/15 text-[#70a3ff] ring-1 ring-[#0055fb]/30">
                  <Gauge className="size-4" />
                </span>
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-[#09142b] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/45">Fluxo de conversão</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#70a3ff]">
                    <ArrowUpRight className="size-3.5" /> Em movimento
                  </span>
                </div>
                <div
                  className="mt-5 flex h-28 items-end gap-2 sm:gap-3"
                  aria-label="Gráfico qualitativo de evolução do fluxo de conversão"
                >
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex flex-1 items-end rounded-t-md bg-gradient-to-t from-[#0055fb]/25 to-[#70a3ff] opacity-80"
                      style={{ height: `${(index + 2) * 10}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.14em] text-white/30">
                  <span>Entrada</span>
                  <span>Checkout</span>
                  <span>Pagamento</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {["Pix", "Cartão", "Boleto"].map((method, index) => (
                  <div
                    key={method}
                    className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
                  >
                    <span className="text-[11px] text-white/45">{method}</span>
                    <div className="mt-3 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#4d8dff]"
                        style={{ width: `${[78, 64, 48][index]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="relative mx-auto mt-16 grid w-full max-w-[1120px] grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map(({ icon: Icon, title, description }, index) => (
          <Reveal key={title} delay={index * 70} className="bg-[#071127]">
            <div className="h-full p-5 sm:p-6">
              <Icon className="size-5 text-[#70a3ff]" />
              <h3 className="mt-5 text-sm font-bold text-white">{title}</h3>
              <p className="mt-2 text-[13px] leading-5 text-white/50">{description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
