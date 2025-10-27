import { formatError, AppError, ErrorKind, isNetworkError } from '../lib/errorUtils';
import {
  parseNumericValue,
  roundCurrencyValue,
  normalizeTimestamp,
  isPlainRecord,
  pickFirstString,
  normalizeDjIds,
  mergeDjIds,
  sanitizeEventRecord,
  prepareSanitizedEventRecord,
} from '@/lib/eventUtils';
import { paymentService } from './paymentService';
import { DJService } from './djService';
import { supabase, isSupabaseConfigured, SUPABASE_URL } from '@/lib/supabase';
import { Tables } from '@/integrations/supabase/types';

type EventRow = Tables<'events'>;
type PaymentRow = Tables<'payments'>;
type DJRow = Tables<'djs'>;
type ProducerRow = Tables<'producers'>;
type EventDJRow = Tables<'event_djs'>;

type EventPayload = Partial<EventRow> & Record<string, any>;
type FeeMap = Record<string, unknown>;
type ProducerRecord = Partial<ProducerRow> & Record<string, any>;

type EnrichedEvent = EventRow & {
  dj?: DJRow | null;
  producer?: ProducerRow | null;
  event_djs?: (EventDJRow & { dj?: DJRow | null })[] | null;
};

const createBaseEventColumnSet = (): Set<string> =>
  new Set([
    'event_name',
    'event_date',
    'dj_id',
    'producer_id',
    'status',
    'description',
    'venue',
    'location',
    'city',
    'state',
    'address',
    'fee',
    'cache_value',
    'commission_rate',
    'commission_amount',
    'expected_attendees',
    'start_time',
    'end_time',
    'special_requirements',
    'payment_status',
    'payment_proof',
    'shared_with_manager',
    'equipment_provided',
  ]);

let cachedEventColumns: Set<string> | null = null;

const getEventColumnSet = async (): Promise<Set<string>> => {
  if (cachedEventColumns) return new Set(cachedEventColumns);

  const baseColumns = createBaseEventColumnSet();

  if (!isSupabaseConfigured) {
    cachedEventColumns = baseColumns;
    return new Set(baseColumns);
  }

  try {
    const { data, error } = await supabase.from('events').select('*').limit(1).maybeSingle();
    if (error) {
      const msg = formatError(error);
      if (isNetworkError(msg)) {
        // network problems should bubble up as AppError
        throw new AppError('Erro de rede ao inspecionar colunas de evento', ErrorKind.Network, error);
      }
      // Non-network errors are logged but we continue with baseColumns
      console.warn('Unable to inspect event columns (db):', msg);
    } else if (data && typeof data === 'object') {
      Object.keys(data).forEach((key) => baseColumns.add(key));
    }
  } catch (err) {
    const msg = formatError(err);
    if (isNetworkError(msg)) {
      throw new AppError('Erro de rede ao carregar colunas de evento', ErrorKind.Network, err);
    }
    console.warn('Unable to inspect event columns:', msg);
  }

  cachedEventColumns = baseColumns;
  return new Set(baseColumns);
};

const updateEventColumnCache = (columns: Set<string>) => {
  cachedEventColumns = new Set(columns);
};

// Utilities (in lib/eventUtils.ts)

const extractUndefinedColumn = (error: any): string | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const message = typeof error.message === 'string' ? error.message : '';
  const details = typeof error.details === 'string' ? error.details : '';
  const combined = `${message} ${details}`;

  const patterns = [
    /column\s+"?([\w]+)"?\s+of\s+relation/i,
    /relation\s+"?[\w]+"?\.\s*column\s+"?([\w]+)"/i,
    /"([\w]+)"\s+does not exist/i,
    /could not find the '([\w]+)' column/i,
    /could not find column "?([\w]+)"?/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return typeof (error as { column?: string }).column === 'string' ? (error as { column?: string }).column! : null;
};

// ...existing code uses helpers from lib/eventUtils.ts

