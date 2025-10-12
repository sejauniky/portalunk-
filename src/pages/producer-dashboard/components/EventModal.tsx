import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { eventService } from '@/services/supabaseService';
import { mediaService } from '@/services/mediaService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const EventModal = ({ djId, producerId, isOpen, onClose }: { djId: string; producerId: string; isOpen: boolean; onClose: () => void }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, event_name, event_date, fee, cache_value, payment_status, producer_id')
        .eq('dj_id', djId)
        .eq('producer_id', producerId)
        .order('event_date', { ascending: false });

      if (error) {
        console.error('Failed to load events', error);
        setEvents([]);
      } else {
        setEvents((data ?? []) as any[]);
      }
    } catch (err) {
      console.error('Failed load events for dj', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, djId]);

  const handleUpload = async (eventId: string, file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      // Show fixed instruction: comprovante must be exact amount and CNPJ
      toast({ title: 'Atenção', description: 'O comprovante precisa estar no valor exato da pendência e em nome do CNPJ 59.839.507/0001-86 (UNK ASSESSORIA).' });

      // Upload file via mediaService; mediaService doesn't expose progress callback so simulate progress
      const simulateProgress = () => {
        let v = 5;
        const t = setInterval(() => {
          v = Math.min(95, v + Math.floor(Math.random() * 20));
          setUploadProgress(v);
        }, 300);
        return t;
      };

      const timer = simulateProgress();

      const params = { djId, file, category: 'other' } as any;
      const { data, error } = await mediaService.uploadFile(params as any);
      clearInterval(timer);
      setUploadProgress(100);

      if (error || !data) {
        toast({ title: 'Erro no upload', description: String(error ?? 'Falha ao enviar arquivo'), variant: 'destructive' });
        throw new Error(error || 'upload_failed');
      }

      const receiptUrl = data.file_url;
      setLatestReceipt(receiptUrl);
      toast({ title: 'Upload concluído', description: 'Comprovante enviado com sucesso. Enviando para análise...' });

      // call edge function mark-event-paid which now marks as 'pagamento_enviado'
      const res = await (supabase as any).functions.invoke('mark-event-paid', { body: { eventId, receipt_url: receiptUrl } });
      if (res?.error) {
        toast({ title: 'Erro', description: String(res.error), variant: 'destructive' });
        throw new Error(res.error || 'function_error');
      }

      // On success, notify user and refresh
      toast({ title: 'Pagamento enviado', description: 'O comprovante foi enviado para análise pelo administrador.' });
  queryClient.invalidateQueries({ queryKey: ['producer-dj-events', djId, producerId] });
      await load();
    } catch (err) {
      console.error('Upload or mark payment failed', err);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Eventos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? <div>Carregando...</div> : (
            <div className="space-y-3">
              {events.length === 0 ? <p className="text-muted-foreground">Nenhum evento encontrado com este DJ.</p> : events.map(ev => {
                const isContractSigned = ev.contract_attached;
                const isPaid = ev.payment_status === 'pago';
                const isPaymentSent = ev.payment_status === 'pagamento_enviado';
                
                return (
                  <div key={ev.id} className="p-4 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{ev.event_name || ev.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {ev.event_date ? new Date(ev.event_date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            }) : 'Data não informada'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ev.fee ?? ev.cache_value ?? 0)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Contrato</p>
                          <div className="flex items-center gap-2">
                            {isContractSigned ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">Assinado</span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">Não Assinado</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Pagamento</p>
                          <div className="flex items-center gap-2">
                            {isPaid ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">Pago</span>
                            ) : isPaymentSent ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">Enviado</span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">Pendente</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
