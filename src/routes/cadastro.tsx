import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PavoxLogo } from "@/components/pavox/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import cadastroHeroAsset from "@/assets/pavox-cadastro-hero.png.asset.json";

export const Route = createFileRoute("/cadastro")({
  component: CadastroPage,
  head: () => ({
    meta: [
      { title: "Criar sua conta · PAVOX" },
      { name: "description", content: "Crie sua conta PAVOX e comece a vender com checkouts de alta conversão." },
      { property: "og:title", content: "Criar sua conta · PAVOX" },
      { property: "og:description", content: "Comece sua operação na PAVOX em poucos minutos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CadastroPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/" });
  }, [loading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("Use uma senha com pelo menos 6 caracteres");
      return;
    }
    if (!accepted) {
      toast.error("É preciso aceitar os Termos de Uso");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName.trim(), company_name: company.trim() },
      },
    });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      toast.error("Não foi possível criar a conta", {
        description: msg.includes("already")
          ? "Este e-mail já possui uma conta."
          : msg.includes("weak") || msg.includes("pwned")
            ? "Esta senha é muito comum. Escolha uma senha mais forte."
            : "Confira os dados e tente novamente.",
      });
      return;
    }
    if (!data.session) {
      toast.success("Conta criada", { description: "Confirme seu e-mail para entrar." });
      void navigate({ to: "/login" });
      return;
    }
    toast.success("Conta criada com sucesso");
    void navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px]">
          <PavoxLogo />
          <h1 className="font-display mt-8 text-[26px] font-bold tracking-tight">Criar sua conta</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Comece sua operação na PAVOX em poucos minutos.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresa">Nome da empresa</Label>
              <Input id="empresa" required value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmar">Confirmar senha</Label>
                <Input
                  id="confirmar"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
              <Checkbox
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5"
              />
              <span>Li e aceito os Termos de Uso e a Política de Privacidade.</span>
            </label>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Criar conta
            </Button>
          </form>

          <p className="mt-5 text-[13px] text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      <div className="bg-brand-gradient relative hidden flex-col justify-end p-12 lg:flex">
        <div className="grid-noise absolute inset-0 opacity-30" />
        <div className="relative">
          <p className="font-display text-[30px] leading-tight font-bold text-primary-foreground">
             <br /> operação hoje.
          </p>
          <p className="mt-3 max-w-[340px] text-[14px] text-primary-foreground/80">
            Sua conta começa limpa: crie seu primeiro produto, publique um checkout e acompanhe os
            resultados em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
