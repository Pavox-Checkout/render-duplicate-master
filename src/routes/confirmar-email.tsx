import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PavoxLogo } from "@/components/pavox/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
const confirmHeroAsset = { url: "/pavox-auth-banner.png" };

// Must match "Email OTP Length" in Supabase (Authentication → Sign In / Providers → Email).
const CODE_LENGTH = 8;
const RESEND_COOLDOWN = 60;

export const Route = createFileRoute("/confirmar-email")({
  component: ConfirmarEmailPage,
  validateSearch: (search: Record<string, unknown>): { email?: string | undefined } => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Confirmar e-mail · PAVOX" },
      { name: "description", content: "Digite o código enviado para o seu e-mail para ativar sua conta PAVOX." },
    ],
  }),
});

function ConfirmarEmailPage() {
  const navigate = useNavigate();
  const { email: emailFromSearch } = Route.useSearch();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState(emailFromSearch ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(emailFromSearch ? RESEND_COOLDOWN : 0);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verify = async (token: string) => {
    if (!email.trim()) {
      toast.error("Informe o e-mail usado no cadastro");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "signup" });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      toast.error("Código inválido", {
        description: msg.includes("expired")
          ? "Este código expirou. Peça um novo código."
          : "Confira o código e tente novamente.",
      });
      setCode("");
      return;
    }
    toast.success("E-mail confirmado", { description: "Sua conta está ativa." });
    void navigate({ to: "/dashboard" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === CODE_LENGTH) void verify(code);
  };

  const resend = async () => {
    if (!email.trim()) {
      toast.error("Informe o e-mail usado no cadastro");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setResending(false);
    if (error) {
      toast.error("Não foi possível reenviar agora", { description: "Aguarde alguns instantes e tente novamente." });
      return;
    }
    setCooldown(RESEND_COOLDOWN);
    toast.success("Enviamos um novo código para o seu e-mail");
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          <PavoxLogo />
          <h1 className="font-display mt-8 text-[26px] font-bold tracking-tight">Confirme seu e-mail</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            {emailFromSearch ? (
              <>
                Enviamos um código de {CODE_LENGTH} dígitos para{" "}
                <span className="font-medium text-foreground">{emailFromSearch}</span>.
              </>
            ) : (
              <>Digite o código de {CODE_LENGTH} dígitos que enviamos para o seu e-mail.</>
            )}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            {!emailFromSearch && (
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
            )}
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código de confirmação</Label>
              <InputOTP
                id="codigo"
                maxLength={CODE_LENGTH}
                inputMode="numeric"
                pattern="^[0-9]*$"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={setCode}
                onComplete={(value: string) => void verify(value)}
                disabled={busy}
              >
                <InputOTPGroup>
                  {Array.from({ length: CODE_LENGTH }, (_, i) => (
                    <InputOTPSlot key={i} index={i} className="h-11 w-10 text-base sm:h-12 sm:w-12 sm:text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full" disabled={busy || code.length !== CODE_LENGTH}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirmar
            </Button>
          </form>

          <div className="mt-5 flex flex-col items-start gap-2 text-[13px]">
            <button
              type="button"
              onClick={resend}
              disabled={resending || cooldown > 0}
              className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? `Reenviar código em ${cooldown}s` : "Reenviar código"}
            </button>
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>

      <div
        className="relative hidden bg-contain bg-center bg-no-repeat lg:flex"
        style={{ backgroundImage: `url(${confirmHeroAsset.url})` }}
      >
      </div>
    </div>
  );
}
