-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'producer');
CREATE TYPE public.dj_status AS ENUM ('available', 'busy', 'unavailable');
CREATE TYPE public.event_status AS ENUM ('planned', 'confirmed', 'completed', 'cancelled');
CREATE TYPE public.eventdj_status AS ENUM ('confirmed', 'pending');
CREATE TYPE public.contract_type AS ENUM ('standard', 'premium', 'exclusive');
CREATE TYPE public.contract_status AS ENUM ('pending', 'signed', 'rejected');
CREATE TYPE public.payment_status AS ENUM ('pending', 'sent', 'paid', 'overdue');
CREATE TYPE public.media_category AS ENUM ('presskit', 'logo', 'backdrop', 'performance', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create DJs table
CREATE TABLE public.djs (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create producers table
CREATE TABLE public.producers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  status public.event_status NOT NULL DEFAULT 'planned',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  producer_id UUID REFERENCES public.producers(id),
  total_amount TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_djs table (many-to-many relationship)
CREATE TABLE public.event_djs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dj_id UUID NOT NULL REFERENCES public.djs(id) ON DELETE CASCADE,
  fee TEXT NOT NULL,
  status public.eventdj_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, dj_id)
);

-- Create contracts table
CREATE TABLE public.contracts (
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
CREATE TABLE public.payments (
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
CREATE TABLE public.media_files (
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
CREATE TABLE public.share_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  dj_id UUID NOT NULL REFERENCES public.djs(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  cep TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('dj-presskit', 'dj-presskit', false),
  ('dj-logos', 'dj-logos', false),
  ('dj-backdrops', 'dj-backdrops', false),
  ('dj-videos', 'dj-videos', false),
  ('avatars', 'avatars', false),
  ('receipts', 'receipts', false);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_djs_updated_at
  BEFORE UPDATE ON public.djs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_producers_updated_at
  BEFORE UPDATE ON public.producers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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
    WHERE user_id = auth.uid()
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
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for DJs (Admins can do everything, producers can only view)
CREATE POLICY "Admins can manage DJs"
  ON public.djs FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can view DJs"
  ON public.djs FOR SELECT
  USING (public.is_producer());

-- RLS Policies for producers (Admins can manage, producers can view their own)
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
CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can view their events"
  ON public.events FOR SELECT
  USING (producer_id = public.get_producer_id());

-- RLS Policies for event_djs
CREATE POLICY "Admins can manage event_djs"
  ON public.event_djs FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can view their event_djs"
  ON public.event_djs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_djs.event_id
      AND events.producer_id = public.get_producer_id()
    )
  );

-- RLS Policies for contracts
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
CREATE POLICY "Admins can manage share_tokens"
  ON public.share_tokens FOR ALL
  USING (public.is_admin());

CREATE POLICY "Producers can manage their share_tokens"
  ON public.share_tokens FOR ALL
  USING (producer_id = public.get_producer_id());

-- RLS Policies for company_settings (Admin only)
CREATE POLICY "Admins can manage company_settings"
  ON public.company_settings FOR ALL
  USING (public.is_admin());

-- Storage policies for dj-presskit bucket
CREATE POLICY "Admins can upload to dj-presskit"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dj-presskit' AND public.is_admin());

CREATE POLICY "Admins can view dj-presskit"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dj-presskit' AND public.is_admin());

CREATE POLICY "Producers can view dj-presskit from contracted DJs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dj-presskit' AND
    EXISTS (
      SELECT 1 FROM public.event_djs ed
      JOIN public.events e ON e.id = ed.event_id
      JOIN public.djs d ON d.id = ed.dj_id
      WHERE e.producer_id = public.get_producer_id()
      AND (storage.foldername(name))[1] = d.id::text
    )
  );

-- Storage policies for dj-logos bucket
CREATE POLICY "Admins can upload to dj-logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dj-logos' AND public.is_admin());

CREATE POLICY "Admins can view dj-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dj-logos' AND public.is_admin());

CREATE POLICY "Producers can view dj-logos from contracted DJs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dj-logos' AND
    EXISTS (
      SELECT 1 FROM public.event_djs ed
      JOIN public.events e ON e.id = ed.event_id
      JOIN public.djs d ON d.id = ed.dj_id
      WHERE e.producer_id = public.get_producer_id()
      AND (storage.foldername(name))[1] = d.id::text
    )
  );

-- Storage policies for dj-backdrops bucket
CREATE POLICY "Admins can upload to dj-backdrops"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dj-backdrops' AND public.is_admin());

CREATE POLICY "Admins can view dj-backdrops"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dj-backdrops' AND public.is_admin());

CREATE POLICY "Producers can view dj-backdrops from contracted DJs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dj-backdrops' AND
    EXISTS (
      SELECT 1 FROM public.event_djs ed
      JOIN public.events e ON e.id = ed.event_id
      JOIN public.djs d ON d.id = ed.dj_id
      WHERE e.producer_id = public.get_producer_id()
      AND (storage.foldername(name))[1] = d.id::text
    )
  );

-- Storage policies for dj-videos bucket
CREATE POLICY "Admins can upload to dj-videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dj-videos' AND public.is_admin());

CREATE POLICY "Admins can view dj-videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dj-videos' AND public.is_admin());

CREATE POLICY "Producers can view dj-videos from contracted DJs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dj-videos' AND
    EXISTS (
      SELECT 1 FROM public.event_djs ed
      JOIN public.events e ON e.id = ed.event_id
      JOIN public.djs d ON d.id = ed.dj_id
      WHERE e.producer_id = public.get_producer_id()
      AND (storage.foldername(name))[1] = d.id::text
    )
  );

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND public.is_admin());

-- Storage policies for receipts bucket
CREATE POLICY "Producers can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND public.is_producer());

CREATE POLICY "Admins can view all receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY "Producers can view their receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM public.producers p
      WHERE p.user_id = auth.uid()
      AND (storage.foldername(name))[1] = p.id::text
    )
  );