const buildEventRecord = (payload: EventPayload, primaryDjId: string | null): Partial<EventRow> => {
  const eventName = pickFirstString(payload.event_name, payload.title, payload.name);
  if (!eventName) {
    throw new AppError('Nome do evento é obrigatório.', ErrorKind.Validation);
  }

  const eventDate = pickFirstString(payload.event_date, payload.date);
  if (!eventDate) {
    throw new AppError('Data do evento é obrigatória.', ErrorKind.Validation);
  }

  const feeValue = parseNumericValue(payload.fee ?? payload.cache_value ?? payload.cache) ?? 0;
  const fee = feeValue >= 0 ? roundCurrencyValue(feeValue) : 0;

  const commissionRate = parseNumericValue(payload.commission_rate ?? payload.commission_percentage);
  const commissionAmount = parseNumericValue(payload.commission_amount);
  const expectedAttendees = parseNumericValue(payload.expected_attendees ?? payload.expectedAttendance ?? payload.expected_attendance);

  const description = pickFirstString(payload.description);
  const requirements = pickFirstString(payload.special_requirements, payload.requirements);
  const venueValue = pickFirstString(payload.venue, payload.location);
  const locationValue = pickFirstString(payload.location);
  const cityValue = pickFirstString(payload.city);
  const stateValue = pickFirstString(payload.state);
  const addressValue = pickFirstString(payload.address);
  const producerId = pickFirstString(payload.producer_id, payload.producerId);

  const eventRecord: Partial<EventRow> = {
    event_name: eventName,
    event_date: eventDate as any,
    fee,
    cache_value: fee,
  };

  if (primaryDjId && primaryDjId.trim().length > 0) {
    eventRecord.dj_id = primaryDjId.trim() as any;
  }

  if (producerId) eventRecord.producer_id = producerId as any;
  if (payload.status !== undefined) eventRecord.status = payload.status as any;
  if (description) eventRecord.description = description as any;
  if (venueValue) eventRecord.venue = venueValue as any;
  if (locationValue) eventRecord.location = locationValue as any;
  if (cityValue) eventRecord.city = cityValue as any;
  if (stateValue) eventRecord.state = stateValue as any;
  if (addressValue) eventRecord.address = addressValue as any;
  if (payload.start_time !== undefined && payload.start_time !== null) eventRecord.start_time = payload.start_time as any;
  if (payload.end_time !== undefined && payload.end_time !== null) eventRecord.end_time = payload.end_time as any;
  if (expectedAttendees !== null) eventRecord.expected_attendees = expectedAttendees as any;
  if (commissionRate !== null) eventRecord.commission_rate = roundCurrencyValue(commissionRate) as any;
  if (commissionAmount !== null) eventRecord.commission_amount = roundCurrencyValue(commissionAmount) as any;
  if (requirements) eventRecord.special_requirements = requirements as any;
  if (payload.payment_status !== undefined) eventRecord.payment_status = payload.payment_status as any;
  if (payload.payment_proof !== undefined) eventRecord.payment_proof = payload.payment_proof as any;
  if (payload.shared_with_manager !== undefined) eventRecord.shared_with_manager = Boolean(payload.shared_with_manager) as any;
  if (payload.equipment_provided !== undefined) eventRecord.equipment_provided = payload.equipment_provided as any;

  return eventRecord;
};

const syncEventDjRelations = async (eventId: string, djIds: string[], feeMapInput: FeeMap) => {
  const normalizedDjIds = normalizeDjIds(djIds);
  const feeMap = isPlainRecord(feeMapInput) ? feeMapInput : {};

  const { error: deleteError } = await supabase.from('event_djs').delete().eq('event_id', eventId);
  if (deleteError) {
    throw deleteError;
  }

  if (normalizedDjIds.length === 0) {
    return;
  }

  const rows = normalizedDjIds.map((djId) => {
    const feeValue = parseNumericValue((feeMap as Record<string, unknown>)[djId]);
    return {
      event_id: eventId,
      dj_id: djId,
      fee: feeValue != null && feeValue >= 0 ? roundCurrencyValue(feeValue) : null,
    };
  });

  const { error: insertError } = await supabase.from('event_djs').insert(rows);
  if (insertError) {
    throw insertError;
  }
};

const ensurePendingPaymentForEvent = async (
  eventRecord: Partial<EventRow>,
  fallbackRecord: EventPayload,
): Promise<void> => {
  const rawEventId = eventRecord?.id ?? fallbackRecord?.id ?? null;
  if (!rawEventId) return;
  const eventId = String(rawEventId);

  const amountSource =
    eventRecord?.cache_value ?? eventRecord?.fee ?? fallbackRecord?.cache_value ?? fallbackRecord?.fee ?? 0;

  const parsedAmount = parseNumericValue(amountSource);
  const amount = parsedAmount != null && parsedAmount >= 0 ? roundCurrencyValue(parsedAmount) : 0;

  // Skip creating payment if amount is zero or cache is exempt
  const isExempt = Boolean((eventRecord as any)?.cache_exempt) || Boolean((fallbackRecord as any)?.cache_exempt);
  if (isExempt || amount <= 0) {
    return;
  }

  const rawProducerId = eventRecord?.producer_id ?? fallbackRecord?.producer_id ?? null;
  const producerId = rawProducerId ? String(rawProducerId) : null;

  const dueDate = normalizeTimestamp(
    (eventRecord as any)?.due_date ?? (eventRecord as any)?.event_date ?? (fallbackRecord as any)?.due_date ?? (fallbackRecord as any)?.event_date,
  );

  const existingResponse = await supabase
    .from('payments')
    .select('id, status')
    .eq('event_id', eventId)
    .limit(1)
    .maybeSingle();

  if (existingResponse.error) {
    const msg = formatError(existingResponse.error);
    if (isNetworkError(msg)) throw new AppError('Erro de rede ao consultar pagamentos', ErrorKind.Network, existingResponse.error);
    throw new AppError('Erro ao consultar pagamentos', ErrorKind.Database, existingResponse.error);
  }

  if (existingResponse.data) {
    const updates: Partial<PaymentRow> = {
      amount: amount as any,
      producer_id: (producerId ?? null) as any,
      due_date: (dueDate as any) ?? null,
    };

    if (!existingResponse.data.status || existingResponse.data.status === 'pendente') {
      (updates as any).status = 'pendente';
    }

    const { error: updateError } = await supabase.from('payments').update(updates).eq('id', existingResponse.data.id);
    if (updateError) {
      const msg = formatError(updateError);
      if (isNetworkError(msg)) throw new AppError('Erro de rede ao atualizar pagamento', ErrorKind.Network, updateError);
      throw new AppError('Erro ao atualizar pagamento', ErrorKind.Database, updateError);
    }
    return;
  }

  const insertPayload: Partial<PaymentRow> = {
    event_id: eventId as any,
    amount: amount as any,
    status: 'pendente' as any,
    producer_id: (producerId ?? null) as any,
    due_date: dueDate as any,
  };

  const { error: insertError } = await supabase.from('payments').insert(insertPayload as any);
  if (insertError) {
    const msg = formatError(insertError);
    if (isNetworkError(msg)) throw new AppError('Erro de rede ao criar pagamento', ErrorKind.Network, insertError);
    throw new AppError('Erro ao criar pagamento', ErrorKind.Database, insertError);
  }
};

