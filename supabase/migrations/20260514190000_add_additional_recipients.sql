-- Extra recipients (parent, guardian, manager, agent, etc.) that should
-- receive a copy of the proposal email alongside the primary player_email.
-- Stored as a jsonb array of { email, name?, role } objects.
ALTER TABLE public.proposals
  ADD COLUMN additional_recipients jsonb NOT NULL DEFAULT '[]'::jsonb;
