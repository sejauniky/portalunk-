-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'producer';

-- Update the is_admin function to properly check the role
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

-- Update the handle_new_user function to set default role
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

-- Set the existing user as admin (camilla@conexaounk.com)
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'camilla@conexaounk.com'
);

-- If no profile exists yet, create it
INSERT INTO public.profiles (user_id, name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data ->> 'name', email) as name,
  'admin'::public.user_role as role
FROM auth.users 
WHERE email = 'camilla@conexaounk.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = auth.users.id
);