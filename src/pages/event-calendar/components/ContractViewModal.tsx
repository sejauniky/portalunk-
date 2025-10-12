import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const handleSign = async () => {
    setIsSigning(true);
    try {
      const { error } = await supabase
        .from("contract_instances")
        .update({ signature_status: "signed", signed_at: new Date().toISOString() })
        .eq("id", contractId);

      if (error) throw error;

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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrato - {eventName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] w-full rounded border p-4">
          <div className="whitespace-pre-wrap text-sm">
            {contractContent || "Conteúdo do contrato não disponível."}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          {isSigned ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">Contrato Assinado</span>
            </div>
          ) : (
            <Button onClick={handleSign} disabled={isSigning} className="gap-2">
              <FileText className="h-4 w-4" />
              {isSigning ? "Assinando..." : "Assinar Contrato"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
