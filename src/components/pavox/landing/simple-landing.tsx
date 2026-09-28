import { Link } from "@tanstack/react-router";
import { PLAN_CATALOG } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { PaymentConversion } from "./sections/payment-conversion";

/*
 * PAVOX landing page: white, minimal and conventional.
 * Real product screens stand in for photography; every fact comes from the
 * product (plan catalog, supported gateways). Nothing here is invented.
 */

const GATEWAYS = [
  "Mercado Pago",
  "Asaas",
  "Stripe",
  "Pagar.me",
  "Pagou",
  "Appmax",
  "Garu",
  "Beehive",
  "Axion Pay",
  "CredWave",
  "FastPay",
  "Blackcat",
];

// Only features that work today (checked in the code); the full list lives on /planos.
const PLAN_POINTS: Record<string, string[]> = {
  free: ["Produtos ilimitados", "Pedidos, clientes e painel", "Suporte por e-mail"],
  growth: ["Domínio personalizado", "Personalização avançada do checkout", "Suporte prioritário"],
  pro: ["Vários domínios personalizados", "Pavox AI", "Tudo do Growth"],
};

const FAQ = [
  [
    "Onde cai o dinheiro das vendas?",
    "Na sua própria conta do gateway que você conectou. A PAVOX não segura o seu dinheiro.",
  ],
  [
    "Preciso saber programar?",
    "Não. Você cadastra o produto, escolhe as cores da sua loja e copia o link do checkout.",
  ],
  [
    "Quais formas de pagamento o checkout aceita?",
    "Pix, boleto e cartão de crédito. Hoje o cartão é processado pelo Mercado Pago; Pix e boleto funcionam com vários gateways.",
  ],
  [
    "Serve para produto físico?",
    "Serve. Para produto físico, o checkout pede o endereço de entrega. Para digital, só os dados do comprador.",
  ],
  ["Posso mudar de plano depois?", "Pode. Você começa no Free e muda quando quiser."],
];

const brl = (n: number) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });

