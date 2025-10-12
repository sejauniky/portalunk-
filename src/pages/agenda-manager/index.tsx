import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarRange,
  Clock,
  Calendar as CalendarIcon,
  LayoutGrid,
  ListChecks,
  Share2,
  Users,
  Radio,
  ClipboardList,
  Plus,
  Music,
} from "lucide-react";
import Input from "@/components/ui/input";
import { useDJs } from "@/hooks/useDJs";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { eventService } from "@/services/supabaseService";

// Utility function to combine class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Simple toast notification system
const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; description?: string; variant?: string }>>([]);

  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return { toast, toasts };
};

// Date formatting utilities
const formatDate = (date: Date, formatStr: string) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  
  if (formatStr === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (formatStr === "dd/MM") return `${day}/${month}`;
  if (formatStr === "dd 'de' MMMM") return `${day} de ${monthNames[d.getMonth()]}`;
  
  return date.toLocaleDateString('pt-BR');
};

const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

const parseISODate = (dateString: string) => {
  return new Date(dateString);
};

// --- Tipos e Constantes ---

const STORAGE_KEYS = {
  personal: "agenda-manager-personal",
  content: "agenda-manager-content",
  kanban: "agenda-manager-kanban-settings",
} as const;

type KanbanGroupBy = "status" | "priority" | "category";

type KanbanSettingsType = {
  groupBy: KanbanGroupBy;
  columns: Record<string, { title: string; color: string }>;
};

type AgendaItem = {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO String
  time?: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  category: "instagram" | "music_project" | "set_release" | "event" | "personal";
  sharedWithDjs?: boolean;
  djId?: string; // ID do DJ vinculado
};

const defaultKanbanSettings: KanbanSettingsType = {
  groupBy: "status",
  columns: {
    todo: { title: "A Fazer", color: "#6b7280" },
    in_progress: { title: "Em Andamento", color: "#f59e0b" },
    completed: { title: "Concluído", color: "#10b981" },
    low: { title: "Baixa Prioridade", color: "#3b82f6" },
    medium: { title: "Média Prioridade", color: "#f59e0b" },
    high: { title: "Alta Prioridade", color: "#ef4444" },
    instagram: { title: "Instagram", color: "#ec4899" },
    music_project: { title: "Projetos Musicais", color: "#8b5cf6" },
    set_release: { title: "Lançamentos", color: "#3b82f6" },
    event: { title: "Eventos", color: "#10b981" },
    personal: { title: "Pessoal", color: "#6b7280" },
  },
};

const statusOptions = [
  { value: "todo", label: "A Fazer" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluído" },
];

const priorityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];

const categoryOptions = [
  { value: "personal", label: "Pessoal" },
  { value: "event", label: "Evento" },
  { value: "instagram", label: "Instagram" },
  { value: "music_project", label: "Projeto Musical" },
  { value: "set_release", label: "Lançamento" },
];

// Funções de inicialização sem dados mocados (limpos)
const getInitialPersonalItems = (): AgendaItem[] => [];
const getInitialContentItems = (): AgendaItem[] => [];
const getInitialDjs = () => [];

const safeParseDate = (value: string) => {
  const parsed = parseISODate(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(value);
  }
  return parsed;
};

const getColumnKey = (item: AgendaItem, settings: KanbanSettingsType) => {
  if (settings.groupBy === "status") return item.status;
  if (settings.groupBy === "priority") return item.priority;
  return item.category;
};

// --- Hooks ---

