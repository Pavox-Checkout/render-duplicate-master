import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PavoxLogo } from "@/components/pavox/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import loginHeroAsset from "@/assets/pavox-login-hero-v2.png.asset.json";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Entrar · PAVOX" },
      { name: "description", content: "Acesse sua conta PAVOX e acompanhe sua operação de checkout." },
      { property: "og:title", content: "Entrar · PAVOX" },
      { property: "og:description", content: "Entre na sua conta para acessar sua operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/" });
  }, [loading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: "Verifique seu e-mail e senha." });
      return;
    }
    toast.success("Bem-vindo de volta");
    void navigate({ to: "/" });
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      toast.error("Informe seu e-mail para receber o link de redefinição");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) toast.error("Não foi possível enviar o e-mail agora");
    else toast.success("Enviamos um link para redefinir sua senha");
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          <PavoxLogo />
          <h1 className="font-display mt-8 text-[26px] font-bold tracking-tight">Bem-vindo à PAVOX</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Entre na sua conta para acessar sua operação.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@suaempresa.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Entrar
            </Button>
          </form>

          <div className="mt-5 flex flex-col items-start gap-2 text-[13px]">
            <button type="button" onClick={resetPassword} className="text-primary hover:underline">
              Esqueci minha senha
            </button>
            <Link to="/cadastro" className="text-muted-foreground hover:text-foreground">
              Ainda não tenho uma conta
            </Link>
          </div>
        </div>
      </div>

      <div
        className="relative hidden flex-col justify-end bg-cover bg-center bg-no-repeat p-12 lg:flex"
        style={{ backgroundImage: `url(${loginHeroAsset.url})` }}
      >
        <div className="grid-noise absolute inset-0 opacity-30" />
        <div className="relative">
          <p className="font-display text-[30px] leading-tight font-bold text-primary-foreground">
            Seu checkout.
            <br /> Mais conversão.
            <br /> Mais vendas.
          </p>
          <p className="mt-3 max-w-[340px] text-[14px] text-primary-foreground/80">
            Monte checkouts de alta performance e acompanhe cada etapa da sua operação em um só lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
