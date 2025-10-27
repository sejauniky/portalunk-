'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, Search, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  event: string;
  producer: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
}

export default function FinancialTrackingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = useMemo(() => {
    return payments.filter(payment =>
      payment.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.producer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payments, searchTerm]);

  const totals = useMemo(() => {
    return {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      paid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    };
  }, [payments]);

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: Payment['status']) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Controle Financeiro</h1>
        <p className="mt-1 text-muted-foreground">Acompanhe pagamentos e receitas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
            <p className="text-xs text-muted-foreground">todos os pagamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.paid)}</div>
            <p className="text-xs text-muted-foreground">pagamentos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.pending)}</div>
            <p className="text-xs text-muted-foreground">a receber</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar pagamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </div>

      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum pagamento registrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{payment.event}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Produtor: {payment.producer}</p>
                    <p className="text-sm text-muted-foreground">Data: {new Date(payment.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                    <Badge className={`mt-2 ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </Badge>
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
