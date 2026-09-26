import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CreditCard, Loader2, LockKeyhole, Mail, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { PavoxLogo } from "@/components/pavox/logo";
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
        const { error: resendError } = await supabase.auth.resend({ type: "signup", email: email.trim() });
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
    <main className="relative flex min-h-screen overflow-hidden bg-[#070b16] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,112,255,0.18),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(25,57,143,0.16),transparent_35%)]" />
      <div aria-hidden="true" className="landing-grid pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-260px] size-[600px] -translate-x-1/2 rounded-full bg-[#3470ff]/10 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3470ff]/70 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid w-full max-w-[1080px] items-center gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,420px)] lg:gap-24">
          <section className="relative hidden min-h-[520px] lg:block" aria-label="Recursos da PAVOX">
            <div className="absolute left-0 top-10 max-w-[430px] animate-[pavox-fade-in_700ms_ease-out_both]">
              <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#73a0ff]">
                <Sparkles className="size-3.5" /> Plataforma PAVOX
              </p>
              <h2 className="font-display text-5xl font-extrabold leading-[1.04] tracking-[-0.05em] text-white xl:text-6xl">
                Sua operação, <span className="text-gradient-brand">em movimento.</span>
              </h2>
              <p className="mt-6 max-w-[370px] text-[15px] leading-7 text-white/48">
                Acesse seu espaço para criar experiências de checkout que acompanham o ritmo do seu negócio.
              </p>
            </div>

            <div className="absolute bottom-10 left-0 w-[290px] animate-[pavox-float_6s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-[#3470ff]/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-[11px] text-white/45"><span>Checkout ativo</span><span className="flex items-center gap-1.5 text-[#8bb0ff]"><span className="size-1.5 rounded-full bg-[#5cffb2]" /> Online</span></div>
              <div className="mt-5 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#3470ff]/15 text-[#8bb0ff]"><CreditCard className="size-5" /></div><div><p className="text-sm font-medium text-white/90">Experiência de compra</p><p className="mt-0.5 text-[11px] text-white/40">Pensada para converter</p></div></div>
            </div>
            <div className="absolute right-5 top-48 flex animate-[pavox-float_7s_ease-in-out_1s_infinite] items-center gap-2 rounded-full border border-white/10 bg-[#111a31]/90 px-3.5 py-2 text-[11px] text-white/65 shadow-xl backdrop-blur-xl"><Check className="size-3.5 text-[#5cffb2]" /> Pagamento aprovado</div>
          </section>

          <section className="w-full animate-[pavox-fade-in_700ms_120ms_ease-out_both]" aria-labelledby="login-title">
            <div className="mx-auto w-full max-w-[400px]">
              <div className="mb-9 flex justify-center lg:justify-start"><PavoxLogo className="h-10 [&_img]:h-10 [&_img]:w-[120px]" /></div>
              <div className="mb-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#73a0ff]">Bem-vindo de volta</p>
                <h1 id="login-title" className="font-display text-[30px] font-bold tracking-[-0.04em] text-white">Entre na PAVOX</h1>
                <p className="mt-2 text-[14px] leading-6 text-white/48">Acesse sua operação de checkout em poucos segundos.</p>
              </div>

              <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2"><Label htmlFor="email" className="text-[12px] font-medium text-white/65">E-mail</Label><div className="relative"><Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" /><Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@suaempresa.com" className="h-12 border-white/10 bg-white/[0.055] pl-10 text-white placeholder:text-white/25 focus-visible:border-[#3470ff]/70 focus-visible:ring-[#3470ff]/25" /></div></div>
                <div className="flex flex-col gap-2"><Label htmlFor="senha" className="text-[12px] font-medium text-white/65">Senha</Label><div className="relative"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" /><Input id="senha" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 border-white/10 bg-white/[0.055] pl-10 text-white placeholder:text-white/25 focus-visible:border-[#3470ff]/70 focus-visible:ring-[#3470ff]/25" /></div></div>
                <Button type="submit" className="mt-1 h-12 w-full bg-[#3470ff] font-semibold text-white shadow-[0_16px_35px_-14px_rgba(52,112,255,0.9)] transition-all hover:bg-[#4b80ff] hover:shadow-[0_18px_42px_-12px_rgba(52,112,255,0.95)]" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />} Entrar</Button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-3 text-[13px] sm:items-start"><button type="button" onClick={resetPassword} className="text-[#8fb0ff] transition-colors hover:text-white hover:underline">Esqueci minha senha</button><span className="text-white/35">Ainda não tenho uma conta? <Link to="/cadastro" className="font-medium text-white/70 transition-colors hover:text-white">Criar conta</Link></span></div>
              <p className="mt-10 flex items-center justify-center gap-2 text-[11px] text-white/30 sm:justify-start"><ShieldCheck className="size-3.5 text-[#73a0ff]" /> Ambiente seguro para sua operação</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
