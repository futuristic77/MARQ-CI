<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All brands, collections, products, categories and looks live in `src/data/catalog.ts`; every page and the lookbook read from it. Why: the brief requires one connected catalogue with no duplicate data.
- Shop filtering/sorting logic lives in `src/lib/filters.ts` (pure, tested); category pages drive it through validated search params. Why: filters must work on the real product data and stay shareable by URL.
- The ring lookbook (`src/components/lookbook/RingLookbook.tsx`) renders markup with React but runs the spring/drag/layout engine imperatively in one mount effect; parents remount it with `key` when the look set changes. Why: per-frame transforms must not go through React renders.
- Lookbook and shared atom styles (`.pill`, `.cap`, deck, slip, drawer) live in `src/styles/lookbook.css`, imported from `src/styles.css`. Why: the spec is written as plain CSS and those atoms are reused site-wide.
- The bag is client-side (`src/lib/bag.tsx`, localStorage) and checkout is a labelled demo. Why: no backend or payments are connected yet.
- Demo imagery uses contact-sheet crops (`productCrop`) and CDN cut-outs (`px()`); admin uploads live in the private `media` bucket and are served by `/api/public/media/$`, referenced by URL in the DB. Why: the workspace blocks public buckets and demo photos stay until replaced.
- Published admin content is fetched in the root route (`src/lib/published.functions.ts`) and merged in front of the demo arrays in `src/data/catalog.ts` by `applyPublished` (`src/lib/published.ts`). Why: every existing page keeps reading one shared catalogue.
- `/admin` is a client-only layout (`ssr: false`) that shows the login form until the session has the `admin` role; writes go straight through the browser client and are enforced by RLS + `has_role`. Admins are granted only via `admin_invites` (trigger on signup, or `inviteAdmin`); public signup is disabled. Why: no credentials in code, server-side enforcement.
