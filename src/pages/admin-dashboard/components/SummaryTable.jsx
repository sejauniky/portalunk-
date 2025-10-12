import React from 'react';
import { useLocation } from 'wouter';
import { Icon } from '../../../components/Icon';

const quickActionItems = [
  {
    id: 'create-event',
    label: 'Criar Evento',
    icon: 'Plus',
    path: '/event-calendar',
  },
  {
    id: 'register-dj',
    label: 'Cadastrar DJ',
    icon: 'UserPlus',
    path: '/dj-management',
  },
  {
    id: 'new-producer',
    label: 'Novo Produtor',
    icon: 'FilePlus',
    path: '/producer-management',
  },
  {
    id: 'approve-payments',
    label: 'Aprovar Pagamentos',
    icon: 'CheckCircle2',
    path: '/financial-tracking',
  },
];

const SummaryTable = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border/60">
        <h3 className="text-lg font-semibold text-foreground">Ações Rápidas</h3>
      </div>
      <div className="p-4 space-y-3">
        {quickActionItems.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => setLocation(action.path)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background/40 hover:bg-primary/5 border border-border/50 transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name={action.icon} size={18} />
              </span>
              {action.label}
            </span>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SummaryTable;
