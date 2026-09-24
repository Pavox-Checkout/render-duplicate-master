import { type ReactNode } from "react";
import {
  AlignStartVertical,
  Bell,
  CreditCard,
  GripVertical,
  Image as ImageIcon,
  LayoutPanelTop,
  ListChecks,
  Minus,
  Package,
  Palette,
  Plus,
  Quote,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Timer,
  Trash2,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PixIcon } from "@/components/pavox/builder/pix-icon";
import {
  AlignField,
  ColorField,
  Group,
  ImageUpload,
  NumberField,
  RadioCards,
  Row,
  Segmented,
  SelectRow,
  SliderRow,
  SwitchRow,
  TextField,
} from "@/components/pavox/builder/controls";
import {
  ADDRESS_FIELDS,
  CUSTOMER_FIELDS,
  FIELD_LABELS,
  FONT_LABELS,
  LIVE_PHRASES,
  PALETTES,
  PALETTE_SWATCHES,
  newId,
  type CheckoutConfig,
  type FieldKey,
} from "@/lib/checkout-builder";
import { cn } from "@/lib/utils";

// `receiptText` não existe no pacote de ícones — mapeia para um disponível.
const ReceiptIcon = ListChecks;

type Props = {
  config: CheckoutConfig;
  update: (patch: Partial<CheckoutConfig>) => void;
};

