import { useCallback, useEffect, useMemo, useState } from "react";

import EventsCalendar, {
  type CalendarDJ,
  type CalendarEvent,
  type CalendarProducer,
} from "@/components/events/EventsCalendar";
import EventFormDialog, { type EventFormValues } from "@/components/events/EventFormDialog";
import EventContractModal, {
  type ContractTemplateOption,
  type EventContractFormState,
} from "@/components/events/EventContractModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { eventService, producerService, paymentService } from "@/services/supabaseService";
import { djServiceWrapper } from "@/services/djService";

type ExtendedCalendarEvent = CalendarEvent & {
  dj_ids?: string[];
  dj_names?: string[];
  producer_name?: string | null;
  contract_attached?: boolean;
  contract_content?: string | null;
  special_requirements?: string | null;
  event_time?: string | null;
  finance_status?: string;
};

type CompanySettingsRow = {
  contract_basic?: string | null;
  contract_intermediate?: string | null;
  contract_premium?: string | null;
};

const CONTRACT_TEMPLATE_SOURCES: ReadonlyArray<{
  id: string;
  label: string;
  key: keyof CompanySettingsRow;
}> = [
  { id: "basic", label: "Contrato Básico", key: "contract_basic" },
  { id: "intermediate", label: "Contrato Intermediário", key: "contract_intermediate" },
  { id: "premium", label: "Contrato Premium", key: "contract_premium" },
];

const DEFAULT_CONTRACT_FORM: EventContractFormState = {
  id: null,
  templateId: "basic",
  content: "",
  value: 0,
  duration: "4 horas",
  paymentTerms: "50% na assinatura do contrato, 50% após o evento",
  requiredEquipment: "Sistema de som profissional, mesa de mixagem, microfones",
  setupTime: "1 hora antes do evento",
  dressCode: "Traje social/casual elegante",
  additionalTerms: "",
  isAttached: false,
};

const ensureCurrencyNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const sanitized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeStatus = (status: unknown): CalendarEvent["status"] => {
  const normalized = typeof status === "string" ? status.toLowerCase() : "";
  if (normalized === "confirmed" || normalized === "completed" || normalized === "cancelled" || normalized === "pending") {
    return normalized;
  }
  return "pending";
};

const createTemplateOptions = (data: CompanySettingsRow | null): ContractTemplateOption[] =>
  CONTRACT_TEMPLATE_SOURCES.map((source) => ({
    id: source.id,
    label: source.label,
    content: data?.[source.key] ?? "",
  }));

const formatCurrencyLabel = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(value) ? value : 0);

