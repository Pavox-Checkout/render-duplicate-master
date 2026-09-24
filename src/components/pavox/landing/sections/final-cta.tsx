import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "../reveal";

export function FinalCta() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/30 bg-gradient-to-br from-primary/25 via-[oklch(0.2_0.05_264)] to-[oklch(0.16_0.02_264)] px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="landing-grid pointer-events-none absolute inset-0 opacity-40"
            />
            <div
              aria-hidden="true"
              className="landing-glow pointer-events-none absolute left-1/2 top-[-30%] h-[420px] w-[420px] -translate-x-1/2 opacity-60"
            />

            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.03] text-white">
                Pronto para vender com um checkout de verdade?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-[15.5px] leading-7 text-white/70 sm:text-lg">
                Crie sua conta gratuitamente e monte seu primeiro checkout hoje mesmo.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="group h-12 px-7 text-[15px] shadow-[0_18px_44px_-14px_oklch(0.55_0.23_262_/_0.9)]"
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
                  className="h-12 border-white/20 bg-white/[0.03] px-7 text-[15px] text-white hover:bg-white/10"
                >
                  <Link to="/login">Já tenho conta</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
