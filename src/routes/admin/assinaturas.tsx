import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/pavox/admin/list-page";

export const Route = createFileRoute("/admin/assinaturas")({
  component: () => <AdminListPage key="subscriptions" kind="subscriptions" />,
});
