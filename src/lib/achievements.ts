export const PAVOX_MILESTONES = [
  { amount: 100_000, shortLabel: "100K", reward: "Plaquinha PAVOX 100K" },
  { amount: 500_000, shortLabel: "500K", reward: "Plaquinha PAVOX 500K" },
  { amount: 1_000_000, shortLabel: "1M", reward: "Plaquinha PAVOX 1M" },
] as const;

export type PavoxAchievementProgress = {
  revenue: number;
  currentMilestone: (typeof PAVOX_MILESTONES)[number] | null;
  nextMilestone: (typeof PAVOX_MILESTONES)[number] | null;
  percentage: number;
  remaining: number;
  achieved: readonly (typeof PAVOX_MILESTONES)[number][];
  isMaximumReached: boolean;
};

export function calculatePavoxAchievements(revenue: number): PavoxAchievementProgress {
  const safeRevenue = Math.max(0, Number.isFinite(revenue) ? revenue : 0);
  const achieved = PAVOX_MILESTONES.filter((milestone) => safeRevenue >= milestone.amount);
  const nextMilestone = PAVOX_MILESTONES.find((milestone) => safeRevenue < milestone.amount) ?? null;
  const currentMilestone = achieved.at(-1) ?? null;
  const previousAmount = currentMilestone?.amount ?? 0;
  const targetAmount = nextMilestone?.amount ?? PAVOX_MILESTONES.at(-1)!.amount;
  const range = targetAmount - previousAmount;

  return {
    revenue: safeRevenue,
    currentMilestone,
    nextMilestone,
    percentage: nextMilestone ? Math.min(100, Math.max(0, ((safeRevenue - previousAmount) / range) * 100)) : 100,
    remaining: nextMilestone ? Math.max(0, nextMilestone.amount - safeRevenue) : 0,
    achieved,
    isMaximumReached: !nextMilestone,
  };
}
