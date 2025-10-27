'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Contract {
  id: string;
  title: string;
  djName: string;
  eventName: string;
  value: number;
  status: 'pending' | 'signed' | 'completed';
  date: string;
}

export default function ContractManagementPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.djName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'signed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'completed': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusLabel = (status: Contract['status']) => {
    switch (status) {
      case 'signed': return 'Assinado';
      case 'pending': return 'Pendente';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Contratos</h1>
          <p className="mt-1 text-muted-foreground">Visualize e gerencie os contratos dos eventos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-neon-purple to-neon-blue text-white shadow-glow hover:opacity-95 border-0">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Funcionalidade de criação de contrato em desenvolvimento</p>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar contratos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum contrato cadastrado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{contract.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">DJ: {contract.djName}</p>
                    <p className="text-sm text-muted-foreground">Evento: {contract.eventName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}
                    </p>
                    <p className={`text-sm font-medium mt-2 ${getStatusColor(contract.status)}`}>
                      {getStatusLabel(contract.status)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
