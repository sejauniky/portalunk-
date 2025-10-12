-- Create missing storage buckets for DJs and company avatars
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('dj-media', 'dj-media', true),
  ('company-avatars', 'company-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for dj-media bucket
CREATE POLICY "Public can view dj media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'dj-media');

CREATE POLICY "Admin can upload dj media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'dj-media' AND public.get_user_role() = 'admin');

CREATE POLICY "Admin can update dj media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'dj-media' AND public.get_user_role() = 'admin');

CREATE POLICY "Admin can delete dj media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'dj-media' AND public.get_user_role() = 'admin');

-- Create storage policies for company-avatars bucket
CREATE POLICY "Public can view company avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-avatars');

CREATE POLICY "Admin can upload company avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-avatars' AND public.get_user_role() = 'admin');

CREATE POLICY "Admin can update company avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-avatars' AND public.get_user_role() = 'admin');

CREATE POLICY "Admin can delete company avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-avatars' AND public.get_user_role() = 'admin');