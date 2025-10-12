import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/button';

const ContractStatusPanel = ({ contracts, onSignContract, onViewContract, onCreateContract }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'signed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'expired':
        return 'bg-error text-error-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'signed':
        return 'Assinado';
      case 'pending':
        return 'Pendente';
      case 'draft':
        return 'Rascunho';
      case 'expired':
        return 'Expirado';
      default:
        return 'Desconhecido';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return 'AlertTriangle';
      case 'medium':
        return 'Clock';
      case 'low':
        return 'Info';
      default:
        return 'FileText';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Status dos Contratos
        </h2>
        <Button
          variant="default"
          size="sm"
          iconName="Plus"
          iconPosition="left"
          onClick={onCreateContract}
        >
          Novo Contrato
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mx-auto mb-2">
            <Icon name="CheckCircle" size={24} color="white" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {contracts?.summary?.signed}
          </p>
          <p className="text-sm text-muted-foreground">Assinados</p>
        </div>

        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-warning rounded-full flex items-center justify-center mx-auto mb-2">
            <Icon name="Clock" size={24} color="white" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {contracts?.summary?.pending}
          </p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </div>

        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-muted-foreground rounded-full flex items-center justify-center mx-auto mb-2">
            <Icon name="FileText" size={24} color="white" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {contracts?.summary?.draft}
          </p>
          <p className="text-sm text-muted-foreground">Rascunhos</p>
        </div>

        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-error rounded-full flex items-center justify-center mx-auto mb-2">
            <Icon name="AlertTriangle" size={24} color="white" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {contracts?.summary?.expired}
          </p>
          <p className="text-sm text-muted-foreground">Expirados</p>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">
          Ações Necessárias
        </h3>

        <div className="space-y-3">
          {contracts?.actionRequired?.map((contract) => (
            <div
              key={contract?.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg border-l-4 border-l-warning"
            >
              <div className="flex items-center space-x-3">
                <Icon
                  name={getPriorityIcon(contract?.priority)}
                  size={20}
                  className={getPriorityColor(contract?.priority)}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {contract?.eventName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    DJ: {contract?.djName} • Vence em: {contract?.dueDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract?.status)}`}>
                  {getStatusText(contract?.status)}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Eye"
                    onClick={() => onViewContract(contract?.id)}
                  />
                  {contract?.status === 'pending' && (
                    <Button
                      variant="default"
                      size="sm"
                      iconName="PenTool"
                      onClick={() => onSignContract(contract?.id)}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {contracts?.actionRequired?.length === 0 && (
          <div className="text-center py-8">
            <Icon name="CheckCircle" size={48} className="text-success mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Tudo em Dia!
            </p>
            <p className="text-sm text-muted-foreground">
              Não há contratos pendentes de assinatura no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractStatusPanel;