# Build Decisions

Non-obvious calls made during the rebuild, with reasoning. Anything that diverges from the brief is flagged with **DIVERGENCE**. Anything to revisit later is flagged with **REVIEW**.

## 1. Next.js 16, not Next.js 15 — **DIVERGENCE**

The brief asks for Next.js 15. `pnpm create next-app@latest` installed Next.js 16.2.6 (released early 2026). It uses the same App Router and supports React 19. The only meaningful breaking change touching this app is that `middleware.ts` was renamed to `proxy.ts` — I followed the new convention in `src/proxy.ts`.

Going forward this just means using `proxy.ts` rather than `middleware.ts`. No code-level differences.

## 2. Tailwind v4 ported from v3 source — DIVERGENCE in mechanics, not output

Source uses Tailwind v3 with a JS config (`tailwind.config.ts`). New stack is Tailwind v4 with CSS-first config — everything lives in `src/app/globals.css` under `@theme inline { ... }`. Same HSL design tokens, same colour palette, same Outfit font. Visually identical.

`tailwindcss-animate` was replaced with `tw-animate-css` because the former hasn't been updated for v4. Same `accordion-down/up` keyframes are still present.

## 3. No `react-hook-form` / `zod` in the proposal form — **REVIEW**

The brief instructs "Port forms. Use the same Zod schemas and react-hook-form resolvers from the source. Preserve every validation rule."

**The source has neither.** `package.json` lists both libraries but no file imports from them, and no Zod schema exists anywhere. Form state is a single `useState<ProposalState>` with no validation. The brief's instruction was preserving rules that don't exist.

I kept the same plain-state pattern. If Rod wants validation, the obvious places are: `playerName` required, `dealDuration` required, `quantity >= 1` per item, `discountPercent` between 0 and 100, `cashIncentive >= 0`. Trivial to add later as a Zod schema applied at save time.

## 4. Window-based action sharing — kept as-is

Source uses `window.__proposalActions = { save, email, isSaving }` to bridge Save/PDF/Email buttons in `AppHeader` to handlers in `Index.tsx`. Ugly, but works, and rewiring it into a proper context provider expands scope. Typed properly in `src/components/app-header.tsx` via `declare global`.

## 5. `@supabase/ssr` with a Proxy-based singleton

Brief requires `@supabase/ssr` (browser + server + middleware clients) even though there's no auth. I implemented all three (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`) plus a proxy entrypoint (`src/proxy.ts`).

The source app uses `import { supabase } from "@/integrations/supabase/client"` from dozens of components. Rather than rewrite every call site to use `createClient()`, I exposed both:

- `createClient()` — factory, returns a cached browser client
- `supabase` — a `Proxy` over the cached client so existing `supabase.from("…")` calls still work

Source-code edits during port were therefore one-line import path changes only.

## 6. UI components — copied direct from source

The source's `src/components/ui/*` is plain shadcn/ui at typical revision. Faster to copy them than to re-run `shadcn add` for each. Added `"use client"` to every file that uses Radix or React hooks (everything except `badge.tsx` and `skeleton.tsx`, which are pure CSS).

Filenames were converted from PascalCase (`PlayerDetailsCard.tsx`) to kebab-case (`player-details-card.tsx`) to match Next.js community convention. Component default-export names unchanged.

## 7. Full catalog imported from the original Lovable DB — `20260513131500_import_full_catalog.sql`

The new Supabase project started empty. I dumped the live catalog from the original Lovable Supabase project (`zfjcuzbpawnprzjofovm`) via the anon REST API and turned it into an idempotent migration. UUIDs preserved end-to-end so any future cross-environment imports stay consistent.

Counts after import (match the source exactly):
- 8 categories (Bats, Gloves, Pads, Protection, Bags, Accessories, Apparel, Footwear)
- 57 products
- 13 spec types (Willow Grade, Sticker Colour/Design, Grip, Face Protection, Handle Length/Shape/Thickness, Finished Weight, Toe Protection, Knocking In, Bat Size, Toe Shape)
- 95 spec options
- 12 colour options
- 14 standard terms (Tiered Discount, Early Termination & Exit Fee, Specialist Equipment Exception, etc.)

The migration is `ON CONFLICT (id) DO UPDATE` so re-running it (Supabase CLI `db push`, or a CI deploy) will sync any column changes without orphaning rows. Replaced the earlier placeholder `20260513000000_seed_baseline.sql` (now deleted).

## 8. Permissive RLS preserved

Source has `CREATE POLICY "Allow all access" ... FOR ALL USING (true) WITH CHECK (true)` on every table. The brief calls this internal-only and notes auth can be layered on later via Vercel password protection. Preserved verbatim. **REVIEW**: when adding auth, replace these policies. The `@supabase/ssr` plumbing is already in place, so auth can be wired in without rewriting clients.

## 9. Bugs from source kept on purpose

Per brief: "If you spot an obvious bug in the source, note it in DECISIONS.md and leave it as-is unless it blocks the migration." Catalogued in `SOURCE_ANALYSIS.md` under "Bugs / weirdness spotted". Notably:

- **`customTerms` array is never persisted** in the `proposals.terms` jsonb — it's component-local, rendered to preview but lost on save. Probably wants fixing.
- **PDF button calls `save`** in `AppHeader`. Probably a copy-paste error in source.
- **Optimistic version increment is racey.** Two queries (`select version` then `update version+1`) — concurrent edits will overwrite.

## 10. `next/image` over `<img>`

Replaced `<img src={cooperLogo}>` (Vite asset import) with `<Image src="/cooper-c-logo.png">`. The logo is now in `public/` rather than `src/assets/`. Next.js needs explicit width/height — used 32×32 for header, 48×48 for proposal preview.

## 11. `next/link` and `next/navigation` over `react-router-dom`

- `react-router-dom`'s `BrowserRouter`/`Routes`/`Route` → `app/` directory file-based routing
- `useNavigate` → `useRouter().push()`
- `useSearchParams` → `useSearchParams()` from `next/navigation`
- `useLocation().pathname` → `usePathname()`
- `react-router-dom` is uninstalled.

## 12. lucide-react version jump

Source has `lucide-react@0.462.0`. The package switched to 1.x in 2026 and `latest` resolved to 1.14.0. Same icons, same API.

## 13. ESLint config and TypeScript strict mode

Next.js scaffold installed `eslint.config.mjs` with the Next.js flat-config preset. `tsconfig.json` has `"strict": true`. Build passes type-check; only place I had to tighten was supabase `update()` calls — replaced `Record<string, unknown>` with `TablesUpdate<"table_name">`.

## 14. Custom 404 page

Next.js auto-renders `not-found.tsx`. Replaced the source's `useEffect(() => console.error(...))` with a clean message page. The console.error was debugging noise, not user-facing behaviour.