const formatDateLabel = (value: string | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const applyTemplatePlaceholders = (
  template: string,
  event: ExtendedCalendarEvent,
  contract: EventContractFormState,
  dj: CalendarDJ | null,
  producer: CalendarProducer | null,
): string => {
  if (!template) return "";
  return template
    .replace(/{DJ_NAME}/g, dj?.name ?? "DJ")
    .replace(/{EVENT_DATE}/g, formatDateLabel(event.event_date))
    .replace(/{EVENT_NAME}/g, event.title ?? "Evento")
    .replace(/{VENUE}/g, event.location ?? "")
    .replace(/{AMOUNT}/g, formatCurrencyLabel(ensureCurrencyNumber(contract.value)))
    .replace(/{PRODUCER_NAME}/g, producer?.name ?? "Produtor");
};

const buildSpecialRequirements = (contract: EventContractFormState): string =>
  [
    contract.duration ? `Duração: ${contract.duration}` : null,
    contract.paymentTerms ? `Pagamento: ${contract.paymentTerms}` : null,
    contract.requiredEquipment ? `Equipamentos: ${contract.requiredEquipment}` : null,
    contract.setupTime ? `Setup: ${contract.setupTime}` : null,
    contract.dressCode ? `Dress code: ${contract.dressCode}` : null,
    contract.additionalTerms?.trim() ? contract.additionalTerms.trim() : null,
  ]
    .filter(Boolean)
    .join("\n");

const EventCalendar = () => {
  const { toast } = useToast();

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExtendedCalendarEvent | null>(null);
  const [eventModalMode, setEventModalMode] = useState<"create" | "view" | "edit">("create");
  const [eventFormSubmitting, setEventFormSubmitting] = useState(false);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractEvent, setContractEvent] = useState<ExtendedCalendarEvent | null>(null);
  const [contractState, setContractState] = useState<EventContractFormState | null>(null);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplateOption[]>([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractEditing, setContractEditing] = useState(false);
  const [contractSaving, setContractSaving] = useState(false);
  const [contractAttaching, setContractAttaching] = useState(false);
  const [contractDj, setContractDj] = useState<CalendarDJ | null>(null);
  const [contractProducer, setContractProducer] = useState<CalendarProducer | null>(null);

  const {
    data: rawEvents = [],
    loading: eventsLoading,
    refetch: refetchEvents,
  } = useSupabaseData(eventService, "getAll", [], []);

  const { data: allDJs = [], loading: djsLoading } = useSupabaseData(djServiceWrapper, "getAll", [], []);
  const { data: allProducers = [], loading: producersLoading } = useSupabaseData(producerService, "getAll", [], []);
  const { data: allPayments = [] } = useSupabaseData(paymentService, "getAll", [], []);

  const isLoading = eventsLoading || djsLoading || producersLoading;

  const paymentStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    (Array.isArray(allPayments) ? allPayments : []).forEach((payment: any) => {
      const eventId = payment?.event?.id ?? payment?.event_id;
      if (!eventId) {
        return;
      }
      const status = String(payment?.status ?? "").toLowerCase();
      const normalized = status === "paid" || status === "pago" ? "paid" : "pending";
      if (map.get(eventId) !== "paid") {
        map.set(eventId, normalized);
      }
    });
    return map;
  }, [allPayments]);

  const calendarEvents = useMemo<ExtendedCalendarEvent[]>(() => {
    const fallbackDate = new Date().toISOString();
    return (Array.isArray(rawEvents) ? rawEvents : [])
      .map((event: any) => {
        if (!event?.id) {
          return null;
        }

        const extraDJs = Array.isArray(event?.event_djs)
          ? event.event_djs.map((relation: any) => relation?.dj).filter(Boolean)
          : [];
        const combinedDJs = [event?.dj, ...extraDJs].filter(Boolean);

        const djIds = combinedDJs
          .map((dj: any) => (dj?.id ? String(dj.id) : null))
          .filter((id): id is string => Boolean(id));

        const djNames = combinedDJs
          .map((dj: any) => dj?.artist_name || dj?.name || dj?.stage_name)
          .filter(Boolean);

        const status = normalizeStatus(event?.status);
        if (status === "cancelled") {
          return null;
        }

        const cacheValue = ensureCurrencyNumber(event?.cache_value ?? event?.fee);
        const commissionRate = event?.commission_rate ?? event?.commission_percentage ?? null;

        const producerId = event?.producer?.id ?? event?.producer_id ?? "";
        const producerName = event?.producer?.name ?? event?.producer?.company_name ?? null;

        const formattedEventDate = event?.event_date || event?.date || fallbackDate;

        return {
          id: String(event.id),
          title: event?.title || event?.event_name || "Evento sem título",
          description: event?.description ?? null,
          event_date: formattedEventDate,
          location: event?.location || event?.venue || "",
          city: event?.city || "",
          cache_value: cacheValue,
          commission_rate: commissionRate != null ? Number(commissionRate) : null,
          status,
          dj_id: djIds[0] ?? (event?.dj_id ? String(event.dj_id) : ""),
          producer_id: producerId ? String(producerId) : "",
          created_at: event?.created_at || fallbackDate,
          updated_at: event?.updated_at || fallbackDate,
          contract_type: event?.contract_type ?? null,
          dj_ids: djIds,
          dj_names: djNames,
          producer_name: producerName,
          contract_attached: Boolean(event?.contract_attached),
          contract_content: event?.contract_content ?? null,
          special_requirements: event?.special_requirements ?? event?.requirements ?? null,
          event_time: event?.start_time ?? event?.event_time ?? null,
          finance_status: paymentStatusMap.get(event.id) ?? "pending",
        };
      })
      .filter(Boolean) as ExtendedCalendarEvent[];
  }, [paymentStatusMap, rawEvents]);

  const calendarDjs = useMemo<CalendarDJ[]>(() => {
    return (Array.isArray(allDJs) ? allDJs : [])
      .map((dj: any) => {
        if (!dj?.id) {
          return null;
        }
        const basePrice = ensureCurrencyNumber(dj?.base_price ?? dj?.cache_value);
        return {
          id: String(dj.id),
          name: dj?.artist_name || dj?.name || "DJ sem nome",
          email: dj?.email || dj?.contact_email || "",
          base_price: basePrice > 0 ? basePrice : undefined,
        };
      })
      .filter(Boolean) as CalendarDJ[];
  }, [allDJs]);

  const calendarProducers = useMemo<CalendarProducer[]>(() => {
    return (Array.isArray(allProducers) ? allProducers : [])
      .map((producer: any) => {
        if (!producer?.id) {
          return null;
        }
        return {
          id: String(producer.id),
          name: producer?.name || producer?.company_name || producer?.email || "Produtor sem nome",
          email: producer?.email || "",
          company_name: producer?.company_name ?? null,
        };
      })
      .filter(Boolean) as CalendarProducer[];
  }, [allProducers]);

  const resolveDj = useCallback(
    async (djId: string): Promise<CalendarDJ | null> => {
      if (!djId) return null;
      const local = calendarDjs.find((item) => item.id === djId);
      if (local) return local;

      const { data, error } = await supabase
        .from("djs")
        .select("id, artist_name, email, base_price")
        .eq("id", djId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const basePrice = ensureCurrencyNumber(data?.base_price);
      return {
        id: String(data.id),
        name: data.artist_name || data.email || "DJ",
        email: data.email ?? "",
        base_price: basePrice > 0 ? basePrice : undefined,
      };
    },
    [calendarDjs],
  );

  const resolveProducer = useCallback(
    async (producerId: string): Promise<CalendarProducer | null> => {
      if (!producerId) return null;
      const local = calendarProducers.find((item) => item.id === producerId);
      if (local) return local;

      const { data, error } = await supabase
        .from("producers")
        .select("id, name, company_name, email")
        .eq("id", producerId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: String(data.id),
        name: data.name || data.company_name || data.email || "Produtor",
        email: data.email ?? "",
        company_name: data.company_name ?? null,
      };
    },
    [calendarProducers],
  );

  useEffect(() => {
    if (!isContractModalOpen || !contractEvent) {
      return;
    }

    let active = true;

    const loadContract = async () => {
      setContractLoading(true);
      setContractError(null);
      setContractEditing(false);
      setContractState(null);
      setContractTemplates([]);
      setContractDj(null);
      setContractProducer(null);

      try {
        const [{ data: settingsData, error: settingsError }, { data: eventData, error: eventError }] = await Promise.all([
          supabase
            .from("company_settings")
            .select("contract_basic, contract_intermediate, contract_premium")
            .maybeSingle<CompanySettingsRow>(),
          supabase
            .from("events")
            .select("cache_value, contract_type, contract_content, special_requirements, contract_attached")
            .eq("id", contractEvent.id)
            .maybeSingle<{
              cache_value: number | null;
              contract_type: string | null;
              contract_content: string | null;
              special_requirements: string | null;
              contract_attached: boolean | null;
            }>(),
        ]);

        if (!active) return;

        if (settingsError) {
          throw settingsError;
        }
        if (eventError) {
          throw eventError;
        }

        const templates = createTemplateOptions(settingsData ?? null);
        setContractTemplates(templates);

        const defaultTemplateId =
          contractEvent.contract_type && templates.some((template) => template.id === contractEvent.contract_type)
            ? contractEvent.contract_type
            : templates[0]?.id ?? DEFAULT_CONTRACT_FORM.templateId;

        const templateContent = templates.find((template) => template.id === defaultTemplateId)?.content ?? "";
        const cacheValue = ensureCurrencyNumber(eventData?.cache_value ?? contractEvent.cache_value);

        const initialContract: EventContractFormState = {
          ...DEFAULT_CONTRACT_FORM,
          id: contractEvent.id,
          templateId: defaultTemplateId,
          content: eventData?.contract_content ?? templateContent,
          value: cacheValue,
          additionalTerms: eventData?.special_requirements ?? DEFAULT_CONTRACT_FORM.additionalTerms,
          isAttached: Boolean(eventData?.contract_attached),
        };

        if (!active) return;

        setContractState(initialContract);

        const [djDetails, producerDetails] = await Promise.all([
          contractEvent.dj_id ? resolveDj(contractEvent.dj_id) : Promise.resolve(null),
          contractEvent.producer_id ? resolveProducer(contractEvent.producer_id) : Promise.resolve(null),
        ]);

        if (!active) return;

        setContractDj(djDetails);
        setContractProducer(producerDetails);
      } catch (error: any) {
        if (!active) return;
        console.error("Erro ao carregar modal de contrato:", error);
        const message =
          typeof error?.message === "string" ? error.message : "Não foi possível carregar os dados do contrato.";
        setContractError(message);
      } finally {
        if (active) {
          setContractLoading(false);
        }
      }
    };

    void loadContract();

    return () => {
      active = false;
    };
  }, [contractEvent, isContractModalOpen, resolveDj, resolveProducer]);

  const handleCreateEvent = useCallback(() => {
    setSelectedEvent(null);
    setEventModalMode("create");
    setIsEventModalOpen(true);
  }, []);

  const handleViewEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event as ExtendedCalendarEvent);
    setEventModalMode("view");
    setIsEventModalOpen(true);
  }, []);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event as ExtendedCalendarEvent);
    setEventModalMode("edit");
    setIsEventModalOpen(true);
  }, []);

  const handleCloseEventModal = useCallback(() => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
    setEventModalMode("create");
  }, []);

  const handleSaveEvent = useCallback(
    async (values: EventFormValues) => {
      setEventFormSubmitting(true);

      // Prepara o payload básico do evento
      const payload = {
        event_name: values.title,
        title: values.title,
        description: values.description,
        event_date: values.event_date,
        location: values.location,
        venue: values.location,
        city: values.city,
        cache_value: typeof values.cache_value === 'string'
          ? parseFloat(values.cache_value) || 0
          : values.cache_value || 0,
        commission_rate: typeof values.commission_rate === 'string'
          ? parseFloat(values.commission_rate) || 20
          : values.commission_rate || 20,
        status: values.status,
        // Mantém o primeiro DJ no campo dj_id para compatibilidade
        dj_id: values.dj_ids && values.dj_ids.length > 0 ? values.dj_ids[0] : null,
        producer_id: values.producer_id,
        contract_type: values.contract_type || 'basic',
      };

      try {
        let eventId: string;

        // Criar ou atualizar o evento
        if (eventModalMode === "edit" && selectedEvent?.id) {
          const response = await eventService.update(selectedEvent.id, payload);
          if (response?.error) {
            const message =
              response.error?.message ||
              (typeof response.error === "string" ? response.error : "Erro desconhecido.");
            throw new Error(message);
          }
          eventId = selectedEvent.id;
          toast({
            title: "Evento atualizado",
            description: "O evento foi atualizado com sucesso."
          });
        } else {
          const response = await eventService.create(payload);
          if (response?.error) {
            const message =
              response.error?.message ||
              (typeof response.error === "string" ? response.error : "Erro desconhecido.");
            throw new Error(message);
          }
          // Assume que o response retorna o evento criado com o ID
          eventId = response?.data?.id || response?.id;
          if (!eventId) {
            throw new Error("ID do evento não foi retornado após criação");
          }
          toast({
            title: "Evento criado",
            description: "O evento foi criado com sucesso."
          });
        }

        // IMPORTANTE: Processar os múltiplos DJs
        if (values.dj_ids && Array.isArray(values.dj_ids) && values.dj_ids.length > 0) {
          try {
            // 1. Limpar relações anteriores (importante para edição)
            const { error: deleteError } = await supabase
              .from('events_djs')
              .delete()
              .eq('event_id', eventId);

            if (deleteError) {
              console.error('Erro ao limpar relações anteriores:', deleteError);
              // Não vamos bloquear por isso, apenas logamos
            }

            // 2. Criar novas relações para cada DJ selecionado
            const eventsDjsRecords = values.dj_ids.map(djId => ({
              event_id: eventId,
              dj_id: djId,
              // Se você tiver cachê por DJ no formulário, adicione aqui:
              // fee: values.dj_fee_map?.[djId] || null,
            }));

            const { error: insertError } = await supabase
              .from('events_djs')
              .insert(eventsDjsRecords);

            if (insertError) {
              console.error('Erro ao criar relações DJ-Evento:', insertError);
              toast({
                title: "Aviso",
                description: "Evento salvo, mas houve um problema ao vincular os DJs. Tente editar o evento novamente.",
                variant: "destructive"
              });
            }
          } catch (djError) {
            console.error('Erro ao processar DJs:', djError);
            toast({
              title: "Aviso",
              description: "Evento salvo, mas houve um problema ao vincular os DJs.",
              variant: "destructive"
            });
          }
        }

        await refetchEvents();
        handleCloseEventModal();
      } catch (error: any) {
        console.error("Erro ao salvar evento:", error);
        const message = typeof error?.message === "string"
          ? error.message
          : "Não foi possível salvar o evento.";
        toast({
          title: "Erro ao salvar evento",
          description: message,
          variant: "destructive"
        });
      } finally {
        setEventFormSubmitting(false);
      }
    },
    [eventModalMode, handleCloseEventModal, refetchEvents, selectedEvent, toast],
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      if (!eventId) return;
      if (!window.confirm("Deseja excluir este evento permanentemente? Essa ação não pode ser desfeita.")) {
        return;
      }
      try {
        const response = await eventService.delete(eventId);
        if (response?.error) {
          const message =
            response.error?.message || (typeof response.error === "string" ? response.error : "Erro desconhecido.");
          throw new Error(message);
        }
        toast({ title: "Evento excluído", description: "O evento foi excluído com sucesso." });
        await refetchEvents();
      } catch (error: any) {
        console.error("Erro ao excluir evento:", error);
        const message = typeof error?.message === "string" ? error.message : "Não foi possível excluir o evento.";
        toast({ title: "Erro ao excluir evento", description: message, variant: "destructive" });
      }
    },
    [refetchEvents, toast],
  );

  const handleOpenContract = useCallback((event: CalendarEvent) => {
    setContractEvent(event as ExtendedCalendarEvent);
    setIsContractModalOpen(true);
  }, []);

  const handleCloseContractModal = useCallback(() => {
    setIsContractModalOpen(false);
    setContractEvent(null);
    setContractState(null);
    setContractTemplates([]);
    setContractError(null);
    setContractDj(null);
    setContractProducer(null);
    setContractEditing(false);
  }, []);

  const handleContractTemplateChange = useCallback(
    (templateId: string) => {
      setContractState((prev) => {
        if (!prev) return prev;
        const template = contractTemplates.find((item) => item.id === templateId);
        const nextContent = template ? template.content : prev.content;
        return {
          ...prev,
          templateId,
          content: nextContent,
        };
      });
    },
    [contractTemplates],
  );

  const handleContractChange = useCallback((update: Partial<EventContractFormState>) => {
    setContractState((prev) => (prev ? { ...prev, ...update } : prev));
  }, []);

  const handleContractSave = useCallback(async (): Promise<boolean> => {
    if (!contractEvent || !contractState) {
      return false;
    }

    setContractSaving(true);
    setContractError(null);

    try {
      const template = contractTemplates.find((item) => item.id === contractState.templateId);
      const processedContent = applyTemplatePlaceholders(
        contractState.content || template?.content || "",
        contractEvent,
        contractState,
        contractDj,
        contractProducer,
      );

      const { error } = await supabase
        .from("events")
        .update({
          cache_value: ensureCurrencyNumber(contractState.value),
          contract_type: contractState.templateId,
          contract_content: processedContent,
          special_requirements: buildSpecialRequirements(contractState),
        })
        .eq("id", contractEvent.id);

      if (error) {
        throw error;
      }

      setContractEditing(false);
      setContractState((prev) => (prev ? { ...prev, content: processedContent } : prev));
      toast({ title: "Contrato salvo", description: "As informações do contrato foram atualizadas." });
      await refetchEvents();
      return true;
    } catch (error: any) {
      console.error("Erro ao salvar contrato:", error);
      const message =
        typeof error?.message === "string" ? error.message : "Não foi possível salvar o contrato.";
      setContractError(message);
      toast({ title: "Erro ao salvar contrato", description: message, variant: "destructive" });
      return false;
    } finally {
      setContractSaving(false);
    }
  }, [contractDj, contractEvent, contractProducer, contractState, contractTemplates, refetchEvents, toast]);

  const handleContractAttach = useCallback(async () => {
    if (!contractEvent || !contractState) {
      return;
    }

    setContractAttaching(true);
    try {
      const saved = await handleContractSave();
      if (!saved) {
        return;
      }

      const { error } = await supabase
        .from("events")
        .update({ contract_attached: true })
        .eq("id", contractEvent.id);

      if (error) {
        throw error;
      }

      setContractState((prev) => (prev ? { ...prev, isAttached: true } : prev));
      toast({
        title: "Contrato anexado",
        description: "O contrato foi disponibilizado para o produtor.",
      });
      await refetchEvents();
    } catch (error: any) {
      console.error("Erro ao anexar contrato:", error);
      const message =
        typeof error?.message === "string" ? error.message : "Não foi possível anexar o contrato.";
      toast({ title: "Erro ao anexar contrato", description: message, variant: "destructive" });
    } finally {
      setContractAttaching(false);
    }
  }, [contractEvent, contractState, handleContractSave, refetchEvents, toast]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-white/80">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          Carregando calendário...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] p-6">
      <div className="mx-auto max-w-7xl space-y-6 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-[0_35px_60px_-30px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <EventsCalendar
          events={calendarEvents}
          djs={calendarDjs}
          producers={calendarProducers}
          onCreateEvent={handleCreateEvent}
          onViewEvent={handleViewEvent}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          onOpenContract={handleOpenContract}
        />

        <EventFormDialog
          open={isEventModalOpen}
          mode={eventModalMode}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseEventModal();
            } else {
              setIsEventModalOpen(true);
            }
          }}
          onSubmit={handleSaveEvent}
          initialData={selectedEvent as CalendarEvent | null}
          djs={calendarDjs}
          producers={calendarProducers}
          isSubmitting={eventFormSubmitting}
        />

        <EventContractModal
          open={isContractModalOpen}
          loading={contractLoading}
          error={contractError}
          event={contractEvent as CalendarEvent | null}
          dj={contractDj}
          producer={contractProducer}
          contract={contractState}
          templates={contractTemplates}
          isEditing={contractEditing}
          isSaving={contractSaving}
          isAttaching={contractAttaching}
          onClose={handleCloseContractModal}
          onToggleEditing={setContractEditing}
          onTemplateChange={handleContractTemplateChange}
          onChange={handleContractChange}
          onSave={() => {
            void handleContractSave();
          }}
          onAttach={() => {
            void handleContractAttach();
          }}
        />
      </div>
    </div>
  );
};

export default EventCalendar;
