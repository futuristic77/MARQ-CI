import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { requestAdminAccess } from "@/lib/admin.functions";
import { btn, btnInk, Field, inputCls } from "@/components/admin/kit";

export const Route = createFileRoute("/admin")({
  // The session lives in the browser, so the whole admin area renders client-side.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — MARQ’CI" },
      { name: "description", content: "Espace administrateur MARQ’CI : gestion des contenus du site." },
      { property: "og:title", content: "Administration — MARQ’CI" },
      { property: "og:description", content: "Espace réservé aux administrateurs MARQ’CI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Vue d’ensemble", exact: true },
  { to: "/admin/articles", label: "Articles" },
  { to: "/admin/mannequins", label: "Mannequins" },
  { to: "/admin/vetements", label: "Vêtements" },
  { to: "/admin/marques", label: "Marques" },
  { to: "/admin/collections", label: "Collections" },
  { to: "/admin/looks", label: "Looks / Lookbook" },
  { to: "/admin/accueil", label: "Page d’accueil" },
  { to: "/admin/medias", label: "Bibliothèque média" },
  { to: "/admin/parametres", label: "Paramètres" },
] as const;

type GateState = "loading" | "out" | "denied" | "ok";

function AdminLayout() {
  const [state, setState] = useState<GateState>("loading");
  const [email, setEmail] = useState("");
  const qc = useQueryClient();

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      if (!data.user) return setState("out");
      setEmail(data.user.email ?? "");
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      if (alive) setState(isAdmin ? "ok" : "denied");
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "USER_UPDATED") setTimeout(() => void check(), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await qc.cancelQueries({ queryKey: ["admin"] });
    qc.removeQueries({ queryKey: ["admin"] });
    await supabase.auth.signOut();
    setState("out");
  }

  if (state === "loading") return <Centered><p className="cap text-mute">Vérification de l’accès…</p></Centered>;
  if (state === "out") return <LoginScreen />;
  if (state === "denied")
    return (
      <Centered>
        <h1 className="display text-4xl">Accès refusé</h1>
        <p className="mt-3 text-sm text-mute">Le compte {email} n’a pas les droits administrateur.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className={btn} onClick={() => void signOut()}>Se déconnecter</button>
          <Link to="/" className={btn}>Retour au site</Link>
        </div>
      </Centered>
    );

  return (
    <div className="min-h-screen bg-studio md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-dashed border-ink bg-paper md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/admin" className="display text-2xl leading-none">MARQ’CI</Link>
          <span className="cap text-mute">Admin</span>
        </div>
        <nav aria-label="Navigation administrateur" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n }}
              className="cap shrink-0 rounded-full px-3 py-2 hover:bg-studio"
              activeProps={{ style: { background: "var(--ink)", color: "var(--paper)" } }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-dashed border-ink px-5 py-4">
          <span className="truncate text-xs text-mute">{email}</span>
          <Link to="/" target="_blank" className="cap hover:underline">Voir le site ↗</Link>
          <button type="button" className="cap text-left hover:underline" onClick={() => void signOut()}>Se déconnecter</button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-studio px-4">
      <div className="w-full max-w-md border border-dashed border-ink bg-paper p-8 text-center">{children}</div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(/invalid/i.test(err.message) ? "E-mail ou mot de passe incorrect." : /confirm/i.test(err.message) ? "Adresse e-mail non confirmée." : err.message);
  }

  async function onAccess() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Saisissez d’abord votre adresse e-mail.");
    setBusy(true);
    setError("");
    try {
      await requestAdminAccess({ data: { email: email.trim(), origin: window.location.origin } });
      setInfo("Si cette adresse est autorisée, un e-mail vient d’être envoyé avec un lien pour choisir votre mot de passe.");
    } catch {
      setError("Envoi impossible pour le moment. Réessayez dans quelques minutes.");
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-studio px-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-5 border border-dashed border-ink bg-paper p-8">
        <div>
          <p className="cap text-mute">MARQ’CI</p>
          <h1 className="display mt-1 text-4xl leading-none">Espace administrateur</h1>
        </div>
        <Field label="Adresse e-mail">
          <input className={inputCls} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Mot de passe">
          <input className={inputCls} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p role="alert" className="text-sm underline underline-offset-4">{error}</p>}
        {info && <p role="status" className="text-sm text-mute">{info}</p>}
        <button type="submit" className={btnInk} disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button>
        <button type="button" className="cap text-left underline underline-offset-4" onClick={() => void onAccess()} disabled={busy}>
          Première connexion ou mot de passe oublié
        </button>
        <Link to="/" className="cap text-mute hover:text-ink">← Retour au site</Link>
      </form>
    </div>
  );
}
