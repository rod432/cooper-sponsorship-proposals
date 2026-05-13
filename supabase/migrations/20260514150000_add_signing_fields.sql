-- Cursive-signature approval: persist signed_name (+ parent for under-18)
-- and the moment the player signed. Mirrors on proposal_responses keep the
-- full audit trail.

ALTER TABLE public.proposals
  ADD COLUMN signed_under_18 boolean NOT NULL DEFAULT false,
  ADD COLUMN signed_name text,
  ADD COLUMN parent_signed_name text,
  ADD COLUMN signed_at timestamptz;

ALTER TABLE public.proposal_responses
  ADD COLUMN signed_name text,
  ADD COLUMN parent_signed_name text,
  ADD COLUMN under_18 boolean NOT NULL DEFAULT false;
