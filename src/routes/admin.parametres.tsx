import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inviteAdmin, revokeAdmin } from "@/lib/admin.functions";
import { btn, btnInk, Confirm, Field, inputCls, PageHead } from "@/components/admin/kit";
import { must, useRefresh } from "@/lib/admin/data";

export const Route = createFileRoute("/admin/parametres")({ component: SettingsAdmin });

function SettingsAdmin() {
  const { data: me } = useQuery({ queryKey: ["admin", "me"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const { data: admins = [] } = useQuery({ queryKey: ["admin", "invites"], queryFn: async () => must(await supabase.from("admin_invites").select("*").order("invited_at")) });
  const refresh = useRefresh();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await inviteAdmin({ data: { email, origin: window.location.origin } });
      toast.success(r.status === "granted" ? "Accès administrateur accordé à ce compte existant." : "Invitation envoyée par e-mail.");
      setEmail("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invitation impossible.");
    }
    setBusy(false);
  }

  async function onPassword(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("8 caractères minimum."); return; }
    if (pw !== pw2) { toast.error("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(/pwned|leaked|weak/i.test(error.message) ? "Mot de passe trop courant : choisissez-en un autre." : error.message); return; }
    setPw("");
    setPw2("");
    toast.success("Mot de passe modifié.");
  }

  return (
    <>
      <PageHead cap="Compte et accès" title="Paramètres" />
      <div className="grid gap-10 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="display text-2xl">Administrateurs</h2>
          <ul className="border-t border-dashed border-ink">
            {admins.map((a) => (
              <li key={a.email} className="flex items-center gap-3 border-b border-dashed border-ink py-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{a.email}</span>
                <span className="cap text-mute">{a.accepted_at ? "Actif" : "Invitation envoyée"}</span>
                {a.email !== me?.email?.toLowerCase() && (
                  <Confirm
                    trigger={<button type="button" className="cap underline">Retirer</button>}
                    title="Retirer l’accès administrateur ?"
                    description={`${a.email} ne pourra plus entrer dans l’espace administrateur.`}
                    confirmLabel="Retirer l’accès"
                    onConfirm={async () => {
                      try {
                        await revokeAdmin({ data: { email: a.email } });
                        await refresh();
                        toast.success("Accès retiré.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Action impossible.");
                      }
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={onInvite} className="flex flex-col gap-3">
            <Field label="Inviter un administrateur" hint="La personne reçoit un e-mail pour choisir son mot de passe.">
              <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adresse@exemple.com" />
            </Field>
            <button type="submit" className={btnInk} disabled={busy}>Envoyer l’invitation</button>
          </form>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="display text-2xl">Mon compte</h2>
          <p className="text-sm">Connecté en tant que <b>{me?.email}</b></p>
          <form onSubmit={onPassword} className="flex flex-col gap-3">
            <Field label="Nouveau mot de passe" hint="8 caractères minimum."><input className={inputCls} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></Field>
            <Field label="Confirmer le mot de passe"><input className={inputCls} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></Field>
            <button type="submit" className={btn} disabled={busy}>Modifier le mot de passe</button>
          </form>
        </section>
      </div>
    </>
  );
}
