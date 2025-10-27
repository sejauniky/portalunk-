import { AppError, ErrorKind } from './errorUtils';
import { Tables } from '@/integrations/supabase/types';

type EventRow = Tables<'events'>;

export const parseNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value as any);
  return Number.isFinite(parsed) ? parsed : null;
};

export const roundCurrencyValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const normalizeTimestamp = (value: unknown): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return trimmed;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return null;
};

const padDatePart = (value: number): string => value.toString().padStart(2, '0');

export const normalizeDateOnly = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${padDatePart(value.getUTCMonth() + 1)}-${padDatePart(value.getUTCDate())}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getUTCFullYear()}-${padDatePart(parsed.getUTCMonth() + 1)}-${padDatePart(parsed.getUTCDate())}`;
    }
    return null;
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getUTCFullYear()}-${padDatePart(parsed.getUTCMonth() + 1)}-${padDatePart(parsed.getUTCDate())}`;
    }
  }

  return null;
};

export const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

export const pickFirstString = (...candidates: unknown[]): string | null => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
};

export const normalizeDjIds = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  input.forEach((candidate) => {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        result.push(trimmed);
      }
    }
  });
  return result;
};

export const mergeDjIds = (primaryDjId: string | null | undefined, djIds: string[]): string[] => {
  const normalized = normalizeDjIds(djIds);
  if (primaryDjId && typeof primaryDjId === 'string') {
    const trimmed = primaryDjId.trim();
    if (trimmed) {
      const rest = normalized.filter((id) => id !== trimmed);
      return [trimmed, ...rest];
    }
  }
  return normalized;
};

export const sanitizeEventRecord = (raw: Record<string, any>, allowedColumns: Set<string>): Partial<EventRow> => {
  const sanitized: Partial<EventRow> = {};
  allowedColumns.forEach((column) => {
    if ((raw as any)[column] !== undefined) {
      (sanitized as any)[column] = (raw as any)[column];
    }
  });
  return sanitized;
};

export const prepareSanitizedEventRecord = (raw: Record<string, any>, allowedColumns: Set<string>): Partial<EventRow> => {
  const sanitized = sanitizeEventRecord(raw, allowedColumns);
  if (typeof (sanitized as any).fee !== 'number' || Number.isNaN((sanitized as any).fee)) {
    (sanitized as any).fee = 0;
  }
  if (allowedColumns.has('cache_value') && (sanitized as any).cache_value === undefined) {
    (sanitized as any).cache_value = (sanitized as any).fee;
  }

  if ((sanitized as any).event_date !== undefined) {
    const normalized = normalizeDateOnly((sanitized as any).event_date as unknown);
    if (normalized) (sanitized as any).event_date = normalized as any;
  }
  if ((sanitized as any).start_time !== undefined) {
    const normalized = normalizeTimestamp((sanitized as any).start_time as unknown);
    if (normalized) (sanitized as any).start_time = normalized as any;
  }
  if ((sanitized as any).end_time !== undefined) {
    const normalized = normalizeTimestamp((sanitized as any).end_time as unknown);
    if (normalized) (sanitized as any).end_time = normalized as any;
  }

  return sanitized;
};

export const buildEventRecord = (payload: Record<string, any>, primaryDjId: string | null): Partial<EventRow> => {
  const eventName = pickFirstString(payload.event_name, payload.title, payload.name);
  if (!eventName) {
    throw new AppError('Nome do evento é obrigatório.', ErrorKind.Validation);
  }

  const eventDate = pickFirstString(payload.event_date, payload.date);
  if (!eventDate) {
    throw new AppError('Data do evento é obrigatória.', ErrorKind.Validation);
  }

  const feeValue = parseNumericValue((payload as any).fee ?? (payload as any).cache_value ?? (payload as any).cache) ?? 0;
  const fee = feeValue >= 0 ? roundCurrencyValue(feeValue) : 0;

  const commissionRate = parseNumericValue((payload as any).commission_rate ?? (payload as any).commission_percentage);
  const commissionAmount = parseNumericValue((payload as any).commission_amount);
  const expectedAttendees = parseNumericValue((payload as any).expected_attendees ?? (payload as any).expectedAttendance ?? (payload as any).expected_attendance);

  const description = pickFirstString((payload as any).description);
  const requirements = pickFirstString((payload as any).special_requirements, (payload as any).requirements);
  const venueValue = pickFirstString((payload as any).venue, (payload as any).location);
  const locationValue = pickFirstString((payload as any).location);
  const cityValue = pickFirstString((payload as any).city);
  const stateValue = pickFirstString((payload as any).state);
  const addressValue = pickFirstString((payload as any).address);
  const producerId = pickFirstString((payload as any).producer_id, (payload as any).producerId);

  const eventRecord: Partial<EventRow> = {
    event_name: eventName as any,
    event_date: eventDate as any,
    fee: fee as any,
    cache_value: fee as any,
  };

  if (primaryDjId && primaryDjId.trim().length > 0) {
    (eventRecord as any).dj_id = primaryDjId.trim();
  }

  if (producerId) (eventRecord as any).producer_id = producerId;
  if ((payload as any).status !== undefined) (eventRecord as any).status = (payload as any).status;
  if (description) (eventRecord as any).description = description;
  if (venueValue) (eventRecord as any).venue = venueValue;
  if (locationValue) (eventRecord as any).location = locationValue;
  if (cityValue) (eventRecord as any).city = cityValue;
  if (stateValue) (eventRecord as any).state = stateValue;
  if (addressValue) (eventRecord as any).address = addressValue;
  if ((payload as any).start_time !== undefined && (payload as any).start_time !== null) (eventRecord as any).start_time = (payload as any).start_time;
  if ((payload as any).end_time !== undefined && (payload as any).end_time !== null) (eventRecord as any).end_time = (payload as any).end_time;
  if (expectedAttendees !== null) (eventRecord as any).expected_attendees = expectedAttendees;
  if (commissionRate !== null) (eventRecord as any).commission_rate = roundCurrencyValue(commissionRate) as any;
  if (commissionAmount !== null) (eventRecord as any).commission_amount = roundCurrencyValue(commissionAmount) as any;
  if (requirements) (eventRecord as any).special_requirements = requirements;
  if ((payload as any).payment_status !== undefined) (eventRecord as any).payment_status = (payload as any).payment_status;
  if ((payload as any).payment_proof !== undefined) (eventRecord as any).payment_proof = (payload as any).payment_proof;
  if ((payload as any).shared_with_manager !== undefined) (eventRecord as any).shared_with_manager = Boolean((payload as any).shared_with_manager) as any;
  if ((payload as any).equipment_provided !== undefined) (eventRecord as any).equipment_provided = (payload as any).equipment_provided as any;

  return eventRecord;
};

export default {};
