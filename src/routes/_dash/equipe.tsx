import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Role = "Administrador" | "Financeiro" | "Operações" | "Analista" | "Proprietário";
type Member = { id: string; name: string; email: string; role: Role; status: "Ativo" | "Convite pendente" | "Suspenso"; inviteId?: string };

export const Route = createFileRoute("/_dash/equipe")({
  component: Equipe,
  head: () => ({ meta: [{ title: "Equipe · PAVOX" }, { name: "description", content: "Convide pessoas e defina permissões de acesso na PAVOX." }] }),
});

const roles: Role[] = ["Administrador", "Financeiro", "Operações", "Analista"];

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function Equipe() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Analista");

  const loadMembers = async () => {
    if (!user) { setMembers([]); setLoading(false); return; }
    setLoading(true);
    const client = supabase as any;
    const { error: ownerError } = await client.from("team_members").upsert({
      account_id: user.id, user_id: user.id, invited_email: user.email, role: "Proprietário", status: "Ativo", accepted_at: new Date().toISOString(),
    }, { onConflict: "account_id,user_id", ignoreDuplicates: true });
    if (ownerError) console.error("[v0] Falha ao garantir proprietário:", ownerError);

    const [{ data: rows, error }, { data: invites, error: inviteError }] = await Promise.all([
      client.from("team_members").select("id,user_id,invited_email,role,status").eq("account_id", user.id).order("created_at", { ascending: true }),
      client.from("team_invites").select("id,invited_email,invited_name,role,status").eq("account_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    if (error || inviteError) toast.error("Não foi possível carregar os membros da equipe.");
    const inviteByEmail = new Map((invites ?? []).map((invite: any) => [invite.invited_email.toLowerCase(), invite]));
    const loaded = (rows ?? []).map((member: any) => {
      const invite = member.status === "Convite pendente" ? inviteByEmail.get((member.invited_email ?? "").toLowerCase()) : undefined;
      return { id: member.id, name: invite?.invited_name || (member.user_id === user.id ? (profile?.full_name || user.email?.split("@")[0] || "Proprietário") : member.invited_email || "Membro"), email: member.invited_email || user.email || "", role: member.role, status: member.status, inviteId: invite?.id };
    });
    setMembers(loaded);
    setLoading(false);
  };

  useEffect(() => { void loadMembers(); }, [user?.id, profile?.full_name]);

  const resetForm = () => { setName(""); setEmail(""); setRole("Analista"); };
  const submitInvite = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) return toast.error("Informe o nome da pessoa.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return toast.error("Informe um e-mail válido.");
    if (!user) return toast.error("Sua sessão expirou. Entre novamente para continuar.");
    setSubmitting(true);
    const client = supabase as any;
    const { data: existing } = await client.from("team_members").select("id,status").eq("account_id", user.id).ilike("invited_email", normalizedEmail).maybeSingle();
    if (existing?.status === "Ativo") { toast.error("Este e-mail já pertence à equipe."); setSubmitting(false); return; }
    if (existing?.status === "Convite pendente") { toast.error("Já existe um convite pendente para este e-mail."); setSubmitting(false); return; }
    const { data: invite, error: inviteError } = await client.from("team_invites").insert({ account_id: user.id, invited_email: normalizedEmail, invited_name: name.trim(), role, token_hash: crypto.randomUUID() }).select("id").single();
    if (inviteError || !invite) { toast.error("Não foi possível criar o convite. Tente novamente."); setSubmitting(false); return; }
    const { error: memberError } = await client.from("team_members").insert({ account_id: user.id, invited_email: normalizedEmail, role, status: "Convite pendente", invited_at: new Date().toISOString() });
    if (memberError) {
      await client.from("team_invites").delete().eq("id", invite.id);
      toast.error("Não foi possível registrar o membro convidado.");
      setSubmitting(false);
      return;
    }
    setDialogOpen(false); resetForm(); await loadMembers();
    toast.success("Convite registrado.", { description: "O convite foi salvo como pendente. O envio de e-mail ainda não está configurado." });
    setSubmitting(false);
  };

  const updateMember = async (member: Member, nextStatus: "Ativo" | "Suspenso") => {
    const { error } = await (supabase as any).from("team_members").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", member.id).eq("account_id", user?.id);
    if (error) toast.error("Não foi possível atualizar o membro."); else { toast.success("Membro atualizado."); await loadMembers(); }
  };
  const removeMember = async (member: Member) => {
    if (!window.confirm(`Tem certeza que deseja remover ${member.name} da equipe?`)) return;
    const client = supabase as any;
    const { error } = await client.from("team_members").delete().eq("id", member.id).eq("account_id", user?.id);
    if (error) toast.error("Não foi possível remover o membro."); else { if (member.inviteId) await client.from("team_invites").update({ status: "cancelled" }).eq("id", member.inviteId).eq("account_id", user?.id); toast.success("Membro removido."); await loadMembers(); }
  };

  return <>
    <PageHeader title="Equipe" subtitle="Controle quem acessa sua operação e com quais permissões." actions={<Button onClick={() => setDialogOpen(true)}><UserPlus className="h-4 w-4" /> Convidar pessoa</Button>} />
    <div className="surface divide-y divide-border">
      {loading ? <div className="p-10 text-center text-sm text-muted-foreground">Carregando equipe...</div> : members.length === 0 ? <div className="p-10 text-center"><p className="font-medium">Você ainda não adicionou ninguém à sua equipe.</p><p className="mt-1 text-sm text-muted-foreground">Convide pessoas para ajudar a administrar sua operação PAVOX.</p><Button className="mt-5" onClick={() => setDialogOpen(true)}><UserPlus className="h-4 w-4" /> Convidar pessoa</Button></div> : members.map((member) => <div key={member.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback className="bg-accent text-[12px] font-semibold text-accent-foreground">{initials(member.name)}</AvatarFallback></Avatar><div><p className="text-[14px] font-medium">{member.name}</p><p className="text-[12.5px] text-muted-foreground">{member.email}</p></div></div><div className="flex items-center gap-3"><span className="text-[13px] text-muted-foreground">{member.role}</span><StatusBadge status={member.status} />{member.role !== "Proprietário" && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Ações para ${member.name}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => void updateMember(member, member.status === "Suspenso" ? "Ativo" : "Suspenso")}>{member.status === "Suspenso" ? "Reativar acesso" : "Suspender acesso"}</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => void removeMember(member)}>Remover da equipe</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div></div>)}
    </div>
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}><DialogContent><DialogHeader><DialogTitle>Convidar pessoa</DialogTitle><DialogDescription>Registre um convite para adicionar alguém à sua equipe.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-2"><Label htmlFor="team-name">Nome da pessoa</Label><Input id="team-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome completo" /></div><div className="grid gap-2"><Label htmlFor="team-email">E-mail</Label><Input id="team-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pessoa@empresa.com" /></div><div className="grid gap-2"><Label>Função</Label><Select value={role} onValueChange={(value) => setRole(value as Role)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={() => void submitInvite()} disabled={submitting}>{submitting ? "Salvando..." : "Enviar convite"}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

