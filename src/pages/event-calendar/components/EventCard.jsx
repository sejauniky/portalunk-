import React from 'react';
import { Calendar as CalendarIcon, FileText, MapPin, Trash2, Users } from 'lucide-react';

const STATUS_STYLES = {
  confirmed: {
    label: 'Confirmado',
    classes: 'border border-emerald-500/40 bg-emerald-900/60 text-emerald-200',
    dot: 'bg-emerald-400',
  },
  pending: {
    label: 'Pendente',
    classes: 'border border-amber-500/40 bg-amber-900/60 text-amber-200',
    dot: 'bg-yellow-400',
  },
  cancelled: {
    label: 'Cancelado',
    classes: 'border border-red-500/40 bg-red-900/60 text-red-200',
    dot: 'bg-red-400',
  },
  completed: {
    label: 'Concluído',
    classes: 'border border-blue-500/40 bg-blue-900/60 text-blue-200',
    dot: 'bg-blue-400',
  },
};

const getStatusPresentation = (status) => {
  const key = `${status ?? ''}`.toLowerCase();
  return (
    STATUS_STYLES[key] ?? {
      label: status || 'Sem status',
      classes: 'border border-white/20 bg-white/10 text-white/80 shadow-[0_0_30px_rgba(255,255,255,0.12)]',
      dot: 'bg-white/70',
    }
  );
};

const parseDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const onlyDatePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (onlyDatePattern.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      const parsed = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDateValue(value);
  if (!date) return 'Data não informada';
  return date.toLocaleDateString('pt-BR');
};

const formatTime = (dateValue, explicitTime) => {
  if (explicitTime) {
    if (/^\d{2}:\d{2}$/.test(explicitTime)) return explicitTime;
    if (/^\d{2}:\d{2}:\d{2}$/.test(explicitTime)) return explicitTime.slice(0, 5);
  }

  const date = parseDateValue(dateValue);
  if (!date) return 'Horário não informado';

  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return 'Não informado';
  const amount = Number(value);
  if (Number.isNaN(amount)) return 'Não informado';
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
};

const resolveDjNames = (event) => {
  // Prefer explicit array provided by calendar mapping
  if (Array.isArray(event?.dj_names) && event.dj_names.length > 0) {
    return Array.from(new Set(event.dj_names.filter(Boolean))).join(', ');
  }

  const names = [];
  // Primary DJ object on event
  if (event?.dj) {
    const n = event.dj.artist_name || event.dj.name || event.dj.stage_name || event.dj.email;
    if (n) names.push(n);
  }
  // Relations from event_djs
  if (Array.isArray(event?.event_djs)) {
    event.event_djs.forEach((rel) => {
      const d = rel?.dj || null;
      const n = d?.artist_name || d?.name || d?.stage_name || d?.email;
      if (n) names.push(n);
    });
  }
  // Legacy arrays
  if (Array.isArray(event?.djs)) {
    event.djs.forEach((n) => { if (n) names.push(n); });
  }

  const unique = Array.from(new Set(names.filter(Boolean)));
  return unique.length > 0 ? unique.join(', ') : 'DJ não encontrado';
};

const StatusBadge = ({ status }) => (
  <span
    className={`text-xs px-3 py-1 rounded-md font-medium ${status.classes}`}
  >
    {status.label}
  </span>
);

const InfoRow = ({ icon: IconComponent, primary, secondary }) => (
  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-4 text-sm text-white/70">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/80">
      <IconComponent className="h-4 w-4" />
    </div>
    <div>
      <p className="text-sm font-medium text-white">{primary}</p>
      <p className="text-xs text-white/60">{secondary}</p>
    </div>
  </div>
);

const EventCard = ({ event, onEdit, onOpenContract, onDelete }) => {
  const eventDateSource = event?.event_date || event?.date;
  const eventTime = event?.event_time || event?.time;
  const status = getStatusPresentation(event?.status);
  const djNames = resolveDjNames(event);
  const bookingFee = event?.booking_fee ?? event?.budget ?? event?.fee ?? event?.cache_value;
  const formattedTime = formatTime(eventDateSource, eventTime);
  const showTime = formattedTime && formattedTime !== 'Horário não informado' && formattedTime !== '00:00';

  const handleAction = (callback, payload) => {
    if (typeof callback === 'function') {
      callback(payload);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-black/70 text-white shadow-[0_35px_60px_-35px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40">
      <div className="relative z-10">
        {/* Header with title and status badge */}
        <div className="flex items-start justify-between border-b border-white/10 bg-black/70 px-6 pb-4 pt-6">
          <h3 className="text-xl font-semibold text-white">
            {event?.title || 'Evento sem título'}
          </h3>
          <StatusBadge status={status} />
        </div>

        {/* Event details */}
        <div className="space-y-4 px-6 pb-6 pt-6">
          <div className="flex items-center gap-3 text-sm text-white/70">
            <CalendarIcon className="h-4 w-4 text-blue-200/80" />
            <span>{formatDate(eventDateSource)}</span>
            {showTime && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-white/50">{formattedTime}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-white/70">
            <Users className="h-4 w-4 text-white/60" />
            <span>DJs {djNames}</span>
            {event?.dj?.genre && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-white/40">{event.dj.genre}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-white/70">
            <MapPin className="h-4 w-4 text-white/60" />
            <span>{event?.venue || 'Local não informado'}</span>
            {(event?.city || event?.state) && (
              <>
                <span className="text-white/40">•</span>
                <span>{[event?.city, event?.state].filter(Boolean).join(', ')}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
            <svg className="h-4 w-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span className="font-medium text-white">
              {bookingFee ? formatCurrency(bookingFee) : 'Não informado'}
            </span>
            <span className="text-white/40">•</span>
            <span className="text-white/40">Cachê</span>
            <span className="text-white/40">•</span>
            <span className="text-white/40">Comissão UNK: {event?.commission_percentage || 15}%</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/60 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleAction(onOpenContract, event)}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-purple-400/40 hover:text-white"
            >
              <FileText className="h-4 w-4" />
              Contrato
            </button>

            <button
              onClick={() => handleAction(onEdit, event)}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-purple-400/40 hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
              Editar
            </button>
          </div>

          <button
            onClick={() => handleAction(onDelete, event?.id)}
            className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
