import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  CreditCard,
  LayoutGrid,
  LogOut,
  Menu,
  Plug,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PavoxLogo } from "@/components/pavox/logo";
import { ThemeToggle } from "@/components/pavox/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminError, AdminLoading } from "@/components/pavox/admin/shared";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/lib/admin/data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [{ title: "Administração · PAVOX" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const navigation = [
  { to: "/admin", label: "Visão geral", icon: LayoutGrid },
  { to: "/admin/lojistas", label: "Lojistas", icon: Building2 },
  { to: "/admin/transacoes", label: "Transações", icon: Receipt },
  { to: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { to: "/admin/integracoes", label: "Integrações", icon: Plug },
  { to: "/admin/atividade", label: "Atividade", icon: Activity },
] as const;

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    try {
      await signOut();
      queryClient.removeQueries({ queryKey: ["platform-admin"] });
      await navigate({ to: "/login" });
    } catch {
      toast.error("Não foi possível encerrar a sessão. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex h-full w-[248px] flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center px-5">
        <PavoxLogo className="dark:[&_img]:brightness-0 dark:[&_img]:invert" />
      </div>
      <div className="mx-4 mb-5 mt-3 flex items-center gap-3 rounded-xl border border-border bg-accent/50 p-3">
        <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Pavox Admin</p>
          <p className="text-xs text-muted-foreground">Gestão da plataforma</p>
        </div>
      </div>
      <nav aria-label="Administração" className="flex-1 space-y-1 overflow-y-auto px-3">
        {navigation.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold data-[status=active]:text-sidebar-accent-foreground"
          >
            <Icon className="size-[18px]" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-3 border-t border-border p-4">
        <Link
          to="/dashboard"
          className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
          Painel da loja
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {profile?.full_name || "Administrador"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            size="icon"
            className="size-11 shrink-0"
            variant="ghost"
            aria-label="Sair da conta"
            disabled={busy}
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminLayout() {
  const { session, loading, user } = useAuth();
  const access = useAdminAccess();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!loading && !session)
      void navigate({ to: "/login", search: { redirect: "/admin" }, replace: true });
  }, [loading, session, navigate]);
  if (loading || !session || access.isPending)
    return (
      <div className="grid min-h-screen place-items-center">
        <AdminLoading />
      </div>
    );
  if (access.isError)
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-20">
        <PavoxLogo className="dark:[&_img]:brightness-0 dark:[&_img]:invert" />
        <AdminError error={access.error} retry={() => void access.refetch()} />
        <Button asChild variant="outline">
          <Link to="/dashboard">Voltar ao painel</Link>
        </Button>
      </div>
    );
  if (!access.data?.role)
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
        <ShieldCheck className="size-9 text-primary" />
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Esta área é exclusiva da equipe administrativa da Pavox. Sua conta não possui essa
          permissão.
        </p>
        <Button asChild>
          <Link to="/dashboard">Voltar ao meu painel</Link>
        </Button>
      </div>
    );
  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#admin-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only"
      >
        Ir para o conteúdo
      </a>
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <AdminSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 lg:hidden"
                aria-label="Abrir menu administrativo"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[248px] p-0">
              <SheetTitle className="sr-only">Menu administrativo</SheetTitle>
              <SheetDescription className="sr-only">
                Navegue pelas áreas da plataforma.
              </SheetDescription>
              <AdminSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            <span className="font-semibold">Administração</span>
            <span className="hidden text-muted-foreground sm:inline">/ Plataforma Pavox</span>
          </p>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground sm:block">
              {access.data.role === "viewer" ? "Somente leitura" : "Administrador"}
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main
          id="admin-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          <div key={user?.id} className="mx-auto w-full max-w-[1320px] space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
