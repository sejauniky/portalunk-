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
}

export const ContractViewModal = ({
  open,
  onOpenChange,
  contractId,
  contractContent,
  eventName,
  signatureStatus,
  onSign,
}: ContractViewModalProps) => {
  const [isSigning, setIsSigning] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSign = async () => {
    setIsSigning(true);
    try {
      const { error } = await supabase
        .from("contract_instances")
        .update({ signature_status: "signed", signed_at: new Date().toISOString() })
        .eq("id", contractId);

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
                {isSigning ? "Assinando..." : "Li e concordo"}
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
