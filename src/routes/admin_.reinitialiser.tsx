import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { btnInk, Field, inputCls } from "@/components/admin/kit";

export const Route = createFileRoute("/admin_/reinitialiser")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choisir un mot de passe — MARQ’CI" },
      { name: "description", content: "Définissez le mot de passe de votre compte administrateur MARQ’CI." },
      { property: "og:title", content: "Choisir un mot de passe — MARQ’CI" },
      { property: "og:description", content: "Définissez le mot de passe de votre compte administrateur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"wait" | "yes" | "no">("wait");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The invitation / recovery link signs the visitor in from the URL; wait for that session.
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => session && setReady("yes"));
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setReady(data.session ? "yes" : "no");
    }, 1500);
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setError("8 caractères minimum.");
    if (pw !== pw2) return setError("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (err) return setError(/pwned|leaked|weak/i.test(err.message) ? "Mot de passe trop courant : choisissez-en un autre." : err.message);
    void navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-studio px-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-5 border border-dashed border-ink bg-paper p-8">
        <h1 className="display text-4xl leading-none">Choisir un mot de passe</h1>
        {ready === "wait" && <p className="cap text-mute">Vérification du lien…</p>}
        {ready === "no" && (
          <>
            <p className="text-sm">Ce lien est invalide ou a expiré. Demandez-en un nouveau depuis la page de connexion.</p>
            <Link to="/admin" className={btnInk}>Aller à la connexion</Link>
          </>
        )}
        {ready === "yes" && (
          <>
            <Field label="Nouveau mot de passe" hint="8 caractères minimum.">
              <input className={inputCls} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            </Field>
            <Field label="Confirmer le mot de passe">
              <input className={inputCls} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
            </Field>
            {error && <p role="alert" className="text-sm underline underline-offset-4">{error}</p>}
            <button type="submit" className={btnInk} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer et entrer"}</button>
          </>
        )}
      </form>
    </div>
  );
}
