import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileText,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-primitive";

export type CalendarEventStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  event_date: string;
  location: string;
  city: string;
  cache_value: number;
  commission_rate: number | null;
  status: CalendarEventStatus;
  dj_id: string;
  producer_id: string;
  created_at: string;
  updated_at: string;
  contract_type?: string | null;
  dj_ids?: string[];
  dj_names?: string[];
  producer_name?: string | null;
  contract_attached?: boolean;
  contract_content?: string | null;
  special_requirements?: string | null;
  event_time?: string | null;
  finance_status?: string;
}

export interface CalendarDJ {
  id: string;
  name: string;
  email: string;
  base_price?: number;
}

export interface CalendarProducer {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
}

interface EventsCalendarProps {
  events?: CalendarEvent[];
  djs?: CalendarDJ[];
  producers?: CalendarProducer[];
  onCreateEvent?: () => void;
  onViewEvent?: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onOpenContract?: (event: CalendarEvent) => void;
}

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const statusBadgeClasses: Record<CalendarEventStatus, string> = {
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<CalendarEventStatus, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const parseEventDate = (value: string) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatEventDate = (value: string, options?: Intl.DateTimeFormatOptions) => {
  const date = parseEventDate(value);
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", options ?? {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const EventsCalendar = ({
  events = [],
  djs = [],
  producers = [],
  onCreateEvent,
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
  onOpenContract,
}: EventsCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const dj = djs.find((item) => item.id === event.dj_id);
      const producer = producers.find((item) => item.id === event.producer_id);
      const normalizedSearch = searchTerm.trim().toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        event.title.toLowerCase().includes(normalizedSearch) ||
        event.location.toLowerCase().includes(normalizedSearch) ||
        event.city.toLowerCase().includes(normalizedSearch) ||
        (dj?.name.toLowerCase().includes(normalizedSearch) ?? false) ||
        (producer?.name.toLowerCase().includes(normalizedSearch) ?? false);

      const matchesStatus =
        statusFilter === "all" ||
        event.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [events, djs, producers, searchTerm, statusFilter]);

  const todayEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredEvents.filter((event) => {
      const eventDate = parseEventDate(event.event_date);
      if (!eventDate) {
        return false;
      }
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
  }, [filteredEvents]);

  const upcomingEvents = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(startOfToday);
    sevenDaysFromNow.setDate(startOfToday.getDate() + 7);

    return filteredEvents
      .filter((event) => {
        const eventDate = parseEventDate(event.event_date);
        if (!eventDate) {
          return false;
        }
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= startOfToday && eventDate <= sevenDaysFromNow;
      })
      .sort((a, b) => {
        const firstDate = parseEventDate(a.event_date)?.getTime() ?? 0;
        const secondDate = parseEventDate(b.event_date)?.getTime() ?? 0;
        return firstDate - secondDate;
      });
  }, [filteredEvents]);

  const confirmedEvents = useMemo(
    () => filteredEvents.filter((event) => event.status === "confirmed").length,
    [filteredEvents],
  );

  const monthLabel = useMemo(() => {
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate]);

  const sortedEvents = useMemo(
    () =>
      [...filteredEvents].sort((a, b) => {
        const firstDate = parseEventDate(a.event_date)?.getTime() ?? 0;
        const secondDate = parseEventDate(b.event_date)?.getTime() ?? 0;
        return firstDate - secondDate;
      }),
    [filteredEvents],
  );

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      nextDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return nextDate;
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendário de Eventos</h1>
          <p className="text-muted-foreground">
            {events.length} evento{events.length !== 1 ? "s" : ""} cadastrado{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={onCreateEvent}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{events.length}</div>
            <p className="text-xs text-muted-foreground">Eventos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{todayEvents.length}</div>
            <p className="text-xs text-muted-foreground">Eventos hoje</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximos 7 dias</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Eventos próximos</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmados</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{confirmedEvents}</div>
            <p className="text-xs text-muted-foreground">Eventos confirmados</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground capitalize">{monthLabel}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {(["month", "week", "list"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="capitalize"
              >
                {mode === "month" ? "Mês" : mode === "week" ? "Semana" : "Lista"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar eventos, DJs, locais..."
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </motion.div>

      {todayEvents.length > 0 && (
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-accent" />
            Eventos de Hoje
          </h3>
          <div className="space-y-3">
            {todayEvents.map((event) => {
              const dj = djs.find((item) => item.id === event.dj_id);
              const formattedDate =
                formatEventDate(event.event_date, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }) ?? "Data não definida";
              return (
                <div key={event.id} className="p-4 bg-accent/10 border border-accent/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.location} • {event.city}
                      </p>
                      <p className="text-sm text-accent">{Array.isArray(event.dj_names) && event.dj_names.length > 0 ? event.dj_names.join(', ') : (dj?.name || 'DJ não informado')}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-accent font-medium">{formattedDate}</p>
                      <Badge className={statusBadgeClasses[event.status]}> {statusLabels[event.status]} </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event) => {
            const formattedDate =
              formatEventDate(event.event_date, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }) ?? "Data não definida";
            const weekdayLabel = formatEventDate(event.event_date, { weekday: "long" });
            const dj = djs.find((item) => item.id === event.dj_id);
            const producer = producers.find((item) => item.id === event.producer_id);

            return (
              <Card key={event.id} className="glass-card group hover:shadow-glow transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground mb-2">{event.title}</h4>
                      {event.description && (
                        <p className="text-muted-foreground text-sm mb-3">{event.description}</p>
                      )}
                    </div>
                    <Badge className={statusBadgeClasses[event.status]}>
                      {statusLabels[event.status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground font-medium">{formattedDate}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {weekdayLabel ?? "Data não definida"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground font-medium">{event.location}</p>
                        <p className="text-xs text-muted-foreground">{event.city}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground font-medium">{Array.isArray(event.dj_names) && event.dj_names.length > 0 ? event.dj_names.join(', ') : (dj?.name || 'DJ não informado')}</p>
                        <p className="text-xs text-muted-foreground">{producer?.name || "Produtor não informado"}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          R$ {Number(event.cache_value || 0).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">Cachê</p>
                        <p className="text-xs text-muted-foreground">
                          Comissão UNK: {event.commission_rate != null ? `${event.commission_rate}%` : "Não informada"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" onClick={() => onViewEvent?.(event)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenContract?.(event)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Contrato
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEditEvent?.(event)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) {
                          onDeleteEvent?.(event.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                {events.length === 0 ? "Nenhum evento agendado" : "Nenhum evento encontrado"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {events.length === 0
                  ? "A agenda está livre para novos eventos"
                  : "Tente ajustar os filtros para encontrar eventos"}
              </p>
              {events.length === 0 && (
                <Button
                  onClick={onCreateEvent}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default EventsCalendar;
