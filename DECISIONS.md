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

## 16. Magic-link auth + domain restriction

Staff sign in with a Supabase Auth one-time email link. No passwords. Self-signup is allowed but locked to whichever email domain `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` points at (defaults to `coopercricket.com.au`).

- `src/app/login/page.tsx` — public login UI. Posts to a server action that calls `supabase.auth.signInWithOtp`. Rejects emails that don't match the allowed domain *before* requesting the link, and the `/auth/callback` route double-checks after the link is exchanged for a session.
- `src/app/auth/callback/route.ts` — exchanges either `code` (PKCE) or `token_hash + type` (magic link) for a session, then validates the user's email domain. If it doesn't match, signs the user out and redirects to `/login?error=...`.
- `src/lib/supabase/middleware.ts` — proxy redirects unauthenticated requests for anything outside `/login`, `/auth/*`, `/p/*` to `/login?next=<original>`.
- `src/components/app-header.tsx` — popover account menu shows the signed-in email + a Sign out button (server action).

**REQUIRED MANUAL STEP**: Supabase Auth needs the production callback URL on its redirect allowlist. In the Supabase dashboard for project `bpivibtphwnuciaapewd`, go to **Authentication → URL Configuration** and set:
- **Site URL**: `https://cooper-sponsorship-proposals.vercel.app` (or whatever custom domain you land on)
- **Redirect URLs**: add `https://cooper-sponsorship-proposals.vercel.app/auth/callback`, and `http://localhost:3000/auth/callback` for local dev. If you switch to a custom domain, add that callback URL too.

Without those entries, magic links will fall back to the default Site URL and the redirect will fail.

**REQUIRED CONFIG**: in **Authentication → Providers → Email**, ensure "Confirm email" is on and "Enable email signups" is on. These are on by default in new projects.

The Supabase default mail server has a 4-emails-per-hour limit. Fine for 1–5 staff but worth knowing.

## 17. Cursive-signature approval (e-sign)

Replaces the plain "Approve" button on `/p/[token]` with a typed-signature flow modelled on DocuSign:

- Player types their full legal name into an input; below, the same name renders in **Great Vibes** (Google Font, loaded via `next/font/google`). Submits both the typed name and the cursive rendering atomically.
- A prominent "I am under 18" checkbox sits at the very top of the page (before the proposal content). When ticked, the signing form requires a second name field for the parent/guardian. Both signatures are persisted.
- "I agree to the terms" tick-box is required before the submit button activates.
- `proposals.signed_name` / `parent_signed_name` / `signed_under_18` / `signed_at` hold the final signed state. `proposal_responses` keeps the same fields per response for the audit trail.
- Once approved, the page re-renders in a **signed view**: the cursive signature(s) are shown beneath the proposal preview alongside the timestamp, and a **Save as PDF** button calls `window.print()` against a print-friendly stylesheet.
- Decline / Request-changes flow is unchanged — short note, no signature, status flips to `declined` / `changes_requested`.

**Print lockdown**: before the proposal is approved, `<PrintLock />` adds `body.print-locked`. The CSS at the bottom of `globals.css` hides the entire `<main>` in `@media print` when that class is present and shows a "please review and approve online before printing" message instead. The player physically cannot print or save-as-PDF until they've signed.

**REVIEW for Rod**:

- Typed-name e-signatures are legally enforceable in Australia under the Electronic Transactions Act 1999 / state equivalents for most contracts. Talk to your lawyer if you're putting players on long-term deals with this; you may want a brief consent paragraph above the sign button.
- I gate the signature on `signedName.length >= 2`. There's no validation that the typed name actually matches the player's real name — that's a UX trust issue, not a technical one.
- Under-18 starts unchecked. If you'd rather have it default to checked for proposals where the player IS under 18 (set by staff), the migration leaves that easy: just default the new player-side checkbox from `proposals.signed_under_18` (which staff could also set on the proposal record).

## 19. Brand-accurate visual identity + letterhead

