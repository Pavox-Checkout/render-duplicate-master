import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeading } from "../section-kit";
import { Reveal } from "../reveal";

const FAQS = [
  {
    q: "Preciso saber programar para usar a PAVOX?",
    a: "Não. O Checkout Builder é visual: você configura etapas, cores e blocos de conversão sem escrever uma linha de código.",
  },
  {
    q: "Quais meios de pagamento são aceitos?",
    a: "Você pode aceitar PIX e cartão de crédito no seu checkout, oferecendo aos clientes as opções mais usadas no Brasil.",
  },
  {
    q: "Posso usar meu próprio domínio?",
    a: "Sim. Nos planos pagos você conecta um domínio personalizado para que o checkout fique com a cara da sua marca.",
  },
  {
    q: "Como funcionam as taxas por transação?",
    a: "Cada plano tem uma taxa por transação: quanto mais avançado o plano, menor a taxa. Você acompanha tudo pelo painel.",
  },
  {
    q: "Consigo trocar de plano depois?",
    a: "Sim. Você pode começar no plano Free e fazer upgrade a qualquer momento conforme suas vendas crescem.",
  },
  {
    q: "A PAVOX serve para produtos digitais e físicos?",
    a: "Sim. A plataforma se adapta a produtos digitais, físicos, assinaturas e infoprodutos, com as etapas certas para cada caso.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <SectionHeading
          eyebrow="Dúvidas frequentes"
          title={<>Tudo o que você precisa saber.</>}
          description="Não encontrou sua resposta? Fale com o nosso time de suporte."
        />

        <Reveal from="right">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-[15px] font-semibold text-white hover:text-primary hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14px] leading-6 text-white/55">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
