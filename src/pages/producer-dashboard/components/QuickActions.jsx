import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ onCreateEvent, onBookDJ, onUploadPayment, onViewCalendar }) => {
  const quickActionItems = [
    {
      id: 'create-event',
      title: 'Criar Evento',
      description: 'Agendar novo evento musical',
      icon: 'Plus',
      color: 'text-primary',
      action: onCreateEvent
    },
    {
      id: 'book-dj',
      title: 'Contratar DJ',
      description: 'Buscar e contratar DJs disponíveis',
      icon: 'Users',
      color: 'text-secondary',
      action: onBookDJ
    },
    {
      id: 'upload-payment',
      title: 'Comprovante',
      description: 'Enviar comprovante de pagamento',
      icon: 'Upload',
      color: 'text-success',
      action: onUploadPayment
    },
    {
      id: 'view-calendar',
      title: 'Calendário',
      description: 'Ver agenda de eventos',
      icon: 'Calendar',
      color: 'text-accent',
      action: onViewCalendar
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Ações Rápidas
        </h2>
        <Icon name="Zap" size={20} className="text-accent" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActionItems?.map((item) => (
          <button
            key={item?.id}
            onClick={item?.action}
            className="group p-4 bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 text-left border border-transparent hover:border-border hover:shadow-md min-h-[96px]"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 bg-transparent`}>
                <Icon name={item?.icon} size={20} className={`${item?.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 whitespace-normal break-words line-clamp-2">
                  {item?.title}
                </h3>
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200 whitespace-normal break-words line-clamp-2">
              {item?.description}
            </p>
          </button>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            iconName="BarChart3"
            iconPosition="left"
            onClick={() => window.location.href = '/financial-tracking'}
            fullWidth
          >
            Relatório Financeiro
          </Button>
          <Button
            variant="outline"
            iconName="FileText"
            iconPosition="left"
            onClick={() => window.location.href = '/contract-management'}
            fullWidth
          >
            Gerenciar Contratos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
