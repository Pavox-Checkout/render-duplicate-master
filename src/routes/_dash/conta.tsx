import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pavox/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/conta")({
  component: Conta,
  head: () => ({
    meta: [
      { title: "Minha conta · PAVOX" },
      { name: "description", content: "Dados pessoais, preferências e segurança da sua conta PAVOX." },
      { property: "og:title", content: "Minha conta · PAVOX" },
      { property: "og:description", content: "Gerencie seu perfil na PAVOX." },
    ],
  }),
});

function Conta() {
  const { user: authUser, profile } = useAuth();
  const name = profile?.full_name || authUser?.email?.split("@")[0] || "";
  const email = profile?.email || authUser?.email || "";
  const company = profile?.company_name || "";
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
          <div className="mt-5 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-brand-gradient text-lg font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={() => toast("Envio de foto em breve")}>
              Alterar foto
            </Button>
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
          </div>
          <Button className="mt-6" onClick={() => toast.success("Alterações salvas")}>
            Salvar alterações
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
              <Button variant="outline" className="w-full" onClick={() => toast("Link enviado por e-mail")}>
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
    </>
  );
}
