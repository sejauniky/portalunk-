import { formatError } from '@/lib/errorUtils';
import { supabase, isSupabaseConfigured, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase';
import { Tables } from '@/integrations/supabase/types';

type MediaTable = typeof MEDIA_TABLE_CANDIDATES[number];

type MediaItem = {
  id: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string;
  description?: string | null;
  bucket_name?: string | null;
  file_path?: string | null;
  created_at?: string | null;
};

type UploadFileParams = {
  djId: string;
  djName?: string | null;
  file: File;
  category: string;
  title?: string;
  description?: string;
};

type UploadExternalLinkParams = {
  djId: string;
  djName?: string | null;
  externalLink: string;
  category: string;
  title: string;
  description?: string;
  fileType?: string;
};

type InsertMeta = {
  djId: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  description?: string | null;
  bucket?: string | null;
  path?: string | null;
  title?: string | null;
};

const MEDIA_TABLE_CANDIDATES = ['media_files', 'dj_media', 'media'] as const;

// Stronger types for common media tables
type MediaFilesRow = Tables<'media_files'>;
type DjMediaRow = Record<string, unknown>;
type MediaRow = Tables<'media'>;

const CATEGORY_BUCKET_MAP: Record<string, string> = {
  logo: 'dj-logos',
  presskit: 'dj-presskit',
  backdrop: 'dj-backdrops',
  performance: 'dj-presskit',
  video: 'dj-videos',
  audio: 'dj-presskit',
  other: 'dj-presskit'
};

const SUPABASE_BASE_URL = ((process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_URL) || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = ((process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? SUPABASE_PUBLISHABLE_KEY) || '').trim();

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'arquivo';
}

function extensionFromFile(file: File): string {
  const parts = (file.name || '').split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function parseStorageUrl(url?: string | null): { bucket: string; path: string } | null {
  if (!url) return null;
  const match = url.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
}

function detectTableFromRecord(record: unknown): MediaTable {
  const r = record as Record<string, unknown> | null;
  if (!r) return 'media';
  if ((r as any)?.file_category !== undefined) {
    return 'media_files';
  }
  if ((r as any)?.file_name !== undefined) {
    return 'dj_media';
  }
  return 'media';
}

function isTableMissingError(error: unknown): boolean {
  const e = error as Record<string, unknown> | null;
  const message = [e?.details, e?.message, e?.hint, e?.error_description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return message.includes('does not exist') || message.includes('undefined table');
}

function isRowLevelSecurityError(error: any): boolean {
  // Supabase/Postgres RLS errors often contain code 42501 or mention 'row-level security'
  const message = [error?.details, error?.message, error?.hint, error?.error_description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if ((error && (error.code === '42501' || error.code === 42501)) || message.includes('row-level security') || message.includes('permission denied')) {
    return true;
  }
  return false;
}

function normalizeRecord(table: MediaTable, record: unknown): MediaItem {
  const r = record as Record<string, any>;
  const bucketName = r.bucket_name ?? r.bucket ?? null;
  const fileUrl = r.file_url ?? r.url ?? r.public_url ?? '';
  const fallbackName = fileUrl ? decodeURIComponent(String(fileUrl).split('/').pop() || '') : '';
  const resolvedName = r.file_name ?? r.title ?? r.name ?? fallbackName;
  const fileName = resolvedName && String(resolvedName).trim() ? String(resolvedName) : randomId();
  const category = r.category ?? r.file_category ?? r.folder ?? 'other';
  const fileType = r.file_type ?? r.mime_type ?? r.type ?? '';
  const fileSize = typeof r.file_size === 'number' ? r.file_size : typeof r.size === 'number' ? r.size : null;
  const description = r.description ?? r.details ?? r.caption ?? null;
  const createdAt = r.created_at ?? r.updated_at ?? r.inserted_at ?? null;
  const filePath = r.file_path ?? r.path ?? null;

  return {
    id: r.id ?? randomId(),
    category: String(category),
    file_url: String(fileUrl),
    file_name: String(fileName),
    file_size: fileSize,
    file_type: String(fileType),
    description: description ?? undefined,
    bucket_name: bucketName ?? undefined,
    file_path: filePath ?? undefined,
    created_at: createdAt ?? undefined
  };
}

function normalizeRecords(table: MediaTable, records: unknown[]): MediaItem[] {
  return (records || []).map((record) => normalizeRecord(table, record));
}

async function invokeEdgeFunction<T>(endpoint: string, payload: FormData | Record<string, unknown>): Promise<T> {
  if (!SUPABASE_BASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('supabase_not_configured');
  }

  const url = `${SUPABASE_BASE_URL}/functions/v1/${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  };

  let body: BodyInit;
  if (payload instanceof FormData) {
    body = payload;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload ?? {});
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body
  });

  const text = await response.text();
  let parsed: any = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message = parsed?.error ?? parsed?.message ?? text ?? `HTTP ${response.status}`;
    throw new Error(message);
  }

  return parsed as T;
}

async function insertMediaRecord(meta: InsertMeta): Promise<MediaItem | null> {
  function mapMimeToSimpleType(mime?: string | null, category?: string | null): string {
    if (!mime) {
      if (category && ['logo', 'presskit', 'backdrop', 'video', 'audio', 'other'].includes(category)) {
        // Use category as a fallback when it's one of the expected buckets
        return category;
      }
      return 'other';
    }

    const major = mime.split('/')[0];
    if (major === 'image' || major === 'video' || major === 'audio') return major;
    return 'other';
  }

  const attempts: { table: MediaTable; payload: Record<string, any> }[] = [
    {
      // prefer inserting into dj_media first (less restrictive policies in many setups)
      table: 'dj_media',
      payload: {
        dj_id: meta.djId,
        category: meta.category,
        file_name: meta.fileName,
        file_url: meta.fileUrl,
        file_size: meta.fileSize,
        file_type: meta.fileType,
        description: meta.description,
        bucket_name: meta.bucket,
        file_path: meta.path,
        title: meta.title
      }
    },
    {
      table: 'media',
      payload: {
        dj_id: meta.djId,
        category: meta.category,
        title: meta.fileName,
        file_url: meta.fileUrl,
        file_size: meta.fileSize,
        file_type: meta.fileType,
        description: meta.description,
        bucket_name: meta.bucket
      }
    },
    {
      // try media_files last because many projects set stricter RLS/policies on this table
      table: 'media_files',
      payload: {
        dj_id: meta.djId,
        file_category: meta.category,
        file_name: meta.fileName,
        file_url: meta.fileUrl,
        file_size: meta.fileSize,
        // normalize file_type to a simple category to satisfy check constraints like image|video|audio|other
        file_type: mapMimeToSimpleType(meta.fileType, meta.category),
        description: meta.description,
        bucket_name: meta.bucket,
        file_path: meta.path,
        title: meta.title
      }
    }
  ];

  for (const attempt of attempts) {
    try {
      const { data, error } = await supabase
        .from(attempt.table as any)
        .insert(attempt.payload)
        .select()
        .maybeSingle();

      if (error) {
        if (isTableMissingError(error)) {
          continue;
        }
        if (isRowLevelSecurityError(error)) {
          // Skip this table if RLS prevented the insert; try next candidate
          console.warn(`[mediaService] insert into ${attempt.table} skipped due to RLS:`, formatError(error));
          continue;
        }
        throw error;
      }

      if (data) {
        return normalizeRecord(attempt.table, data);
      }
    } catch (error) {
      if (isTableMissingError(error)) {
        continue;
      }
      if (isRowLevelSecurityError(error)) {
        console.warn(`[mediaService] insert into ${attempt.table} skipped due to RLS (caught):`, formatError(error));
        continue;
      }
      console.error(`[mediaService] insert into ${attempt.table} failed:`, formatError(error));
      throw error;
    }
  }

  return null;
}

async function uploadViaStorage(params: UploadFileParams): Promise<MediaItem> {
  const { djId, file, category, title, description } = params;
  const bucket = CATEGORY_BUCKET_MAP[category] ?? CATEGORY_BUCKET_MAP.other;
  const ext = extensionFromFile(file);
  const baseName = sanitizeFileName((title || file.name).replace(/\.[^/.]+$/, ''));
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const relativePath = `${djId}/${category}/${timestamp}-${baseName}${ext ? `.${ext}` : ''}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(relativePath, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(relativePath);
  const publicUrl = publicData.publicUrl;

  const inserted = await insertMediaRecord({
    djId,
    category,
    fileUrl: publicUrl,
    fileName: title?.trim() || file.name,
    fileType: file.type || (ext ? `application/${ext}` : 'file'),
    fileSize: typeof file.size === 'number' ? file.size : null,
    description: description ?? null,
    bucket,
    path: relativePath,
    title: title?.trim() || file.name
  });

  if (inserted) {
    return inserted;
  }

  return {
    id: randomId(),
    category,
    file_url: publicUrl,
    file_name: title?.trim() || file.name,
    file_size: typeof file.size === 'number' ? file.size : null,
    file_type: file.type || (ext ? `application/${ext}` : 'file'),
    description: description ?? null,
    bucket_name: bucket,
    file_path: relativePath,
    created_at: new Date().toISOString()
  };
}

async function fetchMediaRecordById(mediaId: string): Promise<{ record: Record<string, any> | null; table: MediaTable | null; error: any }> {
  for (const table of MEDIA_TABLE_CANDIDATES) {
    try {
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .eq('id', mediaId)
        .maybeSingle();

      if (error) {
        if (isTableMissingError(error)) {
          continue;
        }
        return { record: null, table, error };
      }

      if (data) {
        return { record: data, table, error: null };
      }
    } catch (error) {
      if (isTableMissingError(error)) {
        continue;
      }
      return { record: null, table, error };
    }
  }

  return { record: null, table: null, error: null };
}

export const mediaService = {
  async getDJMedia(djId: string): Promise<{ data: MediaItem[]; error: string | null }> {
    if (!djId) {
      return { data: [], error: 'dj_id_required' };
    }

    if (!isSupabaseConfigured) {
      console.warn('mediaService.getDJMedia skipped - Supabase not configured');
      return { data: [], error: 'supabase_not_configured' };
    }

    const collectedErrors: string[] = [];

    for (const table of MEDIA_TABLE_CANDIDATES) {
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select('*')
          .eq('dj_id', djId)
          .order('created_at', { ascending: false });

        if (error) {
          if (isTableMissingError(error)) {
            continue;
          }
          collectedErrors.push(formatError(error));
          continue;
        }

        if (data) {
          return { data: normalizeRecords(table, data), error: null };
        }
      } catch (error) {
        if (isTableMissingError(error)) {
          continue;
        }
        collectedErrors.push(formatError(error));
      }
    }

    const message = collectedErrors[0] ?? 'media_not_found';
    return { data: [], error: message };
  },

  async uploadFile(params: UploadFileParams): Promise<{ data: MediaItem | null; error: string | null }> {
    if (!params?.djId || !params?.file) {
      return { data: null, error: 'missing_parameters' };
    }

    if (!isSupabaseConfigured) {
      console.warn('mediaService.uploadFile skipped - Supabase not configured');
      return { data: null, error: 'supabase_not_configured' };
    }

    try {
      if (SUPABASE_BASE_URL && SUPABASE_ANON_KEY) {
        const formData = new FormData();
        formData.append('djId', params.djId);
        if (params.djName) formData.append('djName', params.djName);
        formData.append('category', params.category);
        formData.append('title', params.title || params.file.name);
        if (params.description) formData.append('description', params.description);
        formData.append('file', params.file);

        const result = await invokeEdgeFunction<any>('upload-file', formData);
        if (result?.error) {
          const message = result.error?.message || (typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
          throw new Error(message || 'Upload edge function error');
        }

        const payload = result?.data ?? result;
        if (payload) {
          if (Array.isArray(payload) && payload.length > 0) {
            const table = detectTableFromRecord(payload[0] as Record<string, any>);
            const normalized = normalizeRecord(table, payload[0] as Record<string, any>);
            return { data: normalized, error: null };
          }

          if (typeof payload === 'object') {
            const table = detectTableFromRecord(payload as Record<string, any>);
            const normalized = normalizeRecord(table, payload as Record<string, any>);
            return { data: normalized, error: null };
          }
        }

        return { data: null, error: null };
      }
    } catch (error) {
      console.warn('[mediaService] Edge upload-file fallback:', formatError(error));
    }

    try {
      const fallback = await uploadViaStorage(params);
      return { data: fallback, error: null };
    } catch (error) {
      console.error('[mediaService] uploadFile failed:', formatError(error));
      return { data: null, error: formatError(error) };
    }
  },

  async uploadExternalLink(params: UploadExternalLinkParams): Promise<{ data: MediaItem | null; error: string | null }> {
    if (!params?.djId || !params?.externalLink) {
      return { data: null, error: 'missing_parameters' };
    }

    if (!isSupabaseConfigured) {
      console.warn('mediaService.uploadExternalLink skipped - Supabase not configured');
      return { data: null, error: 'supabase_not_configured' };
    }

    try {
      if (SUPABASE_BASE_URL && SUPABASE_ANON_KEY) {
        const body = {
          djId: params.djId,
          djName: params.djName,
          externalLink: params.externalLink,
          category: params.category,
          title: params.title,
          description: params.description,
          fileType: params.fileType ?? 'link'
        };
        const result = await invokeEdgeFunction<any>('upload-media', body);
        if (result?.error) {
          const message = result.error?.message || (typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
          throw new Error(message || 'Upload edge function error');
        }

        const payload = result?.data ?? result;
        if (payload) {
          if (Array.isArray(payload) && payload.length > 0) {
            const table = detectTableFromRecord(payload[0] as Record<string, any>);
            const normalized = normalizeRecord(table, payload[0] as Record<string, any>);
            return { data: normalized, error: null };
          }

          if (typeof payload === 'object') {
            const table = detectTableFromRecord(payload as Record<string, any>);
            const normalized = normalizeRecord(table, payload as Record<string, any>);
            return { data: normalized, error: null };
          }
        }

        return { data: null, error: null };
      }
    } catch (error) {
      console.warn('[mediaService] Edge upload-media fallback:', formatError(error));
    }

    try {
      const inserted = await insertMediaRecord({
        djId: params.djId,
        category: params.category,
        fileUrl: params.externalLink,
        fileName: params.title,
        fileType: params.fileType ?? 'link',
        fileSize: null,
        description: params.description ?? null,
        bucket: null,
        path: null,
        title: params.title
      });

      return { data: inserted, error: null };
    } catch (error) {
      console.error('[mediaService] uploadExternalLink failed:', formatError(error));
      return { data: null, error: formatError(error) };
    }
  },

  async deleteMedia(mediaId: string): Promise<{ error: string | null }> {
    if (!mediaId) {
      return { error: 'media_id_required' };
    }

    if (!isSupabaseConfigured) {
      console.warn('mediaService.deleteMedia skipped - Supabase not configured');
      return { error: 'supabase_not_configured' };
    }

    try {
      const { record, table, error } = await fetchMediaRecordById(mediaId);
      if (error) {
        if (isTableMissingError(error)) {
          return { error: null };
        }
        return { error: formatError(error) };
      }

      if (!record || !table) {
        return { error: 'media_not_found' };
      }

      const normalized = normalizeRecord(table, record);
      const storageInfo = normalized.bucket_name && normalized.file_path
        ? { bucket: normalized.bucket_name, path: normalized.file_path }
        : parseStorageUrl(normalized.file_url);

      if (storageInfo?.bucket && storageInfo?.path) {
        const { error: removeError } = await supabase.storage.from(storageInfo.bucket).remove([storageInfo.path]);
        if (removeError && !String(removeError.message || '').toLowerCase().includes('not found')) {
          console.warn('[mediaService] storage remove error:', formatError(removeError));
        }
      }

      const { error: deleteError } = await supabase.from(table as any).delete().eq('id', mediaId);
      if (deleteError && !isTableMissingError(deleteError)) {
        throw deleteError;
      }

      return { error: null };
    } catch (error) {
      console.error('[mediaService] deleteMedia failed:', formatError(error));
      return { error: formatError(error) };
    }
  },

  async downloadFile(url: string, fileName?: string): Promise<void> {
    if (!url || typeof window === 'undefined') {
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName || decodeURIComponent(url.split('/').pop() || 'download');
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.warn('[mediaService] Direct download failed, opening in new tab', formatError(error));
      window.open(url, '_blank', 'noopener');
    }
  },

  getFileIcon(fileType?: string | null): string {
    const value = (fileType || '').toLowerCase();
    if (!value) return 'File';

    const matchExtension = (...extensions: string[]) => extensions.some((ext) => value.includes(ext));

    if (value.includes('video') || matchExtension('mp4', 'mov', 'avi', 'mkv', 'webm')) return 'Video';
    if (value.includes('audio') || matchExtension('mp3', 'wav', 'aac', 'flac', 'ogg')) return 'Music';
    if (value.includes('pdf')) return 'FileText';
    if (matchExtension('xls', 'xlsx', 'csv')) return 'FileSpreadsheet';
    if (matchExtension('ppt', 'pptx')) return 'Presentation';
    if (matchExtension('zip', 'rar', '7z')) return 'FileArchive';
    if (value.includes('image') || matchExtension('png', 'jpg', 'jpeg', 'gif', 'svg', 'webp')) return 'Image';
    if (value.includes('link') || value === 'url') return 'Link';
    return 'File';
  },

  formatFileSize(bytes?: number | null, decimals = 1): string {
    if (!bytes || bytes <= 0) {
      return '0 B';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${parseFloat(value.toFixed(dm))} ${sizes[i]}`;
  }
};
