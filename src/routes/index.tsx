import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
const logoAsset = { url: "/pavox-logo.png" };

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
    <img
      src={logoAsset.url}
      alt="PAVOX Checkout"
      className="h-auto w-[210px] object-contain sm:w-[238px]"
    />
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

        <section className="relative flex flex-1 items-center pb-10 pt-8 lg:pb-16 lg:pt-0" aria-labelledby="hero-title">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-[-8%] hidden w-[70%] bg-[url('/pavox-banner.png')] bg-[length:auto_100%] bg-[position:115%_center] bg-no-repeat opacity-90 [mask-image:linear-gradient(to_right,transparent_0%,transparent_48%,black_68%,black_100%)] lg:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-8%] right-[12%] hidden h-1/2 w-[48%] rounded-full bg-blue-600/20 blur-[90px] lg:block"
          />

          <div className="relative z-10 max-w-[640px] lg:py-10">
            <p className="mb-5 text-sm font-medium text-foreground/80 sm:text-base">Seu checkout.</p>
            <h1 id="hero-title" className="font-display text-[clamp(2.75rem,5.4vw,5.4rem)] leading-[0.96] font-extrabold">
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
        </section>
      </div>
    </main>
  );
}
