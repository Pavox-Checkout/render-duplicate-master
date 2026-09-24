/**
 * Dados de DEMONSTRAÇÃO da seção de Domínios.
 *
 * ⚠️ Somente para renderização da interface. Nada aqui persiste, consulta o
 * Supabase ou verifica DNS/SSL de verdade. Um DEV pode substituir este arquivo
 * (ou o hook `useDomainsDemo`) por dados reais do backend mantendo os mesmos
 * tipos/campos: `currentDomains`, `domainLimit`, `planName`, e a lista `domains`.
 */

export type DomainType = "pavox" | "custom";

export type DomainStatus = "connected" | "awaiting_dns" | "verifying" | "error";

export interface DemoDomain {
  id: string;
  /** Domínio completo exibido ao usuário. */
  domain: string;
  type: DomainType;
  status: DomainStatus;
  /**
   * ID do checkout real associado (vem de `useCheckouts`). `null` quando ainda
   * não há checkout associado. Nenhum checkout fictício é usado aqui.
   */
  checkoutId: string | null;
  isPrimary: boolean;
  /** Data de conexão já formatada para exibição. */
  connectedAt: string;
}

/** Rótulos e cores dos status — reutilizados pelo badge. */
export const DOMAIN_STATUS: Record<
  DomainStatus,
  { label: string; tone: "success" | "warning" | "neutral" | "error"; pulse?: boolean }
> = {
  connected: { label: "Conectado", tone: "success" },
  awaiting_dns: { label: "Aguardando configuração", tone: "neutral" },
  verifying: { label: "Verificando", tone: "warning", pulse: true },
  error: { label: "Erro na verificação", tone: "error" },
};

export const DOMAIN_TYPE_LABEL: Record<DomainType, string> = {
  pavox: "Domínio PAVOX",
  custom: "Domínio próprio",
};

/**
 * Limites por plano — apenas para preparar a UI. A regra real de billing NÃO
 * é consultada aqui.
 */
export const PLAN_DOMAIN_LIMITS: Record<string, number> = {
  Free: 1,
  Growth: 3,
  Pro: 5,
};

/** Sufixo dos domínios PAVOX (apenas visual). */
export const PAVOX_DOMAIN_SUFFIX = "checkout.pavox.com.br";

/** Alvo de CNAME exibido na etapa de DNS (apenas visual). */
export const PAVOX_CNAME_TARGET = "domains.pavox.com.br";

/**
 * Lista inicial de domínios. Começa VAZIA — não há domínios fictícios. Os
 * domínios reais serão adicionados pelo usuário (e, futuramente, persistidos).
 */
export const INITIAL_DEMO_DOMAINS: DemoDomain[] = [];
