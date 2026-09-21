import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutGrid,
  Package,
  Receipt,
  RotateCcw,
  Settings,
  ShoppingBag,
  Sparkles,
  Plug,
  TrendingUp,
  Users,
  UserCircle,
} from "lucide-react";
import { PavoxLogo } from "./logo";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

function initialsOf(name: string, fallback: string) {
  const source = name.trim() || fallback;
  return (
    source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PX"
  );
}

const main = [
  { to: "/", label: "Visão geral", icon: LayoutGrid },
  { to: "/vendas", label: "Vendas", icon: TrendingUp },
  { to: "/pedidos", label: "Pedidos", icon: Receipt },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/checkouts", label: "Checkouts", icon: ShoppingBag },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/recuperacao", label: "Recuperação", icon: RotateCcw },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/integracoes", label: "Integrações", icon: Plug },
  { to: "/pavox-ai", label: "Pavox AI", icon: Sparkles },
] as const;

const settings = [
  { to: "/conta", label: "Minha conta", icon: UserCircle },
  { to: "/equipe", label: "Equipe", icon: Building2 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/planos", label: "Planos", icon: CreditCard },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      activeOptions={{ exact: to === "/" }}
      className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold data-[status=active]:text-sidebar-accent-foreground"
    >
      <Icon className="h-[17px] w-[17px] shrink-0 opacity-80 group-data-[status=active]:opacity-100" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SidebarNav({
  onNavigate,
  className,
}: {
  onNavigate?: (() => void) | undefined;
  className?: string | undefined;
}) {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const email = profile?.email || user?.email || "";
  const name = profile?.full_name || email.split("@")[0] || "Minha conta";
  const company = profile?.company_name || "Sua empresa";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    void navigate({ to: "/login" });
  };

  return (
    <div
      className={cn(
        "flex h-full w-[248px] flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      <div className="flex h-16 items-center px-5">
        <PavoxLogo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {main.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}

        <p className="px-2.5 pt-5 pb-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Configurações
        </p>
        {settings.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-brand-gradient text-[12px] font-semibold text-primary-foreground">
                {initialsOf(name, email)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{name}</span>
              <span className="block truncate text-[11.5px] text-muted-foreground">{email}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>{company}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/conta">Minha conta</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/planos">Planos</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleSignOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
