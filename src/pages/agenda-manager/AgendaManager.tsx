import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { eventService } from '../../services/supabaseService';
import { DJService } from '../../services/djService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="p-6">
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
  const djId = dj?.id;
  const { data: events = [], loading, error } = useSupabaseData(eventService, 'getByDj', [djId], [djId]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calcular dias vazios no início do mês (para alinhar com o dia da semana)
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  // Agrupar eventos por dia
  const eventsByDay = useMemo(() => {
    const grouped = new Map();
    events.forEach(event => {
      if (!event.event_date) return;
      const eventDate = new Date(event.event_date);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey).push(event);
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

      {!loading && !error && (
        <div className="bg-background rounded-lg overflow-hidden border border-border">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 bg-primary/10">
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
          <div className="grid grid-cols-7">
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
    </div>
  );
}

export default AgendaManager;