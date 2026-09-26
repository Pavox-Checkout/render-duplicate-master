import { createFileRoute } from "@tanstack/react-router";
import { IntegrationHub } from "@/components/pavox/integration-hub";

export const Route = createFileRoute("/_dash/integracoes")({
  component: IntegrationHub,
  head: () => ({
    meta: [
      { title: "Integrações · PAVOX" },
      { name: "description", content: "Configure visualmente os gateways disponíveis na PAVOX." },
    ],
  }),
});
