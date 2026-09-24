import { BadgePercent, FlaskConical, Radio, RotateCcw, ShoppingCart, Star, Ticket, Timer } from "lucide-react";
import { Section, SectionHeading } from "../section-kit";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";

export function Conversion() {
  return (
    <Section id="recursos">
      <SectionHeading
        eyebrow="Conversão"
        title={<>Mais do que um checkout.</>}
        description="Ferramentas para transformar cada etapa da jornada em uma oportunidade de venda."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
        {/* Order Bump — large feature */}
        <Reveal className="md:col-span-3 md:row-span-2" from="up">
          <Card className="h-full">
            <CardHead icon={ShoppingCart} title="Order Bump" featured />
            <p className="mt-2 text-[13.5px] leading-6 text-white/55">
              Ofereça um complemento no momento certo, direto no resumo do pedido.
            </p>
            <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-primary/[0.06] p-4">
              <label className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-primary text-primary-foreground">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[13px] font-medium text-white">Adicione por apenas R$ 27,00</span>
              </label>
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <span className="h-9 w-9 rounded-md bg-gradient-to-br from-primary/40 to-primary/5 ring-1 ring-white/10" />
                <div className="flex-1">
                  <div className="h-2 w-2/3 rounded bg-white/15" />
                  <div className="mt-1.5 h-1.5 w-1/3 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Upsell */}
        <Reveal className="md:col-span-3" delay={80} from="up">
          <Card className="h-full">
            <CardHead icon={Star} title="Upsell" />
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[13px] font-semibold text-primary">Oferta especial para você</p>
              <p className="mt-1 text-[12px] text-white/50">Aproveite antes de finalizar a compra.</p>
            </div>
          </Card>
        </Reveal>

        {/* Compra ao vivo */}
        <Reveal className="md:col-span-2" delay={140} from="up">
          <Card className="h-full">
            <CardHead icon={Radio} title="Compra ao vivo" />
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <span className="h-2 w-2 animate-dot rounded-full bg-emerald-400" />
              <span className="text-[12px] text-white/70">João acabou de comprar</span>
            </div>
          </Card>
        </Reveal>

        {/* Escassez */}
        <Reveal className="md:col-span-1" delay={200} from="up">
          <Card className="h-full">
            <CardHead icon={Timer} title="Escassez" compact />
            <p className="mt-3 text-[11.5px] leading-5 text-white/55">Oferta disponível por tempo limitado</p>
          </Card>
        </Reveal>
      </div>

      {/* Secondary row of tools */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Ticket, title: "Cupons" },
          { icon: BadgePercent, title: "Provas sociais" },
          { icon: RotateCcw, title: "Recuperação" },
          { icon: FlaskConical, title: "A/B Testing" },
        ].map((t, i) => (
          <Reveal key={t.title} delay={i * 70}>
            <div className="flex h-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-primary/30 hover:bg-white/[0.035]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
                <t.icon className="h-4 w-4" />
              </span>
              <span className="text-[13.5px] font-semibold text-white">{t.title}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-primary/25",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardHead({
  icon: Icon,
  title,
  featured,
  compact,
}: {
  icon: React.ElementType;
  title: string;
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid place-items-center rounded-lg text-primary ring-1 ring-primary/20",
          featured ? "h-11 w-11 bg-primary/15" : "h-9 w-9 bg-primary/12",
          compact && "h-8 w-8",
        )}
      >
        <Icon className={featured ? "h-5 w-5" : "h-4 w-4"} />
      </span>
      <h3 className={cn("font-display font-bold text-white", featured ? "text-xl" : "text-[15px]")}>{title}</h3>
    </div>
  );
}
