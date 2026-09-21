import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { CheckoutLimitError, createCheckout } from "@/lib/checkouts-data";

export const Route = createFileRoute("/_dash/checkouts/novo")({
  component: NovoCheckout,
  head: () => ({
    meta: [
      { title: "Novo checkout · PAVOX" },
      {
        name: "description",
        content: "Crie um novo checkout PAVOX e personalize cada elemento da página de compra.",
      },
      { property: "og:title", content: "Novo checkout · PAVOX" },
      { property: "og:description", content: "Construtor visual de checkout da PAVOX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function NovoCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    void (async () => {
      try {
        const record = await createCheckout(user.id);
        await queryClient.invalidateQueries({ queryKey: ["checkouts"] });
        void navigate({ to: "/checkouts/$id", params: { id: record.id }, replace: true });
      } catch (e) {
        if (e instanceof CheckoutLimitError) {
          toast.error("Você atingiu o limite de 3 checkouts do seu plano.");
          setError("Você atingiu o limite de 3 checkouts do seu plano.");
          void navigate({ to: "/checkouts", replace: true });
          return;
        }
        toast.error("Não foi possível criar o checkout.");
        void navigate({ to: "/checkouts", replace: true });
      }
    })();
  }, [user, navigate, queryClient]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <p className="text-[13px] text-muted-foreground">{error ?? "Criando seu checkout..."}</p>
    </div>
  );
}
