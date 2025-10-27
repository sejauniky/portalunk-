export enum ErrorKind {
  Unknown = 'Unknown',
  Network = 'Network',
  NotFound = 'NotFound',
  Validation = 'Validation',
  Database = 'Database',
  Auth = 'Auth',
}

export class AppError extends Error {
  public kind: ErrorKind;
  public original?: unknown;

  constructor(message: string, kind: ErrorKind = ErrorKind.Unknown, original?: unknown) {
    super(message);
    this.kind = kind;
    this.original = original;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function isNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = (typeof err === 'string' ? err : (err && (err.message || err.error || ''))).toString().toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network error') || msg.includes('typeerror');
}

export function formatError(error: any): string {
  try {
    if (!error) return 'Erro desconhecido';
    if (typeof error === 'string') return error;
    if (error instanceof AppError) return error.message;
    if (error instanceof Error) {
      // Prefer explicit network-detection
      if (isNetworkError(error)) return 'Erro de rede. Verifique sua conexão.';
      return error.message || 'Erro inesperado';
    }

    if (typeof error === 'object') {
      // Supabase returns { message, code, status }
      const message = (error && (error.message || error.error || error.msg || '')) as string;
      if (message && isNetworkError(message)) return 'Erro de rede. Verifique sua conexão.';
      const parts: string[] = [];
      if (message) parts.push(String(message));
      if ((error as any).code) parts.push(`code: ${(error as any).code}`);
      if ((error as any).status) parts.push(`status: ${(error as any).status}`);
      if (parts.length) return parts.join(' - ');
      try {
        return JSON.stringify(error);
      } catch (e) {
        return 'Erro inesperado';
      }
    }

    return String(error);
  } catch (e) {
    return 'Erro inesperado';
  }
}
