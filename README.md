# Cooper Cricket Sponsorship Proposals

Internal tool for Cooper Cricket Pty Ltd (Brisbane) to put together professional-player sponsorship proposals. Staff fill in a player's details, pick equipment from the catalog, set financial terms, attach standard or custom legal clauses, and save/preview/print the proposal.

This is the production Next.js rebuild of an earlier Lovable prototype.

## Stack

- **Next.js 16** App Router, **React 19**, TypeScript strict
- **Tailwind CSS v4** (CSS-first config in `src/app/globals.css`)
- **shadcn/ui** (Radix primitives) for the component library
- **Supabase** for database + future auth, accessed via **`@supabase/ssr`**
- **@tanstack/react-query v5** for client-side data fetching and mutations
- **Vercel** for hosting
- **pnpm** for package management, **Node 20+**

## Running locally

1. Clone and install:
   ```sh
   git clone https://github.com/rod432/cooper-sponsorship-proposals.git
   cd cooper-sponsorship-proposals
   pnpm install
   ```
2. Copy env vars:
   ```sh
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase dashboard (`Project Settings → API`). Use the `sb_publishable_...` key for new apps; the legacy `anon` JWT also works.
3. Dev server:
   ```sh
   pnpm dev
   ```
   App boots at `http://localhost:3000`.
4. Build / type-check:
   ```sh
   pnpm build
   ```

## How it's wired

```
src/
  app/
    layout.tsx               — root layout: Outfit font, providers
    globals.css              — Tailwind v4 + design tokens
    not-found.tsx            — 404
    (staff)/                 — staff routes (Cooper-branded header + nav)
      layout.tsx
      actions.ts             — `sendProposal` server action (Resend + mailto)
      page.tsx               — `/`            Create/edit proposal (the workhorse)
      create-proposal-view.tsx
      proposals/page.tsx     — `/proposals`   Saved proposals list w/ status, search, actions
      catalog/page.tsx       — `/catalog`     CRUD for products, categories, specs, colours
      terms/page.tsx         — `/terms`       CRUD for the standard terms library
    p/[token]/               — public approval page (minimal layout, no staff nav)
      layout.tsx
      page.tsx               — read-only proposal + response history
      response-form.tsx      — Approve / Decline / Request changes form
      actions.ts             — `submitResponse` server action
  components/
    app-header.tsx           — sticky header w/ logo, nav, save/PDF/email shortcuts
    providers.tsx            — React Query + Tooltip + Toaster providers
    proposal/                — proposal builder cards + preview/print views
    catalog/                 — catalog admin sections (categories, products, customisation)
    ui/                      — shadcn/ui components
  hooks/
    use-toast.ts             — toast queue (shadcn pattern)
    use-mobile.tsx           — `useIsMobile()` breakpoint hook
  lib/
    utils.ts                 — `cn()` (clsx + tailwind-merge)
    supabase/
      client.ts              — browser client (also exports `supabase` proxy)
      server.ts              — server component / action client
      middleware.ts          — session-refresh helper (proxied by `src/proxy.ts`)
      types.ts               — generated Database types
  proxy.ts                   — Next 16 proxy (was `middleware.ts` in Next 15)

supabase/
  migrations/                — SQL migrations applied to the project
  config.toml                — local Supabase CLI config

public/
  cooper-c-logo.png          — Cooper Cricket logo used in header + preview
```

## Where the data lives

Supabase project **`cooper-sponsorship-proposals`** (project ref `bpivibtphwnuciaapewd`, region ap-southeast-2). Seven tables:

- `categories` — product groups (Bats, Pads, Gloves, ...); flags whether items in this category can be customised or have colour variants.
- `products` — individual SKUs, each linked to a category, with a default price.
- `spec_types` — customisation dimensions (Grade, Handle, Size, ...). `has_pricing` toggles whether options for this type add to the line-item price.
- `spec_options` — values within a spec type, with an optional price.
- `colour_options` — flat list of colour names for categories flagged `has_colour_variants`.
- `standard_terms` — title + body of reusable legal clauses, sortable.
- `proposals` — the actual saved proposals. `items`, `clauses`, `terms` are JSONB blobs. `public_token` is the unguessable URL token the player sees; `status` is `draft | sent | approved | declined | changes_requested`.
- `proposal_responses` — one row per approve / decline / request-changes click from a player.

All tables have RLS enabled with a permissive `Allow all access` policy. The app is currently open-access; tighten policies if/when you add auth.

## Common tasks

### Add a new field to the proposal form

1. Add the column to `proposals` via a migration in `supabase/migrations/` and apply it (Supabase CLI or the MCP `apply_migration`).
2. Regenerate types and overwrite `src/lib/supabase/types.ts` (`supabase gen types typescript --project-id bpivibtphwnuciaapewd > src/lib/supabase/types.ts`, or pull from the Supabase MCP).
3. Add the field to `ProposalState` in `src/app/create-proposal-view.tsx`.
4. Add a new card under `src/components/proposal/` and render it from `create-proposal-view.tsx`.
5. Add the field to the save payload in `saveMutation.mutationFn`.
6. Add it to `ProposalPreview` and `ProposalPrintView` so it shows in the preview/PDF.

### Add a new top-nav route

1. Create `src/app/<route>/page.tsx`.
2. Add an entry to `navItems` in `src/components/app-header.tsx`.

### Adjust brand colours

Edit the HSL CSS variables at the top of `src/app/globals.css` (`--primary`, `--primary-dark`, `--primary-light`, etc.). Tailwind utilities like `bg-primary`, `text-primary-foreground`, `from-primary-dark` pick them up via `@theme inline`.

## Deployment

Hosted on **Vercel** as the project `cooper-sponsorship-proposals` (team `rod-greys-projects`).

Set env vars in **Vercel Project Settings → Environment Variables** for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL` (required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- `RESEND_API_KEY` (optional) — when set, the Send-to-Player button sends server-side via Resend instead of opening the staff member's mail client.
- `RESEND_FROM_ADDRESS` (optional) — defaults to `Cooper Cricket <proposals@coopercricket.com.au>`. The sending domain must be verified in Resend.
- `NEXT_PUBLIC_SITE_URL` (optional) — overrides the auto-detected base URL used in proposal links. Set this if you put the app behind a custom domain.

Push to `main` triggers a production deploy via the GitHub integration.

## Migrations

Migrations live in `supabase/migrations/` and are timestamped. To apply locally with the Supabase CLI:

```sh
supabase link --project-ref bpivibtphwnuciaapewd
supabase db push
```

Or apply individual files via the Supabase MCP `apply_migration` tool — that's the path used during the initial rebuild.

## Notes

- See `SOURCE_ANALYSIS.md` for a breakdown of the source app this was ported from.
- See `DECISIONS.md` for non-obvious choices and known divergences.
