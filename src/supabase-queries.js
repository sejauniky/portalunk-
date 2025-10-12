// Exemplos mínimos para usar com @supabase/supabase-js

// Exemplo: buscar events usando a VIEW events_with_djs (retorna event_djs já embutido como JSONB)
export async function fetchEventsWithDJs(supabaseClient) {
  // supabaseClient é o resultado de createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data, error } = await supabaseClient
    .from('events_with_djs') // view criada pela migration
    .select('*')
    .order('event_date', { ascending: false });

  return { data, error };
}

// Se preferir consultar a tabela events diretamente com relações nativas,
// simplifique e teste o select incrementalmente. Exemplo seguro:
// 1) testar .select('*') -> se OK, então:
// 2) adicionar relação existente, por exemplo: .select('*, event_djs(*)')
// Ajuste conforme nomes de relacionamento do seu schema.
export async function fetchEventsSimple(supabaseClient) {
  const { data, error } = await supabaseClient
    .from('events')
    .select('*') // comece simples e vá adicionando campos
    .order('event_date', { ascending: false });
  return { data, error };
}