import { supabase } from '@/lib/supabase';
import { formatError } from '../lib/errorUtils';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type PaymentRow = Tables<'payments'>;
type EventRow = Tables<'events'>;
type DJRow = Tables<'djs'>;
type ProducerRow = Tables<'producers'>;
type ContractRow = Tables<'contracts'>;
type EventDJRow = Tables<'event_djs'>;

export type EnrichedPayment = PaymentRow & {
  event?: (EventRow & {
    dj?: DJRow | null;
    producer?: ProducerRow | null;
    event_djs?: (EventDJRow & { dj?: DJRow | null })[] | null;
  }) | null;
  contract?: ContractRow | null;
};

// Defensive sanitizer to map Supabase nested select errors into nulls so the shape
// matches EnrichedPayment and we can safely return typed arrays.
function sanitizePayments(raw: any[] | null | undefined): EnrichedPayment[] {
  if (!raw || raw.length === 0) return [];
  return raw.map((item: any) => {
    const p: any = { ...item };
    if (p.event && typeof p.event === 'object') {
      if ((p.event as any).error) {
        p.event = null;
      } else {
        if (Array.isArray(p.event.event_djs)) {
          p.event.event_djs = p.event.event_djs.map((ed: any) => {
            if (ed && ed.dj && (ed.dj as any).error) ed.dj = null;
            return ed;
          });
        }
        if (p.event.dj && (p.event.dj as any).error) p.event.dj = null;
        if (p.event.producer && (p.event.producer as any).error) p.event.producer = null;
      }
    }
    if (p.contract && (p.contract as any).error) p.contract = null;
    return p as EnrichedPayment;
  });
}

export interface PaymentServiceInterface {
  __serviceName?: string;
  getAll(): Promise<EnrichedPayment[]>;
  getByDJ(djId: string): Promise<EnrichedPayment[]>;
  getByProducer(producerId: string): Promise<EnrichedPayment[]>;
  update(id: string, updates: Partial<TablesUpdate<'payments'>>): Promise<{ data: PaymentRow | null; error: any }>;
  confirmPayment(id: string, data: any): Promise<{ data: PaymentRow | null; error: any }>;
  delete(id: string): Promise<{ success?: boolean; error?: any }>;
  [key: string]: any;
}

