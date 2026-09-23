import { useState } from "react";
import { Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  ENVIRONMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  maskValue,
  type Environment,
  type PaymentMethod,
  type ProviderDef,
  type SavedIntegration,
} from "@/lib/payments/catalog";
import { useSaveIntegration } from "@/lib/payments/use-integrations";

const STEPS = ["Credenciais", "Métodos", "Revisão", "Concluído"] as const;

export function IntegrationConnectDialog({
  provider,
  existing,
  open,
  onOpenChange,
}: {
  provider: ProviderDef;
  existing?: SavedIntegration | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(existing);
  const save = useSaveIntegration();

  const [step, setStep] = useState(0);
  const [environment, setEnvironment] = useState<Environment>(existing?.environment ?? "sandbox");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [methods, setMethods] = useState<PaymentMethod[]>(
    existing?.enabledMethods ?? provider.methods,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setCred = (key: string, value: string) =>
    setCredentials((c) => ({ ...c, [key]: value }));

  const toggleMethod = (m: PaymentMethod) =>
    setMethods((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]));

  const validateCreds = () => {
    const e: Record<string, string> = {};
    for (const field of provider.credentialFields) {
      const value = (credentials[field.key] ?? "").trim();
      // On edit a blank field keeps the previously stored secret.
      if (!value && !isEdit) e[field.key] = "Campo obrigatório.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 0 && !validateCreds()) return;
    if (step === 1 && methods.length === 0) {
      toast.error("Selecione ao menos um método de pagamento.");
      return;
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    try {
      await save.mutateAsync({ provider: provider.id, environment, methods, credentials });
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar a integração.");
    }
  };

  const reviewCredential = (key: string) => {
    const typed = (credentials[key] ?? "").trim();
    if (typed) return maskValue(typed);
    if (isEdit && existing?.maskedCredentials[key]) return existing.maskedCredentials[key];
    return "—";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold text-white"
              style={{ backgroundColor: provider.color }}
              aria-hidden
            >
              {provider.tag}
            </span>
            {isEdit ? "Editar" : "Conectar"} {provider.name}
          </DialogTitle>
          <DialogDescription>
            Conecte sua própria conta {provider.name}. A PAVOX apenas orquestra os pagamentos.
          </DialogDescription>
        </DialogHeader>

        <Stepper step={step} />

        {step === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <RadioGroup
                value={environment}
                onValueChange={(v) => setEnvironment(v as Environment)}
                className="grid grid-cols-2 gap-2"
              >
                {provider.environments.map((env) => (
                  <label
                    key={env}
                    htmlFor={`env-${env}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition",
                      environment === env ? "border-primary bg-accent" : "border-border",
                    )}
                  >
                    <RadioGroupItem id={`env-${env}`} value={env} />
                    {ENVIRONMENT_LABELS[env]}
                  </label>
                ))}
              </RadioGroup>
            </div>

            {provider.credentialFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`cred-${field.key}`}>{field.label}</Label>
                <Input
                  id={`cred-${field.key}`}
                  type={field.secret ? "password" : "text"}
                  autoComplete="off"
                  value={credentials[field.key] ?? ""}
                  onChange={(e) => setCred(field.key, e.target.value)}
                  placeholder={
                    isEdit
                      ? `${existing?.maskedCredentials[field.key] ?? "••••"} — deixe em branco para manter`
                      : field.label
                  }
                />
                {errors[field.key] ? (
                  <p className="text-[12px] font-medium text-destructive">{errors[field.key]}</p>
                ) : field.hint ? (
                  <p className="text-[12px] text-muted-foreground">{field.hint}</p>
                ) : null}
              </div>
            ))}

            <p className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2.5 text-[12px] text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              As credenciais são armazenadas com segurança no servidor e nunca exibidas novamente.
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-2">
            <Label>Métodos de pagamento</Label>
            <p className="text-[12px] text-muted-foreground">
              Escolha quais métodos deseja habilitar para esta conexão.
            </p>
            <div className="space-y-2 pt-1">
              {provider.methods.map((m) => (
                <label
                  key={m}
                  htmlFor={`method-${m}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition",
                    methods.includes(m) ? "border-primary bg-accent" : "border-border",
                  )}
                >
                  <Checkbox
                    id={`method-${m}`}
                    checked={methods.includes(m)}
                    onCheckedChange={() => toggleMethod(m)}
                  />
                  {PAYMENT_METHOD_LABELS[m]}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <dl className="divide-y divide-border rounded-lg border border-border text-[13px]">
            <Row label="Gateway" value={provider.name} />
            <Row label="Ambiente" value={ENVIRONMENT_LABELS[environment]} />
            <Row
              label="Métodos"
              value={methods.map((m) => PAYMENT_METHOD_LABELS[m]).join(", ") || "—"}
            />
            {provider.credentialFields.map((field) => (
              <Row key={field.key} label={field.label} value={reviewCredential(field.key)} mono />
            ))}
          </dl>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <p className="text-[15px] font-semibold">Integração salva</p>
            <p className="max-w-[360px] text-[13px] text-muted-foreground">
              Sua conta {provider.name} foi configurada no ambiente{" "}
              {ENVIRONMENT_LABELS[environment].toLowerCase()}. Os métodos{" "}
              {methods.map((m) => PAYMENT_METHOD_LABELS[m]).join(", ")} ficam prontos para
              roteamento. A verificação real com a API do gateway será ativada na próxima etapa.
            </p>
          </div>
        ) : null}

        <DialogFooter>
          {step === 3 ? (
            <Button onClick={() => onOpenChange(false)}>Concluir</Button>
          ) : (
            <div className="flex w-full items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => (step === 0 ? onOpenChange(false) : setStep((s) => s - 1))}
                disabled={save.isPending}
              >
                {step === 0 ? "Cancelar" : "Voltar"}
              </Button>
              {step < 2 ? (
                <Button onClick={next}>Continuar</Button>
              ) : (
                <Button onClick={() => void submit()} disabled={save.isPending}>
                  {save.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {isEdit ? "Salvar alterações" : "Salvar integração"}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-1.5">
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
              i < step
                ? "bg-success text-white"
                : i === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          {i < STEPS.length - 1 ? (
            <span
              className={cn("h-0.5 flex-1 rounded-full", i < step ? "bg-success" : "bg-border")}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", mono && "font-mono text-[12px]")}>{value}</dd>
    </div>
  );
}
