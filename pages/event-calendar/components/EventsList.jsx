import React from 'react';
import EventCard from './EventCard';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/ui/button';

const EventsList = ({ events = [], onViewDetails, onViewProof, onCreateEvent }) => {
  if (!events || events.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-border/50 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="Calendar" size={64} className="text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum evento agendado
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece criando seu primeiro evento
            </p>
          </div>
          <Button
            variant="default"
            size="lg"
            onClick={onCreateEvent}
          >
            <Icon name="Plus" size={20} className="mr-2" />
            Criar Primeiro Evento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onViewDetails={onViewDetails}
          onViewProof={onViewProof}
        />
      ))}
    </div>
  );
};

export default EventsList;