const syncDjProducerRelationStats = async (
  eventRecord: Partial<EventRow>,
  fallbackRecord: EventPayload,
  djIds: string[],
  feeMapInput: FeeMap,
): Promise<void> => {
  const normalizedDjIds = normalizeDjIds(djIds);
  if (normalizedDjIds.length === 0) {
    return;
  }

  const rawProducerId = (eventRecord as any)?.producer_id ?? (fallbackRecord as any)?.producer_id ?? null;
  if (!rawProducerId) return;
  const producerId = String(rawProducerId);

  const eventDate = normalizeTimestamp((eventRecord as any)?.event_date ?? (fallbackRecord as any)?.event_date) ?? null;

  const totalAmountSource =
    eventRecord?.cache_value ??
    eventRecord?.fee ??
    fallbackRecord?.cache_value ??
    fallbackRecord?.fee ??
    0;
  const parsedTotalAmount = parseNumericValue(totalAmountSource);
  const totalAmount =
    parsedTotalAmount != null && parsedTotalAmount >= 0
      ? roundCurrencyValue(parsedTotalAmount)
      : 0;

  const feeMap = isPlainRecord(feeMapInput) ? (feeMapInput as Record<string, unknown>) : {};
  const allocationMap = new Map<string, number>();

  normalizedDjIds.forEach((djId) => {
    const feeValue = parseNumericValue(feeMap[djId]);
    let amount =
      feeValue != null && feeValue >= 0 ? roundCurrencyValue(feeValue) : null;

    if (amount == null && totalAmount > 0 && normalizedDjIds.length > 0) {
      amount = roundCurrencyValue(totalAmount / normalizedDjIds.length);
    }

    allocationMap.set(djId, amount ?? 0);
  });

  for (const djId of normalizedDjIds) {
    const allocation = allocationMap.get(djId) ?? 0;
    const allocationValue = allocation >= 0 ? roundCurrencyValue(allocation) : 0;

    const existingResponse = await supabase
      .from('dj_producer_relations')
      .select('id, total_events, total_revenue, last_event_date')
      .eq('dj_id', djId)
      .eq('producer_id', producerId)
      .limit(1)
      .maybeSingle();

    if (existingResponse.error) {
      const msg = formatError(existingResponse.error);
      if (isNetworkError(msg)) throw new AppError('Erro de rede ao consultar relação DJ-produtor', ErrorKind.Network, existingResponse.error);
      throw new AppError('Erro ao consultar relação DJ-produtor', ErrorKind.Database, existingResponse.error);
    }

    const candidateLastDate = eventDate;
    let resolvedLastDate = normalizeTimestamp(existingResponse.data?.last_event_date) ?? null;
    if (candidateLastDate) {
      const newDate = new Date(candidateLastDate);
      if (!Number.isNaN(newDate.getTime())) {
        if (!resolvedLastDate) {
          resolvedLastDate = newDate.toISOString();
        } else {
          const existingDate = new Date(resolvedLastDate);
          if (
            Number.isNaN(existingDate.getTime()) ||
            newDate.getTime() >= existingDate.getTime()
          ) {
            resolvedLastDate = newDate.toISOString();
          }
        }
      } else {
        resolvedLastDate = candidateLastDate;
      }
    }

    if (existingResponse.data) {
      const currentEvents = Number(existingResponse.data.total_events ?? 0);
      const currentRevenue =
        parseNumericValue(existingResponse.data.total_revenue) ?? 0;
      const updatedPayload = {
        total_events: Number.isFinite(currentEvents) ? currentEvents + 1 : 1,
        total_revenue: roundCurrencyValue(currentRevenue + allocationValue),
        last_event_date: resolvedLastDate ?? candidateLastDate ?? null,
        is_active: true,
      };

      const { error: updateError } = await supabase.from('dj_producer_relations').update(updatedPayload).eq('id', existingResponse.data.id);
      if (updateError) {
        const msg = formatError(updateError);
        if (isNetworkError(msg)) throw new AppError('Erro de rede ao atualizar relação DJ-produtor', ErrorKind.Network, updateError);
        throw new AppError('Erro ao atualizar rela��ão DJ-produtor', ErrorKind.Database, updateError);
      }
    } else {
      const insertPayload = {
        dj_id: djId,
        producer_id: producerId,
        total_events: 1,
        total_revenue: allocationValue,
        last_event_date: candidateLastDate,
        is_active: true,
      };
      const { error: insertRelationError } = await supabase.from('dj_producer_relations').insert(insertPayload as any);
      if (insertRelationError) {
        const msg = formatError(insertRelationError);
        if (isNetworkError(msg)) throw new AppError('Erro de rede ao criar relação DJ-produtor', ErrorKind.Network, insertRelationError);
        throw new AppError('Erro ao criar relação DJ-produtor', ErrorKind.Database, insertRelationError);
      }
    }
  }
};


const getProducerSortLabel = (producer: Partial<ProducerRow> | null | undefined) => {
  const candidates = [
    (producer as any)?.company_name,
    (producer as any)?.name,
    (producer as any)?.profile?.full_name,
    (producer as any)?.profile?.name,
    (producer as any)?.email,
    (producer as any)?.profile?.email,
  ].filter((value) => value != null && String(value).trim().length > 0);
  return String(candidates[0] ?? '').trim();
};

