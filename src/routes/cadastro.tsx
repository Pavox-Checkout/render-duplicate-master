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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  component: CadastroPage,
  head: () => ({
    meta: [
      { title: "Criar sua conta · PAVOX" },
      {
        name: "description",
        content: "Crie sua conta PAVOX e comece a vender com checkouts de alta conversão.",
      },
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
    if (!loading && session) void navigate({ to: "/dashboard" });
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
      toast.success("Conta criada", {
        description: "Enviamos um código de confirmação para o seu e-mail.",
      });
      void navigate({ to: "/confirmar-email", search: { email: email.trim() } });
      return;
    }
    toast.success("Conta criada com sucesso");
    void navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell
      greeting="Seu checkout no ar ainda hoje."
      railContent={
        <div className="max-w-[290px]">
          <h2 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-white">
            Comece a vender com a PAVOX.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.55] text-[#b9c6e4]">
            Crie seu checkout, conecte seu gateway e tenha tudo pronto para começar a vender.
          </p>
        </div>
      }
    >
      <AuthTitle title="Criar sua conta">É grátis. Você escolhe o plano depois.</AuthTitle>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nome" className={authLabel}>
            Nome completo
          </Label>
          <Input
            id="nome"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={authInput}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="empresa" className={authLabel}>
            Nome da loja ou empresa
          </Label>
          <Input
            id="empresa"
            required
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={authInput}
          />
        </div>
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
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha" className={authLabel}>
              Senha
            </Label>
            <PasswordInput
              id="senha"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmar" className={authLabel}>
              Confirmar senha
            </Label>
            <PasswordInput
              id="confirmar"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
            />
          </div>
        </div>
        <p className="-mt-2 text-[14px] text-muted-foreground">Pelo menos 6 caracteres.</p>

        <label className="flex min-h-11 items-start gap-3 text-[15px] text-muted-foreground">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5 size-5"
          />
          <span>Li e aceito os Termos de Uso e a Política de Privacidade.</span>
        </label>

        <Button type="submit" className={authButton} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Criando a conta" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-[15px] text-muted-foreground">
        Já tem uma conta?{" "}
        <Link to="/login" className={authLink}>
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
