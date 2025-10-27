import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/Icon';
import { supabase } from '@/lib/supabase';
import paymentService from '@/services/paymentService';
import { toast } from 'sonner';

const ConfirmPaymentModal = ({ isOpen, onClose, transactionIds }) => {
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!transactionIds || transactionIds.length === 0) return;

    setLoading(true);
    try {
      let results = [];
      for (const id of transactionIds) {
        let proofUrl = null;
        if (file) {
          const ext = file.name.split('.').pop();
          const fileName = `payment_${id}_${Date.now()}.${ext}`;
          const filePath = `${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(filePath);
          
          proofUrl = publicUrl;
        }
        
        const paid_at = new Date(paymentDate).toISOString();
        const res = await paymentService.confirmPayment(id, { 
          payment_method: paymentMethod, 
          paid_at, 
          proofUrl 
        });
        results.push(res);
      }

      const errors = results.filter(r => r?.error);
      if (errors.length > 0) {
        toast.error(`${errors.length} pagamento(s) falharam`);
      } else {
        toast.success('Pagamento(s) confirmados com sucesso');
      }

      onClose();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Confirmar Pagamento</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {transactionIds?.length === 1 ? '1 transação selecionada' : `${transactionIds?.length} transações selecionadas`}
            </p>
          </div>
          <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Método de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="PIX">PIX</option>
                <option value="Transferência">Transferência</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>
            <Input
              label="Data do Pagamento"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Comprovante (opcional)</label>
            <div className="flex items-center space-x-3">
              <Button type="button" variant="outline" iconName="Upload" onClick={() => fileInputRef.current?.click()}>
                Selecionar Arquivo
              </Button>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file && (
                <span className="text-sm text-foreground truncate">{file.name}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG até 10MB</p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" iconName="Check" loading={loading}>
              Confirmar Pagamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmPaymentModal;
