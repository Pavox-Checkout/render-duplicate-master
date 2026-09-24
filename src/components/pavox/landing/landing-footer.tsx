import { Link } from "@tanstack/react-router";

const COLUMNS: { title: string; links: string[] }[] = [
  { title: "Produto", links: ["Checkout", "Builder", "Marketing", "Analytics"] },
  { title: "Empresa", links: ["Sobre", "Contato"] },
  { title: "Suporte", links: ["Central de ajuda", "Suporte"] },
  { title: "Legal", links: ["Termos de uso", "Política de privacidade"] },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-[oklch(0.14_0.015_264)]">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2">
            <img src="/pavox-logo.png" alt="PAVOX Checkout" className="h-8 w-auto object-contain" />
            <p className="mt-4 max-w-[240px] text-sm leading-6 text-white/45">
              Plataforma de checkout e commerce technology para criar experiências de compra de alta performance.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="cursor-default text-[13px] text-white/45 transition-colors hover:text-white/75">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-white/40">© 2026 PAVOX. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-[13px] font-medium text-white/55 transition-colors hover:text-white"
            >
              Entrar
            </Link>
            <span className="h-3 w-px bg-white/15" />
            <Link
              to="/cadastro"
              className="text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
            >
              Começar agora
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
