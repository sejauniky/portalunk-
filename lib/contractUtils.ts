type Primitive = string | number | boolean | null | undefined;

export interface ContractMetadata {
  templateId: string;
  contractContent: string;
  duration: string;
  requiredEquipment: string;
  setupTime: string;
  dressCode: string;
  additionalTerms: string;
  isAttached: boolean;
  attachmentName: string | null;
  attachmentUrl: string | null;
}

const defaultMetadata: ContractMetadata = {
  templateId: '',
  contractContent: '',
  duration: '',
  requiredEquipment: '',
  setupTime: '',
  dressCode: '',
  additionalTerms: '',
  isAttached: false,
  attachmentName: null,
  attachmentUrl: null,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const coerceString = (value: unknown): string => (typeof value === 'string' ? value : '');

const coerceBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'sim'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'nao', 'não'].includes(normalized)) return false;
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value !== 0;
  }
  return false;
};

const coerceNullableString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
};

export const parseContractMetadata = (raw: unknown): ContractMetadata => {
  if (typeof raw === 'string') {
    try {
      return parseContractMetadata(JSON.parse(raw));
    } catch {
      return { ...defaultMetadata, contractContent: raw };
    }
  }

  if (!isPlainObject(raw)) {
    return { ...defaultMetadata };
  }

  return {
    templateId: coerceString(raw.templateId),
    contractContent: coerceString((raw as Record<string, Primitive>).contractContent),
    duration: coerceString(raw.duration),
    requiredEquipment: coerceString(raw.requiredEquipment),
    setupTime: coerceString(raw.setupTime),
    dressCode: coerceString(raw.dressCode),
    additionalTerms: coerceString(raw.additionalTerms),
    isAttached: coerceBoolean(raw.isAttached),
    attachmentName: coerceNullableString(raw.attachmentName),
    attachmentUrl: coerceNullableString(raw.attachmentUrl),
  };
};

export const buildContractMetadata = (
  metadata: Partial<ContractMetadata> | null | undefined,
  fallback: ContractMetadata = defaultMetadata,
): ContractMetadata => {
  const base = { ...fallback };
  if (!metadata) {
    return base;
  }

  return {
    templateId: metadata.templateId ?? base.templateId,
    contractContent: metadata.contractContent ?? base.contractContent,
    duration: metadata.duration ?? base.duration,
    requiredEquipment: metadata.requiredEquipment ?? base.requiredEquipment,
    setupTime: metadata.setupTime ?? base.setupTime,
    dressCode: metadata.dressCode ?? base.dressCode,
    additionalTerms: metadata.additionalTerms ?? base.additionalTerms,
    isAttached: metadata.isAttached ?? base.isAttached,
    attachmentName: metadata.attachmentName ?? base.attachmentName,
    attachmentUrl: metadata.attachmentUrl ?? base.attachmentUrl,
  };
};

export const resolveContractAttachmentStatus = (
  metadata: Partial<ContractMetadata> | null | undefined,
  contractUrl?: string | null,
): boolean => {
  const parsed = buildContractMetadata(metadata ?? undefined);
  if (parsed.isAttached) return true;
  if (parsed.attachmentUrl) return true;
  if (contractUrl) return true;
  return false;
};

export const generateContractNumber = (): string => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomSegment = (() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    }
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  })();
  return `CTR-${stamp}-${randomSegment}`;
};

export const calculateCommissionAmount = (fee: number, rate: number | null | undefined): number => {
  if (!Number.isFinite(fee) || fee <= 0) return 0;
  if (!Number.isFinite(rate ?? null)) return 0;
  const normalizedRate = Number(rate);
  if (!Number.isFinite(normalizedRate)) return 0;
  return Math.max(0, (fee * normalizedRate) / 100);
};

export const ensureMetadataContent = (
  metadata: ContractMetadata,
  fallbackTemplateContent: string,
  fallbackTemplateId: string,
): ContractMetadata => {
  const resolvedContent = metadata.contractContent || fallbackTemplateContent;
  const resolvedTemplateId = metadata.templateId || fallbackTemplateId;
  return {
    ...metadata,
    contractContent: resolvedContent,
    templateId: resolvedTemplateId,
  };
};

export const serializeContractMetadata = (metadata: ContractMetadata): Record<string, unknown> => ({
  templateId: metadata.templateId,
  contractContent: metadata.contractContent,
  duration: metadata.duration,
  requiredEquipment: metadata.requiredEquipment,
  setupTime: metadata.setupTime,
  dressCode: metadata.dressCode,
  additionalTerms: metadata.additionalTerms,
  isAttached: metadata.isAttached,
  attachmentName: metadata.attachmentName,
  attachmentUrl: metadata.attachmentUrl,
});
