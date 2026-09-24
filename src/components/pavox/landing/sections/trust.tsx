import { CreditCard, Gauge, Lock, ShieldCheck } from "lucide-react";
import { Section } from "../section-kit";
import { Reveal } from "../reveal";

const ITEMS = [
  { icon: ShieldCheck, title: "Segurança em primeiro lugar", text: "Ambiente protegido e conforme as boas práticas do mercado." },
  { icon: Lock, title: "Dados criptografados", text: "Informações de pagamento tratadas com criptografia." },
  { icon: CreditCard, title: "PIX e cartão", text: "Aceite os principais meios de pagamento do Brasil." },
  { icon: Gauge, title: "Alta performance", text: "Checkout leve e rápido para não perder vendas." },
];

export function Trust() {
  return (
    <Section>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ITEMS.map((item, i) => (
          <Reveal key={item.title} delay={i * 80}>
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="text-[14.5px] font-semibold text-white">{item.title}</p>
              <p className="text-[12.5px] leading-5 text-white/50">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
