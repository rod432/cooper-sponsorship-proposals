# Source App Analysis

A read of the Lovable export at `../_source-lovable` before porting. Confirms what the new Next.js app has to match.

## Stack at source

- **Vite 5 + React 18 + react-router-dom v6** — `BrowserRouter` with five named routes.
- **TypeScript** (not strict mode in source: `tsconfig.app.json` uses Vite defaults).
- **Tailwind CSS v3** with `tailwindcss-animate`, design tokens defined as HSL CSS variables in `src/index.css`.
- **shadcn/ui** components in `src/components/ui/*` — every Radix primitive listed in the brief is present.
- **@tanstack/react-query v5** for ALL data fetching and mutations. No server-side calls.
- **@supabase/supabase-js v2** with a single `createClient` in `src/integrations/supabase/client.ts`, using `localStorage` for session.
- **No auth wired up.** `auth.signIn`/`signUp` are never called. The app is open access.
- **No edge functions** in `supabase/functions/` — that directory does not exist.
- **No storage buckets used** — no calls to `supabase.storage.*` anywhere in source.
- **react-hook-form + zod packages are installed but never imported.** No form schemas exist. Form state is plain `useState`.

## Routes

| Path | Source file | Purpose |
| --- | --- | --- |
| `/` | `src/pages/Index.tsx` | Create/edit proposal — the workhorse page. Reads `?editId=` to load existing. |
| `/proposals` | `src/pages/Proposals.tsx` | Placeholder, no functionality yet ("Manage saved sponsorship proposals."). |
| `/catalog` | `src/pages/Catalog.tsx` | CRUD for categories, products, spec types/options, colour options. |
| `/terms` | `src/pages/Terms.tsx` | CRUD for the standard terms library used during proposal creation. |
| `*` | `src/pages/NotFound.tsx` | 404 with a console.error log and a link home. |

## Database schema (Postgres / Supabase)

Seven tables, two migrations, all with permissive RLS (`USING (true) WITH CHECK (true)`).

- **`categories`** — name, sort_order, two boolean flags (`has_customisation`, `has_colour_variants`).
- **`products`** — name, category_id (FK), default_price, sort_order, is_active.
- **`spec_types`** — key (unique), label, has_pricing, sort_order, is_active.
- **`spec_options`** — spec_type_id (FK), value, price, sort_order, is_active.
- **`colour_options`** — value, sort_order, is_active.
- **`standard_terms`** — title, body, sort_order, is_active.
- **`proposals`** — player_name, deal_duration, items (jsonb), discount_percent, cash_incentive, clauses (jsonb), terms (jsonb), notes, ai_image_rights, photo_provisions, status (default 'draft'), version.

Indexes: `idx_products_category`, `idx_spec_options_type`, `idx_proposals_status`.

No triggers, no functions, no views, no enums. Plain tables.

## Proposal data shape

The proposal builder (`/`) holds the entire form in a single React `useState` blob (`ProposalState` in `src/pages/Index.tsx`):

- `playerName: string`
- `dealDuration: string` (free-form, populated by a 1–10 year `Select`)
- `items: ProposalItem[]` (see equipment block below)
- `discountPercent: number`
- `cashIncentive: number`
- `clauses: string[]` (special clauses, custom strings)
- `aiImageRights: boolean`
- `photoProvisions: boolean`
- `selectedTerms: SelectedTerm[]` (`{id, title, body}` snapshots of standard terms)
- `customTerms: string[]` (additional one-off terms)
- `notes: string`

`ProposalItem` (from `EquipmentCatalogCard`):

- `id` (line-item uuid, client-generated)
- `productId`, `productName`, `categoryId`
- `quantity` (>= 1)
- `basePrice`
- `specs: Record<specTypeId, { optionId, value, price }>`
- `colour: string`

Financial math (in `FinancialSummaryCard` and `ProposalPreview`):

- `subtotal = sum((basePrice + Σ spec.price) * quantity)`
- `afterDiscount = subtotal - subtotal * discountPercent / 100`
- `totalValue = afterDiscount + cashIncentive`

Saved as JSONB blobs in the `proposals` row. `customTerms` is **not persisted** — it lives in component state only and is rendered into the preview/print views but never written to `terms` jsonb.

## Cross-component patterns to preserve

- **Window-based action sharing.** `Index.tsx` writes `(window as any).__proposalActions = { save, email, isSaving }` so `AppHeader` can call the Save/PDF/Email buttons from the top bar. Hacky, but it works and rewiring it would expand scope.
- **`react-query` keys**: `["categories"]`, `["products"]`, `["products-active"]`, `["spec_types"]`, `["spec_options"]`, `["colour_options"]`, `["standard_terms"]`, `["specTypes"]`, `["specOptions"]`, `["colourOptions"]`, `["proposal", id]`. Inconsistent (snake_case vs camelCase) — kept verbatim to avoid behavioural drift.
- **AppLayout** wraps every route in a sticky header + `max-w-3xl` main container.
- **Print CSS** in `index.css` hides `header` and `nav` and forces A4 margins; the `Preview`/`Print PDF` tabs rely on this.

## Design tokens (HSL CSS variables)

Primary brand colour is `hsl(187, 91%, 37%)` (Cooper teal). Header uses a `linear-gradient` from `--primary-dark` to `--primary`. Font: **Outfit** loaded from Google Fonts, used for headings; system stack for body. Radius `0.75rem`. Custom shadows `--shadow-card` and `--shadow-card-hover`. The dark-mode block exists but is never toggled — no theme switcher in the UI.

## Bugs / weirdness spotted (left as-is in port)

1. **PDF button calls `save`** (`AppHeader.tsx` line 65) — should probably call print/email instead but kept for behavioural parity.
2. **`customTerms` not saved** — see above. Rod may want to fix this; flagged in DECISIONS.md.
3. **Optimistic version bumping has a race** — `saveMutation` reads `version` then writes `version + 1` in two separate queries. Concurrent edits could clobber each other.
4. **`react-router-dom`'s `NavLink` wrapper** (`src/components/NavLink.tsx`) is defined but never imported anywhere. Dead code in source.
5. **`PhotoProvisionsCard` legal text diverges between the card and the preview.** The card body talks about "submission and approval"; the preview body says "participate in photo sessions". Two different paragraphs for the same clause.

## Things explicitly NOT in source

- No tests (despite `vitest.config.ts` and `src/test/example.test.ts` existing — only a one-liner sanity test).
- No CI workflow files (`.github/workflows/` absent).
- No Storybook or component documentation.
- No analytics SDK.
- No environment-specific configuration beyond `.env`.
