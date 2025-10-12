import React from 'react';
import { Icon } from '../../../components/Icon';
import Button from '../../../components/ui/button';

const TransactionDetailsModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': { color: 'bg-success text-success-foreground', label: 'Pago', icon: 'CheckCircle' },
      'pending': { color: 'bg-warning text-warning-foreground', label: 'Pendente', icon: 'Clock' },
      'overdue': { color: 'bg-error text-error-foreground', label: 'Atrasado', icon: 'AlertCircle' },
      'processing': { color: 'bg-accent text-accent-foreground', label: 'Processando', icon: 'Loader' }
    };
    
    const config = statusConfig?.[status] || statusConfig?.pending;
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${config?.color}`}>
        <Icon name={config?.icon} size={16} />
        <span>{config?.label}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Detalhes da Transação</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ID: #{transaction?.id} • {formatDate(transaction?.date)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Status and Amount */}
          <div className="flex items-center justify-between">
            {getStatusBadge(transaction?.status)}
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(transaction?.totalAmount)}</p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
              <Icon name="Calendar" size={20} className="mr-2" />
              Informações do Evento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome do Evento</p>
                <p className="text-foreground font-medium">{transaction?.eventName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Evento</p>
                <p className="text-foreground font-medium">{transaction?.eventType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data do Evento</p>
                <p className="text-foreground font-medium">{formatDate(transaction?.eventDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Local</p>
                <p className="text-foreground font-medium">{transaction?.eventLocation}</p>
              </div>
            </div>
          </div>

          {/* Parties Involved */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
              <Icon name="Users" size={20} className="mr-2" />
              Partes Envolvidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Icon name="Headphones" size={20} color="white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">DJ</p>
                    <p className="text-foreground font-medium">{transaction?.djName}</p>
                    <p className="text-xs text-muted-foreground">{transaction?.djEmail}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <Icon name="User" size={20} color="white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produtor</p>
                    <p className="text-foreground font-medium">{transaction?.producerName}</p>
                    <p className="text-xs text-muted-foreground">{transaction?.producerEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Payment Information */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
              <Icon name="CreditCard" size={20} className="mr-2" />
              Informações de Pagamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                <p className="text-foreground font-medium">{transaction?.paymentMethod || 'Transferência Bancária'}</p>
              </div>
              {transaction?.paymentProofUrl && (
                <div>
                  <p className="text-sm text-muted-foreground">Comprovante</p>
                  <a href={transaction?.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline font-medium">
                    <Icon name="ExternalLink" size={16} className="mr-1" /> Visualizar Comprovante
                  </a>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                <p className="text-foreground font-medium">{formatDate(transaction?.dueDate)}</p>
              </div>
              {transaction?.paidDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Pagamento</p>
                  <p className="text-foreground font-medium">{formatDate(transaction?.paidDate)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Referência</p>
                <p className="text-foreground font-medium font-mono">{transaction?.reference || `TXN-${transaction?.id}`}</p>
              </div>
            </div>
          </div>

          {/* Contract Information */}
          {transaction?.contractId && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
                <Icon name="FileText" size={20} className="mr-2" />
                Contrato Relacionado
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">Contrato #{transaction?.contractId}</p>
                  <p className="text-sm text-muted-foreground">Status: {transaction?.contractStatus}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="ExternalLink"
                  iconPosition="right"
                >
                  Ver Contrato
                </Button>
              </div>
            </div>
          )}

          {/* Attachments */}
          {transaction?.attachments && transaction?.attachments?.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
                <Icon name="Paperclip" size={20} className="mr-2" />
                Comprovantes Anexados
              </h3>
              <div className="space-y-2">
                {transaction?.attachments?.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                    <div className="flex items-center space-x-3">
                      <Icon name="File" size={16} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{attachment?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviado em {formatDate(attachment?.uploadDate)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Download"
                    >
                      Baixar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Última atualização: {formatDate(transaction?.updatedAt)}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              iconName="Printer"
              iconPosition="left"
            >
              Imprimir
            </Button>
            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
            >
              Exportar PDF
            </Button>
            <Button
              variant="default"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
