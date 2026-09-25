export function PavoxSupportOption({
  label,
  onSelect,
}: {
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
    >
      {label}
    </button>
  );
}
