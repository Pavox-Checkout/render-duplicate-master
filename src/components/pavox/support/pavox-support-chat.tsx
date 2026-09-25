import { useMemo, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PavoxLogo } from "@/components/pavox/logo";
import { PavoxSupportMessage } from "./pavox-support-message";
import { PavoxSupportOption } from "./pavox-support-option";
import { PavoxSupportSummary } from "./pavox-support-summary";
import { WhatsAppIcon } from "./whatsapp-icon";
import {
  PAVOX_SUPPORT_REASONS,
  buildPavoxSupportWhatsAppLink,
  type PavoxSupportReason,
} from "@/lib/pavox-support";

type Step = "reason" | "email" | "description" | "summary";

export function PavoxSupportChat({
  initialEmail,
  onClose,
}: {
  initialEmail: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<PavoxSupportReason | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [description, setDescription] = useState("");

  const whatsappUrl = useMemo(() => {
    if (!reason) return "#";
    return buildPavoxSupportWhatsAppLink({ reason, email, message: description });
  }, [reason, email, description]);

  const handleSelectReason = (value: PavoxSupportReason) => {
    setReason(value);
    setStep("email");
  };

  const handleBack = () => {
    if (step === "email") setStep("reason");
    else if (step === "description") setStep("email");
    else if (step === "summary") setStep("description");
  };

  return (
    <div
      role="dialog"
      aria-label="Suporte PAVOX"
      className="flex h-[min(600px,calc(100vh-6.5rem))] w-[min(392px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lift motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-200"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-gradient-to-b from-primary/10 to-transparent px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
          <PavoxLogo compact className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-foreground">PAVOX</p>
          <p className="truncate text-[12px] text-muted-foreground">Suporte</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar chat de suporte"
          onClick={onClose}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Corpo da conversa */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <PavoxSupportMessage from="bot">
          <p>Olá! 👋</p>
          <p className="mt-1">Como podemos ajudar você?</p>
        </PavoxSupportMessage>
        <PavoxSupportMessage from="bot">
          Selecione o assunto que melhor descreve sua necessidade.
        </PavoxSupportMessage>

        {step === "reason" && (
          <div className="space-y-1.5 pt-1">
            {PAVOX_SUPPORT_REASONS.map((item) => (
              <PavoxSupportOption key={item} label={item} onSelect={() => handleSelectReason(item)} />
            ))}
          </div>
        )}

        {reason && (
          <>
            <PavoxSupportMessage from="user">Você selecionou: &quot;{reason}&quot;</PavoxSupportMessage>
            <PavoxSupportMessage from="bot">
              <p>Agora precisamos de mais algumas informações.</p>
              <p className="mt-1">Qual é o e-mail da sua conta PAVOX?</p>
            </PavoxSupportMessage>
          </>
        )}

        {step === "email" && (
          <div className="space-y-2 pt-1">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className="h-10"
              autoFocus
            />
            <Button className="w-full" onClick={() => setStep("description")} disabled={!email.trim()}>
              Continuar
            </Button>
          </div>
        )}

        {(step === "description" || step === "summary") && (
          <>
            <PavoxSupportMessage from="user">{email}</PavoxSupportMessage>
            <PavoxSupportMessage from="bot">
              Quer contar um pouco mais sobre o que aconteceu?
            </PavoxSupportMessage>
          </>
        )}

        {step === "description" && (
          <div className="space-y-2 pt-1">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva sua dúvida ou problema..."
              className="min-h-[84px] resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("summary")}>
                Pular
              </Button>
              <Button className="flex-1" onClick={() => setStep("summary")}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === "summary" && reason && (
          <>
            {description.trim() && <PavoxSupportMessage from="user">{description}</PavoxSupportMessage>}
            <PavoxSupportMessage from="bot">Confira suas informações</PavoxSupportMessage>
            <PavoxSupportSummary reason={reason} email={email} message={description} />
            <PavoxSupportMessage from="bot">
              <p>Pronto! Já temos as informações necessárias.</p>
              <p className="mt-1">
                Você será direcionado para o WhatsApp da equipe PAVOX para continuar o atendimento.
              </p>
            </PavoxSupportMessage>
          </>
        )}
      </div>

      {/* Rodapé */}
      <div className="border-t border-border p-3">
        {step === "summary" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Voltar e editar"
              onClick={handleBack}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button asChild className="flex-1 gap-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-4 w-4" />
                Falar com a equipe no WhatsApp
              </a>
            </Button>
          </div>
        ) : step === "reason" ? (
          <p className="text-center text-[11px] text-muted-foreground">Atendimento via WhatsApp</p>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}
