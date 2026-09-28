import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/*
 * Cupons do lojista. Leitura e escrita pelo navegador com RLS por dono; o
 * contador de usos só muda no servidor (quando um pedido com o cupom é
 * aprovado). O desconto cobrado é calculado no servidor em create_public_order.
 */

export type CouponRow = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minimum_amount: number;
  max_uses: number | null;
  uses: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

export type CouponInput = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minimum_amount: number;
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
};

const FIELDS =
  "id, code, type, value, minimum_amount, max_uses, uses, starts_at, expires_at, active, created_at";

export const normalizeCode = (raw: string) =>
  raw
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);

export function couponStatus(c: CouponRow): { label: string; tone: "ok" | "off" | "warn" } {
  if (!c.active) return { label: "Pausado", tone: "off" };
  if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now())
    return { label: "Vencido", tone: "off" };
  if (c.max_uses != null && c.uses >= c.max_uses) return { label: "Esgotado", tone: "warn" };
  return { label: "Ativo", tone: "ok" };
}

export function useCoupons() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coupons", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons" as never)
        .select(FIELDS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as CouponRow[]).map((c) => ({
        ...c,
        value: Number(c.value),
        minimum_amount: Number(c.minimum_amount),
      }));
    },
  });
}

function friendly(error: { code?: string; message?: string }) {
  if (error.code === "23505") return "Já existe um cupom com esse código.";
  if (error.code === "23514")
    return "Confira os valores: percentual até 100% e valores maiores que zero.";
  return "Não foi possível salvar o cupom. Tente novamente.";
}

export function useSaveCoupon() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: CouponInput }) => {
      if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
      const row = { ...input, code: normalizeCode(input.code) };
      const q = id
        ? supabase
            .from("coupons" as never)
            .update({ ...row, updated_at: new Date().toISOString() } as never)
            .eq("id", id)
        : supabase.from("coupons" as never).insert({ ...row, user_id: user.id } as never);
      const { error } = await q;
      if (error) throw new Error(friendly(error));
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coupons" as never)
        .delete()
        .eq("id", id);
      if (error) throw new Error("Não foi possível excluir o cupom.");
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}
