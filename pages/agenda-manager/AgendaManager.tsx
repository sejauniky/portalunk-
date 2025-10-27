'use client';

import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { eventService, producerService } from '../../services/supabaseService';
import { DJService } from '../../services/djService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const DJCard = ({ dj, onViewAgenda }) => (
  <div className="bg-card border border-border rounded-lg shadow p-4 flex flex-col items-center w-full max-w-xs hover:shadow-lg transition-shadow">
    <img
      src={dj.avatar_url || dj.profile_image_url || '/placeholder.svg'}
      alt={dj.artist_name}
      className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-primary/20"
    />
    <div className="font-bold text-lg text-center text-foreground">{dj.artist_name}</div>
    <div className="text-sm text-muted-foreground text-center mb-2">{dj.real_name}</div>
    {dj.email && (
      <div className="text-sm text-center mb-2">
        <a href={`mailto:${dj.email}`} className="text-primary hover:underline">{dj.email}</a>
      </div>
    )}
    <button
      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg w-full mt-2 hover:bg-primary/90 transition-colors"
      onClick={() => onViewAgenda(dj)}
    >
      Ver Agenda
    </button>
  </div>
);

const AgendaManager = () => {
  const { data: djRecords = [] } = useSupabaseData(DJService, 'getAll', [], []);
  const [selectedDJ, setSelectedDJ] = useState(null);
  const [activeTab, setActiveTab] = useState('todos');

  const handleViewAgenda = (dj) => {
    setSelectedDJ(dj);
    setActiveTab(dj.id);
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Agenda Pessoal</h1>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'todos'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          onClick={() => setActiveTab('todos')}
        >
          Todos os DJs
        </button>
        {djRecords.map((dj) => (
          <button
            key={dj.id}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === dj.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            onClick={() => {
              setSelectedDJ(dj);
              setActiveTab(dj.id);
            }}
          >
            {dj.artist_name}
          </button>
        ))}
      </div>

      {activeTab === 'todos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {djRecords.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Nenhum DJ cadastrado ainda.</p>
            </div>
          ) : (
            djRecords.map((dj) => (
              <DJCard key={dj.id} dj={dj} onViewAgenda={handleViewAgenda} />
            ))
          )}
        </div>
      )}

      {activeTab !== 'todos' && selectedDJ && (
        <DjAgenda dj={selectedDJ} />
      )}
    </div>
  );
};

// Componente para mostrar a agenda individual do DJ em formato de calendário mensal
function DjAgenda({ dj }) {
  const { toast } = useToast();
  const djId = dj?.id;
  const { data: events = [], loading, error, refetch } = useSupabaseData(eventService, 'getByDj', [djId], [djId]);
  const { data: producers = [] } = useSupabaseData(producerService, 'getAll', [], []);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    event_date: '',
    location: '',
    city: '',
    status: 'pending',
    producer_id: '',
  });
  const handleFormChange = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const handleCreate = async () => {
    if (!djId || !form.title || !form.event_date || !form.location || !form.city) return;
    const payload: any = {
      event_name: form.title,
      title: form.title,
      description: '',
      event_date: form.event_date,
      location: form.location,
      venue: form.location,
      city: form.city,
      cache_value: 0,
      commission_rate: 0,
      status: form.status,
      dj_ids: [djId],
      dj_id: djId,
      producer_id: form.producer_id || null,
      contract_type: 'basic',
      cache_exempt: true,
    };
    const res = await eventService.create(payload);
    if (res?.error) {
      toast({ title: 'Erro ao criar compromisso', description: String(res.error), variant: 'destructive' });
    } else {
      toast({ title: 'Compromisso criado', description: 'O evento foi criado com sucesso.' });
      setIsCreateOpen(false);
      setForm({ title: '', event_date: '', location: '', city: '', status: 'pending', producer_id: '' });
      await refetch();
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calcular dias vazios no início do mês (para alinhar com o dia da semana)
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  // Agrupar eventos por dia
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, any[]>();

    const parseLocalDate = (value: string) => {
      if (!value) return null as Date | null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map((v) => Number(v));
        const local = new Date(y, m - 1, d);
        return Number.isNaN(local.getTime()) ? null : local;
      }
      const dt = new Date(value);
      return Number.isNaN(dt.getTime()) ? null : dt;
    };

    (events || []).forEach((event: any) => {
      const raw = event?.event_date as string | null | undefined;
      if (!raw) return;
      const eventDate = parseLocalDate(raw);
      if (!eventDate) return;
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push(event);
    });

    return grouped;
  }, [events]);

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header com navegação de mês */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Agenda de {dj.artist_name}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-background">
            <Button size="sm" variant={viewMode === 'calendar' ? 'default' : 'ghost'} onClick={() => setViewMode('calendar')}>Calendário</Button>
            <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')}>Lista</Button>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-neon-purple to-neon-blue text-white border-0 shadow-glow">Criar compromisso</Button>
          <div className="flex items-center gap-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xl font-semibold uppercase min-w-[200px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Carregando eventos...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-destructive">
          Erro ao carregar eventos
        </div>
      )}

      {!loading && !error && viewMode === 'calendar' && (
        <div className="bg-background rounded-lg border border-border overflow-x-auto">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 min-w-[700px] bg-primary/10">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-3 text-center font-semibold text-sm uppercase text-primary border-r border-border last:border-r-0"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7 min-w-[700px]">
            {/* Dias vazios no início */}
            {emptyDays.map((_, index) => (
              <div
                key={`empty-${index}`}
                className="min-h-[120px] border-r border-b border-border bg-muted/20"
              />
            ))}

            {/* Dias do mês */}
            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(dateKey) || [];
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dateKey}
                  className={`min-h-[120px] border-r border-b border-border p-2 ${!isSameMonth(day, currentMonth) ? 'bg-muted/20' : 'bg-card'
                    } ${isToday ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex flex-col h-full">
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : 'text-foreground'
                      }`}>
                      {format(day, 'd')}
                    </div>

                    <div className="flex-1 space-y-1 overflow-auto">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded bg-primary/20 text-primary truncate"
                          title={`${event.title || event.event_name} - ${event.location || event.venue}`}
                        >
                          {event.title || event.event_name || 'Evento'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && viewMode === 'list' && (
        <div className="bg-background rounded-lg border border-border p-4">
          {(events || [])
            .slice()
            .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            .map((e: any) => (
              <div key={e.id} className="flex items-center justify-between border-b border-border/70 py-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-foreground">{e.title || e.event_name || 'Evento'}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(e.event_date), 'dd/MM/yyyy')} • {e.location || e.venue || ''}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-muted/50 capitalize">{e.status}</span>
              </div>
            ))}
          {(!events || events.length === 0) && (
            <div className="text-sm text-muted-foreground">Nenhum compromisso.</div>
          )}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo compromisso</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => handleFormChange('title', e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Data</Label>
              <Input type="date" value={form.event_date} onChange={(e) => handleFormChange('event_date', e.target.value)} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Local</Label>
                <Input value={form.location} onChange={(e) => handleFormChange('location', e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => handleFormChange('city', e.target.value)} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Status</Label>
                <select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={form.status} onChange={(e) => handleFormChange('status', e.target.value)}>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label>Produtor</Label>
                <select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={form.producer_id} onChange={(e) => handleFormChange('producer_id', e.target.value)}>
                  <option value="">Sem produtor</option>
                  {(producers || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name || p.company_name || p.email}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgendaManager;
