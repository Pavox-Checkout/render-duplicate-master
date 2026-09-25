import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  promotional_price: number | null;
  type: string;
  status: string;
  main_image: string;
  track_inventory: boolean;
  inventory_quantity: number;
  checkout_id: string | null;
  created_at: string;
};

export type CheckoutRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
};

export type OrderRow = {
  id: string;
  reference: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
};

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
};

export function useProducts(enabled = true) {
  return useQuery({
    queryKey: ["products"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, promotional_price, type, status, main_image, track_inventory, inventory_quantity, checkout_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });
}

export function useCheckouts(enabled = true) {
  return useQuery({
    queryKey: ["checkouts", "summary"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkouts")
        .select("id, name, slug, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CheckoutRow[];
    },
  });
}

export function useOrders(enabled = true) {
  return useQuery({
    queryKey: ["orders"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, reference, amount, status, payment_method, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });
}

export function useCustomers(enabled = true) {
  return useQuery({
    queryKey: ["customers"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email, phone, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CustomerRow[];
    },
  });
}
