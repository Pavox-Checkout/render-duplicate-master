import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Plataforma", id: "plataforma" },
  { label: "Recursos", id: "recursos" },
  { label: "Como funciona", id: "como-funciona" },
  { label: "Planos", id: "planos" },
  { label: "FAQ", id: "faq" },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNav = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-[oklch(0.16_0.015_264_/_0.72)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:h-[72px]">
        <Link to="/" aria-label="PAVOX — página inicial" className="flex items-center">
          <img src="/pavox-logo.png" alt="PAVOX Checkout" className="h-7 w-auto object-contain sm:h-8" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Seções">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/65 transition-colors hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" className="text-white/80 hover:bg-white/5 hover:text-white">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button
            asChild
            className="group shadow-[0_10px_30px_-12px_oklch(0.55_0.23_262_/_0.8)]"
          >
            <Link to="/cadastro">
              Começar agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "overflow-hidden border-t border-white/10 bg-[oklch(0.16_0.015_264_/_0.96)] backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden",
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-1 px-5 py-4">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className="block w-full rounded-lg px-3 py-3 text-left text-[15px] font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </button>
          ))}
          <div className="mt-3 flex flex-col gap-2 pt-2">
            <Button asChild variant="outline" className="h-11 border-white/15 bg-transparent text-white hover:bg-white/5">
              <Link to="/login" onClick={() => setOpen(false)}>
                Entrar
              </Link>
            </Button>
            <Button asChild className="h-11">
              <Link to="/cadastro" onClick={() => setOpen(false)}>
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
