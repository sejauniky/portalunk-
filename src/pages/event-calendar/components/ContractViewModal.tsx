import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ContractViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractContent: string;
  eventName: string;
  signatureStatus: string;
  onSign?: () => void;
  eventId?: string;
  djId?: string;
}

export const ContractViewModal = ({
  open,
  onOpenChange,
  contractId,
  contractContent,
  eventName,
  signatureStatus,
  onSign,
  eventId,
  djId,
}: ContractViewModalProps) => {
  const [isSigning, setIsSigning] = useState(false);
  const [agree, setAgree] = useState(false);
  const [resolvedId, setResolvedId] = useState<string>(contractId || "");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setResolvedId(contractId || "");
  }, [contractId]);

  useEffect(() => {
    const ensureInstance = async () => {
      if (!open || resolvedId || !eventId || !djId) return;
      setResolving(true);
      try {
        const existing = await supabase
          .from("contract_instances")
          .select("id")
          .eq("event_id", eventId)
          .eq("dj_id", djId)
          .maybeSingle();
        if (existing?.data?.id) {
          setResolvedId(String(existing.data.id));
          return;
        }
        const { data: evInfo } = await supabase
          .from("events")
          .select("contract_type, producer_id, cache_value")
          .eq("id", eventId)
          .maybeSingle();
        const contractType = (evInfo as any)?.contract_type || "basic";
        const ownerProducerId = (evInfo as any)?.producer_id || null;
        if (ownerProducerId) {
          try {
            await supabase.functions.invoke('create-event-contracts', {
              body: { eventId, djIds: [djId], contractType, producerId: ownerProducerId }
            });
            const retry = await supabase
              .from("contract_instances")
              .select("id")
              .eq("event_id", eventId)
              .eq("dj_id", djId)
              .maybeSingle();
            if (retry?.data?.id) setResolvedId(String(retry.data.id));
          } catch (e) {
            console.error('create-event-contracts failed', e);
          }
        }
      } finally {
        setResolving(false);
      }
    };
    ensureInstance();
  }, [open, eventId, djId, resolvedId]);

  const handleSign = async () => {
    setIsSigning(true);
    try {
      let toUseId = resolvedId && resolvedId.trim().length > 0 ? resolvedId : "";

      if (!toUseId && eventId && djId) {
        const existing = await supabase
          .from("contract_instances")
          .select("id")
          .eq("event_id", eventId)
          .eq("dj_id", djId)
          .maybeSingle();
        if (existing?.data?.id) {
          toUseId = String(existing.data.id);
          setResolvedId(toUseId);
        }
      }

      if (!toUseId) {
        throw new Error('Contrato não disponível para assinatura no momento. Aguarde a geração e tente novamente.');
      }

      const { data: userData } = await supabase.auth.getUser();
      const nowIso = new Date().toISOString();
      const signerName = userData?.user?.email || "Produtor";

      // Fallback: update directly if edge function is unavailable in the project
      try {
        const resp = await supabase.functions.invoke('process-digital-signature', {
          body: {
            contractInstanceId: toUseId,
            signatureData: `accepted_terms_${nowIso}`,
            signerName,
            signerType: 'producer',
            location: null,
          },
        });
        if ((resp as any)?.error) throw new Error((resp as any)?.error?.message || 'Falha ao processar assinatura');
      } catch (fnErr) {
        // Direct update (mirrors ContractCard.tsx) for environments without the edge function
        const { error: updErr } = await supabase
          .from('contract_instances')
          .update({ signature_status: 'signed', signed_at: nowIso })
          .eq('id', toUseId);
        if (updErr) throw updErr;
        await supabase.from('digital_signatures').insert({
          contract_instance_id: toUseId,
          signer_id: (await supabase.auth.getUser()).data.user?.id,
          signer_type: 'producer',
          signer_name: signerName,
          signature_data: 'digital_signature_' + Date.now(),
          signature_hash: crypto.randomUUID(),
        });
      }

      toast({ title: "Contrato assinado", description: "O contrato foi assinado com sucesso." });
      onSign?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao assinar contrato:', error);
      toast({ title: "Erro ao assinar contrato", description: error.message, variant: "destructive" });
    } finally {
      setIsSigning(false);
    }
  };

  const isSigned = signatureStatus === "signed";
  const disablePrimary = isSigning || resolving || !agree || (!resolvedId && !!eventId && !!djId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:w-full sm:max-w-3xl max-h-[85vh] sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrato - {eventName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[45vh] sm:h-[55vh] w-full rounded border p-4">
          <div className="whitespace-pre-wrap text-sm">
            {contractContent || "Conteúdo do contrato não disponível."}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          {isSigned ? (
            <div className="flex items-center gap-2 text-green-600 mr-auto">
              <Check className="h-5 w-5" />
              <span className="font-medium">Contrato Assinado</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mr-auto">
                <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
                <label htmlFor="agree" className="text-sm select-none">
                  Li e concordo com os termos do contrato
                </label>
              </div>
              <Button onClick={handleSign} disabled={disablePrimary} className="gap-2">
                <Check className="h-4 w-4" />
                {isSigning || resolving ? "Preparando..." : "Salvar"}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