export function ConfigSidebar({ config, update }: Props) {
  const advanced = config.mode === "advanced";

  // helper para atualizar uma seção específica preservando o resto
  function set<K extends keyof CheckoutConfig>(key: K, patch: Partial<CheckoutConfig[K]>) {
    update({ [key]: { ...(config[key] as object), ...patch } } as Partial<CheckoutConfig>);
  }

  return (
    <Accordion type="multiple" defaultValue={["cabecalho", "cores"]} className="w-full">
      {/* ── CABEÇALHO ── */}
      <SectionItem value="cabecalho" icon={LayoutPanelTop} title="Cabeçalho">
        <Group title="Logo">
          <ImageUpload
            label="Logo da loja"
            hint="Enviada sem distorção — ajuste a largura abaixo."
            value={config.header.logoUrl}
            onChange={(v) => set("header", { logoUrl: v })}
          />
          <AlignField value={config.header.logoAlign} onChange={(v) => set("header", { logoAlign: v })} />
          <SliderRow
            label="Largura no desktop"
            value={config.header.logoWidthDesktop}
            min={80}
            max={260}
            suffix="px"
            onChange={(v) => set("header", { logoWidthDesktop: v })}
          />
          <SliderRow
            label="Largura no mobile"
            value={config.header.logoWidthMobile}
            min={60}
            max={200}
            suffix="px"
            onChange={(v) => set("header", { logoWidthMobile: v })}
          />
        </Group>

        <Divider />
        <Group title="Nome da loja">
          <SwitchRow
            label="Exibir nome da loja"
            checked={config.header.showStoreName}
            onChange={(v) => set("header", { showStoreName: v })}
          />
          {config.header.showStoreName ? (
            <TextField
              label="Nome"
              value={config.header.storeName}
              onChange={(v) => set("header", { storeName: v })}
            />
          ) : null}
        </Group>

        <Divider />
        <Group title="Cores do cabeçalho">
          <ColorField label="Fundo" value={config.header.background} onChange={(v) => set("header", { background: v })} />
          <ColorField label="Texto" value={config.header.textColor} onChange={(v) => set("header", { textColor: v })} />
        </Group>

        {advanced ? (
          <>
            <Divider />
            <Group title="Favicon">
              <ImageUpload
                label="Ícone da aba"
                hint="Aparece na aba do navegador (apenas prévia)."
                value={config.header.faviconUrl}
                onChange={(v) => set("header", { faviconUrl: v })}
                aspect="1 / 1"
              />
            </Group>
          </>
        ) : null}

        <Divider />
        <Group title="Pagamento seguro">
          <SwitchRow
            label="Exibir selo de segurança"
            hint="Mostra uma indicação de segurança no cabeçalho."
            checked={config.header.secureEnabled}
            onChange={(v) => set("header", { secureEnabled: v })}
          />
          {config.header.secureEnabled ? (
            <>
              <TextField label="Texto" value={config.header.secureText} onChange={(v) => set("header", { secureText: v })} />
              <AlignField value={config.header.secureAlign} onChange={(v) => set("header", { secureAlign: v })} />
              <Segmented
                label="Tamanho"
                value={config.header.secureSize}
                onChange={(v) => set("header", { secureSize: v })}
                options={[
                  { value: "sm", label: "Pequeno" },
                  { value: "md", label: "Médio" },
                ]}
              />
              <ColorField label="Cor" value={config.header.secureColor} onChange={(v) => set("header", { secureColor: v })} />
            </>
          ) : null}
        </Group>
      </SectionItem>

      {/* ── DIVISOR ── */}
      {advanced ? (
        <SectionItem value="divisor" icon={Minus} title="Divisor" active={config.divider.enabled}>
          <SwitchRow
            label="Exibir linha divisória"
            checked={config.divider.enabled}
            onChange={(v) => set("divider", { enabled: v })}
          />
          {config.divider.enabled ? (
            <>
              <ColorField label="Cor" value={config.divider.color} onChange={(v) => set("divider", { color: v })} />
              <SliderRow label="Espessura" value={config.divider.thickness} min={1} max={6} suffix="px" onChange={(v) => set("divider", { thickness: v })} />
              <SliderRow label="Opacidade" value={config.divider.opacity} min={0} max={100} suffix="%" onChange={(v) => set("divider", { opacity: v })} />
              <SliderRow label="Margem superior" value={config.divider.spacingTop} min={0} max={48} suffix="px" onChange={(v) => set("divider", { spacingTop: v })} />
              <SliderRow label="Margem inferior" value={config.divider.spacingBottom} min={0} max={48} suffix="px" onChange={(v) => set("divider", { spacingBottom: v })} />
            </>
          ) : null}
        </SectionItem>
      ) : null}

      {/* ── BARRA DE AVISOS ── */}
      {advanced ? (
        <SectionItem value="avisos" icon={Bell} title="Barra de avisos" active={config.notice.enabled}>
          <SwitchRow label="Exibir barra de avisos" checked={config.notice.enabled} onChange={(v) => set("notice", { enabled: v })} />
          {config.notice.enabled ? (
            <>
              <Group title="Mensagens">
                <div className="space-y-2">
                  {config.notice.messages.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <Input
                        value={m.text}
                        onChange={(e) => {
                          const messages = config.notice.messages.map((x) => (x.id === m.id ? { ...x, text: e.target.value } : x));
                          set("notice", { messages });
                        }}
                        className="h-9 text-[13px]"
                      />
                      {config.notice.messages.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => set("notice", { messages: config.notice.messages.filter((x) => x.id !== m.id) })}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Remover mensagem ${i + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <AddButton
                    label="Adicionar mensagem"
                    onClick={() => set("notice", { messages: [...config.notice.messages, { id: newId("msg"), text: "Nova mensagem" }] })}
                  />
                </div>
              </Group>
              <Divider />
              <ColorField label="Fundo" value={config.notice.background} onChange={(v) => set("notice", { background: v })} />
              <ColorField label="Texto" value={config.notice.textColor} onChange={(v) => set("notice", { textColor: v })} />
              <Segmented
                label="Tamanho"
                value={config.notice.size}
                onChange={(v) => set("notice", { size: v })}
                options={[
                  { value: "sm", label: "P" },
                  { value: "md", label: "M" },
                  { value: "lg", label: "G" },
                ]}
              />
              <AlignField value={config.notice.align} onChange={(v) => set("notice", { align: v })} />
              <SwitchRow label="Exibir ícone" checked={config.notice.icon} onChange={(v) => set("notice", { icon: v })} />
            </>
          ) : null}
        </SectionItem>
      ) : null}

      {/* ── BANNER ── */}
      {advanced ? (
        <SectionItem value="banner" icon={ImageIcon} title="Banner" active={config.banner.enabled}>
          <SwitchRow label="Exibir banner" checked={config.banner.enabled} onChange={(v) => set("banner", { enabled: v })} />
          {config.banner.enabled ? (
            <>
              <ImageUpload label="Imagem desktop" value={config.banner.desktopUrl} onChange={(v) => set("banner", { desktopUrl: v })} />
              <ImageUpload label="Imagem mobile" value={config.banner.mobileUrl} onChange={(v) => set("banner", { mobileUrl: v })} aspect="4 / 3" />
              <Segmented
                label="Ajuste da imagem"
                value={config.banner.fit}
                onChange={(v) => set("banner", { fit: v })}
                options={[
                  { value: "cover", label: "Preencher" },
                  { value: "contain", label: "Conter" },
                  { value: "original", label: "Original" },
                ]}
              />
              <SelectRow
                label="Posição"
                value={config.banner.position}
                onChange={(v) => set("banner", { position: v })}
                options={[
                  { value: "center", label: "Centro" },
                  { value: "top", label: "Topo" },
                  { value: "bottom", label: "Baixo" },
                  { value: "left", label: "Esquerda" },
                  { value: "right", label: "Direita" },
                ]}
              />
              <SliderRow label="Altura" value={config.banner.height} min={80} max={360} suffix="px" onChange={(v) => set("banner", { height: v })} />
              <SliderRow label="Raio da borda" value={config.banner.radius} min={0} max={32} suffix="px" onChange={(v) => set("banner", { radius: v })} />
              <SliderRow label="Espaçamento" value={config.banner.spacing} min={0} max={48} suffix="px" onChange={(v) => set("banner", { spacing: v })} />
            </>
          ) : null}
        </SectionItem>
      ) : null}

      {/* ── PRODUTO ── */}
      <SectionItem value="produto" icon={Package} title="Produto">
        <p className="rounded-md bg-secondary/60 px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
          Dados de demonstração — o DEV conectará o produto real depois.
        </p>
        <TextField label="Título" value={config.product.title} onChange={(v) => set("product", { title: v })} />
        <TextField label="Descrição" value={config.product.description} onChange={(v) => set("product", { description: v })} textarea />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Preço" value={config.product.price} min={0} step={1} suffix="R$" onChange={(v) => set("product", { price: v })} />
          <NumberField label="De" value={config.product.compareAt} min={0} step={1} suffix="R$" onChange={(v) => set("product", { compareAt: v })} />
        </div>
        <ImageUpload label="Imagem do produto" value={config.product.image} onChange={(v) => set("product", { image: v })} aspect="1 / 1" />
        <SwitchRow label="Mostrar preço antigo" checked={config.product.showCompare} onChange={(v) => set("product", { showCompare: v })} />
        <SwitchRow label="Mostrar % de desconto" checked={config.product.showDiscount} onChange={(v) => set("product", { showDiscount: v })} />
        <SwitchRow label="Seletor de quantidade" checked={config.product.showQuantity} onChange={(v) => set("product", { showQuantity: v })} />
      </SectionItem>

      {/* ── RESUMO ── */}
      {advanced ? (
        <SectionItem value="resumo" icon={ReceiptIcon} title="Resumo" active={config.summary.enabled}>
          <SwitchRow label="Exibir resumo do pedido" checked={config.summary.enabled} onChange={(v) => set("summary", { enabled: v })} />
          {config.summary.enabled ? (
            <>
              <Group title="Comportamento">
                <RadioCards
                  value={config.summary.behavior}
                  onChange={(v) => set("summary", { behavior: v })}
                  options={[
                    { value: "open", label: "Sempre aberto", hint: "Resumo visível em todas as telas." },
                    { value: "closed", label: "Sempre fechado", hint: "Recolhido por padrão." },
                    { value: "mobile-toggle", label: "Abrir/fechar no mobile", hint: "Recolhível apenas no celular." },
                  ]}
                />
              </Group>
              <Divider />
              <Group title="Cupom">
                <SwitchRow label="Exibir cupom de desconto" checked={config.summary.couponEnabled} onChange={(v) => set("summary", { couponEnabled: v })} />
                {config.summary.couponEnabled ? (
                  <SwitchRow label='Mostrar "Inserir cupom" primeiro' checked={config.summary.couponFirst} onChange={(v) => set("summary", { couponFirst: v })} />
                ) : null}
              </Group>
              <Divider />
              <SwitchRow label="Exibir parcelamento no resumo" checked={config.summary.installmentsEnabled} onChange={(v) => set("summary", { installmentsEnabled: v })} />
            </>
          ) : null}
        </SectionItem>
      ) : null}

      {/* ── ETAPAS ── */}
      <SectionItem value="etapas" icon={ListChecks} title="Etapas" active={config.steps.enabled}>
        <SwitchRow
          label="Usar checkout por etapas"
          hint="Divide o preenchimento em passos para reduzir a fricção."
          checked={config.steps.enabled}
          onChange={(v) => set("steps", { enabled: v })}
        />
        {config.steps.enabled ? (
          <>
            <Segmented
              label="Estilo"
              value={config.steps.style}
              onChange={(v) => set("steps", { style: v })}
              options={[
                { value: "line", label: "Linha" },
                { value: "numbered", label: "Numerado" },
                { value: "compact", label: "Compacto" },
              ]}
            />
            <SwitchRow label="Mostrar números" checked={config.steps.showNumbers} onChange={(v) => set("steps", { showNumbers: v })} />
            <SwitchRow label="Mostrar progresso" checked={config.steps.showProgress} onChange={(v) => set("steps", { showProgress: v })} />
            <Divider />
            <Group title="Etapas">
              <div className="space-y-2">
                {config.steps.items.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <Input
                      value={s.label}
                      onChange={(e) => set("steps", { items: config.steps.items.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)) })}
                      className="h-8 text-[12.5px]"
                    />
                    <MiniSwitch
                      checked={s.enabled}
                      onChange={(v) => set("steps", { items: config.steps.items.map((x) => (x.id === s.id ? { ...x, enabled: v } : x)) })}
                    />
                    {config.steps.items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => set("steps", { items: config.steps.items.filter((x) => x.id !== s.id) })}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Remover etapa ${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))}
                {config.steps.items.length < 5 ? (
                  <AddButton
                    label="Adicionar etapa"
                    onClick={() => set("steps", { items: [...config.steps.items, { id: newId("step"), label: "Nova etapa", icon: "circle", enabled: true }] })}
                  />
                ) : null}
              </div>
            </Group>
          </>
        ) : null}
      </SectionItem>

      {/* ── PAGAMENTO ── */}
      <SectionItem value="pagamento" icon={CreditCard} title="Pagamento">
        <div className="space-y-2">
          <MethodRow
            icon={<PixIcon className="h-4 w-4" />}
            label="PIX"
            hint="Pagamento instantâneo"
            checked={config.payment.pix}
            onChange={(v) => set("payment", { pix: v })}
          />
          <MethodRow
            icon={<CreditCard className="h-4 w-4" />}
            label="Cartão de crédito"
            hint="Em até 12x"
            checked={config.payment.card}
            onChange={(v) => set("payment", { card: v })}
          />
          <MethodRow
            icon={<ReceiptIcon className="h-4 w-4" />}
            label="Boleto"
            hint="Compensa em 1 dia útil"
            checked={config.payment.boleto}
            onChange={(v) => set("payment", { boleto: v })}
          />
        </div>
      </SectionItem>

      {/* ── ESCASSEZ ── */}
      {advanced ? (
        <SectionItem value="escassez" icon={Timer} title="Escassez" active={config.scarcity.enabled}>
          <SwitchRow label="Exibir contagem regressiva" checked={config.scarcity.enabled} onChange={(v) => set("scarcity", { enabled: v })} />
          {config.scarcity.enabled ? (
            <>
              <TextField label="Texto" value={config.scarcity.text} onChange={(v) => set("scarcity", { text: v })} />
              <NumberField label="Duração" value={config.scarcity.duration} min={1} max={120} suffix="min" onChange={(v) => set("scarcity", { duration: v })} />
              <ColorField label="Cor" value={config.scarcity.color} onChange={(v) => set("scarcity", { color: v })} />
              <Segmented
                label="Estilo"
                value={config.scarcity.style}
                onChange={(v) => set("scarcity", { style: v })}
                options={[
                  { value: "bar", label: "Barra" },
                  { value: "badge", label: "Selo" },
                ]}
              />
              <Segmented
                label="Posição"
                value={config.scarcity.position}
                onChange={(v) => set("scarcity", { position: v })}
                options={[
                  { value: "top", label: "Topo" },
                  { value: "above-button", label: "Acima do botão" },
                ]}
              />
            </>
          ) : null}
        </SectionItem>
      ) : null}

      {/* ── PROVA SOCIAL ── */}
      {advanced ? (
        <SectionItem value="social" icon={Quote} title="Prova social" active={config.social.enabled}>
          <SwitchRow label="Ativar prova social" checked={config.social.enabled} onChange={(v) => set("social", { enabled: v })} />
          {config.social.enabled ? (
            <>
              <Segmented
                label="Layout"
                value={config.social.layout}
                onChange={(v) => set("social", { layout: v })}
                options={[
                  { value: "card", label: "Card" },
                  { value: "list", label: "Lista" },
                  { value: "rating", label: "Nota" },
                ]}
              />
              <SwitchRow label="Mostrar estrelas" checked={config.social.showStars} onChange={(v) => set("social", { showStars: v })} />
              <SwitchRow label="Mostrar foto" checked={config.social.showPhoto} onChange={(v) => set("social", { showPhoto: v })} />
              <Divider />
              <Group title="Depoimentos">
                <div className="space-y-2.5">
                  {config.social.testimonials.map((t, i) => (
                    <div key={t.id} className="space-y-2 rounded-lg border border-border p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground">Depoimento {i + 1}</span>
                        {config.social.testimonials.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => set("social", { testimonials: config.social.testimonials.filter((x) => x.id !== t.id) })}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            aria-label={`Remover depoimento ${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <Input
                        value={t.name}
                        placeholder="Nome"
                        onChange={(e) => set("social", { testimonials: config.social.testimonials.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)) })}
                        className="h-8 text-[12.5px]"
                      />
                      <Input
                        value={t.text}
                        placeholder="Depoimento"
                        onChange={(e) => set("social", { testimonials: config.social.testimonials.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)) })}
                        className="h-8 text-[12.5px]"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-[11.5px] text-muted-foreground">Nota</Label>
                        <Segmented
                          value={String(t.rating)}
                          onChange={(v) => set("social", { testimonials: config.social.testimonials.map((x) => (x.id === t.id ? { ...x, rating: Number(v) } : x)) })}
                          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
                        />
                      </div>
                    </div>
                  ))}
                  <AddButton
                    label="Adicionar depoimento"
                    onClick={() => set("social", { testimonials: [...config.social.testimonials, { id: newId("tst"), name: "Novo cliente", text: "Depoimento...", rating: 5 }] })}
                  />
                </div>
              </Group>
            </>
          ) : null}
        </SectionItem>
      ) : null}

      {/* ── COMPRA AO VIVO ── */}
      {advanced ? (
        <SectionItem value="live" icon={Radio} title="Compra ao vivo" active={config.live.enabled}>
          <SwitchRow label="Ativar notificações" checked={config.live.enabled} onChange={(v) => set("live", { enabled: v })} />
          {config.live.enabled ? (
            <>
              <p className="rounded-md bg-secondary/60 px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
                Demonstração visual — o DEV conectará aos pedidos reais depois.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Nome" value={config.live.name} onChange={(v) => set("live", { name: v })} />
                <TextField label="Produto" value={config.live.product} onChange={(v) => set("live", { product: v })} />
              </div>
              <TextField label="Localização" value={config.live.location} onChange={(v) => set("live", { location: v })} />
              <SwitchRow label="Mostrar localização" checked={config.live.showLocation} onChange={(v) => set("live", { showLocation: v })} />
              <SelectRow
                label="Frase"
                value={config.live.phrase}
                onChange={(v) => set("live", { phrase: v })}
                options={LIVE_PHRASES.map((p) => ({ value: p, label: p }))}
              />
              <TextField label="Frase personalizada (opcional)" value={config.live.customPhrase} onChange={(v) => set("live", { customPhrase: v })} />
              <SwitchRow label="Mostrar avatar" checked={config.live.showAvatar} onChange={(v) => set("live", { showAvatar: v })} />
              <SelectRow
                label="Posição"
                value={config.live.position}
                onChange={(v) => set("live", { position: v })}
                options={[
                  { value: "bottom-left", label: "Inferior esquerdo" },
                  { value: "bottom-right", label: "Inferior direito" },
                  { value: "top-left", label: "Superior esquerdo" },
                  { value: "top-right", label: "Superior direito" },
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Duração" value={config.live.duration} min={2} max={20} suffix="s" onChange={(v) => set("live", { duration: v })} />
                <NumberField label="Intervalo" value={config.live.interval} min={3} max={60} suffix="s" onChange={(v) => set("live", { interval: v })} />
              </div>
              <Segmented
                label="Animação"
                value={config.live.animation}
                onChange={(v) => set("live", { animation: v })}
                options={[
                  { value: "slide", label: "Deslizar" },
                  { value: "fade", label: "Fade" },
                ]}
              />
            </>
          ) : null}
        </SectionItem>
      ) : null}

      {/* ── CORES ── */}
      <SectionItem value="cores" icon={Palette} title="Cores">
        <Group title="Paleta rápida">
          <div className="grid grid-cols-3 gap-2">
            {PALETTE_SWATCHES.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPalette(config, update, p.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors",
                  config.colors.palette === p.key ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/60",
                )}
              >
                <span className="flex -space-x-1">
                  {p.dots.map((d, i) => (
                    <span key={i} className="h-4 w-4 rounded-full border border-card" style={{ background: d }} />
                  ))}
                </span>
                <span className="text-[11px] font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </Group>
        <Divider />
        <Group title="Cores individuais">
          <ColorField label="Cor principal" value={config.colors.primary} onChange={(v) => setColor(config, update, { primary: v })} />
          <ColorField label="Botão" value={config.colors.button} onChange={(v) => setColor(config, update, { button: v })} />
          <ColorField label="Fundo" value={config.colors.background} onChange={(v) => setColor(config, update, { background: v })} />
          <ColorField label="Superfície" value={config.colors.surface} onChange={(v) => setColor(config, update, { surface: v })} />
          <ColorField label="Texto" value={config.colors.text} onChange={(v) => setColor(config, update, { text: v })} />
          <ColorField label="Texto secundário" value={config.colors.textMuted} onChange={(v) => setColor(config, update, { textMuted: v })} />
          <ColorField label="Borda" value={config.colors.border} onChange={(v) => setColor(config, update, { border: v })} />
          {advanced ? (
            <>
              <ColorField label="Sucesso" value={config.colors.success} onChange={(v) => setColor(config, update, { success: v })} />
              <ColorField label="Alerta" value={config.colors.warning} onChange={(v) => setColor(config, update, { warning: v })} />
              <ColorField label="Erro" value={config.colors.error} onChange={(v) => setColor(config, update, { error: v })} />
            </>
          ) : null}
        </Group>
      </SectionItem>

      {/* ── TIPOGRAFIA ── */}
      {advanced ? (
        <SectionItem value="tipografia" icon={Type} title="Tipografia">
          <SelectRow
            label="Fonte"
            value={config.typography.fontFamily}
            onChange={(v) => set("typography", { fontFamily: v })}
            options={[
              { value: "sans", label: FONT_LABELS.sans },
              { value: "display", label: FONT_LABELS.display },
              { value: "serif", label: FONT_LABELS.serif },
            ]}
          />
          <Group title="Títulos">
            <SliderRow label="Tamanho" value={config.typography.headingSize} min={15} max={30} suffix="px" onChange={(v) => set("typography", { headingSize: v })} />
            <SelectRow
              label="Peso"
              value={String(config.typography.headingWeight)}
              onChange={(v) => set("typography", { headingWeight: Number(v) })}
              options={[
                { value: "500", label: "Médio" },
                { value: "600", label: "Semibold" },
                { value: "700", label: "Bold" },
                { value: "800", label: "Extra bold" },
              ]}
            />
          </Group>
          <Group title="Textos">
            <SliderRow label="Corpo" value={config.typography.bodySize} min={11} max={16} suffix="px" onChange={(v) => set("typography", { bodySize: v })} />
            <SliderRow label="Labels" value={config.typography.labelSize} min={10} max={15} suffix="px" onChange={(v) => set("typography", { labelSize: v })} />
            <SliderRow label="Altura da linha" value={config.typography.lineHeight} min={1.2} max={2} step={0.1} onChange={(v) => set("typography", { lineHeight: v })} />
          </Group>
          <Group title="Botões">
            <SliderRow label="Tamanho" value={config.typography.buttonSize} min={12} max={18} suffix="px" onChange={(v) => set("typography", { buttonSize: v })} />
            <SelectRow
              label="Peso"
              value={String(config.typography.buttonWeight)}
              onChange={(v) => set("typography", { buttonWeight: Number(v) })}
              options={[
                { value: "500", label: "Médio" },
                { value: "600", label: "Semibold" },
                { value: "700", label: "Bold" },
              ]}
            />
          </Group>
        </SectionItem>
      ) : null}

      {/* ── BOTÃO / CTA ── */}
      <SectionItem value="cta" icon={SlidersHorizontal} title="Botão de compra">
        <TextField label="Texto do botão" value={config.button.label} onChange={(v) => set("button", { label: v })} />
        <SliderRow label="Altura" value={config.button.height} min={40} max={72} suffix="px" onChange={(v) => set("button", { height: v })} />
        <SliderRow label="Arredondamento" value={config.button.radius} min={0} max={32} suffix="px" onChange={(v) => set("button", { radius: v })} />
        <SwitchRow label="Largura total" checked={config.button.full} onChange={(v) => set("button", { full: v })} />
        <SwitchRow label="Ícone de cadeado" checked={config.button.icon} onChange={(v) => set("button", { icon: v })} />
      </SectionItem>

      {/* ── SEGURANÇA E CONFIANÇA ── */}
      <SectionItem value="seguranca" icon={ShieldCheck} title="Segurança e confiança" active={config.security.enabled}>
        <SwitchRow label="Exibir selos de confiança" checked={config.security.enabled} onChange={(v) => set("security", { enabled: v })} />
        {config.security.enabled ? (
          <>
            <Segmented
              label="Estilo"
              value={config.security.style}
              onChange={(v) => set("security", { style: v })}
              options={[
                { value: "badges", label: "Selos" },
                { value: "inline", label: "Em linha" },
              ]}
            />
            <Group title="Itens">
              <div className="space-y-2">
                {config.security.items.map((it, i) => (
                  <div key={it.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                    <Input
                      value={it.label}
                      onChange={(e) => set("security", { items: config.security.items.map((x) => (x.id === it.id ? { ...x, label: e.target.value } : x)) })}
                      className="h-8 text-[12.5px]"
                    />
                    <MiniSwitch
                      checked={it.enabled}
                      onChange={(v) => set("security", { items: config.security.items.map((x) => (x.id === it.id ? { ...x, enabled: v } : x)) })}
                    />
                    {config.security.items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => set("security", { items: config.security.items.filter((x) => x.id !== it.id) })}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Remover item ${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))}
                {config.security.items.length < 6 ? (
                  <AddButton
                    label="Adicionar item"
                    onClick={() => set("security", { items: [...config.security.items, { id: newId("sec"), label: "Novo selo", icon: "shield", enabled: true }] })}
                  />
                ) : null}
              </div>
            </Group>
            <Divider />
            <ColorField label="Cor" value={config.security.color} onChange={(v) => set("security", { color: v })} />
            <AlignField value={config.security.align} onChange={(v) => set("security", { align: v })} />
            <Segmented
              label="Tamanho"
              value={config.security.size}
              onChange={(v) => set("security", { size: v })}
              options={[
                { value: "sm", label: "Pequeno" },
                { value: "md", label: "Médio" },
              ]}
            />
          </>
        ) : null}
      </SectionItem>

      {/* ── RODAPÉ ── */}
      {advanced ? (
        <SectionItem value="rodape" icon={AlignStartVertical} title="Rodapé" active={config.footer.enabled}>
          <SwitchRow label="Exibir rodapé" checked={config.footer.enabled} onChange={(v) => set("footer", { enabled: v })} />
          {config.footer.enabled ? (
            <>
              <TextField label="Texto (copyright)" value={config.footer.text} onChange={(v) => set("footer", { text: v })} />
              <SwitchRow label="Exibir links" checked={config.footer.showLinks} onChange={(v) => set("footer", { showLinks: v })} />
              {config.footer.showLinks ? (
                <div className="grid grid-cols-1 gap-3">
                  <TextField label="Política de privacidade" value={config.footer.privacyLabel} onChange={(v) => set("footer", { privacyLabel: v })} />
                  <TextField label="Termos de uso" value={config.footer.termsLabel} onChange={(v) => set("footer", { termsLabel: v })} />
                </div>
              ) : null}
              <AlignField value={config.footer.align} onChange={(v) => set("footer", { align: v })} />
              <ColorField label="Cor do texto" value={config.footer.color} onChange={(v) => set("footer", { color: v })} />
            </>
          ) : null}
        </SectionItem>
      ) : null}

      {/* ── CAMPOS DO FORMULÁRIO ── */}
      {advanced ? (
        <SectionItem value="campos" icon={AlignStartVertical} title="Formulário">
          <Group title="Dados do cliente">
            <FieldToggles
              all={CUSTOMER_FIELDS}
              active={config.fields.customer}
              onChange={(customer) => set("fields", { customer })}
            />
          </Group>
          <Divider />
          <Group title="Endereço de entrega">
            <FieldToggles
              all={ADDRESS_FIELDS}
              active={config.fields.address}
              onChange={(address) => set("fields", { address })}
            />
          </Group>
        </SectionItem>
      ) : null}

      {/* ── RESPONSIVIDADE ── */}
      {advanced ? (
        <SectionItem value="responsividade" icon={Smartphone} title="Responsividade">
          <p className="rounded-md bg-secondary/60 px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
            Use as abas Desktop / Tablet / Mobile no preview para conferir cada tamanho. A logo já tem largura própria por dispositivo.
          </p>
          <SliderRow label="Largura máxima do checkout" value={config.layout.width} min={420} max={720} suffix="px" onChange={(v) => set("layout", { width: v })} />
          <SliderRow label="Arredondamento geral" value={config.layout.radius} min={0} max={28} suffix="px" onChange={(v) => set("layout", { radius: v })} />
        </SectionItem>
      ) : null}
    </Accordion>
  );
}

/* ───────────────────────── helpers de UI ───────────────────────── */

function SectionItem({
  value,
  icon: Icon,
  title,
  active,
  children,
}: {
  value: string;
  icon: LucideIcon;
  title: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <AccordionItem value={value} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="gap-2 px-3 py-3 text-[13px] hover:no-underline">
        <span className="flex flex-1 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold">{title}</span>
          {active !== undefined ? (
            <span
              className={cn(
                "ml-1 h-1.5 w-1.5 rounded-full",
                active ? "bg-[oklch(0.62_0.16_152)]" : "bg-muted-foreground/30",
              )}
              title={active ? "Ativo" : "Inativo"}
            />
          ) : null}
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4 pt-0">
        <div className="space-y-4 border-t border-border/60 pt-3.5">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function Divider() {
  return <div className="h-px bg-border/70" />;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={onClick}>
      <Plus className="h-3.5 w-3.5" /> {label}
    </Button>
  );
}

/** Switch compacto para linhas de lista. */
function MiniSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/25",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "left-0.5 translate-x-4" : "left-0.5",
        )}
      />
    </button>
  );
}

function MethodRow({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
        checked ? "border-primary/40 bg-primary/5" : "border-border",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          checked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <MiniSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function FieldToggles({
  all,
  active,
  onChange,
}: {
  all: FieldKey[];
  active: FieldKey[];
  onChange: (v: FieldKey[]) => void;
}) {
  const toggle = (f: FieldKey) => {
    onChange(active.includes(f) ? active.filter((x) => x !== f) : [...all.filter((x) => active.includes(x) || x === f)]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((f) => {
        const on = active.includes(f);
        return (
          <button
            key={f}
            type="button"
            onClick={() => toggle(f)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
              on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {FIELD_LABELS[f]}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── helpers de estado (cores) ───────────────────────── */

function setColor(
  config: CheckoutConfig,
  update: (patch: Partial<CheckoutConfig>) => void,
  patch: Partial<CheckoutConfig["colors"]>,
) {
  // qualquer edição manual muda a paleta para "Personalizado"
  update({ colors: { ...config.colors, ...patch, palette: "custom" } });
}

function applyPalette(
  config: CheckoutConfig,
  update: (patch: Partial<CheckoutConfig>) => void,
  key: CheckoutConfig["colors"]["palette"],
) {
  if (key === "custom") {
    update({ colors: { ...config.colors, palette: "custom" } });
    return;
  }
  update({ colors: { palette: key, ...PALETTES[key].colors } });
}
