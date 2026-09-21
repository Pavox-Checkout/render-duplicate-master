import { useState } from "react";
import {
  AlignLeft,
  BadgePercent,
  Check,
  CreditCard,
  GripVertical,
  LayoutPanelTop,
  MapPin,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Ticket,
  Timer,
  Trash2,
  User,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BLOCK_LABELS, SINGLETON_BLOCKS, type Block, type BlockType } from "@/lib/checkout-builder";

export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  header: LayoutPanelTop,
  product: Package,
  offer: BadgePercent,
  customer: User,
  address: MapPin,
  payment: CreditCard,
  summary: Receipt,
  footer: AlignLeft,
  bump: Tag,
  upsell: Sparkles,
  coupon: Ticket,
  countdown: Timer,
  social: Star,
  guarantee: ShieldCheck,
  security: Check,
};

const GROUPS: { label: string; items: BlockType[] }[] = [
  {
    label: "Estrutura",
    items: ["header", "product", "offer", "customer", "address", "payment", "summary", "footer"],
  },
  {
    label: "Conversão",
    items: ["bump", "upsell", "coupon", "countdown", "social", "guarantee", "security"],
  },
];

export function ElementLibrary({
  blocks,
  selectedId,
  onAdd,
  onSelect,
  onRemove,
  onReorder,
}: {
  blocks: Block[];
  selectedId: string | null;
  onAdd: (type: BlockType) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const used = new Set(blocks.map((b) => b.type));

  return (
    <Tabs defaultValue="elementos" className="flex h-full min-h-0 flex-col gap-0">
      <div className="border-b border-border px-3 py-2.5">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="elementos">Elementos</TabsTrigger>
          <TabsTrigger value="camadas">Camadas</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="elementos" className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <p className="px-1 pb-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {g.label}
              </p>
              <div className="space-y-0.5">
                {g.items.map((t) => {
                  const Icon = BLOCK_ICONS[t];
                  const disabled = SINGLETON_BLOCKS.includes(t) && used.has(t);
                  return (
                    <button
                      key={t}
                      disabled={disabled}
                      onClick={() => onAdd(t)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                        disabled
                          ? "cursor-not-allowed text-muted-foreground/45"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-current" />
                      <span className="flex-1 truncate font-medium">{BLOCK_LABELS[t]}</span>
                      {disabled ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="camadas" className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="px-1 pb-2 text-[11.5px] text-muted-foreground">
          Arraste para reorganizar a ordem dos blocos.
        </p>
        <div className="space-y-1">
          {blocks.map((b, i) => {
            const Icon = BLOCK_ICONS[b.type];
            return (
              <div
                key={b.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(i);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onClick={() => onSelect(b.id)}
                className={cn(
                  "group flex cursor-grab items-center gap-2 rounded-lg border px-2 py-1.5 text-[12.5px] transition-all active:cursor-grabbing",
                  selectedId === b.id
                    ? "border-primary/50 bg-accent text-accent-foreground"
                    : "border-transparent hover:bg-secondary",
                  dragIndex === i && "opacity-40",
                  overIndex === i && dragIndex !== null && dragIndex !== i && "border-primary",
                )}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 truncate font-medium">{BLOCK_LABELS[b.type]}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${BLOCK_LABELS[b.type]}`}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(b.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}
