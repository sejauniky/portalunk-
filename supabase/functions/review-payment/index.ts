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

    // Check profile role
    const { data: profile, error: profileErr } = await supabaseAdmin.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
    if (profileErr) {
      console.error('[review-payment] profile fetch error', profileErr);
      return new Response(JSON.stringify({ error: 'Failed to validate user' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { eventId, action, reason } = body;
    if (!eventId || !action) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (!['accept', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'accept') {
      const updates = { payment_status: 'pago', payment_verified_by: user.id, payment_verified_at: new Date().toISOString() } as any;
      const { data: updated, error: updateErr } = await supabaseAdmin.from('events').update(updates).eq('id', eventId).select().maybeSingle();
      if (updateErr) {
        console.error('[review-payment] accept update error', updateErr);
        return new Response(JSON.stringify({ error: 'Failed to update event' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, event: updated }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  // reject -> revert to 'pendente' (existing enum) and store rejection reason
  const updates = { payment_status: 'pendente', payment_rejection_reason: reason ?? null, payment_verified_by: user.id, payment_verified_at: new Date().toISOString() } as any;
    const { data: updated, error: updateErr } = await supabaseAdmin.from('events').update(updates).eq('id', eventId).select().maybeSingle();
    if (updateErr) {
      console.error('[review-payment] reject update error', updateErr);
      return new Response(JSON.stringify({ error: 'Failed to update event' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, event: updated }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[review-payment] Unexpected error', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
