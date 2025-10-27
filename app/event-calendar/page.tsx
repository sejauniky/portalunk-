'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  djs: number;
  status: 'pending' | 'confirmed' | 'completed';
}

export default function EventCalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const filteredEvents = useMemo(() => {
    return events.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendário de Eventos</h1>
          <p className="mt-1 text-muted-foreground">Gerencie seus eventos e agendamentos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-neon-purple to-neon-blue text-white shadow-glow hover:opacity-95 border-0">
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Funcionalidade de criação de evento em desenvolvimento</p>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            Lista
          </Button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum evento cadastrado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Local: {event.location}</p>
                    <p className="text-sm text-muted-foreground">Data: {new Date(event.date).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm text-muted-foreground mt-2">DJs: {event.djs}</p>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status === 'confirmed' ? 'Confirmado' : event.status === 'pending' ? 'Pendente' : 'Concluído'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
