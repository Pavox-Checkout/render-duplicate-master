import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Plus } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { webhookEvents } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/configuracoes")({
  component: Configuracoes,
  head: () => ({
    meta: [
      { title: "Configurações · PAVOX" },
      {
        name: "description",
        content: "Empresa, notificações, segurança, webhooks e chaves de API da sua conta PAVOX.",
      },
      { property: "og:title", content: "Configurações · PAVOX" },
      { property: "og:description", content: "Ajustes técnicos e administrativos da plataforma." },
    ],
  }),
});

function Configuracoes() {
  const [apiKey, setApiKey] = useState("pvx_live_9f2c8a1d4b7e6350a1c2");
  const [visible, setVisible] = useState(false);

  return (
    <>
      <PageHeader title="Configurações" subtitle="Ajuste a plataforma ao jeito da sua operação." />

      <Tabs defaultValue="empresa">
        <TabsList className="flex-wrap">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-5">
          <div className="surface space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Razão social</Label>
                <Input defaultValue="Loja Demo Comércio Digital LTDA" />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input defaultValue="42.118.905/0001-77" />
              </div>
              <div className="space-y-1.5">
                <Label>Nome exibido no checkout</Label>
                <Input defaultValue="Loja Demo" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail de suporte</Label>
                <Input defaultValue="suporte@lojademo.com" />
              </div>
            </div>
            <Button onClick={() => toast.success("Dados da empresa salvos")}>Salvar</Button>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-5">
          <div className="surface space-y-4 p-5">
            {["Venda aprovada", "Venda recusada", "Carrinho abandonado", "Resumo semanal"].map((n) => (
              <div key={n} className="flex items-center justify-between">
                <span className="text-[13.5px]">{n}</span>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seguranca" className="mt-5">
          <div className="surface space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium">Autenticação em dois fatores</p>
                <p className="text-[12px] text-muted-foreground">Exigir código ao entrar</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium">Antifraude no checkout</p>
                <p className="text-[12px] text-muted-foreground">Bloquear tentativas suspeitas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="outline" onClick={() => toast("Sessões encerradas")}>
              Encerrar outras sessões
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-5">
          <div className="surface space-y-5 p-5">
            <div className="space-y-1.5">
              <Label>Webhook URL</Label>
              <Input defaultValue="https://lojademo.com/api/pavox/webhook" />
            </div>
            <div>
              <Label className="mb-2 block">Eventos</Label>
              <div className="flex flex-wrap gap-2">
                {webhookEvents.map((e) => (
                  <span key={e} className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-[12px]">
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.success("Webhook de teste enviado")}>
              <Plus className="h-4 w-4" /> Enviar evento de teste
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="api" className="mt-5">
          <div className="surface space-y-5 p-5">
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input readOnly value={visible ? apiKey : apiKey.replace(/.(?=.{4})/g, "•")} className="font-mono" />
                <Button variant="outline" size="icon" aria-label="Mostrar chave" onClick={() => setVisible((v) => !v)}>
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copiar chave"
                  onClick={() => {
                    void navigator.clipboard?.writeText(apiKey);
                    toast.success("API Key copiada");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => {
                setApiKey(`pvx_live_${Math.random().toString(16).slice(2, 22)}`);
                toast.success("Nova API Key gerada");
              }}
            >
              <KeyRound className="h-4 w-4" /> Gerar nova API Key
            </Button>
            <div>
              <Label className="mb-2 block">Eventos disponíveis</Label>
              <div className="flex flex-wrap gap-2">
                {webhookEvents.map((e) => (
                  <span key={e} className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-[12px]">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