export const paymentService: PaymentServiceInterface = {
  __serviceName: 'paymentService',
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          payments.*,
          event:events (
            id,
            event_name,
            event_date,
            fee,
            dj_id,
            producer_id,
            address,
            city,
            venue,
            start_time,
            end_time,
            description,
            payment_status,
            updated_at,
            dj:djs (id, artist_name, profile_id, avatar_url, real_name),
            producer:producers (id, name, company_name, email, avatar_url),
            event_djs (id, dj_id, event_id, fee, created_at, dj:djs (id, artist_name, profile_id, avatar_url, real_name))
          ),
          contract:contracts (id, commission_amount, commission_rate, contract_number, fee, dj_id, producer_id, created_at, updated_at)
        `)
        .order('created_at', { ascending: false });

  if (error) throw error;
  return sanitizePayments(data);
    } catch (error) {
      // If PostgREST relationship metadata is missing, assemble manually
      try {
        const { data: payments, error: e2 } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
        if (e2) throw e2;
        if (!payments || payments.length === 0) return [];

        const eventIds = Array.from(new Set((payments as any[]).map((p) => p.event_id).filter(Boolean)));

  const { data: events } = eventIds.length ? await supabase.from('events').select('*').in('id', eventIds.map(String) as string[]) : { data: [] } as any;

        const djIds = Array.from(new Set([...(events || []).map((ev: any) => ev.dj_id).filter(Boolean)]));
        const producerIds = Array.from(new Set([...(events || []).map((ev: any) => ev.producer_id).filter(Boolean)]));

  const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds.map(String) as string[]) : { data: [] } as any;
  const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds.map(String) as string[]) : { data: [] } as any;
        const producerProfileIds = (producers || []).map((p: any) => p.profile_id).filter(Boolean);
  const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds.map(String) as string[]) : { data: [] } as any;

  const { data: eventDjs } = eventIds.length ? await supabase.from('event_djs').select('*').in('event_id', eventIds.map(String) as string[]) : { data: [] } as any;
  const extraDjIds = Array.from(new Set((eventDjs || []).map((ed: any) => ed.dj_id).filter(Boolean)));
  const { data: extraDjs } = extraDjIds.length ? await supabase.from('djs').select('*').in('id', extraDjIds.map(String) as string[]) : { data: [] } as any;

        const eventsMap = (events || []).reduce((acc: Record<string, any>, ev: any) => {
          const dj = (djs || []).find((d: any) => d.id === ev.dj_id) || null;
          const producerRaw = (producers || []).find((p: any) => p.id === ev.producer_id) || null;
          const producer = producerRaw ? { ...producerRaw, profile: (profiles || []).find((pr: any) => pr.id === producerRaw.profile_id) || null } : null;
          const eds = (eventDjs || []).filter((ed: any) => ed.event_id === ev.id).map((ed: any) => ({ ...ed, dj: (extraDjs || []).find((d: any) => d.id === ed.dj_id) || null }));
          acc[ev.id] = { ...ev, dj, producer, event_djs: eds };
          return acc;
        }, {} as Record<string, any>);

          const enriched = (payments || []).map((p: any) => ({ ...p, event: p.event_id ? eventsMap[p.event_id] || null : null }));
          return sanitizePayments(enriched);
      } catch (inner) {
        const msg = formatError(inner);
        const lower = (msg || '').toLowerCase();
        if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('typeerror')) {
          console.warn('Supabase network error detected while fetching payments; returning empty list.');
        } else {
          console.error('Error fetching payments (fallback):', msg);
        }
        return [];
      }
    }
  },

  // ...existing code...

  async getByDJ(djId: string): Promise<EnrichedPayment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          payments.*,
          event:events (
            id,
            event_name,
            event_date,
            fee,
            dj_id,
            producer_id,
            address,
            city,
            venue,
            start_time,
            end_time,
            description,
            payment_status,
            updated_at,
            dj:djs (id, artist_name, profile_id, avatar_url, real_name),
            producer:producers (id, name, company_name, email, avatar_url),
            event_djs (id, dj_id, event_id, fee, created_at, dj:djs (id, artist_name, profile_id, avatar_url, real_name))
          )
        `)
        .eq('event.dj_id', djId)
        .order('created_at', { ascending: false });

  if (error) throw error;
  return sanitizePayments(data);
    } catch (error) {
      try {
        const { data: primaryEvents } = await supabase.from('events').select('id').eq('dj_id', djId);
        const { data: linkedEventDjs } = await supabase.from('event_djs').select('event_id').eq('dj_id', djId);
        const eventIds = Array.from(new Set([...(primaryEvents || []).map((e: any) => e.id), ...(linkedEventDjs || []).map((ed: any) => ed.event_id)]));
        if (eventIds.length === 0) return [];
  const { data: payments } = await supabase.from('payments').select('*').in('event_id', eventIds.map(String) as string[]).order('created_at', { ascending: false });

        const eventIdsAll = Array.from(new Set((payments as any[]).map((p) => p.event_id).filter(Boolean)));
  const { data: events } = eventIdsAll.length ? await supabase.from('events').select('*').in('id', eventIdsAll.map(String) as string[]) : { data: [] } as any;
  const djIds = Array.from(new Set((events || []).map((ev: any) => ev.dj_id).filter(Boolean)));
  const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds.map(String) as string[]) : { data: [] } as any;
  const producerIds = Array.from(new Set((events || []).map((ev: any) => ev.producer_id).filter(Boolean)));
  const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds.map(String) as string[]) : { data: [] } as any;
  const producerProfileIds = (producers || []).map((p: any) => p.profile_id).filter(Boolean);
  const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds.map(String) as string[]) : { data: [] } as any;
  const { data: eventDjs } = eventIdsAll.length ? await supabase.from('event_djs').select('*').in('event_id', eventIdsAll.map(String) as string[]) : { data: [] } as any;
  const extraDjIds = Array.from(new Set((eventDjs || []).map((ed: any) => ed.dj_id).filter(Boolean)));
  const { data: extraDjs } = extraDjIds.length ? await supabase.from('djs').select('*').in('id', extraDjIds.map(String) as string[]) : { data: [] } as any;

        const eventsMap = (events || []).reduce((acc: Record<string, any>, ev: any) => {
          const dj = (djs || []).find((d: any) => d.id === ev.dj_id) || null;
          const producerRaw = (producers || []).find((p: any) => p.id === ev.producer_id) || null;
          const producer = producerRaw ? { ...producerRaw, profile: (profiles || []).find((pr: any) => pr.id === producerRaw.profile_id) || null } : null;
          const eds = (eventDjs || []).filter((ed: any) => ed.event_id === ev.id).map((ed: any) => ({ ...ed, dj: (extraDjs || []).find((d: any) => d.id === ed.dj_id) || null }));
          acc[ev.id] = { ...ev, dj, producer, event_djs: eds };
          return acc;
        }, {} as Record<string, any>);

  const enriched = (payments || []).map((p: any) => ({ ...p, event: p.event_id ? eventsMap[p.event_id] || null : null }));
  return sanitizePayments(enriched);
      } catch (inner) {
        const msg = formatError(inner);
        const lower = (msg || '').toLowerCase();
        if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('typeerror')) {
          console.warn('Supabase network error detected while fetching DJ payments; returning empty list.');
        } else {
          console.error('Error fetching DJ payments (fallback):', msg);
        }
        return [];
      }
    }
  },

  async getByProducer(producerId: string): Promise<EnrichedPayment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          payments.*,
          event:events (
            id,
            event_name,
            event_date,
            fee,
            dj_id,
            producer_id,
            address,
            city,
            venue,
            start_time,
            end_time,
            description,
            payment_status,
            updated_at,
            dj:djs (id, artist_name, profile_id, avatar_url, real_name),
            producer:producers (id, name, company_name, email, avatar_url),
            event_djs (id, dj_id, event_id, fee, created_at, dj:djs (id, artist_name, profile_id, avatar_url, real_name))
          )
        `)
        .eq('event.producer_id', producerId)
        .order('created_at', { ascending: false });

  if (error) throw error;
  return sanitizePayments(data);
    } catch (error) {
      try {
        const { data: events } = await supabase.from('events').select('id').eq('producer_id', producerId);
        const eventIds = (events || []).map((e: any) => e.id).filter(Boolean);
        if (eventIds.length === 0) return [];
  const { data: payments } = await supabase.from('payments').select('*').in('event_id', eventIds.map(String) as string[]).order('created_at', { ascending: false });

        const eventIdsAll = Array.from(new Set((payments as any[]).map((p) => p.event_id).filter(Boolean)));
  const { data: eventsFull } = eventIdsAll.length ? await supabase.from('events').select('*').in('id', eventIdsAll.map(String) as string[]) : { data: [] } as any;
  const djIds = Array.from(new Set((eventsFull || []).map((ev: any) => ev.dj_id).filter(Boolean)));
  const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds.map(String) as string[]) : { data: [] } as any;
  const producerIds = Array.from(new Set((eventsFull || []).map((ev: any) => ev.producer_id).filter(Boolean)));
  const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds.map(String) as string[]) : { data: [] } as any;
  const producerProfileIds = (producers || []).map((p: any) => p.profile_id).filter(Boolean);
  const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds.map(String) as string[]) : { data: [] } as any;
  const { data: eventDjs } = eventIdsAll.length ? await supabase.from('event_djs').select('*').in('event_id', eventIdsAll.map(String) as string[]) : { data: [] } as any;
  const extraDjIds = Array.from(new Set((eventDjs || []).map((ed: any) => ed.dj_id).filter(Boolean)));
  const { data: extraDjs } = extraDjIds.length ? await supabase.from('djs').select('*').in('id', extraDjIds.map(String) as string[]) : { data: [] } as any;

        const eventsMap = (eventsFull || []).reduce((acc: Record<string, any>, ev: any) => {
          const dj = (djs || []).find((d: any) => d.id === ev.dj_id) || null;
          const producerRaw = (producers || []).find((p: any) => p.id === ev.producer_id) || null;
          const producer = producerRaw ? { ...producerRaw, profile: (profiles || []).find((pr: any) => pr.id === producerRaw.profile_id) || null } : null;
          const eds = (eventDjs || []).filter((ed: any) => ed.event_id === ev.id).map((ed: any) => ({ ...ed, dj: (extraDjs || []).find((d: any) => d.id === ed.dj_id) || null }));
          acc[ev.id] = { ...ev, dj, producer, event_djs: eds };
          return acc;
        }, {} as Record<string, any>);

  const enriched = (payments || []).map((p: any) => ({ ...p, event: p.event_id ? eventsMap[p.event_id] || null : null }));
  return sanitizePayments(enriched);
      } catch (inner) {
        const msg = formatError(inner);
        const lower = (msg || '').toLowerCase();
        if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('typeerror')) {
          console.warn('Supabase network error detected while fetching producer payments; returning empty list.');
        } else {
          console.error('Error fetching producer payments (fallback):', msg);
        }
        return [];
      }
    }
  },

  async update(id: string, updates: Partial<PaymentRow>): Promise<{ data: PaymentRow | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as PaymentRow, error: null };
    } catch (error) {
      console.error('Error updating payment:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  async confirmPayment(id: string, data: any): Promise<{ data: PaymentRow | null; error: any }> {
    return this.update(id, {
      status: 'paid' as any,
      paid_at: data.paid_at || new Date().toISOString(),
      payment_method: data.payment_method,
      payment_proof_url: data.proofUrl || data.payment_proof_url
    } as Partial<PaymentRow>);
  },

  async delete(id: string): Promise<{ success?: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting payment:', formatError(error));
      return { error: (error && (error as any).message) || String(error) };
    }
  }
};

export default paymentService;
