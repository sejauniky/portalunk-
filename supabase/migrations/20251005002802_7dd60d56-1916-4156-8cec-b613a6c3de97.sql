-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  cnpj text,
  address text,
  phone text,
  email text,
  avatar_url text,
  bank_name text,
  bank_agency text,
  bank_account text,
  bank_account_type text,
  pix_key text,
  contract_template text,
  payment_instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "admin_full_access_company_settings" 
ON public.company_settings 
FOR ALL 
USING (public.get_user_role() = 'admin');

CREATE POLICY "producer_can_select_company_settings" 
ON public.company_settings 
FOR SELECT 
USING (public.get_user_role() IN ('admin', 'producer'));

-- Create trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();