function useLocalStorageState<T>(key: string, fallback: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return fallback;
      return JSON.parse(stored) as T;
    } catch (error) {
      console.warn(`Erro ao carregar localStorage (${key}):`, error);
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Erro ao salvar localStorage (${key}):`, error);
    }
  }, [key, state]);

  return [state, setState];
}

// --- Componentes Reutilizáveis Simples ---

const Select = ({ label, value, options, onChange, triggerClassName = "" }: any) => (
  <div className="grid gap-2">
    {label && <Label>{label}</Label>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", triggerClassName)}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const BreadcrumbTrail = () => (
  <div className="text-sm text-muted-foreground">
    Dashboard / Agenda Manager
  </div>
);

const ToastContainer = ({ toasts }: { toasts: any[] }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={cn(
          "rounded-lg border p-4 shadow-lg bg-background",
          toast.variant === "destructive" && "border-red-500 bg-red-50"
        )}
      >
        <div className="font-semibold">{toast.title}</div>
        {toast.description && (
          <div className="text-sm text-muted-foreground">{toast.description}</div>
        )}
      </div>
    ))}
  </div>
);

// --- Seção da Agenda Pessoal ---

const PersonalAgendaSection = ({
  items,
  onCreate,
  onUpdateStatus,
  onDelete,
}: {
  items: AgendaItem[];
  onCreate: (payload: Omit<AgendaItem, "id">) => void;
  onUpdateStatus: (id: string, status: AgendaItem["status"]) => void;
  onDelete: (id: string) => void;
}) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date(),
    time: "",
    priority: "medium" as AgendaItem["priority"],
    status: "todo" as AgendaItem["status"],
  });

  const eventsForDay = useMemo(() => {
    return items.filter((item) => isSameDay(safeParseDate(item.date), selectedDate)).sort((a, b) => {
      const timeA = a.time ? Number(a.time.replace(":", "")) : 0;
      const timeB = b.time ? Number(b.time.replace(":", "")) : 0;
      return timeA - timeB;
    });
  }, [items, selectedDate]);

  const monthLabel = useMemo(() => {
    const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    return `${monthNames[viewMonth.getMonth()]} de ${viewMonth.getFullYear()}`;
  }, [viewMonth]);

  const buildMonthGrid = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstJsDay = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
    const firstMondayIndex = (firstJsDay + 6) % 7; // 0=Mon..6=Sun
    const totalCells = Math.ceil((firstMondayIndex + daysInMonth) / 7) * 7;

    const cells: { date: Date; inCurrent: boolean }[] = [];
    // Leading previous month days
    for (let i = 0; i < firstMondayIndex; i++) {
      const d = new Date(year, month, i - firstMondayIndex + 1);
      cells.push({ date: d, inCurrent: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inCurrent: true });
    }
    // Trailing next month days
    while (cells.length < totalCells) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inCurrent: false });
    }
    return cells;
  }, [viewMonth]);

  const getItemsFor = (d: Date) => items
    .filter((item) => isSameDay(safeParseDate(item.date), d))
    .sort((a, b) => {
      const ta = a.time ? Number(a.time.replace(":", "")) : 0;
      const tb = b.time ? Number(b.time.replace(":", "")) : 0;
      return ta - tb;
    });

  const handleSubmit = () => {
    if (!formData.title) {
      toast({ title: "Informe um título", variant: "destructive" });
      return;
    }
    const payload: Omit<AgendaItem, "id"> = {
      title: formData.title,
      description: formData.description,
      date: formData.date.toISOString(),
      time: formData.time,
      status: formData.status,
      priority: formData.priority,
      category: "personal",
      sharedWithDjs: false,
    };
    onCreate(payload);
    toast({ title: "Compromisso adicionado", description: "A agenda pessoal foi atualizada." });
    setDialogOpen(false);
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      time: "",
      priority: "medium",
      status: "todo",
    });
  };

  const goPrevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const goNextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  return (
    <div className="space-y-6">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5" />
              <span>{monthLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={goPrevMonth}>Anterior</Button>
              <Button size="sm" variant="outline" onClick={goNextMonth}>Próximo</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 text-xs font-semibold text-muted-foreground">
            {['SEG','TER','QUA','QUI','SEX','SAB','DOM'].map((d) => (
              <div key={d} className="border border-border/60 p-2 text-center bg-muted/30">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l border-b border-border/60">
            {buildMonthGrid.map((cell, idx) => {
              const dayItems = getItemsFor(cell.date);
              const isSelected = isSameDay(cell.date, selectedDate);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setSelectedDate(cell.date); }}
                  className={cn(
                    "relative h-28 w-full border-t border-r border-border/60 p-2 text-left overflow-hidden",
                    !cell.inCurrent && "bg-muted/20 text-muted-foreground",
                    isSelected && "ring-2 ring-primary z-10"
                  )}
                >
                  <div className="text-xs font-semibold">{cell.date.getDate()}</div>
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, 3).map((it) => (
                      <div key={it.id} className="truncate text-[11px]">
                        <span className="mr-1 text-muted-foreground">{it.time || ""}</span>
                        {it.title}
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-[11px] text-muted-foreground">+{dayItems.length - 3} mais</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Button onClick={() => setDialogOpen(true)} className="w-full">Novo Compromisso</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>
              Agenda do dia {formatDate(selectedDate, "dd 'de' MMMM")}
            </span>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3.5 w-3.5" />
              {eventsForDay.length} itens
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventsForDay.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.time && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {item.time}
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "text-xs",
                        item.priority === "high" && "bg-red-500",
                        item.priority === "medium" && "bg-amber-500",
                        item.priority === "low" && "bg-blue-500"
                      )}
                    >
                      {priorityOptions.find((opt) => opt.value === item.priority)?.label}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status.value}
                      size="sm"
                      variant={item.status === status.value ? "default" : "ghost"}
                      className="h-8 text-xs"
                      onClick={() => onUpdateStatus(item.id, status.value as AgendaItem["status"])}
                    >
                      {status.label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 text-xs"
                    iconName="Trash2"
                    onClick={() => { if (window.confirm('Excluir este compromisso?')) onDelete(item.id); }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
            {eventsForDay.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 py-12 text-center text-sm text-muted-foreground">
                <CalendarIcon className="h-6 w-6" />
                Nenhum compromisso para esta data.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Compromisso</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="personal-title">Título *</Label>
              <Input
                id="personal-title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex.: Reunião com equipe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="personal-description">Descrição</Label>
              <Textarea
                id="personal-description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes do compromisso"
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(formData.date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData((prev) => ({ ...prev, date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="personal-time">Horário</Label>
                <Input
                  id="personal-time"
                  type="time"
                  value={formData.time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                value={formData.status}
                options={statusOptions}
                onChange={(value: string) => setFormData((prev) => ({ ...prev, status: value as AgendaItem["status"] }))}
              />
              <Select
                label="Prioridade"
                value={formData.priority}
                options={priorityOptions}
                onChange={(value: string) => setFormData((prev) => ({ ...prev, priority: value as AgendaItem["priority"] }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Salvar compromisso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Seção do Planejamento de Conteúdo ---

const ContentPlannerSection = ({
  items,
  settings,
  onCreate,
  onUpdate,
  onDelete,
  djs,
}: {
  items: AgendaItem[];
  settings: KanbanSettingsType;
  onCreate: (payload: Omit<AgendaItem, "id">) => void;
  onUpdate: (id: string, data: Partial<AgendaItem>) => void;
  onDelete: (id: string) => void;
  djs: any[];
}) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date(),
    status: "todo" as AgendaItem["status"],
    priority: "medium" as AgendaItem["priority"],
    category: "instagram" as AgendaItem["category"],
    djId: "",
  });

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const columns = useMemo(() => {
    const activeKeys = Object.keys(settings.columns).filter((key) => {
      if (settings.groupBy === "status") {
        return key === "todo" || key === "in_progress" || key === "completed";
      }
      if (settings.groupBy === "priority") {
        return key === "low" || key === "medium" || key === "high";
      }
      return ["instagram", "music_project", "set_release", "event", "personal"].includes(key);
    });

    return activeKeys.map((key) => ({
      id: key,
      title: settings.columns[key]?.title ?? key,
      color: settings.columns[key]?.color ?? "#6b7280",
      items: items.filter((item) => getColumnKey(item, settings) === key),
    }));
  }, [items, settings]);

  const handleSubmit = () => {
    if (!formData.title) {
      toast({ title: "Informe um título", variant: "destructive" });
      return;
    }
    const payload: Omit<AgendaItem, "id"> = {
      title: formData.title,
      description: formData.description,
      date: formData.date.toISOString(),
      status: formData.status,
      priority: formData.priority,
      category: formData.category,
      djId: formData.djId || undefined,
    };
    onCreate(payload);
    toast({ title: "Item criado", description: "O planejamento de conteúdo foi atualizado." });
    setDialogOpen(false);
    setQuickAddColumn(null);
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      status: "todo",
      priority: "medium",
      category: "instagram",
      djId: "",
    });
  };

  const handleQuickAdd = (columnId: string) => {
    setQuickAddColumn(columnId);
    // Pre-fill form based on column
    if (settings.groupBy === "status") {
      setFormData(prev => ({ ...prev, status: columnId as AgendaItem["status"] }));
    } else if (settings.groupBy === "priority") {
      setFormData(prev => ({ ...prev, priority: columnId as AgendaItem["priority"] }));
    } else {
      setFormData(prev => ({ ...prev, category: columnId as AgendaItem["category"] }));
    }
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Planejamento de Conteúdo</h2>
          <p className="text-sm text-muted-foreground">
            Organize campanhas, entregas de mídia e rotinas de relacionamento com os DJs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "kanban" | "list")}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="h-4 w-4" /> Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <ListChecks className="h-4 w-4" /> Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setDialogOpen(true)}>
            Novo item
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((column) => (
            <div key={column.id} className="w-[280px] flex-shrink-0 rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <p className="text-sm font-semibold">{column.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{column.items.length}</Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleQuickAdd(column.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {column.items.map((item) => (
                  <Card key={item.id} className="border border-border/60 bg-background/80 shadow-sm">
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{item.title}</p>
                          {item.description && (
                            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        {item.djId && (
                          <Badge variant="outline" className="gap-1">
                            <Music className="h-3 w-3" />
                            DJ
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className="gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {formatDate(safeParseDate(item.date), "dd/MM")}
                        </Badge>
                        {item.djId && djs.find(dj => dj.id === item.djId) && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            {djs.find(dj => dj.id === item.djId)?.artist_name}
                          </Badge>
                        )}
                        <Badge
                          className={cn(
                            item.priority === "high" && "bg-red-500",
                            item.priority === "medium" && "bg-amber-500",
                            item.priority === "low" && "bg-blue-500"
                          )}
                        >
                          {priorityOptions.find((opt) => opt.value === item.priority)?.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {statusOptions.map((status) => (
                          <Button
                            key={`${item.id}-${status.value}`}
                            size="sm"
                            variant={item.status === status.value ? "default" : "outline"}
                            className="h-7 text-xs"
                            onClick={() => onUpdate(item.id, { status: status.value as AgendaItem["status"] })}
                          >
                            {status.label}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive"
                          iconName="Trash2"
                          onClick={() => { if (window.confirm('Excluir este item?')) onDelete(item.id); }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {column.items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
                    Nenhum item nesta coluna.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {items.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
              Nenhuma tarefa cadastrada.
            </div>
          )}
          {items.map((item) => (
            <Card key={item.id} className="border border-border/60 bg-background/80">
              <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(safeParseDate(item.date), "dd/MM/yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Radio className="h-3 w-3" />
                      {categoryOptions.find((option) => option.value === item.category)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={item.status}
                    options={statusOptions}
                    onChange={(value: string) => onUpdate(item.id, { status: value as AgendaItem["status"] })}
                    triggerClassName="w-40"
                  />
                  <Select
                    value={item.priority}
                    options={priorityOptions}
                    onChange={(value: string) => onUpdate(item.id, { priority: value as AgendaItem["priority"] })}
                    triggerClassName="w-32"
                  />
                  <Select
                    value={item.category}
                    options={categoryOptions}
                    onChange={(value: string) => onUpdate(item.id, { category: value as AgendaItem["category"] })}
                    triggerClassName="w-44"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    iconName="Trash2"
                    onClick={() => { if (window.confirm('Excluir este item?')) onDelete(item.id); }}
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo item de conteúdo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="content-title">Título *</Label>
              <Input
                id="content-title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex.: Post com highlights do último evento"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content-description">Descrição</Label>
              <Textarea
                id="content-description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva objetivos, referências e materiais necessários"
                rows={4}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                value={formData.status}
                options={statusOptions}
                onChange={(value: string) => setFormData((prev) => ({ ...prev, status: value as AgendaItem["status"] }))}
              />
              <Select
                label="Prioridade"
                value={formData.priority}
                options={priorityOptions}
                onChange={(value: string) => setFormData((prev) => ({ ...prev, priority: value as AgendaItem["priority"] }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Categoria"
                value={formData.category}
                options={categoryOptions}
                onChange={(value: string) => setFormData((prev) => ({ ...prev, category: value as AgendaItem["category"] }))}
              />
              <div className="grid gap-2">
                <Label>Data sugerida</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(formData.date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData((prev) => ({ ...prev, date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content-dj">Selecionar DJ (opcional)</Label>
              <Select
                value={formData.djId}
                options={[
                  { value: "", label: "Nenhum DJ selecionado" },
                  ...djs.map(dj => ({ value: dj.id, label: dj.artist_name }))
                ]}
                onChange={(value: string) => setFormData((prev) => ({ ...prev, djId: value }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Salvar item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Seção de Agenda dos DJs ---

const DjAgendaSection = ({ 
  djs, 
  contentItems 
}: { 
  djs: any[];
  contentItems: AgendaItem[];
}) => {
  const [selectedDJ, setSelectedDJ] = useState<any | null>(null);

  if (selectedDJ) {
    return <DjDetailView dj={selectedDJ} contentItems={contentItems} onBack={() => setSelectedDJ(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Agenda dos DJs</h2>
        <p className="text-sm text-muted-foreground">
          Visualize a agenda e conteúdo programado de cada DJ.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {djs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Nenhum DJ cadastrado ainda.</p>
          </div>
        ) : (
          djs.map((dj) => {
            const djContentCount = contentItems.filter(item => item.djId === dj.id).length;
            return (
              <Card key={dj.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <img
                      src={dj.avatar_url || dj.profile_image_url || '/placeholder.svg'}
                      alt={dj.artist_name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                    />
                    {djContentCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {djContentCount}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{dj.artist_name}</p>
                    <p className="text-sm text-muted-foreground">{dj.real_name}</p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedDJ(dj)}
                  >
                    Ver Agenda
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

const DjDetailView = ({ 
  dj, 
  contentItems, 
  onBack 
}: { 
  dj: any; 
  contentItems: AgendaItem[];
  onBack: () => void;
}) => {
  const djId = dj?.id;
  const { data: events = [], loading: eventsLoading } = useSupabaseData(eventService, 'getByDj', [djId], [djId]);
  const djContent = contentItems.filter(item => item.djId === djId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <div className="flex items-center gap-3">
          <img
            src={dj.avatar_url || dj.profile_image_url || '/placeholder.svg'}
            alt={dj.artist_name}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
          />
          <div>
            <h2 className="text-xl font-bold">{dj.artist_name}</h2>
            <p className="text-sm text-muted-foreground">{dj.real_name}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Eventos ({events.length})</TabsTrigger>
          <TabsTrigger value="content">Conteúdo Programado ({djContent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {eventsLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Carregando eventos...</p>
            </div>
          )}
          
          {!eventsLoading && events.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum evento agendado para este DJ.</p>
              </CardContent>
            </Card>
          )}

          {!eventsLoading && events.map((event: any) => (
            <div key={event.id} className="p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <p className="text-sm font-medium">
                {event.title || event.event_name || 'Evento sem título'} - {event.event_date ? new Date(event.event_date).toLocaleDateString('pt-BR') : 'Data não definida'}
              </p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {djContent.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum conteúdo programado para este DJ.</p>
              </CardContent>
            </Card>
          )}

          {djContent.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        item.status === "completed" && "bg-green-500",
                        item.status === "in_progress" && "bg-amber-500",
                        item.status === "todo" && "bg-gray-500"
                      )}
                    >
                      {statusOptions.find(opt => opt.value === item.status)?.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(safeParseDate(item.date), "dd/MM/yyyy")}
                    </Badge>
                    <Badge variant="outline">
                      {categoryOptions.find(opt => opt.value === item.category)?.label}
                    </Badge>
                    <Badge
                      className={cn(
                        item.priority === "high" && "bg-red-500",
                        item.priority === "medium" && "bg-amber-500",
                        item.priority === "low" && "bg-blue-500"
                      )}
                    >
                      {priorityOptions.find(opt => opt.value === item.priority)?.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Componente Principal: AgendaManager ---

const AgendaManager = () => {
  const { toast, toasts } = useToast();
  const { djs } = useDJs();
  
  // States gerenciados com Local Storage (inicialização vazia)
  const [personalItems, setPersonalItems] = useLocalStorageState<AgendaItem[]>(STORAGE_KEYS.personal, getInitialPersonalItems());
  const [contentItems, setContentItems] = useLocalStorageState<AgendaItem[]>(STORAGE_KEYS.content, getInitialContentItems());
  const [kanbanSettings, setKanbanSettings] = useLocalStorageState<KanbanSettingsType>(STORAGE_KEYS.kanban, defaultKanbanSettings);
  
  const [activeTab, setActiveTab] = useState("personal");

  // Funções de CRUD
  const createItem = useCallback((payload: Omit<AgendaItem, "id">) => {
    const newItem: AgendaItem = {
      ...payload,
      id: `${payload.category}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    if (newItem.category === "personal") {
      setPersonalItems((prev) => [...prev, newItem]);
    } else {
      setContentItems((prev) => [...prev, newItem]);
    }
  }, [setPersonalItems, setContentItems]);

  const updatePersonalStatus = useCallback((id: string, status: AgendaItem["status"]) => {
    setPersonalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    toast({ title: "Status atualizado", description: "O compromisso pessoal foi movido." });
  }, [setPersonalItems, toast]);

  const updateContentItem = useCallback((id: string, data: Partial<AgendaItem>) => {
    setContentItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    toast({ title: "Item de Conteúdo atualizado" });
  }, [setContentItems, toast]);

  // Função para mudar o agrupamento do Kanban
  const changeKanbanGroupBy = (groupBy: KanbanGroupBy) => {
    setKanbanSettings(prev => ({ ...prev, groupBy }));
    toast({ title: "Visualização Kanban atualizada", description: `Agrupado por: ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}` });
  };
  
  // Função para obter o título de agrupamento atual
  const getCurrentGroupByTitle = () => {
    if (kanbanSettings.groupBy === "status") return "Status";
    if (kanbanSettings.groupBy === "priority") return "Prioridade";
    return "Categoria";
  };
  
  return (
    <div className="p-8 space-y-8 min-h-screen">
      <BreadcrumbTrail />
      
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-primary" />
          Agenda Manager
        </h1>
        <p className="text-lg text-muted-foreground">
          Gerencie compromissos pessoais e o pipeline de conteúdo da sua agência.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="personal" className="gap-2">
            <CalendarRange className="h-4 w-4" /> Agenda Pessoal
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Radio className="h-4 w-4" /> Planejador de Conteúdo
          </TabsTrigger>
          <TabsTrigger value="djs" className="gap-2">
            <Music className="h-4 w-4" /> Agenda DJ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalAgendaSection 
            items={personalItems.filter(item => item.category === "personal")}
            onCreate={(payload) => createItem(payload)}
            onUpdateStatus={updatePersonalStatus}
          />
        </TabsContent>

        <TabsContent value="content" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                <Label htmlFor="kanban-group-by" className="whitespace-nowrap font-semibold">Agrupar Kanban por:</Label>
                <Select
                  value={kanbanSettings.groupBy}
                  options={[
                    { value: "status", label: "Status" },
                    { value: "priority", label: "Prioridade" },
                    { value: "category", label: "Categoria" },
                  ]}
                  onChange={(value: string) => changeKanbanGroupBy(value as KanbanGroupBy)}
                  triggerClassName="w-40"
                />
              </div>
              
              <ContentPlannerSection
                items={contentItems.filter(item => item.category !== "personal")}
                settings={kanbanSettings}
                onCreate={(payload) => createItem(payload)}
                onUpdate={updateContentItem}
                djs={djs}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="djs" className="mt-6">
          <DjAgendaSection djs={djs} contentItems={contentItems} />
        </TabsContent>
      </Tabs>
      
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default AgendaManager;
