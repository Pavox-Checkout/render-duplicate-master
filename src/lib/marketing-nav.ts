import {
  LayoutDashboard,
  Radar,
  Ticket,
  Percent,
  Layers,
  ArrowUpCircle,
  Gift,
  RotateCcw,
  Wallet,
  Star,
  Radio,
  Timer,
  FlaskConical,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type MarketingNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  exact?: boolean;
};

/**
 * Estrutura de navegação da área de Marketing.
 * Preparada para receber novas ferramentas: basta adicionar um item.
 */
export const MARKETING_ITEMS: MarketingNavItem[] = [
  {
    to: "/marketing",
    label: "Visão geral",
    icon: LayoutDashboard,
    description: "Resumo das ferramentas de conversão e otimização.",
    exact: true,
  },
  {
    to: "/marketing/pixels",
    label: "Pixels e rastreamento",
    icon: Radar,
    description: "Conecte plataformas de anúncios e acompanhe eventos.",
  },
  {
    to: "/marketing/cupons",
    label: "Cupons",
    icon: Ticket,
    description: "Códigos promocionais para incentivar compras.",
  },
  {
    to: "/marketing/faixa-desconto",
    label: "Faixa de desconto",
    icon: Percent,
    description: "Banners promocionais exibidos no checkout.",
  },
  {
    to: "/marketing/order-bump",
    label: "Order Bump",
    icon: Layers,
    description: "Ofertas complementares na finalização da compra.",
  },
  {
    to: "/marketing/upsell",
    label: "Upsell",
    icon: ArrowUpCircle,
    description: "Ofertas adicionais após a compra.",
  },
  {
    to: "/marketing/brindes",
    label: "Brindes",
    icon: Gift,
    description: "Campanhas do tipo compre X e ganhe Y.",
  },
  {
    to: "/marketing/recuperacao",
    label: "Recuperação",
    icon: RotateCcw,
    description: "Recupere carrinhos e checkouts abandonados.",
  },
  {
    to: "/marketing/sugestoes-pagamento",
    label: "Sugestões de pagamento",
    icon: Wallet,
    description: "Incentive determinados meios de pagamento.",
  },
  {
    to: "/marketing/provas-sociais",
    label: "Provas sociais",
    icon: Star,
    description: "Depoimentos, avaliações e selos de confiança.",
  },
  {
    to: "/marketing/compra-ao-vivo",
    label: "Compra ao vivo",
    icon: Radio,
    description: "Notificações de compra em tempo real no checkout.",
  },
  {
    to: "/marketing/escassez",
    label: "Escassez",
    icon: Timer,
    description: "Contagem regressiva e estoque limitado.",
  },
  {
    to: "/marketing/ab-testing",
    label: "A/B Testing",
    icon: FlaskConical,
    description: "Compare variações de checkout e otimize resultados.",
  },
  {
    to: "/marketing/automacao",
    label: "Automação",
    icon: Workflow,
    description: "Fluxos automáticos disparados por eventos.",
  },
];
