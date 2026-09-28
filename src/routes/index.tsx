import { createFileRoute } from "@tanstack/react-router";
import { SimpleLanding } from "@/components/pavox/landing/simple-landing";
import { PublicCheckout } from "@/components/pavox/public-checkout";
import { resolveCustomDomain } from "@/lib/custom-domain";

export const Route = createFileRoute("/")({
  // On a merchant's custom domain the root serves that merchant's checkout.
  loader: () => resolveCustomDomain(),
  component: IndexPage,
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: "Checkout seguro" }, { name: "robots", content: "noindex" }]
      : [
          { title: "PAVOX: checkout com Pix, boleto e cartão" },
          {
            name: "description",
            content:
              "Crie a página de pagamento do seu produto em minutos e receba direto na conta do gateway que você já usa.",
          },
          { property: "og:title", content: "PAVOX: checkout com Pix, boleto e cartão" },
          {
            property: "og:description",
            content:
              "Crie a página de pagamento do seu produto em minutos e receba direto na conta do gateway que você já usa.",
          },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ],
  }),
});

function IndexPage() {
  const target = Route.useLoaderData();
  if (target) return <PublicCheckout store={target.store} checkout={target.checkout} />;
  return <SimpleLanding />;
}
