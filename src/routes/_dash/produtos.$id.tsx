import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { ProductFormView } from "@/components/pavox/product-form";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  comboKey,
  emptyProduct,
  moneyToInput,
  type ProductForm,
  type ProductType,
  type VariantForm,
  type VariantOption,
} from "@/lib/products";

export const Route = createFileRoute("/_dash/produtos/$id")({
  component: EditarProduto,
  head: () => ({
    meta: [
      { title: "Editar produto · PAVOX" },
      { name: "description", content: "Edite as informações do seu produto no catálogo PAVOX." },
      { property: "og:title", content: "Editar produto · PAVOX" },
      { property: "og:description", content: "Edite as informações do seu produto no catálogo PAVOX." },
    ],
  }),
});

function toForm(product: Record<string, any>, variants: Record<string, any>[]): ProductForm {
  const base = emptyProduct();
  const options = (product["options"] ?? []) as VariantOption[];
  const variantForms: VariantForm[] = variants
    .filter((v) => !v["is_default"])
    .map((v) => ({
      id: v["id"] as string,
      key: comboKey((v["options"] ?? {}) as Record<string, string>),
      name: (v["name"] as string) ?? "",
      sku: (v["sku"] as string) ?? "",
      barcode: (v["barcode"] as string) ?? "",
      price: moneyToInput(v["price"]),
      promotional_price: moneyToInput(v["promotional_price"]),
      inventory_quantity: String(v["inventory_quantity"] ?? 0),
      weight: v["weight"] === null || v["weight"] === undefined ? "" : String(v["weight"]),
      image: (v["image"] as string) ?? "",
      options: (v["options"] ?? {}) as Record<string, string>,
    }));

  return {
    ...base,
    name: product["name"] ?? "",
    description: product["description"] ?? "",
    type: (product["type"] ?? "fisico") as ProductType,
    category: product["category"] ?? "",
    brand: product["brand"] ?? "",
    sku: product["sku"] ?? "",
    barcode: product["barcode"] ?? "",
    tags: product["tags"] ?? [],
    price: moneyToInput(product["price"]),
    promotional_price: moneyToInput(product["promotional_price"]),
    cost: moneyToInput(product["cost"]),
    main_image: product["main_image"] ?? "",
    images: product["images"] ?? [],
    status: product["status"] ?? "Ativo",
    slug: product["slug"] ?? "",
    seo_title: product["seo_title"] ?? "",
    seo_description: product["seo_description"] ?? "",
    track_inventory: Boolean(product["track_inventory"]),
    inventory_quantity: String(product["inventory_quantity"] ?? 0),
    allow_backorder: Boolean(product["allow_backorder"]),
    minimum_stock: String(product["minimum_stock"] ?? 0),
    weight: product["weight"] === null || product["weight"] === undefined ? "" : String(product["weight"]),
    length: product["length"] === null || product["length"] === undefined ? "" : String(product["length"]),
    width: product["width"] === null || product["width"] === undefined ? "" : String(product["width"]),
    height: product["height"] === null || product["height"] === undefined ? "" : String(product["height"]),
    digital_name: product["digital_name"] ?? "",
    digital_file: product["digital_file"] ?? "",
    digital_url: product["digital_url"] ?? "",
    options,
    variants: variantForms,
  };
}

function EditarProduto() {
  const { id } = useParams({ from: "/_dash/produtos/$id" });
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data: product, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) throw error;
      const { data: variants } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("position", { ascending: true });
      return toForm(product as Record<string, any>, (variants ?? []) as Record<string, any>[]);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Produto não encontrado"
        description="Ele pode ter sido excluído ou não pertence à sua conta."
        action={<Button onClick={() => void navigate({ to: "/produtos" })}>Voltar para produtos</Button>}
      />
    );
  }

  return (
    <>
      <PageHeader title={data.name || "Editar produto"} subtitle="Atualize as informações e salve as alterações." />
      <ProductFormView productId={id} initial={data} />
    </>
  );
}
