/**
 * Gera o conteúdo do contrato preenchendo o template com dados do evento
 */
export const generateContractContent = (
  template: string,
  eventData: {
    eventName: string;
    eventDate: string;
    location: string;
    city: string;
    cacheValue: number;
    djName: string;
    producerName: string;
    commissionRate: number;
  }
): string => {
  let content = template;

  // Formatar data sem timezone para evitar mudança de dia
  const formatDateWithoutTimezone = (dateValue: any): string => {
    if (!dateValue) return '';

    // Converter para string se necessário
    const dateStr = typeof dateValue === 'string' ? dateValue : String(dateValue);

    // Se já está no formato DD/MM/YYYY, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

    // Se está no formato YYYY-MM-DD (com ou sem horário)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      // Extrai apenas a parte da data (antes do T se houver)
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  };

  // Substituir variáveis do template
  const variables: Record<string, string> = {
    '{{eventName}}': eventData.eventName || '',
    '{{eventDate}}': formatDateWithoutTimezone(eventData.eventDate),
    '{{location}}': eventData.location || '',
    '{{city}}': eventData.city || '',
    '{{cacheValue}}': eventData.cacheValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
    '{{djName}}': eventData.djName || '',
    '{{producerName}}': eventData.producerName || '',
    '{{commissionRate}}': eventData.commissionRate?.toString() || '20',
    '{{today}}': formatDateWithoutTimezone(new Date().toISOString()),
  };

  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(key, 'g'), value);
  });

  return content;
};
