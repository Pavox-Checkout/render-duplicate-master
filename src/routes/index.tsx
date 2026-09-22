import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroDevicesAsset from "@/assets/pavox-hero-devices.png.asset.json";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "PAVOX · Checkout de alta performance" },
      {
        name: "description",
        content:
          "Crie checkouts de alta performance, gerencie produtos e clientes e acompanhe sua operação em tempo real com a PAVOX.",
      },
      { property: "og:title", content: "PAVOX · Seu checkout. Mais conversão. Mais vendas." },
      {
        property: "og:description",
        content: "A plataforma completa para criar checkouts de alta performance e acompanhar tudo em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LandingLogo() {
  return (
    <span className="flex items-center gap-3" aria-label="PAVOX Checkout">
      <span className="bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground shadow-[var(--shadow-glow)] sm:h-11 sm:w-11">
        <span className="font-display text-lg font-extrabold">P</span>
      </span>
      <span>
        <span className="font-display block text-xl leading-none font-extrabold text-foreground sm:text-2xl">
          PAVO<span className="text-primary">X</span>
        </span>
        <span className="mt-1 block text-[8px] font-semibold tracking-[0.36em] text-muted-foreground sm:text-[9px]">
          CHECKOUT
        </span>
      </span>
    </span>
  );
}

function LandingPage() {
  return (
    <main className="dark relative min-h-[100svh] overflow-hidden bg-background text-foreground">
      <div className="landing-light pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-5 sm:px-8 lg:px-14 xl:px-20">
        <header className="flex h-20 shrink-0 items-center justify-between sm:h-24">
          <Link to="/" aria-label="PAVOX — página inicial">
            <LandingLogo />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Acesso à conta">
            <Button asChild variant="ghost" className="text-foreground/80 hover:bg-foreground/5 hover:text-foreground">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/60 bg-primary/5 text-foreground hover:bg-primary/15">
              <Link to="/cadastro">Cadastrar</Link>
            </Button>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-8 pb-8 pt-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-0 lg:pb-14 lg:pt-0">
          <div className="relative z-20 max-w-[650px] lg:py-12">
            <p className="mb-5 text-sm font-medium text-foreground/80 sm:text-base">Seu checkout.</p>
            <h1 className="font-display text-[clamp(2.75rem,5.4vw,5.4rem)] leading-[0.96] font-extrabold">
              <span className="block text-primary">Mais conversão.</span>
              <span className="mt-2 block text-primary">Mais vendas.</span>
            </h1>
            <p className="mt-7 max-w-[590px] text-[15px] leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              A PAVOX é a plataforma completa para criar checkouts de alta performance, gerenciar seus produtos,
              clientes e acompanhar tudo em tempo real.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="group h-12 px-6 shadow-[var(--shadow-glow)]">
                <Link to="/cadastro">
                  Começar agora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="h-12 border-primary/60 bg-transparent px-6 text-foreground hover:bg-primary/10"
              >
                Conhecer a PAVOX
              </Button>
            </div>
          </div>

          <div className="relative -mx-5 min-h-[300px] sm:-mx-8 sm:min-h-[420px] lg:-mr-14 lg:ml-[-8%] lg:min-h-[620px] xl:-mr-20">
            <div className="landing-device-glow absolute inset-x-[14%] bottom-[4%] h-[38%]" />
            <img
              src={heroDevicesAsset.url}
              alt="Painel PAVOX em um notebook e checkout em um celular"
              className="absolute inset-0 h-full w-full object-contain object-center drop-shadow-2xl lg:object-right"
            />
          </div>
        </div>
      </div>
    </main>
  );
}