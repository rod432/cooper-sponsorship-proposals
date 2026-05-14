-- Who put the proposal together (shown in the letterhead "Prepared by" row).
ALTER TABLE public.proposals
  ADD COLUMN prepared_by_name text NOT NULL DEFAULT '',
  ADD COLUMN prepared_by_email text NOT NULL DEFAULT '';

-- Human-friendly proposal reference, e.g. CC-2026-0007.
CREATE SEQUENCE IF NOT EXISTS public.proposal_reference_seq;

CREATE OR REPLACE FUNCTION public.set_proposal_reference()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  next_id int;
  yr text;
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    next_id := nextval('public.proposal_reference_seq');
    yr := to_char(NEW.created_at, 'YYYY');
    NEW.reference := 'CC-' || yr || '-' || lpad(next_id::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.proposals ADD COLUMN reference text NOT NULL DEFAULT '';

CREATE TRIGGER trg_set_proposal_reference
  BEFORE INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_proposal_reference();

UPDATE public.proposals SET reference = 'CC-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('public.proposal_reference_seq')::text, 4, '0')
WHERE reference = '';

CREATE UNIQUE INDEX idx_proposals_reference ON public.proposals(reference);
