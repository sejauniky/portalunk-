import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateShareRequest {
  djId: string;
  days: number;
  pin?: string; // optional 4-digit pin
}

const sha256 = async (text: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false } 
      }
    );

    // Get authenticated user (use bearer token explicitly)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Confirm role = producer (profile role stored in profiles table)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'producer') {
      return new Response(JSON.stringify({ error: 'Producer access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: CreateShareRequest = await req.json();
    const { djId, days, pin } = body;
    if (!djId || !days || days < 1 || days > 7) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // pin validation or generation
    let finalPin = pin;
    if (!finalPin) {
      finalPin = Math.floor(1000 + Math.random() * 9000).toString();
    }
    if (!/^[0-9]{4}$/.test(finalPin)) {
      return new Response(JSON.stringify({ error: 'PIN must be 4 digits' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const pinHash = await sha256(finalPin);
    const shareToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const { error: insertError } = await supabaseAdmin.from('shared_media_links').insert({
      dj_id: djId,
      producer_id: user.id,
      share_token: shareToken,
      password_hash: pinHash,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error('create-share-link insert error', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create share link' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ share_token: shareToken, pin: finalPin, expires_at: expiresAt.toISOString() }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[create-share-link] Unexpected error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
