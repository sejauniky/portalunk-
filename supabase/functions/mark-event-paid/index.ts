import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { eventId, receipt_url } = body;
    if (!eventId || !receipt_url) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Verify ownership
    const { data: event, error: evErr } = await supabaseAdmin.from('events').select('id, producer_id').eq('id', eventId).maybeSingle();
    if (evErr) {
      console.error('[mark-event-paid] fetch event error', evErr);
      return new Response(JSON.stringify({ error: 'Failed to fetch event' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!event) return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (String(event.producer_id) !== String(user.id)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // mark as 'pagamento_enviado' so admin can review and then confirm 'pago'
    const updates = { payment_status: 'pagamento_enviado', payment_proof: receipt_url, payment_received_at: new Date().toISOString() } as any;
    const { data: updated, error: updateErr } = await supabaseAdmin.from('events').update(updates).eq('id', eventId).select().maybeSingle();
    if (updateErr) {
      console.error('[mark-event-paid] update error', updateErr);
      return new Response(JSON.stringify({ error: 'Failed to update event' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, event: updated }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[mark-event-paid] Unexpected', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
