/*
  # Complete Database Schema Setup
  
  1. Enum Types
    - user_role: admin, producer
    - dj_status: available, busy, unavailable
    - event_status: planned, confirmed, completed, cancelled
    - eventdj_status: confirmed, pending
    - contract_type: standard, premium, exclusive
    - contract_status: pending, signed, rejected
    - payment_status: pending, sent, paid, overdue
    - media_category: presskit, logo, backdrop, performance, other
    
  2. Tables
    - profiles: User profile information
    - djs: DJ information and contact details
    - producers: Producer/company information
    - events: Event management
    - event_djs: Many-to-many relationship between events and DJs
    - contracts: Contract management
    - payments: Payment tracking
    - media_files: DJ media files
    - share_tokens: Sharing tokens for DJ media
    - company_settings: Company configuration
    
  3. Security
    - Enable RLS on all tables
    - Create policies for admin and producer access
    - Create helper functions for role checking
    
  4. Storage
    - Create buckets for media files
    - Set up storage policies
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'producer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dj_status AS ENUM ('available', 'busy', 'unavailable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('planned', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.eventdj_status AS ENUM ('confirmed', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contract_type AS ENUM ('standard', 'premium', 'exclusive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contract_status AS ENUM ('pending', 'signed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'sent', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.media_category AS ENUM ('presskit', 'logo', 'backdrop', 'performance', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  role public.user_role NOT NULL DEFAULT 'producer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create DJs table
CREATE TABLE IF NOT EXISTS public.djs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  base_price TEXT NOT NULL,
  soundcloud_url TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  avatar TEXT,
  status public.dj_status NOT NULL DEFAULT 'available',
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create producers table
CREATE TABLE IF NOT EXISTS public.producers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  cnpj TEXT,
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TEXT,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  status public.event_status NOT NULL DEFAULT 'planned',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  producer_id UUID REFERENCES public.producers(id),
  dj_id UUID REFERENCES public.djs(id),
  cache_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  total_amount TEXT,
  expected_attendance INTEGER,
  contract_id UUID,
  requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_djs table
CREATE TABLE IF NOT EXISTS public.event_djs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dj_id UUID NOT NULL REFERENCES public.djs(id) ON DELETE CASCADE,
  fee TEXT NOT NULL,
  status public.eventdj_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, dj_id)
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES public.producers(id),
  dj_id UUID NOT NULL REFERENCES public.djs(id),
  contract_type public.contract_type NOT NULL DEFAULT 'standard',
  content TEXT NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dj_id UUID NOT NULL REFERENCES public.djs(id),
  producer_id UUID NOT NULL REFERENCES public.producers(id),
  amount TEXT NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media_files table
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id UUID NOT NULL REFERENCES public.djs(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category public.media_category NOT NULL DEFAULT 'other',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create share_tokens table
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  dj_id UUID NOT NULL REFERENCES public.djs(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  cep TEXT,
  phone TEXT,
  email TEXT,
  logo TEXT,
  avatar_url TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  pix_key TEXT,
  contract_template TEXT,
  payment_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('dj-presskit', 'dj-presskit', false),
  ('dj-logos', 'dj-logos', false),
  ('dj-backdrops', 'dj-backdrops', false),
  ('dj-videos', 'dj-videos', false),
  ('dj-media', 'dj-media', true),
  ('avatars', 'avatars', false),
  ('receipts', 'receipts', false),
  ('company-avatars', 'company-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
  CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_djs_updated_at ON public.djs;
  CREATE TRIGGER update_djs_updated_at
    BEFORE UPDATE ON public.djs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_producers_updated_at ON public.producers;
  CREATE TRIGGER update_producers_updated_at
    BEFORE UPDATE ON public.producers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
  CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
  CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
  CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_company_settings_updated_at ON public.company_settings;
  CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'producer')
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profiles
DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
END $$;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.djs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_djs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Function to check if user is producer
CREATE OR REPLACE FUNCTION public.is_producer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.producers
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Function to get producer_id for current user
CREATE OR REPLACE FUNCTION public.get_producer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.producers
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_can_insert_profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());
  
CREATE POLICY "admin_can_insert_profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'::user_role
    )
  );

-- RLS Policies for DJs
DROP POLICY IF EXISTS "Admins can manage DJs" ON public.djs;
DROP POLICY IF EXISTS "Producers can view DJs" ON public.djs;
DROP POLICY IF EXISTS "admin_full_access_djs" ON public.djs;
DROP POLICY IF EXISTS "producer_and_admin_can_select_djs" ON public.djs;

CREATE POLICY "admin_full_access_djs" 
  ON public.djs FOR ALL 
  USING (public.get_user_role() = 'admin');

CREATE POLICY "producer_and_admin_can_select_djs" 
  ON public.djs FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'producer'));

-- RLS Policies for producers
DROP POLICY IF EXISTS "Admins can manage producers" ON public.producers;
DROP POLICY IF EXISTS "Producers can view their own data" ON public.producers;
DROP POLICY IF EXISTS "Producers can update their own data" ON public.producers;

CREATE POLICY "Admins can manage producers"
  ON public.producers FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can view their own data"
  ON public.producers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Producers can update their own data"
  ON public.producers FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for events
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Producers can view their events" ON public.events;
DROP POLICY IF EXISTS "admin_full_access_events" ON public.events;
DROP POLICY IF EXISTS "producer_and_admin_can_select_events" ON public.events;

CREATE POLICY "admin_full_access_events" 
  ON public.events FOR ALL 
  USING (public.get_user_role() = 'admin');

CREATE POLICY "producer_and_admin_can_select_events" 
  ON public.events FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'producer'));

-- RLS Policies for event_djs
DROP POLICY IF EXISTS "Admins can manage event_djs" ON public.event_djs;
DROP POLICY IF EXISTS "Producers can view their event_djs" ON public.event_djs;
DROP POLICY IF EXISTS "admin_full_access_event_djs" ON public.event_djs;
DROP POLICY IF EXISTS "producer_and_admin_can_select_event_djs" ON public.event_djs;

CREATE POLICY "admin_full_access_event_djs" 
  ON public.event_djs FOR ALL 
  USING (public.get_user_role() = 'admin');

CREATE POLICY "producer_and_admin_can_select_event_djs" 
  ON public.event_djs FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'producer'));

-- RLS Policies for contracts
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;
DROP POLICY IF EXISTS "Producers can view their contracts" ON public.contracts;
DROP POLICY IF EXISTS "Producers can update their contracts" ON public.contracts;

CREATE POLICY "Admins can manage contracts"
  ON public.contracts FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can view their contracts"
  ON public.contracts FOR SELECT
  USING (producer_id = public.get_producer_id());

CREATE POLICY "Producers can update their contracts"
  ON public.contracts FOR UPDATE
  USING (producer_id = public.get_producer_id());

-- RLS Policies for payments
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Producers can view their payments" ON public.payments;
DROP POLICY IF EXISTS "Producers can update their payments" ON public.payments;

CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can view their payments"
  ON public.payments FOR SELECT
  USING (producer_id = public.get_producer_id());

CREATE POLICY "Producers can update their payments"
  ON public.payments FOR UPDATE
  USING (producer_id = public.get_producer_id());

-- RLS Policies for media_files
DROP POLICY IF EXISTS "Admins can manage media_files" ON public.media_files;
DROP POLICY IF EXISTS "Producers can view media from contracted DJs" ON public.media_files;

CREATE POLICY "Admins can manage media_files"
  ON public.media_files FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can view media from contracted DJs"
  ON public.media_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_djs ed
      JOIN public.events e ON e.id = ed.event_id
      WHERE ed.dj_id = media_files.dj_id
      AND e.producer_id = public.get_producer_id()
    )
  );

-- RLS Policies for share_tokens
DROP POLICY IF EXISTS "Admins can manage share_tokens" ON public.share_tokens;
DROP POLICY IF EXISTS "Producers can manage their share_tokens" ON public.share_tokens;

CREATE POLICY "Admins can manage share_tokens"
  ON public.share_tokens FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can manage their share_tokens"
  ON public.share_tokens FOR ALL
  USING (producer_id = public.get_producer_id());

-- RLS Policies for company_settings
DROP POLICY IF EXISTS "Admins can manage company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "admin_full_access_company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "producer_can_select_company_settings" ON public.company_settings;

CREATE POLICY "admin_full_access_company_settings" 
  ON public.company_settings FOR ALL 
  USING (public.get_user_role() = 'admin');

CREATE POLICY "producer_can_select_company_settings" 
  ON public.company_settings FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'producer'));

-- Storage policies for dj-media bucket
CREATE POLICY "Public can view dj media" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'dj-media');

CREATE POLICY "Admin can upload dj media" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'dj-media' AND public.get_user_role() = 'admin');

CREATE POLICY "Admin can update dj media" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'dj-media' AND public.get_user_role() = 'admin');

CREATE POLICY "Admin can delete dj media" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'dj-media' AND public.get_user_role() = 'admin');

-- Storage policies for company-avatars bucket
CREATE POLICY "Public can view company avatars" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'company-avatars');

CREATE POLICY "Admin can upload company avatars" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'company-avatars' AND public.get_user_role() = 'admin');

CREATE POLICY "Admin can update company avatars" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'company-avatars' AND public.get_user_role() = 'admin');

CREATE POLICY "Admin can delete company avatars" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'company-avatars' AND public.get_user_role() = 'admin');