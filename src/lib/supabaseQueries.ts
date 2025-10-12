// Queries otimizadas para o Supabase com joins simplificados
export const queries = {
  events: `
    *,
    dj:djs!inner (
      id,
      name,
      artist_name,
      email
    ),
    producer:producers!inner (
      id,
      name,
      company_name,
      email,
      profile_id
    )
  `,

  contracts: `
    *,
    dj:djs!inner (
      id,
      name,
      artist_name,
      email
    ),
    producer:producers!inner (
      id,
      name,
      company_name,
      email,
      profile_id
    ),
    event:events!inner (
      id,
      title,
      event_date,
      location
    )
  `
};