Aligned every visual to the official Cooper Cricket style guide (Aug 2022) and added a proper letterhead to the proposal document.

**Brand colours** — updated from my eyeballed approximation to the exact spec:

- Primary: `#00B3DC` (HSL 191 100% 43%) — Pantone 306PC. Was `#0a7fa6`-ish. Brighter and more saturated than before.
- Primary-dark: `#009BBF` (HSL 192 100% 35%) for the gradient end.
- Grey: `#575B62` (HSL 218 6% 36%) — Pantone 425PC. Drives all the "muted text" cases.

**Logos** — copied the official SVG wordmarks from the Dropbox brand-assets folder to `public/`:

- `cooper-cricket-wordmark-white.svg` — used on the staff header, public proposal header, login brand panel, and the proposal letterhead band.
- `cooper-cricket-wordmark-blue.svg` — used on the mobile login fallback (white background).
- `cooper-cricket-wordmark-black.svg` — kept as a backup for any future print/B&W needs.
- The "C" mark (`cooper-c-logo.png`) is now a watermark on the login brand panel.

**Letterhead** (`ProposalPreview`) — full restyle:

- Blue gradient header band with the white wordmark, "Sponsorship Proposal" label, reference number (e.g. `CC-2026-0007`), and date.
- Sub-header strip with legal name, ABN, address, phone, email pulled from `src/lib/company-info.ts`.
- "Prepared for / Prepared by" two-column block: player name + sponsorship term on the left, staff member's name + email on the right.
- Equipment table with alternating row tints, sticky column widths, brand-coloured headers.
- "Total Sponsorship Value" gets its own filled-blue row so it's the visual anchor.
- Standard-terms section auto-numbers with blue numerals.
- Footer repeats legal name + ABN + contact info, with the validity caveat.

**Auto-generated proposal reference** — every proposal gets a human-friendly ID at insert time via a Postgres trigger. Format: `CC-YYYY-NNNN`. Backed by a sequence so re-running the migration is idempotent. Shown on the proposals list, in the email, and on the letterhead.

**Prepared-by attribution** — `prepared_by_name` + `prepared_by_email` columns on `proposals`. Auto-filled on first save from the signed-in user's metadata (`user_metadata.full_name` → falls back to email-local-part). Not overwritten if another staff member edits a proposal that was originally drafted by someone else, so attribution sticks.

**Branded email body** — when Resend is configured, the player gets a properly designed HTML email: Cooper-blue header band, large "Review your proposal" CTA, business footer. Text fallback included. Subject includes the reference number when available.

**Login page** — split-panel layout. Left side is a Cooper-blue brand panel with the wordmark, a large "C" watermark, and a tagline. Right side is the sign-in form on white. Collapses to a single column on mobile.

**REVIEW for Rod**:

