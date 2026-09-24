/**
 * Fonte dos checkouts reais da conta logada.
 *
 * ⚠️ Ainda NÃO busca dados. Este hook está preparado para o DEV plugar a busca
 * real (ex.: SWR + Supabase / API) mantendo exatamente este contrato:
 *
 *   { checkouts, isLoading, error, refetch }
 *
 * Regras desta etapa (frontend/UI):
 * - Não usar dados fictícios/mockados como fallback.
 * - Enquanto a busca real não é implementada, o estado padrão é "sem checkouts"
 *   (lista vazia, sem loading, sem erro) — a interface renderiza o estado vazio.
 *
 * Para o DEV: basta substituir o corpo desta função pela busca real. A UI já
 * trata os 4 estados: carregando, erro (com "tentar novamente"), vazio e com
 * checkouts.
 */

export interface CheckoutOption {
  /** Identificador único do checkout (vindo do backend). */
  id: string;
  /** Nome do checkout exibido ao usuário. */
  name: string;
  /** Produto associado, quando disponível. */
  product?: string | null;
}

export interface UseCheckoutsResult {
  checkouts: CheckoutOption[];
  isLoading: boolean;
  error: string | null;
  /** Refaz a busca dos checkouts (usado pelo estado de erro). */
  refetch: () => void;
}

export function useCheckouts(): UseCheckoutsResult {
  // TODO(DEV): substituir por busca real dos checkouts da conta logada.
  // Não retornar dados fictícios aqui.
  return {
    checkouts: [],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
