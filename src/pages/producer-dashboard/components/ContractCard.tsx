import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Check, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ContractInstance = {
  id: string;
  contract_content: string;
  contract_value: number;
  signature_status: string;
  created_at: string;
  event: {
    event_name: string;
    event_date: string;
    location: string;
  };
  dj: {
    artist_name: string;
  };
};

interface ContractCardProps {
  contract: ContractInstance;
  onContractSigned?: () => void;
}

export const ContractCard = ({ contract, onContractSigned }: ContractCardProps) => {
  const [open, setOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  const isSigned = contract.signature_status === 'signed';

  const handleSign = async () => {
    setSigning(true);
    try {
      const { error } = await supabase
        .from('contract_instances')
        .update({
          signature_status: 'signed',
          signed_at: new Date().toISOString(),
        })
        .eq('id', contract.id);

      if (error) throw error;

      // Criar registro de assinatura digital
      await supabase.from('digital_signatures').insert({
        contract_instance_id: contract.id,
        signer_id: (await supabase.auth.getUser()).data.user?.id,
        signer_type: 'producer',
        signer_name: 'Produtor',
        signature_data: 'digital_signature_' + Date.now(),
        signature_hash: crypto.randomUUID(),
      });

      toast.success('Contrato assinado com sucesso!');
      setOpen(false);
      onContractSigned?.();
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      toast.error('Erro ao assinar contrato');
    } finally {
      setSigning(false);
    }
  };

  return (
    <>
      <Card className="p-4 bg-card hover:bg-accent/10 transition-colors cursor-pointer" onClick={() => setOpen(true)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{contract.event.event_name}</h4>
              <p className="text-sm text-muted-foreground">DJ: {contract.dj.artist_name}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(contract.event.event_date).toLocaleDateString('pt-BR')} - {contract.event.location}
              </p>
              <p className="text-sm font-medium text-foreground mt-1">
                {contract.contract_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSigned ? (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">Assinado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Pendente</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contrato - {contract.event.event_name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-muted p-6 rounded-lg prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: contract.contract_content.replace(/\n/g, '<br/>') }} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            {!isSigned && (
              <Button onClick={handleSign} disabled={signing}>
                {signing ? 'Assinando...' : 'Assinar Contrato'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
