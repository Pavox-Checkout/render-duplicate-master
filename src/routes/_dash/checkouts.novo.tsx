import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, Rocket, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl, products } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/checkouts/novo")({
  component: CheckoutBuilder,
  head: () => ({
    meta: [
      { title: "Criar checkout · PAVOX" },
      {
        name: "description",
        content: "Monte um checkout personalizado com preview em tempo real, order bump e upsell.",
      },
      { property: "og:title", content: "Criar checkout · PAVOX" },
      { property: "og:description", content: "Construtor visual de checkout da PAVOX." },
    ],
  }),
});

const sections = [
  { key: "produto", label: "Produto e preço" },
  { key: "pagamento", label: "Métodos de pagamento" },
  { key: "campos", label: "Campos do cliente" },
  { key: "ofertas", label: "Upsell e order bump" },
  { key: "recuperacao", label: "Recuperação" },
  { key: "visual", label: "Personalização" },
] as const;

type SectionKey = (typeof sections)[number]["key"];

function CheckoutBuilder() {
  const [name, setName] = useState("Checkout Principal");
  const [productId, setProductId] = useState("p1");
  const [section, setSection] = useState<SectionKey>("produto");
  const [methods, setMethods] = useState({ pix: true, card: true, boleto: false });
  const [fields, setFields] = useState({ phone: true, doc: true, address: false });
  const [bump, setBump] = useState(true);
  const [upsell, setUpsell] = useState(false);
  const [accent, setAccent] = useState("#2563eb");

  const product = products.find((p) => p.id === productId)!;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/checkouts">
          <ArrowLeft className="h-4 w-4" /> Voltar para checkouts
        </Link>
      </Button>

      <PageHeader
        title="Construtor de checkout"
        subtitle="Configure à esquerda, veja o resultado em tempo real no centro."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Rascunho salvo")}>
              Salvar rascunho
            </Button>
            <Button onClick={() => toast.success("Checkout publicado!", { description: "Link pronto para divulgação." })}>
              <Rocket className="h-4 w-4" /> Publicar checkout
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_300px]">
        {/* ESQUERDA */}
        <div className="surface h-fit p-3">
          <p className="px-2 pb-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Configurações
          </p>
          <div className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  section === s.key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-border px-1 pt-3">
            <Label htmlFor="cname" className="text-[12px]">
              Nome do checkout
            </Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>

        {/* CENTRO — PREVIEW */}
        <div className="surface bg-secondary/40 p-4 sm:p-8">
          <div className="mx-auto max-w-[460px] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lift)]">
            <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
            <div className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-[15px] font-bold">
                  PAVO<span style={{ color: accent }}>X</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> Compra segura
                </span>
              </div>

              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-[13.5px]">
                  <span className="font-medium">{product.name}</span>
                  <span className="font-semibold">{brl(product.price)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Seus dados
                </p>
                {["Nome completo", "E-mail"].map((f) => (
                  <div key={f} className="h-9 rounded-md border border-border bg-secondary/50 px-3 text-[12.5px] leading-9 text-muted-foreground">
                    {f}
                  </div>
                ))}
                {fields.phone && (
                  <div className="h-9 rounded-md border border-border bg-secondary/50 px-3 text-[12.5px] leading-9 text-muted-foreground">
                    Telefone
                  </div>
                )}
                {fields.doc && (
                  <div className="h-9 rounded-md border border-border bg-secondary/50 px-3 text-[12.5px] leading-9 text-muted-foreground">
                    CPF
                  </div>
                )}
                {fields.address && (
                  <div className="h-9 rounded-md border border-border bg-secondary/50 px-3 text-[12.5px] leading-9 text-muted-foreground">
                    Endereço
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Pagamento
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  {methods.pix && <div className="rounded-md border border-border py-2 font-medium">Pix</div>}
                  {methods.card && <div className="rounded-md border border-border py-2 font-medium">Cartão</div>}
                  {methods.boleto && <div className="rounded-md border border-border py-2 font-medium">Boleto</div>}
                </div>
              </div>

              {bump && (
                <div className="rounded-lg border border-dashed p-3" style={{ borderColor: accent }}>
                  <p className="text-[12.5px] font-semibold">Adicione o Bônus Exclusivo por + R$ 47,00</p>
                  <p className="text-[11.5px] text-muted-foreground">Oferta única nesta página.</p>
                </div>
              )}

              <button
                className="h-11 w-full rounded-lg text-[14px] font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                Pagar {brl(product.price)}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Pagamento processado com criptografia
              </p>
            </div>
          </div>
          {upsell && (
            <p className="mt-4 text-center text-[12px] text-muted-foreground">
              Após a compra, o cliente verá uma oferta de upsell.
            </p>
          )}
        </div>

        {/* DIREITA */}
        <div className="surface h-fit space-y-5 p-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Seção selecionada
            </p>
            <h3 className="mt-1 font-semibold">{sections.find((s) => s.key === section)!.label}</h3>
          </div>

          {section === "produto" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Produto</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Preço</Label>
                <Input defaultValue={product.price.toFixed(2).replace(".", ",")} />
              </div>
            </div>
          )}

          {section === "pagamento" && (
            <div className="space-y-3">
              {(
                [
                  ["pix", "Pix"],
                  ["card", "Cartão de crédito"],
                  ["boleto", "Boleto"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-[13px] font-normal">{label}</Label>
                  <Switch
                    checked={methods[key]}
                    onCheckedChange={(v) => setMethods((m) => ({ ...m, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          )}

          {section === "campos" && (
            <div className="space-y-3">
              {(
                [
                  ["phone", "Telefone"],
                  ["doc", "CPF / CNPJ"],
                  ["address", "Endereço de entrega"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-[13px] font-normal">{label}</Label>
                  <Switch
                    checked={fields[key]}
                    onCheckedChange={(v) => setFields((f) => ({ ...f, [key]: v }))}
                  />
                </div>
              ))}
              <p className="text-[12px] text-muted-foreground">
                Menos campos costumam aumentar a conversão.
              </p>
            </div>
          )}

          {section === "ofertas" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-normal">Order bump</Label>
                <Switch checked={bump} onCheckedChange={setBump} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-normal">Upsell pós-compra</Label>
                <Switch checked={upsell} onCheckedChange={setUpsell} />
              </div>
            </div>
          )}

          {section === "recuperacao" && (
            <div className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-normal">Recuperação por e-mail</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-normal">Recuperação por WhatsApp</Label>
                <Switch />
              </div>
              <p className="text-[12px] text-muted-foreground">
                As automações serão configuráveis em breve.
              </p>
            </div>
          )}

          {section === "visual" && (
            <div className="space-y-3">
              <Label className="text-[13px]">Cor de destaque</Label>
              <div className="flex gap-2">
                {["#2563eb", "#0f172a", "#16a34a", "#db2777", "#f59e0b"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccent(c)}
                    aria-label={`Cor ${c}`}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform hover:scale-105",
                      accent === c ? "border-foreground" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
