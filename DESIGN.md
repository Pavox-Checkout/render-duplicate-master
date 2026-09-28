# PAVOX design system

Derived from the shipped code after the 2026 redesign. The previous design is kept on the `design-antigo` branch. The approved prototypes are in `design/prototypes/`.

## Brand (binding)

- **Logo:** the official files only. Use `/pavox-wordmark.png` (navy) on light surfaces and `/pavox-logo-white.png` on navy or dark ones. `PavoxLogo` in `src/components/pavox/logo.tsx` switches between them by theme. Never redraw or retype the wordmark.
- **Navy** `#001848`: headings, dark rails (auth, admin), footer, avatar fallback.
- **PAVOX blue** `#0055fb`: actions, links, the "today" line in charts, the focus ring. Hover `#0043c9`.

## Color tokens (`src/styles.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#fcfdfe` | `#06112b` | page ground |
| `--foreground` | `#0d1733` | `#eef2fb` | body text |
| `--card` | `#ffffff` | `#0b1a3d` | cards, inputs |
| `--primary` | `#0055fb` | `#4d86ff` | actions |
| `--muted-foreground` | `#5a6178` | `#9aa8c7` | secondary text (≥4.5:1) |
| `--secondary` / `--muted` | `#f2f5fa` | `#13244d` | quiet surfaces, segmented controls |
| `--accent` | `#e6eeff` | `#16295a` | active nav item |
| `--border` | `#e3e7ef` | white 10% | rules |
| `--destructive` | `#b8322a` | `#ef6b61` | errors, refunds |
| `--success` | `#1b7443` | `#4cc38a` | approved |
| `--highlight` | `#c9daff` | `#23407e` | the panel's highlighter under "Vendido" |
| `--chart-2` | `#c08a2a` | `#e0a94a` | comparison series ("ontem") |

Light is the default theme; the dark theme is a navy night version of the same world. There are no gradients, glows, gradient text or noise. The old utilities (`bg-brand-gradient`, `text-gradient-brand`, `grid-noise`, `landing-*`) still exist so older screens keep compiling, but they now render flat.

## Type

Fonts are self-hosted in `public/fonts` (all OFL):

- **Hanken Grotesk** (`--font-sans`): all UI and body text.
- **Bricolage Grotesque** (`--font-display`): page titles and big numbers in the panel, admin and auth.
- **Schibsted Grotesk** and **Martian Mono**: the buyer's receipt world. Martian Mono is used only for money, times and codes.

Headings are sentence case. There are no all-caps labels, with two exceptions: the store name at the top of the receipt and the rubber stamps (PAGO, EXPIRADO), which imitate a printed receipt. Body copy stays under about 70 characters per line.

## Surfaces

- **Landing (`/`)**: white, minimal and conventional. There is one family (Hanken), one CTA ("Criar conta grátis"), and real product screenshots on a pale panel (`public/landing/`). Plan data comes from `PLAN_CATALOG`. The page carries no icons and no animation.
- **Auth (`/login`, `/cadastro`, `/confirmar-email`, `/planos/selecionar`)**: `AuthShell` gives a navy rail on desktop (a navy bar on phones) with one short line, and the form on the light ground. Inputs are 48px tall and every password field has a show/hide toggle.
- **Buyer checkout**: the form is the lojista's builder design (`CheckoutPreview`), so their customization keeps working. Every payment screen after it uses the **Comprovante** world (`checkout-receipt.tsx`): a paper slip on the store's own color (PAVOX blue by default), perforations, a mono total, an ink stamp on final states, an "Andamento" log, and copy buttons that never claim success when the clipboard fails. Text on the store color is computed to stay ≥4.5:1 for any color.
- **Lojista panel (`/dashboard`)**: the **Extrato**. It shows "Vendido" as one big highlighted number with an honest comparison, then "A receber", a chart that always has a "Ver em tabela" alternative, and orders grouped by day with a daily balance. With no orders, the panel shows first steps instead. Conquistas PAVOX live in Minha conta.
- **Admin (`/admin`)**: a navy top rail with the white logo, an "Admin" badge, the role and six tabs. The overview shows the approved volume big, three key figures in rows, and daily bars.

## Components and rules

- **Buttons:** 48px (auth and landing) or the shadcn default in the panel, 10px radius, no arrow glyphs appended.
- **Links:** PAVOX blue, underlined with a 4px offset.
- **Touch:** every control is at least 44px on coarse pointers (`pointer-coarse:` or padding with a negative margin).
- **Focus:** a visible 2px ring in `--ring`.
- **Motion:** only where the user acted or a state changed (the receipt stamp landing, the Pix wait dots). `prefers-reduced-motion` turns it off.
- **Honesty:**
  - no invented numbers, testimonials or statuses;
  - payment states come only from the server;
  - features that do not exist yet are hidden, never faked (the old search and notification placeholders were removed).