const normalizeProducerRecord = (record: Partial<ProducerRow> | null | undefined): Partial<ProducerRow> | null => {
  if (!record) return null;

  const profile = (record as any).profile ?? null;
  const profileId = (record as any).profile_id ?? profile?.id ?? (record as any).id ?? null;
  const resolvedId = (record as any).id ?? profileId ?? null;

  const name =
    (record as any).name ??
    (record as any).company_name ??
    profile?.full_name ??
    profile?.name ??
    profile?.company_name ??
    (record as any).email ??
    profile?.email ??
    '';

  const companyName =
    (record as any).company_name ??
    (record as any).name ??
    profile?.company_name ??
    profile?.full_name ??
    profile?.name ??
    '';

  const email = (record as any).email ?? profile?.email ?? '';

  return {
    ...(record as any),
    id: resolvedId ?? null,
    profile_id: profileId ?? resolvedId ?? null,
    profile,
    name,
    company_name: companyName,
    email,
  } as Partial<ProducerRow>;
};

const normalizeProducers = (records: (Partial<ProducerRow> | null | undefined)[]): Partial<ProducerRow>[] => {
  const normalized = records
    .map((record) => normalizeProducerRecord(record as any))
    .filter((record): record is Partial<ProducerRow> => Boolean(record));

  normalized.sort((a, b) => getProducerSortLabel(a).localeCompare(getProducerSortLabel(b), 'pt-BR', { sensitivity: 'base' }));

  return normalized;
};

// Analytics Service
export const analyticsService = {
  async getDashboardMetrics() {
    try {
      // Get counts from various tables
      const [djsResult, contractsResult, eventsResult, paymentsResult] = await Promise.all([
        supabase.from('djs').select('id', { count: 'exact', head: true }),
        supabase.from('contracts').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true })
      ]);

      const totalDJs = djsResult.count || 0;
      const totalContracts = contractsResult.count || 0;
      
      // Get pending contracts
      const pendingContracts = 0;

      return {
        totalDJs,
        totalContracts,
        pendingContracts: pendingContracts || 0,
        djsChange: 'N/A',
        contractsChange: 'N/A',
        djsChangeType: 'neutral',
        contractsChangeType: 'neutral'
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', formatError(error));
      return {
        totalDJs: 0,
        totalContracts: 0,
        pendingContracts: 0,
        djsChange: 'Erro',
        contractsChange: 'Erro',
        djsChangeType: 'neutral',
        contractsChangeType: 'neutral'
      };
    }
  }
};

