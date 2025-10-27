import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/button';

const EventSummaryCard = ({ event, onViewDetails, onEditEvent }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'cancelled':
        return 'bg-error text-error-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString?.substring(0, 5);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {event?.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {event?.venue}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event?.status)}`}>
          {event?.status === 'confirmed' ? 'Confirmado' :
           event?.status === 'pending' ? 'Pendente' :
           event?.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Calendar" size={16} className="text-muted-foreground" />
          <span className="text-sm text-foreground">
            {formatDate(event?.date)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Clock" size={16} className="text-muted-foreground" />
          <span className="text-sm text-foreground">
            {formatTime(event?.startTime)} - {formatTime(event?.endTime)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Users" size={16} className="text-muted-foreground" />
          <span className="text-sm text-foreground">
            {event?.djCount} DJ{event?.djCount > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="DollarSign" size={16} className="text-muted-foreground" />
          <span className="text-sm text-foreground">
            R$ {event?.totalBudget?.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
      {event?.djs && event?.djs?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">DJs Contratados:</p>
          <div className="flex flex-wrap gap-1">
            {event?.djs?.map((dj, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
              >
                {dj}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          iconName="Eye"
          iconPosition="left"
          onClick={() => onViewDetails(event?.id)}
          fullWidth
        >
          Ver Detalhes
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconName="Edit"
          iconPosition="left"
          onClick={() => onEditEvent(event?.id)}
          fullWidth
        >
          Editar
        </Button>
      </div>
    </div>
  );
};

export default EventSummaryCard;