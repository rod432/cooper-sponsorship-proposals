-- Baseline catalog data so a fresh deployment renders something useful.
-- Idempotent: skips inserts when a row with the same name/value already exists.

INSERT INTO public.categories (name, sort_order, has_customisation, has_colour_variants)
SELECT v.name, v.sort_order, v.has_customisation, v.has_colour_variants
FROM (VALUES
  ('Bats', 1, true, false),
  ('Pads', 2, false, true),
  ('Gloves', 3, false, true),
  ('Helmets', 4, false, true),
  ('Bags', 5, false, true)
) AS v(name, sort_order, has_customisation, has_colour_variants)
WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.name = v.name);

INSERT INTO public.colour_options (value, sort_order)
SELECT v.value, v.sort_order
FROM (VALUES ('White', 1), ('Black', 2), ('Navy', 3), ('Maroon', 4))
  AS v(value, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.colour_options c WHERE c.value = v.value);

INSERT INTO public.spec_types (key, label, has_pricing, sort_order)
SELECT v.key, v.label, v.has_pricing, v.sort_order
FROM (VALUES
  ('grade', 'Grade', true, 1),
  ('handle', 'Handle', false, 2),
  ('size', 'Size', false, 3)
) AS v(key, label, has_pricing, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.spec_types t WHERE t.key = v.key);

INSERT INTO public.spec_options (spec_type_id, value, price, sort_order)
SELECT st.id, v.value, v.price, v.sort_order
FROM (VALUES
  ('grade', 'Players', 250, 1),
  ('grade', 'Pro', 150, 2),
  ('grade', 'Standard', 0, 3),
  ('handle', 'Short Handle', 0, 1),
  ('handle', 'Long Handle', 0, 2),
  ('size', 'Harrow', 0, 1),
  ('size', 'Full Size', 0, 2)
) AS v(spec_key, value, price, sort_order)
JOIN public.spec_types st ON st.key = v.spec_key
WHERE NOT EXISTS (
  SELECT 1 FROM public.spec_options o WHERE o.spec_type_id = st.id AND o.value = v.value
);

INSERT INTO public.products (name, category_id, default_price, sort_order)
SELECT v.name, c.id, v.default_price, v.sort_order
FROM (VALUES
  ('Bats', 'Cooper Pro Bat', 450, 1),
  ('Bats', 'Cooper Elite Bat', 650, 2),
  ('Pads', 'Cooper Test Pads', 220, 1),
  ('Gloves', 'Cooper Pro Gloves', 180, 1),
  ('Helmets', 'Cooper Pro Helmet', 280, 1),
  ('Bags', 'Cooper Tour Bag', 320, 1)
) AS v(category_name, name, default_price, sort_order)
JOIN public.categories c ON c.name = v.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.products p WHERE p.name = v.name AND p.category_id = c.id
);

INSERT INTO public.standard_terms (title, body, sort_order)
SELECT v.title, v.body, v.sort_order
FROM (VALUES
  ('Exclusivity', 'The Player agrees to exclusively use Cooper Cricket equipment in all competitive matches and training sessions for the duration of this agreement.', 1),
  ('Social Media Obligations', 'The Player agrees to make a minimum of four (4) social media posts per calendar year featuring Cooper Cricket equipment, with at least one post per quarter.', 2),
  ('Brand Representation', 'The Player will conduct themselves in a manner consistent with the values of Cooper Cricket and will not engage in any activity that could bring the brand into disrepute.', 3),
  ('Termination', 'Either party may terminate this agreement with thirty (30) days written notice. Equipment provided remains the property of Cooper Cricket until the conclusion of the sponsorship period.', 4)
) AS v(title, body, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.standard_terms s WHERE s.title = v.title);
