import { supabase } from "@/integrations/supabase/client";

export type ProductType = "fisico" | "digital" | "servico";

export const PRODUCT_TYPES: { value: ProductType; label: string; hint: string }[] = [
  { value: "fisico", label: "Produto físico", hint: "Envio, estoque e dimensões" },
  { value: "digital", label: "Produto digital", hint: "Entrega por arquivo ou link" },
  { value: "servico", label: "Serviço", hint: "Sem estoque nem envio" },
];

export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  fisico: "Físico",
  digital: "Digital",
  servico: "Serviço",
};

export type VariantOption = { name: string; values: string[] };

export type VariantForm = {
  id?: string;
  key: string;
  name: string;
  sku: string;
  barcode: string;
  price: string;
  promotional_price: string;
  inventory_quantity: string;
  weight: string;
  image: string;
  options: Record<string, string>;
};

export type ProductForm = {
  name: string;
  description: string;
  type: ProductType;
  category: string;
  brand: string;
  sku: string;
  barcode: string;
  tags: string[];
  price: string;
  promotional_price: string;
  cost: string;
  main_image: string;
  images: string[];
  status: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  track_inventory: boolean;
  inventory_quantity: string;
  allow_backorder: boolean;
  minimum_stock: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  digital_name: string;
  digital_file: string;
  digital_url: string;
  options: VariantOption[];
  variants: VariantForm[];
};

export const emptyProduct = (): ProductForm => ({
  name: "",
  description: "",
  type: "fisico",
  category: "",
  brand: "",
  sku: "",
  barcode: "",
  tags: [],
  price: "",
  promotional_price: "",
  cost: "",
  main_image: "",
  images: [],
  status: "Ativo",
  slug: "",
  seo_title: "",
  seo_description: "",
  track_inventory: false,
  inventory_quantity: "0",
  allow_backorder: false,
  minimum_stock: "0",
  weight: "",
  length: "",
  width: "",
  height: "",
  digital_name: "",
  digital_file: "",
  digital_url: "",
  options: [],
  variants: [],
});

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "1.299,90" | "1299.90" -> 1299.9 ; "" -> null */
export function parseMoney(value: string): number | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function moneyToInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return Number(value).toFixed(2).replace(".", ",");
}

export function numOrNull(value: string): number | null {
  const n = parseMoney(value);
  return n === null ? null : n;
}

export function intOrZero(value: string): number {
  const n = parseInt((value ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function combine(options: VariantOption[]): Record<string, string>[] {
  const clean = options
    .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length);
  if (!clean.length) return [];
  return clean.reduce<Record<string, string>[]>(
    (acc, opt) => acc.flatMap((combo) => opt.values.map((v) => ({ ...combo, [opt.name]: v }))),
    [{}],
  );
}

export const comboKey = (combo: Record<string, string>) =>
  Object.entries(combo)
    .map(([k, v]) => `${k}:${v}`)
    .join("|");

export const comboLabel = (combo: Record<string, string>) => Object.values(combo).join(" / ");

export async function uploadProductImage(file: File): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sessão expirada");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

const urlCache = new Map<string, string>();

export async function signedImageUrl(path: string): Promise<string> {
  if (!path) return "";
  const cached = urlCache.get(path);
  if (cached) return cached;
  const { data, error } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) return "";
  urlCache.set(path, data.signedUrl);
  return data.signedUrl;
}
