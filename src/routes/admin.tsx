import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  CreditCard,
  LayoutGrid,
  LogOut,
  Plug,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PavoxLogo } from "@/components/pavox/logo";
import { ThemeToggle } from "@/components/pavox/theme-toggle";
import { Button } from "@/components/ui/button";
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

function useLogout() {
  const { signOut } = useAuth();
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
  return { busy, logout };
}

/** Navy rail with the white logo, role badge and the six sections as tabs. */
function AdminTop({ role }: { role: string }) {
  const { profile, user } = useAuth();
  const { busy, logout } = useLogout();
  return (
    <header className="sticky top-0 z-30 bg-[#001848] text-white">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/admin" aria-label="Admin PAVOX, visão geral" className="-m-2 p-2">
          <img
            src="/pavox-logo-white.png"
            alt="PAVOX"
            width={78}
            height={26}
            className="h-[26px] w-auto"
          />
        </Link>
        <span className="rounded-md border border-white/60 px-2 py-0.5 text-[13px] font-bold">
          Admin
        </span>
        <span className="hidden text-[14px] text-[#b9c6e4] sm:inline">
          {role === "viewer" ? "Somente leitura" : "Administrador"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/dashboard"
            className="hidden min-h-11 items-center gap-2 rounded-lg px-3 text-[14px] font-semibold text-[#dbe4f7] hover:bg-white/10 hover:text-white md:flex"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Painel da loja
          </Link>
          <span
            className="hidden max-w-[220px] truncate px-2 text-[14px] text-[#b9c6e4] lg:block"
            title={user?.email ?? ""}
          >
            {profile?.full_name || user?.email}
          </span>
          <ThemeToggle />
          <Button
            size="icon"
            variant="ghost"
            className="size-11 text-white hover:bg-white/10 hover:text-white"
            aria-label="Sair da conta"
            disabled={busy}
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
      <nav
        aria-label="Administração"
        className="mx-auto max-w-[1320px] overflow-x-auto px-2 sm:px-4 lg:px-6"
      >
        <ul className="flex min-w-max">
          {navigation.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: true }}
                className="flex min-h-12 items-center border-b-[3px] border-transparent px-3 text-[15px] font-semibold text-[#b9c6e4] transition-colors hover:text-white data-[status=active]:border-[#4d86ff] data-[status=active]:text-white"
              >
                {label}
              </Link>
            </li>
          ))}
          <li className="md:hidden">
            <Link
              to="/dashboard"
              className="flex min-h-12 items-center px-3 text-[15px] font-semibold text-[#b9c6e4] hover:text-white"
            >
              Painel da loja
            </Link>
          </li>
        </ul>
      </nav>
    </header>
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
        <PavoxLogo />
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
    <div className="min-h-screen bg-background">
      <a
        href="#admin-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only"
      >
        Ir para o conteúdo
      </a>
      <AdminTop role={access.data.role} />
      <main id="admin-content" tabIndex={-1} className="px-4 py-8 outline-none sm:px-6 lg:px-8">
        <div key={user?.id} className="mx-auto w-full max-w-[1320px] space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
