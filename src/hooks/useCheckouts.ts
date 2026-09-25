/**
 * Fonte dos checkouts REAIS da conta logada.
 *
 * Busca os checkouts do usuário autenticado no Supabase (RLS já restringe as
 * linhas à conta da sessão). Nenhum dado fictício é usado como fallback: quando
 * a conta não possui checkouts, a lista volta vazia e a UI renderiza o estado
 * vazio ("Nenhum checkout criado").
 *
 * Contrato consumido pela UI: { checkouts, isLoading, error, refetch }.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CheckoutOption {
  /** Identificador único do checkout. */
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
  const query = useQuery({
    queryKey: ["checkouts", "options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkouts")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  return {
    checkouts: (query.data ?? []).map((c) => ({ id: c.id, name: c.name })),
    isLoading: query.isLoading,
    error: query.isError
      ? ((query.error as Error)?.message ?? "Falha ao carregar checkouts")
      : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
