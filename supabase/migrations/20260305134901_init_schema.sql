-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  has_customisation boolean NOT NULL DEFAULT false,
  has_colour_variants boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  default_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Spec Types
CREATE TABLE public.spec_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  has_pricing boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Spec Options
CREATE TABLE public.spec_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_type_id uuid NOT NULL REFERENCES public.spec_types(id) ON DELETE CASCADE,
  value text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Colour Options
CREATE TABLE public.colour_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

-- Standard Terms
CREATE TABLE public.standard_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Proposals
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL DEFAULT '',
  deal_duration text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  discount_percent numeric NOT NULL DEFAULT 0,
  cash_incentive numeric NOT NULL DEFAULT 0,
  clauses jsonb NOT NULL DEFAULT '[]',
  terms jsonb NOT NULL DEFAULT '[]',
  notes text NOT NULL DEFAULT '',
  ai_image_rights boolean NOT NULL DEFAULT false,
  photo_provisions boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_spec_options_type ON public.spec_options(spec_type_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);