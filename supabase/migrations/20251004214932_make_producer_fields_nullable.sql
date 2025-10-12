-- Make some producer fields nullable since they may not be required during creation
ALTER TABLE public.producers ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE public.producers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.producers ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.producers ALTER COLUMN cnpj DROP NOT NULL;