import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaultConfig, normalizeConfig, type BuilderState } from "@/lib/checkout-builder";

export type CheckoutRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  published: boolean;
  published_at: string | null;
  product_id: string | null;
  config: unknown;
  created_at: string;
  updated_at: string;
};

const FIELDS =
  "id, name, slug, status, published, published_at, product_id, config, created_at, updated_at";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function stateFromConfig(row: CheckoutRecord): BuilderState {
  return {
    name: row.name,
    status: row.published ? "Publicado" : "Rascunho",
    config: normalizeConfig(row.config),
  };
}

export function useCheckoutList() {
  return useQuery({
    queryKey: ["checkouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkouts")
        .select(FIELDS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CheckoutRecord[];
    },
  });
}

export function useCheckout(id: string) {
  return useQuery({
    queryKey: ["checkout", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("checkouts").select(FIELDS).eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as CheckoutRecord | null;
    },
  });
}

export class CheckoutLimitError extends Error {}

export async function createCheckout(userId: string, name = "Checkout Principal") {
  const { data, error } = await supabase
    .from("checkouts")
    .insert({
      user_id: userId,
      name,
      slug: slugify(name),
      status: "Rascunho",
      published: false,
      config: defaultConfig() as never,
    })
    .select(FIELDS)
    .single();
  if (error) {
    if (error.message.includes("checkout_limit_reached")) throw new CheckoutLimitError();
    throw error;
  }
  return data as unknown as CheckoutRecord;
}

export async function saveCheckout(id: string, state: BuilderState) {
  const { error } = await supabase
    .from("checkouts")
    .update({
      name: state.name,
      slug: slugify(state.name),
      config: state.config as never,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function publishCheckout(id: string, state: BuilderState) {
  const { error } = await supabase
    .from("checkouts")
    .update({
      name: state.name,
      slug: slugify(state.name),
      status: "Publicado",
      published: true,
      published_at: new Date().toISOString(),
      config: state.config as never,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCheckout(id: string) {
  const { error } = await supabase.from("checkouts").delete().eq("id", id);
  if (error) throw error;
}
