import { Fingerprint, Globe, Palette } from "lucide-react";
import { Section } from "../section-kit";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: Palette,
    title: "Identidade visual",
    text: "Aplique logo, cores e tipografia da sua marca em todo o checkout.",
  },
  {
    icon: Globe,
    title: "Domínio próprio",
    text: "Ofereça uma experiência coerente no seu próprio endereço.",
  },
  {
    icon: Fingerprint,
    title: "Confiança na compra",
    text: "Um checkout com a sua cara transmite segurança e reduz o abandono.",
  },
];

export function Brand() {
  return (
    <Section>
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/[0.14] via-white/[0.02] to-transparent p-8 sm:p-12">
          <div
            aria-hidden="true"
            className="landing-glow pointer-events-none absolute right-[-6%] top-[-20%] h-[340px] w-[340px] opacity-50"
          />
          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <h2 className="font-display text-[clamp(1.75rem,3.6vw,2.85rem)] font-bold leading-[1.06] text-white">
                A sua marca no centro da experiência.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-white/55">
                Personalize cada detalhe para que o checkout seja uma extensão natural da sua loja — do primeiro clique
                até a confirmação do pagamento.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {ITEMS.map((item, i) => (
                <Reveal key={item.title} delay={i * 90} from="right">
                  <div
                    className={cn(
                      "flex h-full gap-3.5 rounded-2xl border border-white/10 bg-[oklch(0.17_0.02_264)]/70 p-5 backdrop-blur-sm",
                    )}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                      <item.icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-[12.5px] leading-5 text-white/55">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
