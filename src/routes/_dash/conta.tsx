import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pavox/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidCPF, maskCPF } from "@/lib/checkout-builder";

export const Route = createFileRoute("/_dash/conta")({
  component: Conta,
  head: () => ({
    meta: [
      { title: "Minha conta · PAVOX" },
      {
        name: "description",
        content: "Dados pessoais, preferências e segurança da sua conta PAVOX.",
      },
      { property: "og:title", content: "Minha conta · PAVOX" },
      { property: "og:description", content: "Gerencie seu perfil na PAVOX." },
    ],
  }),
});

function Conta() {
  const { user: authUser, profile, refreshProfile } = useAuth();
  const name = profile?.full_name || authUser?.email?.split("@")[0] || "";
  const email = profile?.email || authUser?.email || "";
  const company = profile?.company_name || "";
  const [cpf, setCpf] = useState("");
  const [savingCpf, setSavingCpf] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDraftUrl, setAvatarDraftUrl] = useState<string | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarZoom, setAvatarZoom] = useState([1]);
  const [avatarPosition, setAvatarPosition] = useState([50]);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousAvatarUrlRef = useRef<string | null>(null);
  const avatarFileRef = useRef<File | null>(null);

  useEffect(() => {
    setCpf(profile?.cpf ? maskCPF(profile.cpf) : "");
  }, [profile?.cpf]);

  useEffect(() => {
    let active = true;
    const path = authUser?.user_metadata?.avatar_path;
    if (!authUser || typeof path !== "string" || !path) {
      setAvatarUrl(null);
      return () => { active = false; };
    }
    void supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24).then(({ data }) => {
      if (active) setAvatarUrl(data?.signedUrl ?? null);
    });
    return () => { active = false; };
  }, [authUser?.id, authUser?.user_metadata?.avatar_path]);

  const selectAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!file.type.startsWith("image/")) {
      setAvatarError("Escolha um arquivo de imagem.");
      return;
    }
    if (!supportedTypes.includes(file.type)) {
      setAvatarError("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("A imagem deve ter no máximo 5 MB.");
      return;
    }

    if (avatarDraftUrl) URL.revokeObjectURL(avatarDraftUrl);
    const nextUrl = URL.createObjectURL(file);
    avatarFileRef.current = file;
    previousAvatarUrlRef.current = avatarUrl;
    setAvatarDraftUrl(nextUrl);
    setAvatarUrl(nextUrl);
    setAvatarError("");
    setAvatarZoom([1]);
    setAvatarPosition([50]);
    setAvatarDialogOpen(true);
  };

  const cancelAvatarEdit = () => {
    if (avatarDraftUrl) URL.revokeObjectURL(avatarDraftUrl);
    setAvatarDraftUrl(null);
    setAvatarUrl(previousAvatarUrlRef.current);
    setAvatarDialogOpen(false);
  };

  const confirmAvatarEdit = () => {
    setAvatarDraftUrl(null);
    previousAvatarUrlRef.current = avatarUrl;
    setAvatarDialogOpen(false);
  };

  const saveCpf = async () => {
    const normalizedCpf = cpf.replace(/\D/g, "");
    if (!isValidCPF(normalizedCpf)) {
      toast.error("Informe um CPF válido.");
      return;
    }
    setSavingCpf(true);
    const userId = authUser?.id;
    if (!userId) {
      setSavingCpf(false);
      toast.error("Sua sessão expirou. Entre novamente para salvar o CPF.");
      return;
    }

    let avatarPath = authUser.user_metadata?.avatar_path;
    if (avatarFileRef.current) {
      const extension = avatarFileRef.current.type.split("/")[1] || "jpg";
      avatarPath = `${userId}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(avatarPath, avatarFileRef.current, {
        contentType: avatarFileRef.current.type,
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) {
        setSavingCpf(false);
        toast.error("Não foi possível salvar a foto de perfil.");
        return;
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ cpf: normalizedCpf })
      .eq("id", userId)
      .select("id, cpf")
      .maybeSingle();
    if (error || !data || data.id !== userId || data.cpf !== normalizedCpf) {
      setSavingCpf(false);
      if (error?.code === "23505") toast.error("Este CPF já está vinculado a outra conta PAVOX.");
      else toast.error("Não foi possível salvar o CPF.");
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({ data: { avatar_path: avatarPath } });
    setSavingCpf(false);
    if (metadataError) {
      toast.error("Não foi possível salvar a foto de perfil.");
      return;
    }
    avatarFileRef.current = null;
    await refreshProfile();
    toast.success("Alterações salvas com sucesso.");
  };

  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PX";

  return (
    <>
      <PageHeader title="Minha conta" subtitle="Seus dados pessoais e preferências de acesso." />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Perfil</h2>
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Avatar className="size-16">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={`Foto de perfil de ${name}`} /> : null}
              <AvatarFallback className="bg-brand-gradient text-lg font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={selectAvatar}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Alterar foto
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP · até 5 MB</p>
              {avatarError ? <p className="text-xs text-destructive">{avatarError}</p> : null}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="n">Nome</Label>
              <Input id="n" key={name} defaultValue={name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e">E-mail</Label>
              <Input id="e" key={email} defaultValue={email} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t">Telefone</Label>
              <Input id="t" placeholder="(11) 90000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c">Empresa</Label>
              <Input id="c" key={company} defaultValue={company} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(event) => setCpf(maskCPF(event.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                required
              />
            </div>
          </div>
          <Button className="mt-6" onClick={() => void saveCpf()} disabled={savingCpf || !authUser}>
            {savingCpf ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>

        <div className="space-y-5">
          <div className="surface p-5">
            <h2 className="text-base font-semibold">Segurança</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13.5px] font-medium">Autenticação em dois fatores</p>
                  <p className="text-[12px] text-muted-foreground">Proteja o acesso à sua conta</p>
                </div>
                <Switch onCheckedChange={(v) => toast(v ? "2FA ativado" : "2FA desativado")} />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast("Link enviado por e-mail")}
              >
                Alterar senha
              </Button>
            </div>
          </div>

          <div className="surface p-5">
            <h2 className="text-base font-semibold">Notificações</h2>
            <div className="mt-4 space-y-3">
              {["Nova venda aprovada", "Pagamento recusado", "Resumo diário"].map((n) => (
                <div key={n} className="flex items-center justify-between">
                  <span className="text-[13.5px]">{n}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={avatarDialogOpen} onOpenChange={(open) => !open && cancelAvatarEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar foto de perfil</DialogTitle>
            <DialogDescription>
              Faça um ajuste rápido antes de confirmar a nova prévia.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-5">
            <div className="size-48 overflow-hidden rounded-full bg-muted ring-1 ring-border">
              {avatarDraftUrl ? (
                <img
                  src={avatarDraftUrl}
                  alt="Prévia da foto de perfil"
                  className="size-full object-cover transition-transform"
                  style={{
                    transform: `scale(${avatarZoom[0]})`,
                    objectPosition: `50% ${avatarPosition[0]}%`,
                  }}
                />
              ) : null}
            </div>
            <div className="w-full max-w-xs space-y-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Zoom</span>
                <Slider
                  aria-label="Zoom da foto"
                  min={1}
                  max={3}
                  step={0.1}
                  value={avatarZoom}
                  onValueChange={setAvatarZoom}
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Posição vertical</span>
                <Slider
                  aria-label="Posição vertical da foto"
                  min={0}
                  max={100}
                  step={1}
                  value={avatarPosition}
                  onValueChange={setAvatarPosition}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelAvatarEdit}>
              Cancelar
            </Button>
            <Button onClick={confirmAvatarEdit}>Confirmar prévia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