// Event Service
export const eventService = {
  __serviceName: 'eventService',
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service skipped - Supabase not configured');
        return { data: [], error: 'supabase_not_configured' };
      }

      // Query simples para evitar 400 por metadados de relacionamentos ausentes
      const { data: fallbackEvents, error: e2 } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      if (e2) {
        return { data: [], error: formatError(e2) };
      }
      const eventsBase = fallbackEvents || [];

      const eventIds = eventsBase.map((ev: any) => ev.id).filter(Boolean);
      const djIds = Array.from(new Set(eventsBase.map((ev: any) => ev.dj_id).filter(Boolean)));
      const producerIds = Array.from(new Set(eventsBase.map((ev: any) => ev.producer_id).filter(Boolean)));

      const { data: djs } = djIds.length
        ? await supabase.from('djs').select('*').in('id', djIds.map(String) as string[])
        : ({ data: [] } as any);
      const { data: producers } = producerIds.length
        ? await supabase.from('producers').select('*').in('id', producerIds.map(String) as string[])
        : ({ data: [] } as any);

      const producerProfileIds = (producers || []).map((p: any) => p.profile_id).filter(Boolean);
      const { data: profiles } = producerProfileIds.length
        ? await supabase.from('profiles').select('*').in('id', producerProfileIds)
        : ({ data: [] } as any);

      const { data: eventDjs } = eventIds.length
        ? await supabase.from('event_djs').select('*').in('event_id', eventIds.map(String) as string[])
        : ({ data: [] } as any);
      const extraDjIds = Array.from(new Set((eventDjs || []).map((ed: any) => ed.dj_id).filter(Boolean)));
      const { data: extraDjs } = extraDjIds.length
        ? await supabase.from('djs').select('*').in('id', extraDjIds.map(String) as string[])
        : ({ data: [] } as any);

      const enriched = (eventsBase || []).map((ev: any) => {
        const dj = (djs || []).find((d: any) => d.id === ev.dj_id) || null;
        const producerRaw = (producers || []).find((p: any) => p.id === ev.producer_id) || null;
        let producer = producerRaw;
        if (producerRaw && 'profile_id' in producerRaw && producerRaw.profile_id) {
          producer = { ...producerRaw, profile: (profiles || []).find((pr: any) => pr.id === producerRaw.profile_id) || null };
        }
        if (producerRaw && (!('profile_id' in producerRaw) || !producerRaw.profile_id)) {
          producer = { ...producerRaw, profile: null };
        }
        const eds = (eventDjs || [])
          .filter((ed: any) => ed.event_id === ev.id)
          .map((ed: any) => ({ ...ed, dj: (extraDjs || []).find((d: any) => d.id === ed.dj_id) || null }));
        return { ...ev, dj, producer, event_djs: eds } as unknown as EnrichedEvent;
      });

      return { data: enriched, error: null };
    } catch (error) {
      console.error('Error fetching events:', formatError(error));
      const msg = formatError(error);
      if (isNetworkError(msg)) return { data: [], error: 'Erro de rede ao buscar eventos' };
      return { data: [], error: msg };
    }
  },

  async getById(id: string) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service getById skipped - Supabase not configured');
        return null;
      }

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          dj:djs!events_dj_id_fkey (*),
          producer:producers!events_producer_id_fkey (
            *,
            profile:profiles!producers_id_fkey (*)
          ),
          event_djs (
            *,
            dj:djs (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        // Fallback: fetch base event and related records manually
        const { data: ev, error: e2 } = await supabase.from('events').select('*').eq('id', id).single();
        if (e2) throw e2;
        if (!ev) return null;

        const { data: dj } = ev.dj_id ? await supabase.from('djs').select('*').eq('id', ev.dj_id).single() : { data: null };
        const { data: producerRaw } = ev.producer_id ? await supabase.from('producers').select('*').eq('id', ev.producer_id).single() : { data: null };
        let profile = null;
        if (producerRaw && 'profile_id' in producerRaw && producerRaw.profile_id) {
          const res = await supabase.from('profiles').select('*').eq('id', String(producerRaw.profile_id)).single();
          profile = res.data;
        }
        const { data: eventDjs } = await supabase.from('event_djs').select('*').eq('event_id', id);
        const extraDjIds = (eventDjs || []).map(ed => ed.dj_id).filter(Boolean);
        const { data: extraDjs } = extraDjIds.length ? await supabase.from('djs').select('*').in('id', extraDjIds) : { data: [] };

        const eds = (eventDjs || []).map((ed: any) => ({ ...ed, dj: (extraDjs || []).find((d: any) => d.id === ed.dj_id) || null }));
        const producer = producerRaw ? { ...producerRaw, profile: profile || null } : null;

        return { ...(ev as EventRow), dj: dj || null, producer, event_djs: eds } as EnrichedEvent;
      }

      return data as unknown as EnrichedEvent;
    } catch (error) {
      console.error('Error fetching event:', formatError(error));
      return null;
    }
  },

  async getByDj(djId: string | null | undefined) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service getByDj skipped - Supabase not configured');
        return [];
      }

      if (!djId) {
        return [];
      }

      const selectFields = `
        *,
        dj:djs!events_dj_id_fkey (*),
        producer:producers!events_producer_id_fkey (
          *,
          profile:profiles!producers_id_fkey (*)
        ),
        event_djs (
          *,
          dj:djs (*)
        )
      `;

      // Attempt to fetch events including related records using foreign-key relationships.
      // If the PostgREST schema cache does not include the relationships, queries using the
      // relationship join syntax will fail with PGRST200. In that case we fall back to
      // fetching base records and assembling relations manually (robust for missing FK metadata).
      const [primaryResponse, relationResponse] = await Promise.all([
        supabase
          .from('events')
          .select(selectFields)
          .eq('dj_id', djId)
          .order('event_date', { ascending: false }),
        supabase
          .from('event_djs')
          .select('event_id')
          .eq('dj_id', djId),
      ]);

      // If the primaryResponse failed due to missing relationship metadata, fall back to safe queries
      if (primaryResponse.error) {
        // Fallback: fetch events without relationship joins and assemble relations manually
        const { data: fallbackEvents, error: e2 } = await supabase
          .from('events')
          .select('*')
          .eq('dj_id', djId)
          .order('event_date', { ascending: false });
        if (e2) throw e2;

        const eventIds = (fallbackEvents || []).map((ev: any) => ev.id).filter(Boolean);

        // Fetch event_djs rows for these events or those pointing to this dj
        const { data: eventDjs } = eventIds.length
          ? await supabase.from('event_djs').select('*').in('event_id', eventIds.map(String) as string[])
          : ({ data: [] } as any);

        const relationEventIds = (eventDjs || []).map((r: any) => r.event_id).filter(Boolean);
        const missingRelationIds = relationEventIds.filter((id: any) => !eventIds.includes(id));

        const uniqueMissing = Array.from(new Set(missingRelationIds));
        const { data: linkedEvents } = uniqueMissing.length
          ? await supabase.from('events').select('*').in('id', uniqueMissing.map(String) as string[])
          : ({ data: [] } as any);

        const combinedEvents = [...(fallbackEvents || []), ...(linkedEvents || [])];
        const combinedEventIds = Array.from(new Set((combinedEvents || []).map((ev: any) => ev.id).filter(Boolean)));

        // Fetch related djs, producers, profiles and extra djs
        const djIds = Array.from(new Set((combinedEvents || []).map((ev: any) => ev.dj_id).filter(Boolean)));
        const producerIds = Array.from(new Set((combinedEvents || []).map((ev: any) => ev.producer_id).filter(Boolean)));

        const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds.map(String) as string[]) : ({ data: [] } as any);
        const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds.map(String) as string[]) : ({ data: [] } as any);

        const producerProfileIds = (producers || []).map((p: any) => p.profile_id).filter(Boolean);
        const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds) : ({ data: [] } as any);

        const { data: extraEventDjs } = combinedEventIds.length ? await supabase.from('event_djs').select('*').in('event_id', combinedEventIds.map(String) as string[]) : ({ data: [] } as any);
        const extraDjIds = Array.from(new Set((extraEventDjs || []).map((ed: any) => ed.dj_id).filter(Boolean)));
        const { data: extraDjs } = extraDjIds.length ? await supabase.from('djs').select('*').in('id', extraDjIds.map(String) as string[]) : ({ data: [] } as any);

        const enriched = (combinedEvents || []).map((ev: any) => {
          const dj = (djs || []).find((d: any) => d.id === ev.dj_id) || null;
          const producerRaw = (producers || []).find((p: any) => p.id === ev.producer_id) || null;
          let producer = producerRaw;
          if (producerRaw && 'profile_id' in producerRaw && producerRaw.profile_id) {
            producer = { ...producerRaw, profile: (profiles || []).find((pr: any) => pr.id === producerRaw.profile_id) || null };
          }
          if (producerRaw && (!('profile_id' in producerRaw) || !producerRaw.profile_id)) {
            producer = { ...producerRaw, profile: null };
          }

          const eds = (extraEventDjs || [])
            .filter((ed: any) => ed.event_id === ev.id)
            .map((ed: any) => ({ ...ed, dj: (extraDjs || []).find((d: any) => d.id === ed.dj_id) || null }));

          return { ...ev, dj, producer, event_djs: eds } as unknown as EnrichedEvent;
        });

        // Sort by date
        enriched.sort((a: any, b: any) => {
          const extractTimestamp = (record: any) => {
            const value = record?.event_date ?? record?.date ?? record?.start_date ?? null;
            if (!value) return 0;
            const timestamp = new Date(value as any).getTime();
            return Number.isNaN(timestamp) ? 0 : timestamp;
          };
          return extractTimestamp(b) - extractTimestamp(a);
        });

        return enriched;
      }

      if (relationResponse.error) throw relationResponse.error;

      const eventsMap = new Map<string, any>();
      (primaryResponse.data ?? []).forEach((event) => {
        if (event?.id != null) {
          eventsMap.set(String(event.id), event);
        }
      });

      const relationIds = (relationResponse.data ?? [])
        .map((row) => row?.event_id)
        .filter((id): id is string => id != null);

      const missingIds = relationIds.filter((id) => !eventsMap.has(String(id)));
      const uniqueMissingIds = Array.from(new Set(missingIds));

      if (uniqueMissingIds.length > 0) {
        const { data: linkedEvents, error: linkedError } = await supabase
          .from('events')
          .select(selectFields)
          .in('id', uniqueMissingIds.map(String) as string[])
          .order('event_date', { ascending: false });
        if (linkedError) throw linkedError;
        (linkedEvents ?? []).forEach((event) => {
          if (event?.id != null) {
            eventsMap.set(String(event.id), event);
          }
        });
      }

      const events = Array.from(eventsMap.values()) as unknown as EnrichedEvent[];
      events.sort((a, b) => {
        const extractTimestamp = (record: any) => {
          const value = record?.event_date ?? record?.date ?? record?.start_date ?? null;
          if (!value) return 0;
          const timestamp = new Date(value as any).getTime();
          return Number.isNaN(timestamp) ? 0 : timestamp;
        };
        return extractTimestamp(b) - extractTimestamp(a);
      });

      return events;
    } catch (error) {
      console.error('Error fetching events by DJ:', formatError(error));
      return [];
    }
  },

  async create(payload: EventPayload) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service create skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const input: EventPayload = payload ?? {};
      const providedDjIdsRaw = Array.isArray(input.dj_ids)
        ? input.dj_ids
        : Array.isArray(input['djIds'])
        ? input['djIds']
        : [];
      const normalizedDjIds = normalizeDjIds(providedDjIdsRaw);
      const explicitPrimaryDj = pickFirstString(input.dj_id);
      const primaryDjId = explicitPrimaryDj ?? (normalizedDjIds[0] ?? null);

      const rawRecord = buildEventRecord(input, primaryDjId);
      let allowedColumns = await getEventColumnSet();
      let sanitizedRecord = prepareSanitizedEventRecord(rawRecord, allowedColumns);
      if (!sanitizedRecord.event_name || !sanitizedRecord.event_date) {
        throw new AppError('Event name and event date are required.', ErrorKind.Validation);
      }

      const feeMap = isPlainRecord(input.dj_fee_map) ? (input.dj_fee_map as FeeMap) : {};
      const mergedDjIds = mergeDjIds(primaryDjId, normalizedDjIds);

      let attempt = 0;
      let lastError: any = null;

      while (attempt < 3) {
  const { data, error } = await supabase.from('events').insert([sanitizedRecord] as any).select().single();

        if (!error) {
          updateEventColumnCache(allowedColumns);
          if (data?.id) {
            // Sync relations and auxiliary data, but do not fail the main create if these supplementary steps error
            try {
              await syncEventDjRelations(String(data.id), mergedDjIds, feeMap);
            } catch (relErr) {
              console.error('Failed to sync event-dj relations:', formatError(relErr));
            }

            try {
              await ensurePendingPaymentForEvent(data as EventRow, sanitizedRecord as Partial<EventRow>);
            } catch (payErr) {
              console.error('Failed to ensure pending payment for event:', formatError(payErr));
            }

            try {
              await syncDjProducerRelationStats(data as EventRow, sanitizedRecord as Partial<EventRow>, mergedDjIds, feeMap);
            } catch (statsErr) {
              console.error('Failed to sync DJ-producer relation stats (non-fatal):', formatError(statsErr));
            }
          }
          return { data: data as EnrichedEvent, error: null };
        }

        lastError = error;
        const missingColumn = extractUndefinedColumn(error);
        if (missingColumn && allowedColumns.has(missingColumn)) {
          allowedColumns.delete(missingColumn);
          updateEventColumnCache(allowedColumns);
          sanitizedRecord = prepareSanitizedEventRecord(rawRecord, allowedColumns);
          attempt += 1;
          continue;
        }

        throw error;
      }

      throw lastError || new AppError('Unable to create event.', ErrorKind.Database);
    } catch (error) {
      console.error('Error creating event:', formatError(error));
      const msg = formatError(error);
      if (isNetworkError(msg)) return { data: null, error: 'Erro de rede ao criar evento' };
      return { data: null, error: msg };
    }
  },

  async update(id: string, payload: EventPayload) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service update skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      if (!id) {
        return { data: null, error: 'event_id_required' };
      }

      const input: EventPayload = payload ?? {};
      const providedDjIdsRaw = Array.isArray(input.dj_ids)
        ? input.dj_ids
        : Array.isArray(input['djIds'])
        ? input['djIds']
        : [];
      const normalizedDjIds = normalizeDjIds(providedDjIdsRaw);
      const explicitPrimaryDj = pickFirstString(input.dj_id);
      const primaryDjId = explicitPrimaryDj ?? (normalizedDjIds[0] ?? null);

      const rawRecord = buildEventRecord(input, primaryDjId);
      let allowedColumns = await getEventColumnSet();
      let sanitizedRecord = prepareSanitizedEventRecord(rawRecord, allowedColumns);
      if (!sanitizedRecord.event_name || !sanitizedRecord.event_date) {
        throw new AppError('Event name and event date are required.', ErrorKind.Validation);
      }

      const feeMap = isPlainRecord(input.dj_fee_map) ? (input.dj_fee_map as FeeMap) : {};
      const mergedDjIds = mergeDjIds(primaryDjId, normalizedDjIds);

      let attempt = 0;
      let lastError: any = null;

      while (attempt < 3) {
        const { data, error } = await supabase.from('events').update(sanitizedRecord as any).eq('id', id).select().single();

        if (!error) {
          updateEventColumnCache(allowedColumns);
          try {
            await syncEventDjRelations(id, mergedDjIds, feeMap);
          } catch (relErr) {
            console.error('Failed to sync event-dj relations on update (non-fatal):', formatError(relErr));
          }
          return { data: data as EnrichedEvent, error: null };
        }

        lastError = error;
        const missingColumn = extractUndefinedColumn(error);
        if (missingColumn && allowedColumns.has(missingColumn)) {
          allowedColumns.delete(missingColumn);
          updateEventColumnCache(allowedColumns);
          sanitizedRecord = prepareSanitizedEventRecord(rawRecord, allowedColumns);
          attempt += 1;
          continue;
        }

        throw error;
      }

      throw lastError || new AppError('Unable to update event.', ErrorKind.Database);
    } catch (error) {
      console.error('Error updating event:', formatError(error));
      const msg = formatError(error);
      if (isNetworkError(msg)) return { data: null, error: 'Erro de rede ao atualizar evento' };
      return { data: null, error: msg };
    }
  },

  async delete(id: string) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service delete skipped - Supabase not configured');
        return { error: 'supabase_not_configured' };
      }

      if (!id) {
        return { error: 'event_id_required' };
      }

      const { error: deleteRelationsError } = await supabase.from('event_djs').delete().eq('event_id', id);
      if (deleteRelationsError) {
        const msg = formatError(deleteRelationsError);
        if (isNetworkError(msg)) throw new AppError('Erro de rede ao deletar relações de evento', ErrorKind.Network, deleteRelationsError);
        throw new AppError('Erro ao deletar relações de evento', ErrorKind.Database, deleteRelationsError);
      }

      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) {
        const msg = formatError(error);
        if (isNetworkError(msg)) throw new AppError('Erro de rede ao deletar evento', ErrorKind.Network, error);
        throw new AppError('Erro ao deletar evento', ErrorKind.Database, error);
      }

      return { error: null, success: true };
    } catch (error) {
      console.error('Error deleting event:', formatError(error));
      return { error: (error as any)?.message ?? String(error) };
    }
  }
};

