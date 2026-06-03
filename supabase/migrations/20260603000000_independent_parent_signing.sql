-- Independent parent/guardian co-signing for under-18 proposals.
--
-- Previously the player and parent signatures were captured together in one
-- submission. This lets each party sign the SAME proposal link separately:
-- the player signs their copy, the parent/guardian signs theirs, and the deal
-- only finalises (status 'approved') once BOTH have signed. Adult proposals are
-- unchanged — the player signs and it finalises immediately.
--
-- New intermediate status value used by the app: 'partially_signed'
-- (status is a free-text column, so no enum change is required).

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS player_signed_name text,
  ADD COLUMN IF NOT EXISTS player_signed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS parent_signed_at   timestamptz;

-- Backfill: any already-approved proposals are treated as fully signed so the
-- new "awaiting co-signature" logic never re-opens a finalised agreement.
UPDATE public.proposals
SET player_signed_name = COALESCE(player_signed_name, signed_name),
    player_signed_at   = COALESCE(player_signed_at, signed_at),
    parent_signed_at   = COALESCE(parent_signed_at,
                                  CASE WHEN parent_signed_name IS NOT NULL
                                       THEN signed_at END)
WHERE status = 'approved';
