// API utilities for Portal UNK

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options: RequestInit = {}
): Promise<Response> {
  const config: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || `HTTP ${response.status}`, response.status, response);
  }

  return response;
}

export async function uploadFile(
  url: string,
  file: File,
  additionalFields?: Record<string, string>
): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || `Upload failed: HTTP ${response.status}`, response.status, response);
  }

  return response;
}

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusConfig(status: string) {
  const configs = {
    // DJ Status
    available: { label: 'Disponível', className: 'status-available' },
    busy: { label: 'Ocupado', className: 'status-busy' },
    unavailable: { label: 'Indisponível', className: 'status-pending' },
    
    // Event Status  
    planned: { label: 'Planejado', className: 'status-pending' },
    confirmed: { label: 'Confirmado', className: 'status-paid' },
    completed: { label: 'Finalizado', className: 'status-paid' },
    cancelled: { label: 'Cancelado', className: 'status-busy' },
    
    // Payment Status
    pending: { label: 'Pendente', className: 'status-pending' },
    sent: { label: 'Comprovante Enviado', className: 'status-sent' },
    paid: { label: 'Pago', className: 'status-paid' },
    overdue: { label: 'Em Atraso', className: 'status-busy' },
    
    // Contract Status
    signed: { label: 'Assinado', className: 'status-paid' },
    rejected: { label: 'Rejeitado', className: 'status-busy' },
  };
  
  return configs[status as keyof typeof configs] || { label: status, className: 'status-pending' };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
}

export function validateCNPJ(cnpj: string): boolean {
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  return cnpjRegex.test(cnpj);
}

export function formatPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function formatCNPJ(cnpj: string): string {
  const numbers = cnpj.replace(/\D/g, '');
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}