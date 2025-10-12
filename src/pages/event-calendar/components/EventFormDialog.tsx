import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-primitive";
import { Textarea } from "@/components/ui/textarea";

import type {
  CalendarDJ,
  CalendarEvent,
  CalendarEventStatus,
  CalendarProducer,
} from "./EventsCalendar";

export interface EventFormValues {
  title: string;
  description: string;
  event_date: string;
  location: string;
  city: string;
  cache_value: string;
  commission_rate: string;
  status: CalendarEventStatus;
  dj_ids: string[];
  producer_id: string;
  contract_type: string;
}

interface EventFormDialogProps {
  open: boolean;
  mode: "create" | "edit" | "view";
  onOpenChange: (open: boolean) => void;
  onSubmit?: (values: EventFormValues) => Promise<void> | void;
  onAttachContract?: (eventId: string, djIds: string[], contractType: string, producerId: string) => Promise<void>;
  initialData?: CalendarEvent | null;
  djs: CalendarDJ[];
  producers: CalendarProducer[];
  isSubmitting?: boolean;
  currentEventId?: string | null;
}

type FormErrors = Partial<Record<keyof EventFormValues, string>>;

const defaultValues: EventFormValues = {
  title: "",
  description: "",
  event_date: "",
  location: "",
  city: "",
  cache_value: "",
  commission_rate: "",
  status: "pending",
  dj_ids: [],
  producer_id: "",
  contract_type: "basic",
};

const toInputDate = (value?: string | null) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (value.includes("T")) return value.split("T")[0] ?? "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const EventFormDialog = ({
  open,
  mode,
  onOpenChange,
  onSubmit,
  onAttachContract,
  initialData,
  djs,
  producers,
  isSubmitting = false,
  currentEventId = null,
}: EventFormDialogProps) => {
  const [values, setValues] = useState<EventFormValues>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      if (initialData) {
        const djIds = (initialData as any).dj_ids || (initialData.dj_id ? [initialData.dj_id] : []);
        setValues({
          title: initialData.title ?? "",
          description: initialData.description ?? "",
          event_date: toInputDate(initialData.event_date),
          location: initialData.location ?? "",
          city: initialData.city ?? "",
          cache_value: initialData.cache_value != null ? String(initialData.cache_value) : "",
          commission_rate:
            initialData.commission_rate != null ? String(initialData.commission_rate) : "",
          status: initialData.status,
          dj_ids: djIds,
          producer_id: initialData.producer_id,
          contract_type: (initialData as any).contract_type || "basic",
        });
      } else {
        setValues(defaultValues);
      }
      setErrors({});
    }
  }, [open, initialData]);

  const title = useMemo(() => {
    if (mode === "edit") return "Editar Evento";
    if (mode === "view") return "Detalhes do Evento";
    return "Criar Novo Evento";
  }, [mode]);

  const readOnly = mode === "view";

  const handleChange = (field: keyof EventFormValues, value: string) => {
    if (field === "dj_ids") {
      const parsed = JSON.parse(value) as string[];
      setValues((prev) => ({ ...prev, dj_ids: parsed }));
    } else {
      setValues((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    if (readOnly) return true;
    const nextErrors: FormErrors = {};

    if (!values.title.trim()) nextErrors.title = "Informe o título";
    if (!values.event_date) nextErrors.event_date = "Informe a data";
    if (!values.location.trim()) nextErrors.location = "Informe o local";
    if (!values.city.trim()) nextErrors.city = "Informe a cidade";
    if (!values.status) nextErrors.status = "Informe o status";
    if (!values.dj_ids || values.dj_ids.length === 0) nextErrors.dj_ids = "Selecione pelo menos um DJ";
    if (!values.producer_id) nextErrors.producer_id = "Selecione um produtor";

    if (!values.commission_rate.trim()) {
      nextErrors.commission_rate = "Informe a comissão";
    } else {
      const parsedCommission = Number(values.commission_rate);
      if (Number.isNaN(parsedCommission) || parsedCommission < 0 || parsedCommission > 100) {
        nextErrors.commission_rate = "Informe uma porcentagem válida";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (readOnly || !onSubmit) {
      onOpenChange(false);
      return;
    }

    if (!validate()) return;

    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Visualize os detalhes do evento selecionado."
              : "Preencha os dados do evento abaixo."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(event) => handleChange("title", event.target.value)}
              disabled={readOnly}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="event-date">Data do evento</Label>
            <Input
              id="event-date"
              type="date"
              value={values.event_date}
              onChange={(event) => handleChange("event_date", event.target.value)}
              disabled={readOnly}
              aria-invalid={Boolean(errors.event_date)}
            />
            {errors.event_date && <p className="text-sm text-destructive">{errors.event_date}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={values.location}
                onChange={(event) => handleChange("location", event.target.value)}
                disabled={readOnly}
                aria-invalid={Boolean(errors.location)}
              />
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={values.city}
                onChange={(event) => handleChange("city", event.target.value)}
                disabled={readOnly}
                aria-invalid={Boolean(errors.city)}
              />
              {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) => handleChange("description", event.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) => handleChange("status", value)}
                disabled={readOnly}
              >
                <SelectTrigger aria-invalid={Boolean(errors.status)}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cache">Cachê Total (R$)</Label>
              <Input
                id="cache"
                type="number"
                min="0"
                step="0.01"
                value={values.cache_value}
                onChange={(event) => handleChange("cache_value", event.target.value)}
                disabled={readOnly}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="commission-rate">Comissão UNK (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={values.commission_rate}
                onChange={(event) => handleChange("commission_rate", event.target.value)}
                disabled={readOnly}
                aria-invalid={Boolean(errors.commission_rate)}
              />
              {errors.commission_rate && (
                <p className="text-sm text-destructive">{errors.commission_rate}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Tipo de Contrato</Label>
              <Select
                value={values.contract_type}
                onValueChange={(value) => handleChange("contract_type", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>DJs (Selecione um ou mais)</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                {djs.map((dj) => {
                  const isSelected = values.dj_ids.includes(dj.id);
                  return (
                    <label
                      key={dj.id}
                      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-2"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newDjIds = e.target.checked
                            ? [...values.dj_ids, dj.id]
                            : values.dj_ids.filter((id) => id !== dj.id);
                          handleChange("dj_ids", JSON.stringify(newDjIds));
                        }}
                        disabled={readOnly}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{dj.name}</span>
                    </label>
                  );
                })}
              </div>
              {errors.dj_ids && <p className="text-sm text-destructive">{errors.dj_ids}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Produtor</Label>
              <Select
                value={values.producer_id}
                onValueChange={(value) => handleChange("producer_id", value)}
                disabled={readOnly}
              >
                <SelectTrigger aria-invalid={Boolean(errors.producer_id)}>
                  <SelectValue placeholder="Selecione o produtor" />
                </SelectTrigger>
                <SelectContent>
                  {producers.map((producer) => (
                    <SelectItem key={producer.id} value={producer.id}>
                      {producer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.producer_id && <p className="text-sm text-destructive">{errors.producer_id}</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Fechar
          </Button>
          {!readOnly && (
            <>
              <Button onClick={handleSubmit} disabled={isSubmitting} variant="default">
                {mode === "edit" ? "Salvar alterações" : "Criar evento"}
              </Button>
              {mode === "edit" && currentEventId && onAttachContract && (
                <Button
                  onClick={async () => {
                    if (!validate()) return;
                    await onAttachContract(currentEventId, values.dj_ids, values.contract_type, values.producer_id);
                  }}
                  disabled={isSubmitting}
                  variant="secondary"
                  className="gap-2"
                >
                  Anexar Contrato
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;
