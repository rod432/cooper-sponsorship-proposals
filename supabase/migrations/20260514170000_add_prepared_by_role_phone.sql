-- Snapshot of the prepared-by staff member's role + direct phone at save time.
-- Pulled from their /profile (auth user_metadata) on save and frozen onto
-- the proposal so a future role change doesn't rewrite historical proposals.
ALTER TABLE public.proposals
  ADD COLUMN prepared_by_role text NOT NULL DEFAULT '',
  ADD COLUMN prepared_by_phone text NOT NULL DEFAULT '';
