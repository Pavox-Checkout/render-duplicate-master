import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AuthShell,
  AuthTitle,
  PasswordInput,
  authButton,
  authInput,
  authLabel,
  authLink,
} from "@/components/pavox/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: "/admin" } =>
    search["redirect"] === "/admin" ? { redirect: "/admin" } : {},
  head: () => ({
    meta: [
      { title: "Entrar · PAVOX" },
      {
        name: "description",
        content: "Acesse sua conta PAVOX e acompanhe sua operação de checkout.",
      },
      { property: "og:title", content: "Entrar · PAVOX" },
      { property: "og:description", content: "Entre na sua conta para acessar sua operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const destination = redirect === "/admin" ? "/admin" : "/dashboard";
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: destination });
  }, [loading, session, navigate, destination]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      const code = error.code ?? "";
      const msg = error.message.toLowerCase();
      // A conta existe mas o e-mail ainda não foi confirmado: encaminha para o fluxo de OTP.
      // Verificamos code E message porque o campo `code` nem sempre vem populado (gotrue/proxy).
      const isUnconfirmed = code === "email_not_confirmed" || msg.includes("not confirmed");
      if (isUnconfirmed) {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: email.trim(),
        });
        toast.info("Confirme seu e-mail para entrar", {
          description: resendError
            ? "Digite o código que enviamos para o seu e-mail."
            : "Enviamos um novo código para o seu e-mail.",
        });
        void navigate({ to: "/confirmar-email", search: { email: email.trim() } });
        return;
      }
      const isInvalidCredentials =
        code === "invalid_credentials" || msg.includes("invalid login credentials");
      toast.error("Não foi possível entrar", {
        description: isInvalidCredentials ? "E-mail ou senha incorretos." : error.message,
      });
      return;
    }
    toast.success("Bem-vindo de volta");
    void navigate({ to: destination });
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
    <AuthShell greeting="Bom te ver de novo.">
      <AuthTitle title="Entre na PAVOX">Seu painel, seus pedidos e seu extrato.</AuthTitle>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className={authLabel}>
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@sualoja.com"
            className={authInput}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="senha" className={authLabel}>
              Senha
            </Label>
            <button
              type="button"
              onClick={resetPassword}
              className={`-my-3 py-3 text-[14px] ${authLink}`}
            >
              Esqueci minha senha
            </button>
          </div>
          <PasswordInput
            id="senha"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className={`mt-1 ${authButton}`} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Entrando" : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-[15px] text-muted-foreground">
        Ainda não vende com a PAVOX?{" "}
        <Link to="/cadastro" className={authLink}>
          Criar conta grátis
        </Link>
      </p>
    </AuthShell>
  );
}
