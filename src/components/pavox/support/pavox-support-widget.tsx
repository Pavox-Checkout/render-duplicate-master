import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PavoxSupportChat } from "./pavox-support-chat";
import { WhatsAppIcon } from "./whatsapp-icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Chave usada para esconder o widget apenas durante a sessão (aba) atual. */
const SESSION_HIDDEN_KEY = "pavox_support_hidden";

function readSessionHidden() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_HIDDEN_KEY) === "1";
}

export function PavoxSupportWidget() {
  const { user, profile } = useAuth();
  const [hidden, setHidden] = useState(readSessionHidden);
  const [open, setOpen] = useState(false);

  const email = profile?.email || user?.email || "";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleHide = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen(false);
    setHidden(true);
    window.sessionStorage.setItem(SESSION_HIDDEN_KEY, "1");
  };

  const handleRestore = () => {
    setHidden(false);
    window.sessionStorage.removeItem(SESSION_HIDDEN_KEY);
  };

  if (hidden) {
    return (
      <button
        type="button"
        onClick={handleRestore}
        aria-label="Mostrar suporte PAVOX"
        title="Suporte PAVOX"
        className="fixed right-4 bottom-4 z-40 h-2.5 w-2.5 rounded-full bg-primary/50 shadow-glow transition-transform hover:scale-125 motion-reduce:transition-none"
      />
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-5 sm:bottom-5">
      {open && <PavoxSupportChat initialEmail={email} onClose={() => setOpen(false)} />}

      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group relative">
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label={open ? "Fechar suporte PAVOX" : "Abrir suporte PAVOX"}
                aria-expanded={open}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
              >
                <WhatsAppIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleHide}
                aria-label="Ocultar suporte PAVOX"
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-80 shadow-card transition-opacity hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">Suporte PAVOX</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
