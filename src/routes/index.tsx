import { createFileRoute } from "@tanstack/react-router";
import { LandingHeader } from "@/components/pavox/landing/landing-header";
import { LandingFooter } from "@/components/pavox/landing/landing-footer";
import { Hero } from "@/components/pavox/landing/sections/hero";
import { Pillars } from "@/components/pavox/landing/sections/pillars";
import { Product } from "@/components/pavox/landing/sections/product";
import { Conversion } from "@/components/pavox/landing/sections/conversion";
import { Marketing } from "@/components/pavox/landing/sections/marketing";
import { Brand } from "@/components/pavox/landing/sections/brand";
import { HowItWorks } from "@/components/pavox/landing/sections/how-it-works";
import { ProductTypes } from "@/components/pavox/landing/sections/product-types";
import { Pricing } from "@/components/pavox/landing/sections/pricing";
import { Trust } from "@/components/pavox/landing/sections/trust";
import { Faq } from "@/components/pavox/landing/sections/faq";
import { FinalCta } from "@/components/pavox/landing/sections/final-cta";

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

function LandingPage() {
  return (
    <div className="dark relative min-h-[100svh] overflow-x-hidden bg-background text-foreground">
      <div className="landing-light pointer-events-none fixed inset-0 z-0" />
      <LandingHeader />
      <main className="relative z-10">
        <Hero />
        <Pillars />
        <Product />
        <Conversion />
        <Marketing />
        <Brand />
        <HowItWorks />
        <ProductTypes />
        <Pricing />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
