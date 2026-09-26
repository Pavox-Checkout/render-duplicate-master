import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/pavox/admin/list-page";

export const Route = createFileRoute("/admin/atividade")({
  component: () => <AdminListPage key="events" kind="events" />,
});
