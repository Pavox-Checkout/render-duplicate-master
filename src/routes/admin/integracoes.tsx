import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/pavox/admin/list-page";

export const Route = createFileRoute("/admin/integracoes")({
  component: () => <AdminListPage key="integrations" kind="integrations" />,
});
