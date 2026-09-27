---
version: 1
slug: "src-components-pavox-public-checkout-tsx"
primary_target: "src/components/pavox/public-checkout.tsx"
related_targets: ["design/prototypes/checkout-comprovante.html"]
---

# Public checkout (buyer)

Scope: the buyer-facing checkout at /c/$store/$checkout and its result states (Pix, boleto, card, expired, errors). Visitor mode: Operate. Prototype first in design/prototypes/checkout-comprovante.html; the live component changes only after the user approves.

Audience and task: a Brazilian buyer on a phone, arriving from an ad or sales page, often wary of scams, paying mostly by Pix while switching to their bank app. Success means paying in one screen and knowing for certain that it was paid.

Constraints: the look stays lojista-themable (accent color, logo, banner, testimonials from the builder) and must hold with any accent color. Single page. Never show scarcity, coupon, or installments the backend does not support, and never show a status the gateway did not confirm. Card input stays inside the gateway's secure form slot.

Open: how builder blocks (notice, banner, testimonials) sit around the paper; desktop composition.

## Direction contract

THESIS: The checkout is the receipt being filled in. Order, buyer, and payment print onto one strip of thermal paper, and the "PAGO" stamp lands only on real confirmation. It refuses the white two-column form with a green button and a badge strip.

OWN-WORLD: The lojista's color drenches the page ground (default: PAVOX blue #0055fb, which the lojista can change). One strip of cool-white thermal paper floats on it, with a torn zigzag foot, punched perforation rules, and ink-black print. Data (prices, CPF, Pix code, times, reference) is set in a condensed mono; everything else in a sturdy grotesk. The success color is a rubber-stamp green. There are no cards, no gradients, and no glass.

STORY: The buyer sees what they are buying and the total like a receipt line, fills three fields, picks a method, and pays. The paper then feeds out the Pix code and a printed status log, and the stamp confirms.

FIRST VIEWPORT: Mobile. Store logo and "compra segura" on the colored ground. The paper starts below with the store name and the product line with dotted leaders to the price, then TOTAL in large mono, a perforation, and the name/email/CPF fields. A sticky paper bar at the bottom holds the total and a full-width "Pagar com Pix" button in the lojista color.

FORM: Comprovante (thermal receipt and Pix comprovante). This was the user's pick, over the rolled "Placa" (candidate 7 of 7). Seed key 30d6068e, degraded roll with no challengers. Signature interaction: paper feed on charge creation, and the PAGO stamp on confirmation.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
