type PublicCheckoutFooterProps = {
  displayName?: string | null;
  color?: string;
  mutedColor?: string;
};

export function PublicCheckoutFooter({
  displayName,
  color = "currentColor",
  mutedColor = "currentColor",
}: PublicCheckoutFooterProps) {
  const name = displayName?.trim();

  return (
    <footer
      className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 pb-6 pt-8 text-center text-[10px] leading-relaxed"
      style={{ color }}
      aria-label="Identificação do checkout"
    >
      {name ? (
        <span>
          © {new Date().getFullYear()} {name}. Todos os direitos reservados.
        </span>
      ) : null}
      <span style={{ color: mutedColor }}>Processado com tecnologia PAVOX</span>
    </footer>
  );
}
