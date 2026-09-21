import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductImage } from "@/components/pavox/product-image";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutList } from "@/lib/checkouts-data";
import { cn } from "@/lib/utils";
import {
  comboKey,
  comboLabel,
  combine,
  emptyProduct,
  intOrZero,
  numOrNull,
  parseMoney,
  PRODUCT_TYPES,
  slugify,
  uploadProductImage,
  type ProductForm,
  type ProductType,
  type VariantForm,
} from "@/lib/products";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description ? <p className="text-[13px] text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function ImageUploader({
  main,
  images,
  onChange,
}: {
  main: string;
  images: string[];
  onChange: (next: { main_image: string; images: string[] }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        paths.push(await uploadProductImage(file));
      }
      const all = [main, ...images].filter(Boolean).concat(paths);
      onChange({ main_image: all[0] ?? "", images: all.slice(1) });
      toast.success(paths.length > 1 ? "Imagens enviadas" : "Imagem enviada");
    } catch {
      toast.error("Não foi possível enviar a imagem");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const all = [main, ...images].filter(Boolean);

  const setAsMain = (path: string) => {
    const rest = all.filter((p) => p !== path);
    onChange({ main_image: path, images: rest });
  };
  const remove = (path: string) => {
    const rest = all.filter((p) => p !== path);
    onChange({ main_image: rest[0] ?? "", images: rest.slice(1) });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {all.map((path, i) => (
          <div key={path} className="group relative">
            <ProductImage path={path} alt="Imagem do produto" className="h-24 w-24 rounded-xl border border-border" />
            <button
              type="button"
              onClick={() => remove(path)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm"
              aria-label="Remover imagem"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {i === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Destaque
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAsMain(path)}
                className="absolute bottom-1 left-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold opacity-0 transition group-hover:opacity-100"
              >
                Destacar
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Enviando" : "Enviar"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <p className="text-[12px] text-muted-foreground">
        A primeira imagem é usada como imagem de destaque do produto.
      </p>
    </div>
  );
}

export function ProductFormView({
  productId,
  initial,
}: {
  productId?: string;
  initial?: ProductForm;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductForm>(initial ?? emptyProduct());
  const { data: checkoutList = [] } = useCheckoutList();
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, slugTouched]);

  const combos = useMemo(() => combine(form.options), [form.options]);

  // keep variants in sync with generated combinations
  useEffect(() => {
    setForm((f) => {
      const generated = combine(f.options);
      if (!generated.length) return f.variants.length ? { ...f, variants: [] } : f;
      const byKey = new Map(f.variants.map((v) => [v.key, v]));
      const next: VariantForm[] = generated.map((combo) => {
        const key = comboKey(combo);
        const existing = byKey.get(key);
        return (
          existing ?? {
            key,
            name: comboLabel(combo),
            sku: "",
            barcode: "",
            price: f.price,
            promotional_price: "",
            inventory_quantity: "0",
            weight: "",
            image: "",
            options: combo,
          }
        );
      });
      const same =
        next.length === f.variants.length && next.every((v, i) => v.key === f.variants[i]?.key);
      return same ? f : { ...f, variants: next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(form.options)]);

  const setVariant = (key: string, patch: Partial<VariantForm>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)),
    }));

  const addOption = () => set("options", [...form.options, { name: "", values: [] }]);
  const updateOption = (index: number, patch: Partial<{ name: string; values: string[] }>) =>
    set(
      "options",
      form.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    );
  const removeOption = (index: number) =>
    set(
      "options",
      form.options.filter((_, i) => i !== index),
    );

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e["name"] = "Informe o nome do produto.";
    const price = parseMoney(form.price);
    if (price === null) e["price"] = "Informe o preço de venda.";
    else if (price < 0) e["price"] = "O preço não pode ser negativo.";
    const promo = parseMoney(form.promotional_price);
    if (promo !== null && price !== null && promo >= price)
      e["promotional_price"] = "O preço promocional deve ser menor que o preço de venda.";
    if (form.type === "fisico" && form.track_inventory && !form.options.length) {
      if (intOrZero(form.inventory_quantity) < 0) e["inventory_quantity"] = "Quantidade inválida.";
    }
    setErrors(e);
    if (Object.keys(e).length) toast.error("Revise os campos destacados antes de salvar.");
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        category: form.category.trim(),
        brand: form.brand.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode.trim(),
        tags: form.tags,
        price: parseMoney(form.price) ?? 0,
        promotional_price: numOrNull(form.promotional_price),
        cost: numOrNull(form.cost),
        main_image: form.main_image,
        images: form.images,
        status: form.status,
        checkout_id: form.checkout_id || null,
        slug: form.slug || slugify(form.name),
        seo_title: form.seo_title.trim(),
        seo_description: form.seo_description.trim(),
        track_inventory: form.type === "fisico" ? form.track_inventory : false,
        inventory_quantity: form.type === "fisico" ? intOrZero(form.inventory_quantity) : 0,
        allow_backorder: form.type === "fisico" ? form.allow_backorder : false,
        minimum_stock: form.type === "fisico" ? intOrZero(form.minimum_stock) : 0,
        weight: form.type === "fisico" ? numOrNull(form.weight) : null,
        length: form.type === "fisico" ? numOrNull(form.length) : null,
        width: form.type === "fisico" ? numOrNull(form.width) : null,
        height: form.type === "fisico" ? numOrNull(form.height) : null,
        digital_name: form.type === "digital" ? form.digital_name.trim() : "",
        digital_file: form.type === "digital" ? form.digital_file : "",
        digital_url: form.type === "digital" ? form.digital_url.trim() : "",
        options: form.options.filter((o) => o.name.trim() && o.values.length),
        updated_at: new Date().toISOString(),
      };

      let id = productId;
      if (id) {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id as string;
      }

      // rebuild variants (default variant when the product has no options)
      await supabase.from("product_variants").delete().eq("product_id", id);
      const rows = form.variants.length
        ? form.variants.map((v, i) => ({
            product_id: id!,
            name: v.name || comboLabel(v.options),
            sku: v.sku.trim(),
            barcode: v.barcode.trim(),
            price: parseMoney(v.price) ?? payload.price,
            promotional_price: numOrNull(v.promotional_price),
            inventory_quantity: intOrZero(v.inventory_quantity),
            weight: numOrNull(v.weight),
            image: v.image,
            options: v.options,
            is_default: false,
            status: "Ativo",
            position: i,
          }))
        : [
            {
              product_id: id!,
              name: "Padrão",
              sku: payload.sku,
              barcode: payload.barcode,
              price: payload.price,
              promotional_price: payload.promotional_price,
              inventory_quantity: payload.inventory_quantity,
              weight: payload.weight,
              image: payload.main_image,
              options: {},
              is_default: true,
              status: "Ativo",
              position: 0,
            },
          ];
      const { error: vErr } = await supabase.from("product_variants").insert(rows);
      if (vErr) throw vErr;

      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product", id] });
      toast.success(productId ? "Produto atualizado com sucesso" : "Produto criado com sucesso");
      void navigate({ to: "/produtos" });
    } catch {
      toast.error("Não foi possível salvar o produto");
    } finally {
      setSaving(false);
    }
  };

  const isPhysical = form.type === "fisico";

  return (
    <div className="space-y-5 pb-24">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Section title="Informações do produto" description="Como o produto será apresentado ao comprador.">
            <Field label="Nome do produto *" htmlFor="name" error={errors["name"]}>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Camiseta Premium"
              />
            </Field>
            <Field label="Descrição" htmlFor="description">
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Descreva o produto, benefícios e o que está incluso."
              />
            </Field>
            <Field label="Imagens">
              <ImageUploader
                main={form.main_image}
                images={form.images}
                onChange={(next) => setForm((f) => ({ ...f, ...next }))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria" htmlFor="category">
                <Input id="category" value={form.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field label="Marca" htmlFor="brand">
                <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              </Field>
              <Field label="SKU" htmlFor="sku">
                <Input id="sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="CAM-PRE-M" />
              </Field>
              <Field label="Código de barras" htmlFor="barcode">
                <Input id="barcode" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
              </Field>
            </div>
            <Field label="Tags" hint="Pressione Enter para adicionar.">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="lançamento"
              />
              {form.tags.length ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[12px]"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                        aria-label={`Remover ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </Field>
          </Section>

          <Section title="Preço" description="Valores em reais (BRL).">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Preço de venda *" htmlFor="price" error={errors["price"]}>
                <Input id="price" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="149,90" />
              </Field>
              <Field label="Preço promocional" htmlFor="promo" error={errors["promotional_price"]}>
                <Input
                  id="promo"
                  value={form.promotional_price}
                  onChange={(e) => set("promotional_price", e.target.value)}
                  placeholder="99,90"
                />
              </Field>
              <Field label="Custo do produto" htmlFor="cost">
                <Input id="cost" value={form.cost} onChange={(e) => set("cost", e.target.value)} placeholder="52,00" />
              </Field>
            </div>
            {parseMoney(form.promotional_price) !== null && parseMoney(form.price) !== null ? (
              <p className="text-[13px]">
                <span className="text-muted-foreground line-through">
                  {parseMoney(form.price)!.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>{" "}
                <span className="font-semibold text-success">
                  {parseMoney(form.promotional_price)!.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </p>
            ) : null}
          </Section>

          {isPhysical ? (
            <>
              <Section title="Estoque" description="Controle de disponibilidade do produto.">
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-[13.5px] font-medium">Controlar estoque</p>
                    <p className="text-[12px] text-muted-foreground">
                      O estoque poderá ser atualizado automaticamente pelos pedidos.
                    </p>
                  </div>
                  <Switch checked={form.track_inventory} onCheckedChange={(v) => set("track_inventory", v)} />
                </div>
                {form.track_inventory ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Quantidade disponível" htmlFor="qty" error={errors["inventory_quantity"]}>
                        <Input
                          id="qty"
                          value={form.inventory_quantity}
                          onChange={(e) => set("inventory_quantity", e.target.value)}
                        />
                      </Field>
                      <Field label="Estoque mínimo" htmlFor="min">
                        <Input
                          id="min"
                          value={form.minimum_stock}
                          onChange={(e) => set("minimum_stock", e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <p className="text-[13.5px] font-medium">Permitir venda com estoque zerado</p>
                      <Switch checked={form.allow_backorder} onCheckedChange={(v) => set("allow_backorder", v)} />
                    </div>
                  </>
                ) : null}
              </Section>

              <Section title="Informações físicas" description="Usadas futuramente para cálculo de frete.">
                <div className="grid gap-4 sm:grid-cols-4">
                  <Field label="Peso (kg)" htmlFor="weight">
                    <Input id="weight" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
                  </Field>
                  <Field label="Comprimento (cm)" htmlFor="length">
                    <Input id="length" value={form.length} onChange={(e) => set("length", e.target.value)} />
                  </Field>
                  <Field label="Largura (cm)" htmlFor="width">
                    <Input id="width" value={form.width} onChange={(e) => set("width", e.target.value)} />
                  </Field>
                  <Field label="Altura (cm)" htmlFor="height">
                    <Input id="height" value={form.height} onChange={(e) => set("height", e.target.value)} />
                  </Field>
                </div>
              </Section>
            </>
          ) : null}

          {form.type === "digital" ? (
            <Section title="Produto digital" description="Conteúdo entregue ao comprador.">
              <Field label="Nome do conteúdo" htmlFor="dname">
                <Input
                  id="dname"
                  value={form.digital_name}
                  onChange={(e) => set("digital_name", e.target.value)}
                  placeholder="E-book completo em PDF"
                />
              </Field>
              <Field label="Arquivo para entrega" hint="Envie o arquivo que será liberado após o pagamento.">
                <Input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const path = await uploadProductImage(file);
                      set("digital_file", path);
                      toast.success("Arquivo enviado");
                    } catch {
                      toast.error("Não foi possível enviar o arquivo");
                    }
                  }}
                />
              </Field>
              {form.digital_file ? (
                <p className="text-[12px] text-muted-foreground">Arquivo anexado ao produto.</p>
              ) : null}
              <Field label="URL de entrega" htmlFor="durl">
                <Input
                  id="durl"
                  value={form.digital_url}
                  onChange={(e) => set("digital_url", e.target.value)}
                  placeholder="https://area-de-membros.com/curso"
                />
              </Field>
            </Section>
          ) : null}

          <Section
            title="Variações"
            description="Crie opções como tamanho ou cor. As combinações geram variantes automaticamente."
          >
            {form.options.map((opt, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="flex items-end gap-3">
                  <Field label="Nome da opção" className="flex-1">
                    <Input
                      value={opt.name}
                      onChange={(e) => updateOption(i, { name: e.target.value })}
                      placeholder="Tamanho"
                    />
                  </Field>
                  <Button variant="ghost" size="icon" onClick={() => removeOption(i)} aria-label="Remover opção">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  <Label>Valores</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {opt.values.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[12px]"
                      >
                        {v}
                        <button
                          type="button"
                          aria-label={`Remover ${v}`}
                          onClick={() => updateOption(i, { values: opt.values.filter((x) => x !== v) })}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    placeholder="Digite um valor e pressione Enter (P, M, G)"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      const value = e.currentTarget.value.trim();
                      if (!value || opt.values.includes(value)) return;
                      updateOption(i, { values: [...opt.values, value] });
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addOption}>
              <Plus className="h-4 w-4" /> Adicionar opção
            </Button>

            {combos.length ? (
              <>
                <Separator />
                <p className="text-[13px] font-medium">{form.variants.length} variantes geradas</p>
                <div className="space-y-3">
                  {form.variants.map((v) => (
                    <div key={v.key} className="rounded-lg border border-border p-4">
                      <p className="mb-3 text-[13.5px] font-semibold">{v.name}</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="SKU">
                          <Input value={v.sku} onChange={(e) => setVariant(v.key, { sku: e.target.value })} />
                        </Field>
                        <Field label="Preço">
                          <Input value={v.price} onChange={(e) => setVariant(v.key, { price: e.target.value })} />
                        </Field>
                        <Field label="Preço promocional">
                          <Input
                            value={v.promotional_price}
                            onChange={(e) => setVariant(v.key, { promotional_price: e.target.value })}
                          />
                        </Field>
                        <Field label="Estoque">
                          <Input
                            value={v.inventory_quantity}
                            onChange={(e) => setVariant(v.key, { inventory_quantity: e.target.value })}
                          />
                        </Field>
                        <Field label="Peso (kg)">
                          <Input value={v.weight} onChange={(e) => setVariant(v.key, { weight: e.target.value })} />
                        </Field>
                        <Field label="Código de barras">
                          <Input value={v.barcode} onChange={(e) => setVariant(v.key, { barcode: e.target.value })} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </Section>

          <Section title="SEO e identificação">
            <Field label="Slug" htmlFor="slug" hint="Gerado a partir do nome, mas pode ser editado.">
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Título SEO" htmlFor="seotitle">
              <Input id="seotitle" value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
            </Field>
            <Field label="Descrição SEO" htmlFor="seodesc">
              <Textarea
                id="seodesc"
                rows={3}
                value={form.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
              />
            </Field>
          </Section>
        </div>

        <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <Section title="Tipo do produto">
            <div className="space-y-2">
              {PRODUCT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("type", t.value as ProductType)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left transition",
                    form.type === t.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <p className="text-[13.5px] font-medium">{t.label}</p>
                  <p className="text-[12px] text-muted-foreground">{t.hint}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Status" description="Produtos inativos não ficam disponíveis para novos checkouts.">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </Section>

          <Section title="Checkout" description="Vincule este produto a um checkout que você já criou.">
            <Select
              value={form.checkout_id || "none"}
              onValueChange={(v) => set("checkout_id", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum checkout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum checkout</SelectItem>
                {checkoutList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {checkoutList.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                Você ainda não criou nenhum checkout. Crie um em Checkouts para vinculá-lo aqui.
              </p>
            ) : null}
          </Section>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => void navigate({ to: "/produtos" })}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar produto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
