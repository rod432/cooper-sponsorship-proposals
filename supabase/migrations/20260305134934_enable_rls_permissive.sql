-- Enable RLS on all tables with permissive policies (no auth yet per spec)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colour_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (will add proper auth later)
CREATE POLICY "Allow all access" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.spec_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.spec_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.colour_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.standard_terms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.proposals FOR ALL USING (true) WITH CHECK (true);