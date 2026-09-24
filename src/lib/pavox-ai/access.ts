import { useSubscription } from "@/lib/billing";

/** Slug do plano que libera a Pavox AI. Fonte única de verdade. */
export const PAVOX_AI_PLAN_SLUG = "pro";

export type PavoxAiAccess = {
  /** true somente quando a assinatura ativa é do plano Pro. */
  hasAccess: boolean;
  /** Slug do plano atual (ou null se não houver assinatura). */
  planSlug: string | null;
  /** Nome do plano atual para exibição. */
  planName: string | null;
  /** Ainda carregando a assinatura. */
  isLoading: boolean;
};

/**
 * Hook reutilizável que decide se a conta tem acesso à Pavox AI.
 * Usado pela rota, pela sidebar e pelo header — uma única lógica, sem duplicação.
 */
export function usePavoxAiAccess(): PavoxAiAccess {
  const { data: subscription, isLoading } = useSubscription();
  const planSlug = subscription?.plan?.slug ?? null;
  const isActive = subscription?.status === "active";

  return {
    hasAccess: isActive && planSlug === PAVOX_AI_PLAN_SLUG,
    planSlug,
    planName: subscription?.plan?.name ?? null,
    isLoading,
  };
}
