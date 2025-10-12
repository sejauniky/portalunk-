import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-primitive";
import { cn } from "@/lib/utils";
import {
  Calendar,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Save,
  Paperclip,
  Users,
  X,
} from "lucide-react";

export interface ContractTemplateOption {
  id: string;
  label: string;
  content: string;
}

export interface EventContractFormState {
  id: string | null;
  templateId: string;
  content: string;
  value: number;
  duration: string;
  paymentTerms: string;
  requiredEquipment: string;
  setupTime: string;
  dressCode: string;
  additionalTerms: string;
  isAttached: boolean;
}

type CalendarDJ = any;
type CalendarEvent = any;
type CalendarProducer = any;

interface EventContractModalProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  event: CalendarEvent | null;
  dj: CalendarDJ | null;
  producer: CalendarProducer | null;
  contract: EventContractFormState | null;
  templates: ContractTemplateOption[];
  isEditing: boolean;
  isSaving: boolean;
  isAttaching: boolean;
  onClose: () => void;
  onToggleEditing: (value: boolean) => void;
  onTemplateChange: (templateId: string) => void;
  onChange: (update: Partial<EventContractFormState>) => void;
  onSave: () => void;
  onAttach: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(value) ? value : 0);

const resolveEventDate = (event: CalendarEvent | null) => {
  if (!event?.event_date) {
    return { date: "", time: "" };
  }

  const parsed = new Date(event.event_date);
  if (Number.isNaN(parsed.getTime())) {
    return { date: event.event_date, time: "" };
  }

  const date = parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const time = parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { date, time };
};

export const EventContractModal: React.FC<EventContractModalProps> = ({
  open,
  loading,
  error,
  event,
  dj,
  producer,
  contract,
  templates,
  isEditing,
  isSaving,
  isAttaching,
  onClose,
  onToggleEditing,
  onTemplateChange,
  onChange,
  onSave,
  onAttach,
}) => {
  const { date: formattedDate, time: formattedTime } = useMemo(() => resolveEventDate(event), [event]);
  const formattedValue = useMemo(() => formatCurrency(contract?.value ?? 0), [contract?.value]);

  const disableTemplateSelection = !contract || templates.length === 0 || !isEditing;

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? undefined : onClose())}>
      <DialogContent className="w-full max-w-5xl border border-border bg-background/95 p-0 text-foreground shadow-glass transition-all sm:rounded-2xl [&>button]:hidden">
        <div className="flex h-full max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border bg-background/95 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold leading-tight">Contrato do Evento</h2>
                <p className="text-sm text-muted-foreground">
                  {event ? event.title : "Selecione um evento"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {contract?.isAttached && (
                <Badge variant="secondary" className="bg-green-500/15 text-green-400">
                  Disponível para produtores
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9", isEditing && "bg-primary/10 text-primary")}
                onClick={() => onToggleEditing(!isEditing)}
                disabled={loading || !contract}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando contrato...
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center px-6 py-10">
              <div className="max-w-md rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center text-destructive">
                <p className="font-medium">Não foi possível carregar o contrato</p>
                <p className="mt-2 text-sm text-destructive/80">{error}</p>
                <Button className="mt-4" variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : !contract || !event ? (
            <div className="flex flex-1 items-center justify-center px-6 py-10 text-sm text-muted-foreground">
              Selecione um evento para visualizar o contrato.
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-6 px-6 py-6">
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Data do evento
                    </div>
                    <p className="mt-2 text-lg font-semibold">{formattedDate || "Data não informada"}</p>
                    {formattedTime && <p className="text-sm text-muted-foreground">Às {formattedTime}</p>}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Local
                    </div>
                    <p className="mt-2 text-lg font-semibold">{event.location || "Local não informado"}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      DJ
                    </div>
                    <p className="mt-2 text-lg font-semibold">{dj?.name || dj?.artist_name || dj?.stage_name || "DJ não informado"}</p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Contrato</h3>
                      <div className="text-sm text-muted-foreground">Valor: {formattedValue}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select onValueChange={(v) => onTemplateChange(v)} value={contract.templateId} disabled={disableTemplateSelection}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecionar template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button variant="secondary" onClick={onAttach} disabled={isAttaching || !contract}>
                        Anexar
                      </Button>

                      <Button variant="primary" onClick={onSave} disabled={isSaving || !contract}>
                        Salvar
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Textarea value={contract.content} onChange={(e) => onChange({ content: e.target.value })} readOnly={!isEditing} />
                  </div>
                </section>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventContractModal;
