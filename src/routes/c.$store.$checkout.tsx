import { createFileRoute } from "@tanstack/react-router";
import { PublicCheckout } from "@/components/pavox/public-checkout";

export const Route = createFileRoute("/c/$store/$checkout")({
  component: PublicCheckoutPage,
  head: () => ({
    meta: [{ title: "Checkout seguro" }, { name: "robots", content: "noindex" }],
  }),
});

function PublicCheckoutPage() {
  const { store, checkout } = Route.useParams();
  return <PublicCheckout store={store} checkout={checkout} />;
}
