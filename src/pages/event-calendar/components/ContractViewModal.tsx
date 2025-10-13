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

  const handleSign = async () => {
    setIsSigning(true);
    try {
      let resolvedContractId = contractId && contractId.trim().length > 0 ? contractId : "";

      if (!resolvedContractId && eventId && djId) {
        // Try to find existing instance
        const existing = await supabase
          .from("contract_instances")
          .select("id")
          .eq("event_id", eventId)
          .eq("dj_id", djId)
          .maybeSingle();

        if (existing?.data?.id) {
          resolvedContractId = String(existing.data.id);
        } else {
          // Fetch event info
          const { data: evInfo } = await supabase
            .from("events")
            .select("contract_type, producer_id, cache_value")
            .eq("id", eventId)
            .maybeSingle();

          const contractType = (evInfo as any)?.contract_type || "basic";
          const ownerProducerId = (evInfo as any)?.producer_id || null;
          const eventCache = Number((evInfo as any)?.cache_value) || 0;

          // Attempt to create via edge function first
          let created = false;
          if (ownerProducerId) {
            let invokeOk = false;
            try {
              const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
              const res = await Promise.race([
                supabase.functions.invoke('create-event-contracts', {
                  body: { eventId, djIds: [djId], contractType, producerId: ownerProducerId }
                }),
                timeout,
              ]) as any;
              if (!res?.error) invokeOk = true;
            } catch (_) {
              invokeOk = false;
            }
            if (invokeOk) {
              const retry = await supabase
                .from("contract_instances")
                .select("id")
                .eq("event_id", eventId)
                .eq("dj_id", djId)
                .maybeSingle();
              if (retry?.data?.id) {
                resolvedContractId = String(retry.data.id);
                created = true;
              }
            }

            // Fallback: direct insert if edge function unavailable
            if (!created) {
              // Resolve per-DJ fee if available
              let contractValue = eventCache;
              try {
                const { data: ed } = await supabase
                  .from('event_djs')
                  .select('fee')
                  .eq('event_id', eventId)
                  .eq('dj_id', djId)
                  .maybeSingle();
                if (ed?.fee != null) contractValue = Number(ed.fee) || contractValue;
              } catch {}

              const nowIso = new Date().toISOString();
              const insertRes = await supabase
                .from('contract_instances')
                .insert({
                  event_id: eventId as any,
                  dj_id: djId as any,
                  producer_id: ownerProducerId as any,
                  template_id: contractType,
                  contract_content: contractContent || '',
                  contract_value: contractValue || 0,
                  signature_status: 'pending',
                  payment_status: 'pending',
                })
                .select('id')
                .maybeSingle();

              if (insertRes?.data?.id) {
                resolvedContractId = String(insertRes.data.id);
              }
            }
          }
        }
      }

      if (!resolvedContractId) {
        throw new Error('Contrato não disponível para assinatura no momento.');
      }

      const { error } = await supabase
        .from("contract_instances")
        .update({ signature_status: "signed", signed_at: new Date().toISOString() })
        .eq("id", resolvedContractId);

      if (error) throw error;

      try {
        const { data: userData } = await supabase.auth.getUser();
        const signerId = userData?.user?.id ?? '';
        const nowIso = new Date().toISOString();
        await supabase.from("digital_signatures").insert({
          contract_instance_id: contractId,
          signer_id: signerId,
          signer_type: "producer",
          signer_name: userData?.user?.email || "Produtor",
          signature_data: `accepted_terms_${nowIso}`,
          signature_hash: (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2),
          signed_at: nowIso,
        });
      } catch (_) {
        // best-effort audit trail; ignore errors here
      }

      toast({
        title: "Contrato assinado",
        description: "O contrato foi assinado com sucesso.",
      });

      onSign?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao assinar contrato",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const isSigned = signatureStatus === "signed";

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
              <Button onClick={handleSign} disabled={isSigning || !agree} className="gap-2">
                <Check className="h-4 w-4" />
                {isSigning ? "Salvando..." : "Salvar"}
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
