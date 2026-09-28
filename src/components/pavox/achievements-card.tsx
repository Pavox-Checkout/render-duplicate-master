import { Award, LockKeyhole } from "lucide-react";
import { brl } from "@/lib/mock";
import { useOrders } from "@/lib/pavox-data";
import { calculatePavoxAchievements, PAVOX_MILESTONES } from "@/lib/achievements";
import { cn } from "@/lib/utils";

/** Conquistas PAVOX: revenue milestones, shown on the account page (not the panel). */
export function AchievementsCard() {
  const { data: orders = [], isError } = useOrders();
  const revenue = orders
    .filter((o) => o.status === "Aprovado")
    .reduce((sum, o) => sum + Number(o.amount), 0);
  const progress = calculatePavoxAchievements(revenue);

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
      aria-labelledby="conquistas-pavox-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="conquistas-pavox-title" className="text-lg font-bold">
            Conquistas PAVOX
          </h2>
          <p className="mt-1 max-w-[52ch] text-[15px] text-muted-foreground">
            {isError
              ? "Não foi possível carregar seu faturamento acumulado."
              : progress.isMaximumReached
                ? "Você desbloqueou a conquista máxima atual: a plaquinha PAVOX 1M."
                : progress.revenue === 0
                  ? "Cada venda aprovada conta para a sua próxima plaquinha PAVOX."
                  : progress.revenue < PAVOX_MILESTONES[0].amount
                    ? `Faltam ${brl(progress.remaining)} para a sua primeira plaquinha PAVOX.`
                    : `Você já faturou ${brl(progress.revenue)}. Continue para a próxima conquista.`}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[13px] text-muted-foreground">Faturamento acumulado</p>
          <p className="text-2xl font-bold tabular-nums">{isError ? "—" : brl(progress.revenue)}</p>
        </div>
      </div>

      <div
        className="mt-5 h-2.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={isError ? 0 : Math.round(progress.percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso até o próximo marco"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${isError ? 0 : progress.percentage}%` }}
        />
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {PAVOX_MILESTONES.map((m) => {
          const achieved = !isError && progress.revenue >= m.amount;
          return (
            <li
              key={m.amount}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5",
                achieved ? "border-primary/40 text-primary" : "border-border text-muted-foreground",
              )}
            >
              {achieved ? (
                <Award className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <LockKeyhole className="size-4 shrink-0" aria-hidden="true" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-semibold">R$ {m.shortLabel}</span>
                <span className="block truncate text-[12.5px]">
                  {achieved ? "Alcançado" : m.reward}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
