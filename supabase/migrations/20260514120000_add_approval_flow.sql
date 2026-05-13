-- Public approval flow: each proposal gets a tokenised public URL the player
-- can visit to approve/decline/request changes. Status drives the workflow.

ALTER TABLE public.proposals
  ADD COLUMN public_token uuid UNIQUE DEFAULT gen_random_uuid() NOT NULL,
  ADD COLUMN player_email text NOT NULL DEFAULT '',
  ADD COLUMN sent_at timestamptz;

UPDATE public.proposals SET public_token = gen_random_uuid() WHERE public_token IS NULL;

CREATE INDEX idx_proposals_public_token ON public.proposals(public_token);

CREATE TABLE public.proposal_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  response_type text NOT NULL CHECK (response_type IN ('approve','decline','request_changes')),
  message text NOT NULL DEFAULT '',
  responded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_responses_proposal ON public.proposal_responses(proposal_id);

ALTER TABLE public.proposal_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.proposal_responses FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