export const djProducerRelationService = {
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('DJ-producer relation service skipped - Supabase not configured');
        return [];
      }

      const { data, error } = await supabase
        .from('dj_producer_relations')
        .select(`
          *,
          dj:djs (*),
          producer:producers (*)
        `);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching DJ/producer relations:', formatError(error));
      return [];
    }
  }
};

// Contract Service
export const contractService = {
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Contract service skipped - Supabase not configured');
        return [];
      }

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          dj:djs!contracts_dj_id_fkey (*),
          producer:producers!contracts_producer_id_fkey (
            *,
            profile:profiles!producers_id_fkey (*)
          ),
          event:events (
            *,
            dj:djs!events_dj_id_fkey (*),
            producer:producers!events_producer_id_fkey (
              *,
              profile:profiles!producers_id_fkey (*)
            ),
            event_djs (
              *,
              dj:djs (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback path: assemble records manually without relying on DB relationship metadata
        const { data: contracts, error: e2 } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
        if (e2) throw e2;
        if (!contracts) return [];

        const eventIds = Array.from(new Set(contracts.map(c => c.event_id).filter(Boolean)));
        const contractDjIds = Array.from(new Set(contracts.map(c => c.dj_id).filter(Boolean)));
        const producerIds = Array.from(new Set(contracts.map(c => c.producer_id).filter(Boolean)));

        const { data: events } = eventIds.length ? await supabase.from('events').select('*').in('id', eventIds) : { data: [] };
        const djIds = Array.from(new Set([...(events || []).map(ev => ev.dj_id).filter(Boolean), ...contractDjIds]));

        const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds) : { data: [] };
        const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds) : { data: [] };
        const producerProfileIds = (producers || []).map(p => p.profile_id).filter(Boolean);
        const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds) : { data: [] };

        const { data: eventDjs } = eventIds.length ? await supabase.from('event_djs').select('*').in('event_id', eventIds) : { data: [] };
        const extraDjIds = Array.from(new Set((eventDjs || []).map(ed => ed.dj_id).filter(Boolean)));
        const { data: extraDjs } = extraDjIds.length ? await supabase.from('djs').select('*').in('id', extraDjIds) : { data: [] };

        // Map events with their relations
        const eventsMap = (events || []).reduce((acc, ev) => {
          const dj = (djs || []).find(d => d.id === ev.dj_id) || null;
          const producerRaw = (producers || []).find(p => p.id === ev.producer_id) || null;
          const producer = producerRaw ? { ...producerRaw, profile: (profiles || []).find(pr => pr.id === producerRaw.profile_id) || null } : null;
          const eds = (eventDjs || []).filter(ed => ed.event_id === ev.id).map(ed => ({ ...ed, dj: (extraDjs || []).find(d => d.id === ed.dj_id) || null }));
          acc[ev.id] = { ...ev, dj, producer, event_djs: eds };
          return acc;
        }, {} as Record<string, any>);

        // Map djs
        const djsMap = (djs || []).reduce((acc, dj) => { acc[dj.id] = dj; return acc; }, {} as Record<string, any>);

        // Assemble contracts with enriched event/dj/producer
        const enriched = (contracts || []).map(c => {
          const event = c.event_id ? eventsMap[c.event_id] || null : null;
          const dj = c.dj_id ? djsMap[c.dj_id] || null : (event ? event.dj : null);
          const producer = c.producer_id ? (producers || []).find(p => p.id === c.producer_id) || null : (event ? event.producer : null);
          return { ...c, event, dj, producer };
        });

        return enriched;
      }

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contracts:', formatError(error));
      return [];
    }
  }
};

