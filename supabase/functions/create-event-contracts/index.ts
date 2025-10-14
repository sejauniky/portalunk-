import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { eventId, djIds, contractType, producerId } = await req.json();

    console.log('Creating contracts for event:', eventId, 'DJs:', djIds, 'Type:', contractType);

    if (!eventId || !djIds || djIds.length === 0) {
      throw new Error('Event ID and DJ IDs are required');
    }

    // Buscar dados do evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_name, event_date, location, city, cache_value, commission_rate')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    // Buscar um template de contrato válido
    const { data: contractTemplate, error: templateError } = await supabase
      .from('contract_templates')
      .select('id, template_content, name')
      .eq('type', contractType || 'basic')
      .eq('is_default', true)
      .single();

    // Se não encontrar template padrão, buscar qualquer template do tipo
    let template = contractTemplate?.template_content;
    let templateId = contractTemplate?.id;

    if (!template) {
      const { data: anyTemplate } = await supabase
        .from('contract_templates')
        .select('id, template_content, name')
        .eq('type', contractType || 'basic')
        .limit(1)
        .single();
      
      template = anyTemplate?.template_content;
      templateId = anyTemplate?.id;
    }

    // Buscar dados da empresa para fallback
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select(`contract_basic, contract_intermediate, contract_premium, company_name`)
      .single();

    // Fallback para company_settings se não houver templates
    if (!template) {
      if (settingsError) throw settingsError;

      const templateKey = `contract_${contractType || 'basic'}` as 'contract_basic' | 'contract_intermediate' | 'contract_premium';
      template = settings[templateKey] || settings.contract_basic;
      templateId = null; // Não há template_id para company_settings
    }

    if (!template) {
      throw new Error('Contract template not found');
    }

    // Buscar dados do produtor
    const { data: producer, error: producerError } = await supabase
      .from('producers')
      .select('name, company_name, email')
      .eq('id', producerId)
      .single();

    if (producerError) throw producerError;

    const producerName = producer?.company_name || producer?.name || producer?.email || 'Produtor';

    // Criar um contrato para cada DJ
    const contracts = [];
    for (const djId of djIds) {
      // Buscar dados do DJ
      const { data: dj, error: djError } = await supabase
        .from('djs')
        .select('artist_name, real_name')
        .eq('id', djId)
        .single();

      if (djError) {
        console.error('Error fetching DJ:', djError);
        continue;
      }

      const djName = dj?.artist_name || dj?.real_name || 'DJ';

      // Buscar fee específico do DJ para este evento
      const { data: eventDj } = await supabase
        .from('event_djs')
        .select('fee')
        .eq('event_id', eventId)
        .eq('dj_id', djId)
        .maybeSingle();

      const djFee = eventDj?.fee || (event.cache_value / djIds.length);

      // Preencher template
      let contractContent = template;
      
      // Formatar data do evento sem horário (apenas data)
      let eventDateFormatted = '';
      if (event.event_date) {
        // Extrair apenas a parte da data (YYYY-MM-DD) ignorando qualquer informação de hora/timezone
        const dateOnly = event.event_date.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        eventDateFormatted = `${day}/${month}/${year}`;
      }
      
      // Formatar data de hoje sem horário
      const today = new Date();
      const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      const variables: Record<string, string> = {
        '{{eventName}}': event.event_name || '',
        '{{eventDate}}': eventDateFormatted || '',
        '{{location}}': event.location || '',
        '{{city}}': event.city || '',
        '{{cacheValue}}': djFee?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
        '{{djName}}': djName,
        '{{producerName}}': producerName,
        '{{companyName}}': settings?.company_name || producerName,
        '{{commissionRate}}': event.commission_rate?.toString() || '20',
        '{{today}}': todayFormatted,
      };

      Object.entries(variables).forEach(([key, value]) => {
        contractContent = contractContent.replace(new RegExp(key, 'g'), value);
      });

      // Criar contract_instance
      const { data: contract, error: contractError } = await supabase
        .from('contract_instances')
        .insert({
          event_id: eventId,
          dj_id: djId,
          producer_id: producerId,
          template_id: templateId, // UUID válido ou null
          contract_content: contractContent,
          contract_value: djFee,
          signature_status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (contractError) {
        console.error('Error creating contract:', contractError);
        continue;
      }

      contracts.push(contract);
    }

    return new Response(
      JSON.stringify({ success: true, contracts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error creating contracts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
