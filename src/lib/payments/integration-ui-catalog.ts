import type { ProviderDef } from "./catalog";

const names = [
  "Appmax",
  "Pagou V2",
  "Beehive Pay",
  "Prime Cash",
  "Pagou",
  "Blackcat V2",
  "Centurion",
  "Hypercash",
  "CodiguzHub",
  "ActivePay",
  "ActivePayments",
  "Afex Pay",
  "Afilia Xpay",
  "Aion Pay",
  "Allow",
  "Allpes",
  "Allpes V2",
  "AmploPay",
  "Anubispay",
  "APXPay",
  "Asaas Sandbox",
  "Asset",
  "Aven",
  "Axion Pay",
  "AxiPay",
  "Bearpay",
  "BlackoutPayments",
  "Carthero V2",
  "CenturioPay",
  "CodiguzHub V3",
  "Core Pagamentos",
  "CREDWAVE",
  "Dale Pay",
  "DHR PAGAMENTOS",
  "Eleve Pagamentos",
  "Facility",
  "Fast Pay Brasil",
  "FintPag",
  "Free Pay",
  "FuriaPay V2",
  "Garu Pay",
  "Gatefy",
  "Gatefy V2",
  "Goat Pay",
  "HiSo",
  "HubFlash V2",
  "Hunter Payments",
  "Hura Pay V2",
  "HylexPay",
  "Invictus",
  "Pinpay",
  "Bynet",
  "Pagou.ai",
  "Beehive",
];

const palette = ["#1769ff", "#12b981", "#7757f5", "#f97316", "#0f172a", "#0891b2", "#db2777"];

export const REFERENCE_LOGOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-V230fdnADUznex86jpphKciGySt8Zr.png",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7WwoTtbUkfyuH7gxhE9ViUECo91rDO.png",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-oOYco7GSYEG0YPVQFplUiDuubPmjWv.png",
] as const;

const referenceLogoPosition = (index: number) => {
  const source = index < 18 ? 0 : index < 24 ? 1 : 2;
  const local = source === 0 ? index : source === 1 ? index - 18 : index - 24;
  const column = local % 3;
  const row = Math.floor(local / 3);
  const centers =
    source === 0
      ? { x: [438, 895, 1347], y: [130, 256, 385, 512, 641, 768] }
      : source === 1
        ? { x: [503, 959, 1415], y: [121, 249, 376, 503, 632, 759] }
        : { x: [484, 959, 1413], y: [91, 219, 347, 475, 603, 731] };
  return { source: REFERENCE_LOGOS[source], x: centers.x[column], y: centers.y[row] };
};
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const UI_GATEWAYS: ProviderDef[] = Array.from(
  new Map(
    names.map((name, index) => {
      const id = slug(name);
      return [
        id,
        {
          id,
          name,
          category: "Pagamentos",
          kind: "payment",
          desc: `Prepare sua loja para conectar ao ${name}.`,
          color: palette[index % palette.length],
          tag: name
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 3)
            .toUpperCase(),
          credentialFields: [],
          methods: [],
          environments: [],
          live: false,
          referenceLogo: referenceLogoPosition(index),
        } satisfies ProviderDef,
      ];
    }),
  ).values(),
);

export function getUiGateway(id: string) {
  return UI_GATEWAYS.find((gateway) => gateway.id === id);
}

export const UI_PAYMENT_METHODS = [
  ["pix", "PIX"],
  ["card", "Cartão de crédito"],
  ["boleto", "Boleto"],
  ["debit", "Débito"],
  ["installments", "Parcelamento"],
] as const;
