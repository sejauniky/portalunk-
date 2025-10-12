import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FinancialSummary = ({ financialData, onViewDetails, onUploadReceipt }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(amount);
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'overdue':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Resumo Financeiro
        </h2>
        <Button
          variant="outline"
          size="sm"
          iconName="Upload"
          iconPosition="left"
          onClick={onUploadReceipt}
        >
          Upload Comprovante
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="TrendingUp" size={20} className="text-success" />
            <span className="text-sm font-medium text-foreground">
              Receita Total
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(financialData?.totalRevenue)}
          </p>
          <p className="text-xs text-muted-foreground">
            Este mês: {formatCurrency(financialData?.monthlyRevenue)}
          </p>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Clock" size={20} className="text-warning" />
            <span className="text-sm font-medium text-foreground">
              Pagamentos Pendentes
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(financialData?.pendingPayments)}
          </p>
          <p className="text-xs text-muted-foreground">
            {financialData?.pendingCount} pagamentos
          </p>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Calendar" size={20} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              Próximos Eventos
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {financialData?.upcomingEvents}
          </p>
          <p className="text-xs text-muted-foreground">
            Valor estimado: {formatCurrency(financialData?.estimatedRevenue)}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">
            Pagamentos Recentes
          </h3>
          <Button
            variant="ghost"
            size="sm"
            iconName="ExternalLink"
            iconPosition="right"
            onClick={onViewDetails}
          >
            Ver Todos
          </Button>
        </div>

        <div className="space-y-3">
          {financialData?.recentPayments?.map((payment) => (
            <div
              key={payment?.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="Music" size={16} color="white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {payment?.eventName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment?.djName} • {payment?.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(payment?.amount)}
                </p>
                <p className={`text-xs ${getPaymentStatusColor(payment?.status)}`}>
                  {payment?.status === 'paid' ? 'Pago' :
                   payment?.status === 'pending' ? 'Pendente' : 'Atrasado'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;