import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const originSchema = z.string().regex(/^https?:\/\/[^/\s]+$/).max(200);

async function findUserByEmail(email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * First sign-in / forgotten password for invited administrators only.
 * Always answers the same way so it cannot be used to discover who is an admin.
 */
export const requestAdminAccess = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; origin: string }) => z.object({ email: emailSchema, origin: originSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const redirectTo = `${data.origin}/admin/reinitialiser`;
    const { data: invite } = await supabaseAdmin.from("admin_invites").select("email").eq("email", data.email).maybeSingle();
    if (invite) {
      const user = await findUserByEmail(data.email);
      const res = user
        ? await supabaseAdmin.auth.resetPasswordForEmail(data.email, { redirectTo })
        : await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { redirectTo });
      if (res.error) console.error("[admin-access]", res.error.message);
    }
    return { ok: true as const };
  });

async function assertAdmin(supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Accès réservé aux administrateurs.");
}

/** Adds an administrator: records the invitation and sends the invitation e-mail (or grants the role to an existing account). */
export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; origin: string }) => z.object({ email: emailSchema, origin: originSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: invErr } = await supabaseAdmin.from("admin_invites").upsert({ email: data.email }, { onConflict: "email" });
    if (invErr) throw new Error(invErr.message);
    const user = await findUserByEmail(data.email);
    if (user) {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("admin_invites").update({ accepted_at: new Date().toISOString() }).eq("email", data.email);
      return { status: "granted" as const };
    }
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { redirectTo: `${data.origin}/admin/reinitialiser` });
    if (error) throw new Error(error.message);
    return { status: "invited" as const };
  });

/** Removes another administrator's access (the account itself is kept). */
export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => z.object({ email: emailSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const self = typeof context.claims.email === "string" ? context.claims.email.toLowerCase() : "";
    if (self === data.email) throw new Error("Vous ne pouvez pas retirer votre propre accès.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const user = await findUserByEmail(data.email);
    if (user) await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id).eq("role", "admin");
    await supabaseAdmin.from("admin_invites").delete().eq("email", data.email);
    return { ok: true as const };
  });
