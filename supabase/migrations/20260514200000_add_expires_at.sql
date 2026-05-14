-- expires_at is set at the moment the player signs (approves). It's based on
-- the deal_duration text ("1 Year", "2 Years", ...) + signed_at.
ALTER TABLE public.proposals
  ADD COLUMN expires_at timestamptz;

CREATE INDEX idx_proposals_expires_at ON public.proposals(expires_at);
