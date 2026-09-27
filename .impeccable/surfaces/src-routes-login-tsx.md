---
version: 1
slug: "src-routes-login-tsx"
primary_target: "src/routes/login.tsx"
related_targets: ["design/prototypes/entrar-cadastro.html","src/routes/cadastro.tsx","src/routes/confirmar-email.tsx","src/routes/planos.selecionar.tsx"]
---

# Entrar e criar conta (auth flow)

Scope: the flow login → forgot password → sign-up → confirm e-mail (8-digit code) → choose plan → panel, prototyped in design/prototypes/entrar-cadastro.html. The live routes are /login, /cadastro, /confirmar-email and /planos/selecionar. Visitor mode: Operate. It inherits the PAVOX world: logo files, navy #001848, PAVOX blue #0055fb, pale-blue highlighter, Bricolage Grotesque with Hanken Grotesk, ruled rows.

Constraints: keep the real fields and rules:
- sign-up: nome, empresa, e-mail, senha of at least 6 characters, confirmação, and acceptance of the terms;
- code: 8 digits, with resend on a cooldown;
- password reset: by link.
Plans are the real catalog. Paid plans activate now, and the monthly charge "será habilitado em breve" (the app's own message). Nothing invented, no social proof.

## Direction contract

THESIS: Getting in is the first line of the lojista's statement. A navy side shows where they are headed (the first-day steps), and a white statement-ruled form does one thing per screen. It refuses the glassy centered card on a gradient.

OWN-WORLD: Desktop is split. The left third is navy, holding the white-and-blue logo, a one-line purpose, and the steps of this flow as a ruled list that marks the current step with the pale-blue highlighter. The right side is statement-white with the form. Inputs are 52px, with ruled section heads. Errors are inline in debit red. There are no cards, gradients or glass.

STORY: A returning lojista signs in with two fields. A new lojista creates the account, types the 8-digit code from the e-mail, picks a plan with its real fee, and lands in the panel.

FIRST VIEWPORT: The login form is fully above the fold on mobile: a navy logo band, then "Entre na PAVOX", e-mail, senha, and the Entrar button, with "Esqueci minha senha" and "Criar conta" as plain links.

FORM: an extension inside the established world, a narrow request, so no roll. Signature interaction: the 8-digit code field auto-advances and verifies on the eighth digit, and the step list advances with the highlighter.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
