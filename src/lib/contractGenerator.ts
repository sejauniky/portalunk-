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

  // Substituir variáveis do template
  const variables: Record<string, string> = {
    '{{eventName}}': eventData.eventName || '',
    '{{eventDate}}': eventData.eventDate ? new Date(eventData.eventDate).toLocaleDateString('pt-BR') : '',
    '{{location}}': eventData.location || '',
    '{{city}}': eventData.city || '',
    '{{cacheValue}}': eventData.cacheValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
    '{{djName}}': eventData.djName || '',
    '{{producerName}}': eventData.producerName || '',
    '{{commissionRate}}': eventData.commissionRate?.toString() || '20',
    '{{today}}': new Date().toLocaleDateString('pt-BR'),
  };

  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(key, 'g'), value);
  });

  return content;
};
