import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Shared frame for login, sign-up, e-mail confirmation and plan choice:
 * a navy rail with the logo and one short line on desktop, a navy bar on
 * phones, and the form on the light ground.
 */
export function AuthShell({
  greeting,
  children,
  wide = false,
  railContent,
}: {
  greeting: string;
  children: ReactNode;
  wide?: boolean;
  railContent?: ReactNode;
}) {
  return (
    <div className="min-h-[100svh] bg-background lg:grid lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="flex h-16 items-center bg-[#001848] px-5 text-white lg:sticky lg:top-0 lg:h-[100svh] lg:flex-col lg:items-start lg:justify-between lg:px-9 lg:py-10">
        <div>
          <Link to="/" aria-label="PAVOX, início" className="-m-2 inline-block p-2">
            <img
              src="/pavox-logo-white.png"
              alt="PAVOX"
              width={90}
              height={30}
              className="h-[26px] w-auto lg:h-[30px]"
            />
          </Link>
          <p className="mt-12 hidden max-w-[14ch] font-display text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-white lg:block">
            {greeting}
          </p>
        </div>
        {railContent && <div className="hidden flex-1 items-center lg:flex">{railContent}</div>}
        {!railContent && <div className="hidden flex-1 lg:block" />}
        <p className="hidden text-[14px] text-[#b9c6e4] lg:block">
          Checkout com o gateway que você já usa.
        </p>
      </aside>
      <main id="main" className="flex justify-center px-5 py-10 sm:py-14 lg:items-center lg:px-10">
        <div className={cn("w-full", wide ? "max-w-[1000px]" : "max-w-[420px]")}>{children}</div>
      </main>
    </div>
  );
}

export function AuthTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-[#001848] dark:text-foreground">
        {title}
      </h1>
      {children && <p className="mt-2 text-[16px] text-muted-foreground">{children}</p>}
    </div>
  );
}

export const authInput = "h-12 rounded-[10px] bg-card px-4 text-[16px]";
export const authLabel = "text-[14.5px] font-bold text-foreground";
export const authButton = "h-12 w-full rounded-[10px] text-[16px] font-bold";
export const authLink =
  "font-semibold text-primary underline underline-offset-4 decoration-[1.5px] hover:text-[#0043c9]";

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={shown ? "text" : "password"}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(authInput, "pr-12")}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Esconder senha" : "Mostrar senha"}
        aria-pressed={shown}
        className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
      >
        {shown ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}
