---
version: 1
slug: "src-routes-admin-tsx"
primary_target: "src/routes/admin.tsx"
related_targets: ["design/prototypes/admin-pavox.html","src/routes/admin/index.tsx","src/components/pavox/admin/list-page.tsx","src/components/pavox/admin/detail.tsx"]
---

# Admin PAVOX

Scope: the internal admin (/admin and its six sections: visão geral, lojistas, transações, assinaturas, integrações, atividade), prototyped in design/prototypes/admin-pavox.html. Visitor mode: Operate. The PAVOX team uses it to oversee lojistas and money flow. It inherits the Extrato world and the binding brand. The one deliberate change from the lojista panel: the rail is navy, with the white logo and an "Admin" mark, so the two contexts can never be confused.

Constraints mirror src/lib/admin/data.ts and the routes:
- Roles: admin and viewer. A viewer cannot add notes.
- Period: 7, 30 or 90 days.
- Overview metrics: volume, fees, paid/total/pending orders, lojistas and new lojistas, published checkouts, integration errors, webhook rejections, and a daily series.
- List columns are exactly the row types. The lojista detail shows orders, volume, checkouts, and internal notes.
- All data is synthetic and labeled.

## Direction contract

THESIS: The admin reads like the platform's own ledger. The first thing it shows is what needs attention (integration errors, webhook rejections), then the money, then every list as ruled statement rows. It refuses the KPI-card wall.

OWN-WORLD: The lojista panel's statement world, with the rail inverted to navy. Figures are in Bricolage Grotesque. Lists use Hanken Grotesk with tabular columns, hairline rules, and navy day and section rules. The highlighter marks only the active nav item and the attention count. Status is shown as text with an icon, never color alone. There are no cards, gradients or glass.

STORY: A PAVOX operator opens the admin and sees at once whether anything is broken, how much moved in the period, and which lojistas need follow-up. They drill into a lojista, read the context, and leave a note.

FIRST VIEWPORT: Desktop has the navy rail on the left. The main area shows an attention line (errors and rejections, linking to their lists), then the period volume as the large figure with fees and orders beside it, then the daily chart. Mobile shows the attention line, the figure, and the chart, with a compact section switcher.

FORM: an extension inside the established world, so no concept roll. The cited rule is reference/new-work.md, line 41: "Never run the script for a local extension or a precisely specified narrow request; shape those directly." The six sections and their columns are fixed by the live routes and admin data types. The user is told in chat. Signature interaction: on desktop the lojista detail opens as a non-modal statement pane beside the list, which stays clickable; on mobile it is a full-screen sheet. An added note lands as a new dated line.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