const btn =
  "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-[10px] px-6 text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const btnPrimary = cn(btn, "bg-[#0055fb] text-white hover:bg-[#0043c9]");
const btnGhost = cn(btn, "text-[#001848] shadow-[inset_0_0_0_1.5px_#e3e7ef] hover:bg-[#f2f5fa]");

export function SimpleLanding() {
  const free = PLAN_CATALOG.find((p) => p.slug === "free");

  return (
    <div className="min-h-[100svh] bg-white font-sans text-[17px] leading-relaxed text-[#0d1733]">
      <header className="sticky top-0 z-50 border-b border-[#e3e7ef] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[68px] max-w-[1120px] items-center gap-7 px-5 md:px-8">
          <Link to="/" aria-label="PAVOX, início" className="-my-2 py-2">
            <img
              src="/pavox-wordmark.png"
              alt="PAVOX"
              width={78}
              height={26}
              className="h-[26px] w-auto"
            />
          </Link>
          <nav aria-label="Seções" className="hidden gap-7 lg:flex">
            {[
              ["Checkout", "checkout"],
              ["Gateways", "gateways"],
              ["Planos", "planos"],
              ["Dúvidas", "duvidas"],
            ].map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-[15.5px] font-semibold text-[#4a5068] hover:text-[#001848]"
              >
                {label}
              </a>
            ))}
          </nav>
          <span className="flex-1" />
          <Link
            to="/login"
            className="-mx-1 -my-3 whitespace-nowrap px-1 py-3 text-[15.5px] font-semibold text-[#4a5068] hover:text-[#001848]"
          >
            Entrar
          </Link>
          <Link to="/cadastro" className={cn(btnPrimary, "h-11 px-4 text-[15px]")}>
            Criar conta grátis
          </Link>
        </div>
      </header>

      <main>
        <section aria-labelledby="hero-h" className="pt-16 lg:pt-[88px]">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <h1
              id="hero-h"
              className="max-w-[20ch] font-sans text-[clamp(36px,5.2vw,58px)] font-bold leading-[1.05] tracking-[-0.03em] text-balance text-[#001848]"
            >
              Checkout para vender com Pix, boleto e cartão.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[19px] text-[#4a5068]">
              Crie a página de pagamento do seu produto em minutos e receba direto na conta do
              gateway que você já usa.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3.5">
              <Link to="/cadastro" className={btnPrimary}>
                Criar conta grátis
              </Link>
              {free && (
                <span className="text-[15px] text-[#6a7085]">
                  Plano Free: R$ {brl(free.monthlyPrice)} por mês e {brl(free.feePercent)}% por
                  venda aprovada.
                </span>
              )}
            </div>
            <div className="-mx-5 mt-14 max-h-[720px] overflow-hidden bg-[#f2f5fa] px-5 pt-5 sm:mx-0 sm:rounded-2xl sm:px-7 sm:pt-7 lg:px-10 lg:pt-10">
              <picture>
                <source media="(max-width: 600px)" srcSet="/landing/painel-celular.jpg" />
                <img
                  src="/landing/painel.jpg"
                  width={1600}
                  height={1000}
                  alt="Painel da PAVOX mostrando o valor vendido no dia, os pagamentos a receber e o gráfico de vendas"
                  className="h-auto w-full rounded-t-[10px] shadow-[0_1px_0_#e3e7ef,0_18px_40px_-18px_rgb(16_20_28/0.16)]"
                />
              </picture>
            </div>
          </div>
        </section>

        <section id="checkout" aria-labelledby="co-h" className="scroll-mt-24 py-[104px]">
          <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-5 md:px-8 lg:grid-cols-[5fr_6fr] lg:gap-[72px]">
            <div>
              <h2
                id="co-h"
                className="font-sans text-[clamp(28px,3.4vw,38px)] font-bold leading-[1.12] tracking-[-0.02em] text-balance text-[#001848]"
              >
                Um checkout que o comprador entende.
              </h2>
              <p className="mt-4 max-w-[46ch] text-[#4a5068]">
                Uma página só, com as cores da sua loja. O comprador preenche os dados, paga com Pix
                pelo QR Code ou copia e cola, e a tela confirma sozinha quando o banco aprova.
              </p>
              <p className="mt-4 max-w-[46ch] text-[#4a5068]">
                Serve para curso e para produto físico: quando precisa de entrega, o checkout já
                pede o endereço.
              </p>
            </div>
            <div className="-mx-5 grid grid-cols-2 gap-2.5 bg-[#f2f5fa] p-5 sm:mx-0 sm:gap-4 sm:rounded-2xl sm:p-7">
              {[
                [
                  "/landing/checkout.jpg",
                  "Antes de pagar",
                  "Checkout de exemplo no celular, com o produto, o total e os campos do comprador",
                ],
                [
                  "/landing/checkout-pago.jpg",
                  "Pix confirmado",
                  "Mesmo checkout depois do Pix, com o carimbo de pago e o andamento do pagamento",
                ],
              ].map(([src, cap, alt]) => (
                <figure key={src} className="m-0">
                  <img
                    src={src}
                    width={780}
                    height={1560}
                    alt={alt}
                    loading="lazy"
                    className="h-auto w-full rounded-[10px] shadow-[0_14px_30px_-16px_rgb(16_20_28/0.18)]"
                  />
                  <figcaption className="mt-2.5 text-center text-sm text-[#6a7085]">
                    {cap}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="gateways" aria-labelledby="gw-h" className="scroll-mt-24 pb-[104px]">
          <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-5 md:px-8 lg:grid-cols-[6fr_5fr] lg:gap-[72px]">
            <div className="lg:order-2">
              <h2
                id="gw-h"
                className="font-sans text-[clamp(28px,3.4vw,38px)] font-bold leading-[1.12] tracking-[-0.02em] text-[#001848]"
              >
                O dinheiro cai na sua conta.
              </h2>
              <p className="mt-4 max-w-[46ch] text-[#4a5068]">
                A PAVOX não segura o seu dinheiro. Você conecta o gateway que já usa e escolhe qual
                recebe o Pix, o boleto e o cartão. Pode trocar quando quiser.
              </p>
            </div>
            <div>
              <ul
                aria-label="Gateways que funcionam com a PAVOX"
                className="m-0 grid list-none grid-cols-2 border-t border-[#e3e7ef] p-0 md:grid-cols-3 md:gap-x-6"
              >
                {GATEWAYS.map((g) => (
                  <li
                    key={g}
                    className="border-b border-[#e3e7ef] py-3.5 font-semibold text-[#001848]"
                  >
                    {g}
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 text-[15px] text-[#6a7085]">
                Hoje o cartão de crédito funciona pelo Mercado Pago.
              </p>
            </div>
          </div>
        </section>

        <PaymentConversion />

        <section id="planos" aria-labelledby="pl-h" className="scroll-mt-24 pb-[104px]">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <div className="max-w-[40ch]">
              <h2
                id="pl-h"
                className="font-sans text-[clamp(28px,3.4vw,38px)] font-bold leading-[1.12] tracking-[-0.02em] text-[#001848]"
              >
                Planos
              </h2>
              <p className="mt-3.5 text-[#4a5068]">
                Uma mensalidade e uma taxa sobre cada venda aprovada. As taxas do seu gateway são
                cobradas por ele, à parte.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PLAN_CATALOG.map((p) => (
                <div
                  key={p.slug}
                  className={cn(
                    "flex flex-col rounded-2xl border-[1.5px] p-7",
                    p.highlight ? "border-[#0055fb]" : "border-[#e3e7ef]",
                  )}
                >
                  <h3 className="font-sans text-xl font-bold tracking-normal text-[#001848]">
                    {p.name}
                    {p.highlight && (
                      <span className="ml-2 text-sm font-semibold text-[#0055fb]">Recomendado</span>
                    )}
                  </h3>
                  <div className="mt-3.5 text-[38px] font-bold tracking-[-0.02em] text-[#001848] tabular-nums">
                    R$ {brl(p.monthlyPrice)}{" "}
                    <small className="text-base font-medium tracking-normal text-[#6a7085]">
                      por mês
                    </small>
                  </div>
                  <div className="mt-1 font-semibold">{brl(p.feePercent)}% por venda aprovada</div>
                  <ul className="mb-6 mt-5 grid list-none gap-2 p-0 text-base text-[#4a5068]">
                    {[p.checkoutLabel, ...(PLAN_POINTS[p.slug] ?? [])].map((f) => (
                      <li key={f} className="relative pl-[18px]">
                        <span
                          aria-hidden="true"
                          className="absolute left-0.5 top-[0.7em] h-1.5 w-1.5 rounded-full bg-[#0055fb]"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/cadastro"
                    className={cn(p.slug === "pro" ? btnGhost : btnPrimary, "mt-auto self-start")}
                  >
                    {p.slug === "free" ? "Criar conta grátis" : `Escolher o ${p.name}`}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="duvidas" aria-labelledby="fq-h" className="scroll-mt-24 pb-[104px]">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <h2
              id="fq-h"
              className="font-sans text-[clamp(28px,3.4vw,38px)] font-bold leading-[1.12] tracking-[-0.02em] text-[#001848]"
            >
              Dúvidas
            </h2>
            <div className="mt-5 max-w-[760px]">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group border-b border-[#e3e7ef]">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-[#001848] [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 flex-none -translate-x-[3px] -translate-y-[3px] rotate-45 border-b-2 border-r-2 border-[#6a7085] transition-transform group-open:translate-y-[2px] group-open:-rotate-135"
                    />
                  </summary>
                  <p className="max-w-[64ch] pb-5 text-[#4a5068]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="comecar" aria-labelledby="fin-h" className="bg-[#001848] py-[88px] text-white">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <h2
              id="fin-h"
              className="max-w-[20ch] font-sans text-[clamp(30px,3.8vw,42px)] font-bold leading-[1.1] tracking-[-0.02em] text-white"
            >
              Crie sua conta e publique seu primeiro checkout.
            </h2>
            <p className="mt-3.5 max-w-[48ch] text-[#b9c6e4]">
              É grátis para começar. Você só paga a taxa quando vende.
            </p>
            <Link to="/cadastro" className={cn(btnPrimary, "mt-7")}>
              Criar conta grátis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#001848] text-[15px] text-[#b9c6e4]">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-7 gap-y-3 px-5 pb-9 pt-7 md:px-8">
          <img
            src="/pavox-logo-white.png"
            alt="PAVOX"
            width={66}
            height={22}
            className="mr-auto h-[22px] w-auto"
          />
          <a href="#planos" className="-m-3 p-3 hover:text-white">
            Planos
          </a>
          <a href="#duvidas" className="-m-3 p-3 hover:text-white">
            Dúvidas
          </a>
          <Link to="/login" className="-m-3 p-3 hover:text-white">
            Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}