- Resend's "from" address (`proposals@coopercricket.com.au`) still needs DNS/SPF/DKIM set up on that domain before Resend will deliver. Once it's verified you can also drop `RESEND_FROM_ADDRESS` if you want — the default in `COMPANY` config matches.
- If you want a different display name on the wordmark in the staff header (you've got a lot of horizontal space), I can swap to the bigger version or add a tagline.
- Proposal references start at `CC-2026-0001`. If you want them to continue from a number you've used externally, change the sequence's starting value in Supabase: `SELECT setval('public.proposal_reference_seq', 99);` → next will be 100.

## 18. Custom domain via Cloudflare DNS

Rod is setting up the domain in Cloudflare. Recommended path:

1. In **Vercel** → Project Settings → Domains, add the chosen domain (e.g. `proposals.coopercricket.com.au`). Vercel will show the exact DNS record to add — usually a CNAME pointing at `cname.vercel-dns.com`.
2. In **Cloudflare** DNS, add the record exactly as Vercel asks. **Important**: set the proxy status to **DNS only** (grey cloud), not "Proxied" (orange cloud). Cloudflare's reverse proxy in front of Vercel causes header issues with Next.js streaming and breaks the Supabase auth cookies.
3. After DNS propagates (usually < 5 min with Cloudflare), Vercel auto-provisions a TLS cert via Let's Encrypt.
4. Update Vercel env var `NEXT_PUBLIC_SITE_URL` to the new domain (e.g. `https://proposals.coopercricket.com.au`).
5. Add the new callback URL to Supabase Auth allowlist: `https://proposals.coopercricket.com.au/auth/callback`.
6. Redeploy (Vercel rebuilds automatically when env vars change, or trigger one manually).

Cloudflare-as-proxy can work with extra config (cf-connecting-ip handling, etc.) but DNS-only avoids every gotcha.

## 15. Public approval flow — new feature beyond the source

The source's `/proposals` page was a placeholder. Rod asked for two new things: a working proposals list, and the ability to email a proposal to a player who can approve, decline, or request changes.

**Schema additions** (`20260514120000_add_approval_flow.sql`):

- `proposals.public_token uuid UNIQUE DEFAULT gen_random_uuid()` — unguessable URL token. Player URLs use this, not the primary key, so the row ID is never exposed.
- `proposals.player_email text` — email captured on the proposal form, used as the default Send recipient.
- `proposals.sent_at timestamptz` — set when the proposal is sent. `status` already existed; values now `draft | sent | approved | declined | changes_requested`.
- `proposal_responses` — one row per approve/decline/request-changes click, with an optional message. Stores the full history (a player can request changes multiple times before approving).
- Trigger `trg_proposals_updated_at` — keeps `updated_at` fresh on every UPDATE, replacing the source's manual `updated_at: new Date().toISOString()` payload field.

**Routing**:

- New route group `src/app/(staff)/` holds the existing staff routes (`/`, `/proposals`, `/catalog`, `/terms`) with the Cooper-branded `AppHeader`.
- New public route `src/app/p/[token]/` has its own minimal layout (logo only, no nav) and is server-rendered. Players never see staff nav.

**Email transport** (`src/app/(staff)/actions.ts → sendProposal`):

- Server action. If `RESEND_API_KEY` is set, sends server-side via Resend (from `RESEND_FROM_ADDRESS`, defaults to `proposals@coopercricket.com.au`). Otherwise returns a `mailto:` link the staff member can click in the dialog to open their default mail client with the message pre-filled. Either way, status flips to `sent` and `sent_at` is stamped.
- Same action handles both flows so the UI doesn't branch on transport.
- The send dialog also shows the public link with a Copy button — useful for SMS / WhatsApp / personal handoff.

**Form changes**:

- `PlayerDetailsCard` now has a third field for player email. Persisted on save.
- `create-proposal-view.tsx` auto-saves before opening the Send dialog (you can't send a proposal that doesn't exist yet).
- After the first save, the URL flips to `/?editId=<id>` so subsequent saves update rather than insert.

**Header**:

- "Email" button renamed to "Send" (matches the dialog).
- "PDF" button was previously calling `save` (source bug, called out in §9). Now it correctly switches to the Print PDF tab via a new `printPdf` action on `window.__proposalActions`. **REVIEW**: source-divergence — keeping the fix because the source behaviour was a clear bug.

**REVIEW for Rod**:

- The Resend `RESEND_FROM_ADDRESS` defaults to `proposals@coopercricket.com.au`. That domain needs to be verified in Resend (DKIM/SPF) before sends will work. If you want a different sender, set `RESEND_FROM_ADDRESS` in Vercel env vars.
- The flow currently allows multiple responses (e.g. request changes → request changes → approve). Final `approved` / `declined` locks further responses. If you want stricter rules — e.g. only one response allowed total — change the guard in `src/app/p/[token]/actions.ts`.
- Public proposal pages are open to anyone with the token. That's the point (the player needs to view without logging in). If a token leaks, anyone can approve/decline. Lower-risk than the existing permissive RLS on everything else, but worth knowing.
