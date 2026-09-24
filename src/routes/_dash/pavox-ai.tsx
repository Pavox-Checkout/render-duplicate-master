import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePavoxAiAccess } from "@/lib/pavox-ai/access";
import { UpgradeExperience } from "@/components/pavox/ai/upgrade-experience";
import { ProDashboard } from "@/components/pavox/ai/pro-dashboard";

export const Route = createFileRoute("/_dash/pavox-ai")({
  component: PavoxAI,
  head: () => ({
    meta: [
      { title: "Pavox AI · PAVOX" },
      {
        name: "description",
        content: "Recomendações inteligentes para aumentar a conversão do seu checkout.",
      },
      { property: "og:title", content: "Pavox AI · PAVOX" },
      { property: "og:description", content: "Inteligência aplicada ao seu checkout." },
    ],
  }),
});

function PavoxAI() {
  const { profile, user } = useAuth();
  const { hasAccess, planName, isLoading } = usePavoxAiAccess();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return <UpgradeExperience currentPlanName={planName} />;
  }

  const email = profile?.email || user?.email || "";
  const greetingName =
    (profile?.full_name || email.split("@")[0] || "lojista").split(" ")[0] || "lojista";

  return <ProDashboard greetingName={greetingName} />;
}
