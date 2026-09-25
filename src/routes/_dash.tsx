import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Loader2, Menu, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/lib/billing";
import { SidebarNav } from "@/components/pavox/sidebar-nav";
import { PavoxLogo } from "@/components/pavox/logo";
import { ThemeToggle } from "@/components/pavox/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash")({
  component: DashLayout,
});

function DashLayout() {
  const [open, setOpen] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { data: subscription, isLoading: loadingSub, isFetched } = useSubscription(!!session);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (session && isFetched && !subscription) void navigate({ to: "/planos/selecionar" });
  }, [session, isFetched, subscription, navigate]);

  if (loading || !session || loadingSub || !subscription) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[248px] p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarNav className="w-full border-r-0" onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <PavoxLogo />
          </div>

          <button
            onClick={() => toast("Busca global em breve")}
            className="ml-auto hidden h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 md:flex lg:mr-auto lg:ml-0"
          >
            <Search className="h-4 w-4" />
            Buscar pedidos, clientes, produtos...
            <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/pavox-ai">
                <Sparkles className="h-4 w-4 text-primary" />
                Pavox AI
              </Link>
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notificações"
              onClick={() => toast("3 novas notificações", { description: "Prévia do protótipo" })}
              className="relative"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1320px] space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
