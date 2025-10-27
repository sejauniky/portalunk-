import React from 'react';
import { Calendar, Clock, CheckCircle, Users } from 'lucide-react';

const EventMetrics = ({ events = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalEvents = events.length;

  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  }).length;

  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  const next7DaysEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today && eventDate <= next7Days;
  }).length;

  const confirmedEvents = events.filter(e =>
    e.status?.toLowerCase().includes('confirm')
  ).length;

  const metrics = [
    {
      title: 'Total de Eventos',
      value: totalEvents,
      subtitle: 'Eventos cadastrados',
      icon: Calendar,
      iconColor: 'text-white/60',
      iconBg: 'bg-white/5'
    },
    {
      title: 'Hoje',
      value: todayEvents,
      subtitle: 'Eventos hoje',
      icon: Clock,
      iconColor: 'text-purple-300',
      iconBg: 'bg-purple-500/20'
    },
    {
      title: 'Próximos 7 dias',
      value: next7DaysEvents,
      subtitle: 'Eventos próximos',
      icon: Users,
      iconColor: 'text-yellow-300',
      iconBg: 'bg-[#103db9]/20'
    },
    {
      title: 'Confirmados',
      value: confirmedEvents,
      subtitle: 'Eventos confirmados',
      icon: CheckCircle,
      iconColor: 'text-emerald-300',
      iconBg: 'bg-emerald-900/40'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/60 p-6 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/30 hover:shadow-[0_30px_60px_-25px_rgba(128,90,213,0.45)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium text-white/60">{metric.title}</p>
              <p className="mb-2 text-4xl font-bold text-white">{metric.value}</p>
              <p className="text-xs text-white/50">{metric.subtitle}</p>
            </div>
            <div className={`rounded-xl p-3 ${metric.iconBg}`}>
              <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventMetrics;