// DJ Service
export const djService = DJService;

// Producer Service
export const producerService = {
  __serviceName: 'producerService',
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Producer service skipped - Supabase not configured');
        return { data: [], error: 'supabase_not_configured' };
      }

      const { data: producersData, error: producersError } = await supabase
        .from('producers')
        .select(`
          *,
          profile:profiles!producers_id_fkey (*)
        `);

      if (!producersError && Array.isArray(producersData) && producersData.length > 0) {
        return { data: normalizeProducers(producersData as ProducerRecord[]), error: null };
      }

      if (producersError) {
        console.warn('[producerService] producers query failed, falling back to profiles:', formatError(producersError));
      } else {
        console.warn('[producerService] producers query returned no records, falling back to profiles table for legacy data.');
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'producer');

      if (profilesError) throw profilesError;

      const fallbackRecords = (profilesData || []).map((profile) => ({
        ...profile,
        id: profile?.id,
        profile,
      }));

      return { data: normalizeProducers(fallbackRecords as ProducerRecord[]), error: null };
    } catch (error) {
      console.error('Error fetching producers:', formatError(error));
      return { data: [], error: formatError(error) };
    }
  },

  async uploadAvatar(producerId: string, file: File) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Producer service uploadAvatar skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const fileName = `producer_avatar_${producerId}_${Date.now()}.${file.name.split('.').pop()}`;
      const path = `producer-avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('producer-avatars')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('producer-avatars')
        .getPublicUrl(path);

      return { data: { url: publicUrl }, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  async deleteProducer({ profileId, userId }: { profileId: string; userId?: string | null }) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Producer service deleteProducer skipped - Supabase not configured');
        return { error: 'supabase_not_configured' };
      }

      if (!profileId) {
        return { error: 'profile_id_required' };
      }

      // Delete producer record (uses same id as profile)
      const { error: producerDeleteError } = await supabase
        .from('producers')
        .delete()
        .eq('id', profileId);

      if (producerDeleteError && producerDeleteError.code !== 'PGRST116') {
        console.warn('Producer delete error:', producerDeleteError);
      }

      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileDeleteError) {
        throw profileDeleteError;
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting producer:', formatError(error));
      return { error: formatError(error) };
    }
  },

  async changePassword(email: string, newPassword: string) {
    // This would typically be handled by an edge function with service_role access
    return { error: 'Password change must be handled by admin edge function' };
  },

  async setDashboardDJ(producerId: string, djId: string) {
    // This would store a preference or relationship
    return { error: 'Not implemented' };
  }
};

// Storage Service
export const storageService = {
  async uploadFile(bucket: string, path: string, file: File) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Storage upload skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      return { data: { publicUrl }, error: null };
    } catch (error) {
      console.error('Error uploading file:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  getPublicUrl(bucket: string, path: string) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Storage getPublicUrl skipped - Supabase not configured');
        return null;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', formatError(error));
      return null;
    }
  }
};

export default {
  analyticsService,
  eventService,
  djProducerRelationService,
  contractService,
  djService,
  producerService,
  storageService,
  paymentService
};

export { paymentService };
