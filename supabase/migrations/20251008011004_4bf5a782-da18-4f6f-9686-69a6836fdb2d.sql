-- Adicionar colunas de tipos de contrato na tabela company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS contract_basic TEXT,
ADD COLUMN IF NOT EXISTS contract_intermediate TEXT,
ADD COLUMN IF NOT EXISTS contract_premium TEXT;

-- Migrar dados existentes de contract_template para contract_basic
UPDATE public.company_settings 
SET contract_basic = contract_template 
WHERE contract_template IS NOT NULL AND contract_basic IS NULL;

-- Adicionar coluna contract_type na tabela events com valor padrão 'basic'
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'basic';

COMMENT ON COLUMN public.company_settings.contract_basic IS 'Template de contrato básico para eventos simples';
COMMENT ON COLUMN public.company_settings.contract_intermediate IS 'Template de contrato intermediário para eventos de médio porte';
COMMENT ON COLUMN public.company_settings.contract_premium IS 'Template de contrato premium para eventos de grande porte';
COMMENT ON COLUMN public.events.contract_type IS 'Tipo de contrato do evento: basic, intermediate ou premium';