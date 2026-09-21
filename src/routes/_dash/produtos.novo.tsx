import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pavox/page-header";
import { ProductFormView } from "@/components/pavox/product-form";

export const Route = createFileRoute("/_dash/produtos/novo")({
  component: NovoProduto,
  head: () => ({
    meta: [
      { title: "Criar produto · PAVOX" },
      { name: "description", content: "Cadastre um novo produto no seu catálogo PAVOX." },
      { property: "og:title", content: "Criar produto · PAVOX" },
      { property: "og:description", content: "Cadastre um novo produto no seu catálogo PAVOX." },
    ],
  }),
});

function NovoProduto() {
  return (
    <>
      <PageHeader title="Criar produto" subtitle="Preencha as informações do produto e salve para publicá-lo." />
      <ProductFormView />
    </>
  );
}
