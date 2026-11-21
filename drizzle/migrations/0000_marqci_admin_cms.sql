-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.content_status AS ENUM ('draft', 'published');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ===== Admin invitations =====
CREATE TABLE public.admin_invites (
  email text PRIMARY KEY CHECK (email = lower(email)),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invites" ON public.admin_invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_invites (email) VALUES ('salomondylann@gmail.com');

CREATE OR REPLACE FUNCTION public.grant_invited_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_invites WHERE email = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    UPDATE public.admin_invites SET accepted_at = now() WHERE email = lower(NEW.email);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_invited_admin();

-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ===== Brands =====
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL,
  logo_url text,
  cover_url text,
  city text,
  founded integer,
  tagline text,
  description text,
  editorial text,
  extra_info text,
  status public.content_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Collections =====
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  description text,
  cover_url text,
  gallery text[] NOT NULL DEFAULT '{}',
  season text,
  is_new boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX collections_brand_idx ON public.collections(brand_id);

-- ===== Products (vêtements) =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL,
  description text,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('tops','outerwear','bottoms','shoes','accessories')),
  price integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  material text,
  reference text,
  main_image text,
  images text[] NOT NULL DEFAULT '{}',
  status public.content_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_brand_idx ON public.products(brand_id);
CREATE INDEX products_collection_idx ON public.products(collection_id);

CREATE OR REPLACE FUNCTION public.check_product_collection_brand()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.collections c WHERE c.id = NEW.collection_id AND c.brand_id = NEW.brand_id) THEN
    RAISE EXCEPTION 'La collection choisie n''appartient pas à la marque de ce vêtement.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER products_collection_brand BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_product_collection_brand();

-- A collection cannot change brand while it still holds garments of the old brand.
CREATE OR REPLACE FUNCTION public.check_collection_brand_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.brand_id <> OLD.brand_id AND EXISTS (SELECT 1 FROM public.products p WHERE p.collection_id = NEW.id) THEN
    RAISE EXCEPTION 'Cette collection contient des vêtements : impossible de changer sa marque.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER collections_brand_change BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.check_collection_brand_change();

-- ===== Models (mannequins) =====
CREATE TABLE public.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  reference text,
  description text,
  image_url text NOT NULL,
  image_width integer,
  image_height integer,
  foot numeric NOT NULL DEFAULT 0.05 CHECK (foot >= 0 AND foot <= 0.3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Looks =====
CREATE TABLE public.looks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL,
  description text,
  model_id uuid REFERENCES public.models(id) ON DELETE SET NULL,
  cover_url text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.look_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  look_id uuid NOT NULL REFERENCES public.looks(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  x numeric NOT NULL DEFAULT 50 CHECK (x >= 0 AND x <= 100),
  y numeric NOT NULL DEFAULT 50 CHECK (y >= 0 AND y <= 100),
  position integer NOT NULL DEFAULT 0,
  UNIQUE (look_id, product_id)
);
CREATE INDEX look_items_look_idx ON public.look_items(look_id);

-- ===== Articles =====
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL,
  subtitle text,
  cover_url text,
  gallery text[] NOT NULL DEFAULT '{}',
  content text NOT NULL DEFAULT '',
  author text,
  category text,
  published_at timestamptz,
  status public.content_status NOT NULL DEFAULT 'draft',
  brand_ids uuid[] NOT NULL DEFAULT '{}',
  collection_ids uuid[] NOT NULL DEFAULT '{}',
  product_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Home page editorial slots =====
CREATE TABLE public.home_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_title text,
  hero_subtitle text,
  featured_brand_ids uuid[] NOT NULL DEFAULT '{}',
  featured_collection_ids uuid[] NOT NULL DEFAULT '{}',
  featured_article_ids uuid[] NOT NULL DEFAULT '{}',
  featured_look_ids uuid[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.home_settings (id) VALUES (1);

-- ===== Media library =====
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  url text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
  size_bytes integer NOT NULL,
  width integer,
  height integer,
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('model','product','brand','collection','look','article','other')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== updated_at triggers =====
CREATE TRIGGER brands_touch BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER collections_touch BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER models_touch BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER looks_touch BEFORE UPDATE ON public.looks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER articles_touch BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER home_settings_touch BEFORE UPDATE ON public.home_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Grants =====
GRANT SELECT ON public.brands, public.collections, public.products, public.models, public.looks, public.look_items, public.articles, public.home_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands, public.collections, public.products, public.models, public.looks, public.look_items, public.articles, public.home_settings, public.media TO authenticated;
GRANT ALL ON public.brands, public.collections, public.products, public.models, public.looks, public.look_items, public.articles, public.home_settings, public.media TO service_role;

-- ===== RLS =====
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.looks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.look_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Public reads: published content only
CREATE POLICY "Public reads published brands" ON public.brands FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Public reads published collections" ON public.collections FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Public reads published products" ON public.products FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Public reads published looks" ON public.looks FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Public reads items of published looks" ON public.look_items FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.looks l WHERE l.id = look_id AND l.status = 'published'));
CREATE POLICY "Public reads models of published looks" ON public.models FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.looks l WHERE l.model_id = models.id AND l.status = 'published'));
CREATE POLICY "Public reads published articles" ON public.articles FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Public reads home settings" ON public.home_settings FOR SELECT TO anon, authenticated USING (true);

-- Admin: full control
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage collections" ON public.collections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage models" ON public.models FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage looks" ON public.looks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage look items" ON public.look_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage articles" ON public.articles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update home settings" ON public.home_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage media" ON public.media FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
