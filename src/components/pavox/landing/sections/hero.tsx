import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "../section-kit";
import { Reveal } from "../reveal";
import { CheckoutMockup } from "../checkout-mockup";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 lg:pt-40 lg:pb-24" aria-labelledby="hero-title">
      {/* Ambient background */}
      <div aria-hidden="true" className="landing-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="landing-glow pointer-events-none absolute right-[-10%] top-[-6%] h-[520px] w-[520px] opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-8">
        {/* Copy */}
        <div className="max-w-xl">
          <Reveal>
            <Eyebrow>Checkout &amp; Commerce Technology</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1
              id="hero-title"
              className="mt-6 font-display text-[clamp(2.6rem,5.2vw,4.4rem)] font-extrabold leading-[0.98] tracking-tight text-white"
            >
              Seu checkout.
              <span className="mt-1.5 block text-gradient-brand">Mais conversão.</span>
              <span className="block text-gradient-brand">Mais vendas.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-lg text-pretty text-[15.5px] leading-7 text-white/60 sm:text-lg sm:leading-8">
              A PAVOX é a plataforma para criar checkouts de alta performance, personalizar a experiência de compra e
              acompanhar suas vendas em um só lugar.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group h-12 px-6 text-[15px] shadow-[0_16px_40px_-14px_oklch(0.55_0.23_262_/_0.85)]"
              >
                <Link to="/cadastro">
                  Começar agora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/15 bg-white/[0.02] px-6 text-[15px] text-white hover:bg-white/5"
              >
                <a href="#plataforma">Conhecer a plataforma</a>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <p className="mt-5 flex items-center gap-2 text-[13px] text-white/45">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Comece gratuitamente.
            </p>
          </Reveal>
        </div>

        {/* Product composition */}
        <Reveal delay={200} from="right" className="relative">
          <div className="relative mx-auto max-w-[520px]">
            {/* Builder recorte behind */}
            <div className="absolute -left-6 -top-8 hidden w-[62%] rotate-[-4deg] rounded-2xl border border-white/10 bg-[oklch(0.18_0.02_264)] p-3 opacity-80 shadow-2xl sm:block lg:-left-14">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">Checkout Builder</p>
              <div className="grid grid-cols-2 gap-2">
                {["Personalização", "Etapas", "Cores", "Pagamento"].map((label) => (
                  <span
                    key={label}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/60"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Checkout window in front */}
            <div className="animate-float-slow relative">
              <CheckoutMockup />
            </div>

            {/* Floating badges */}
            <div className="animate-float absolute -right-3 top-10 hidden items-center gap-1.5 rounded-full border border-white/10 bg-[oklch(0.2_0.02_264)]/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-xl backdrop-blur sm:flex lg:-right-8">
              <Zap className="h-3.5 w-3.5 text-primary" /> PIX aprovado
            </div>
            <div className="animate-float absolute -bottom-4 -left-2 hidden items-center gap-1.5 rounded-full border border-white/10 bg-[oklch(0.2_0.02_264)]/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-xl backdrop-blur sm:flex lg:-left-10" style={{ animationDelay: "1.2s" }}>
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Order Bump ativo
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
