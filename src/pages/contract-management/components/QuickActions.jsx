import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/button';
import Select from '../../../components/ui/Select';

const QuickActions = ({ 
  selectedContracts = [], 
  contracts = [],
  onCreateContract, 
  onBulkExport, 
  onBulkStatusUpdate,
  onTemplateCreate 
}) => {
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Marcar como Pendente' },
    { value: 'signed', label: 'Marcar como Assinado' },
    { value: 'cancelled', label: 'Marcar como Cancelado' },
    { value: 'expired', label: 'Marcar como Expirado' }
  ];

  const templateOptions = [
    { value: 'dj-performance', label: 'Contrato de Performance DJ' },
    { value: 'producer-event', label: 'Contrato Produtor-Evento' },
    { value: 'venue-rental', label: 'Contrato de Locação de Espaço' },
    { value: 'sponsorship', label: 'Contrato de Patrocínio' },
    { value: 'custom', label: 'Modelo Personalizado' }
  ];

  const handleBulkStatusUpdate = () => {
    if (bulkStatus && selectedContracts?.length > 0) {
      onBulkStatusUpdate(selectedContracts, bulkStatus);
      setBulkStatus('');
      setShowBulkActions(false);
    }
  };

  const handleTemplateCreate = (templateType) => {
    onTemplateCreate(templateType);
  };

  // Calcular estatísticas reais dos contratos
  const stats = React.useMemo(() => {
    const total = contracts?.length || 0;
    const pending = contracts?.filter(c => c?.status === 'pending')?.length || 0;
    const signed = contracts?.filter(c => c?.status === 'signed')?.length || 0;
    const drafts = contracts?.filter(c => c?.status === 'draft')?.length || 0;
    const expired = contracts?.filter(c => c?.status === 'expired')?.length || 0;

    const totalValue = contracts?.reduce((sum, contract) => {
      const value = contract?.event?.cache_value || contract?.amount || 0;
      return sum + (parseFloat(value) || 0);
    }, 0);

    return {
      total,
      pending,
      signed,
      drafts,
      expired,
      totalValue,
    };
  }, [contracts]);

  const formattedTotalValue = React.useMemo(() => {
    if (!stats.totalValue) {
      return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(stats.totalValue);
  }, [stats.totalValue]);

  const statsCards = React.useMemo(
    () => [
      {
        key: 'total',
        label: 'Total de Contratos',
        value: stats.total,
        valueClass: 'text-foreground',
      },
      {
        key: 'pending',
        label: 'Pendentes',
        value: stats.pending,
        valueClass: 'text-yellow-600',
      },
      {
        key: 'signed',
        label: 'Assinados',
        value: stats.signed,
        valueClass: 'text-green-600',
      },
      {
        key: 'drafts',
        label: 'Rascunhos',
        value: stats.drafts,
        valueClass: 'text-muted-foreground',
      },
      {
        key: 'expired',
        label: 'Expirados',
        value: stats.expired,
        valueClass: 'text-red-600',
      },
      {
        key: 'value',
        label: 'Valor Total',
        value: formattedTotalValue,
        valueClass: 'text-primary',
      },
    ],
    [formattedTotalValue, stats.drafts, stats.expired, stats.pending, stats.signed, stats.total],
  );

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Primary Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="default"
            iconName="Plus"
            onClick={onCreateContract}
          >
            Novo Contrato
          </Button>
          
          <div className="relative">
            <Button
              variant="outline"
              iconName="FileTemplate"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              Criar por Modelo
              <Icon name="ChevronDown" size={16} className="ml-1" />
            </Button>
            
            {showBulkActions && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border rounded-md shadow-lg z-50">
                <div className="p-3">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Selecionar Modelo
                  </h4>
                  <div className="space-y-2">
                    {templateOptions?.map((template) => (
                      <button
                        key={template?.value}
                        onClick={() => handleTemplateCreate(template?.value)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {template?.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            iconName="Download"
            onClick={onBulkExport}
          >
            Exportar Dados
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedContracts?.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="CheckSquare" size={16} className="text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedContracts?.length} contrato(s) selecionado(s)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                options={statusOptions}
                value={bulkStatus}
                onChange={setBulkStatus}
                placeholder="Alterar status"
                className="min-w-[160px]"
              />
              
              <Button
                variant="outline"
                size="sm"
                iconName="Check"
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus}
              >
                Aplicar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                iconName="Send"
                onClick={() => {/* Bulk send for signature */}}
              >
                Enviar para Assinatura
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                iconName="Download"
                onClick={() => onBulkExport(selectedContracts)}
              >
                Exportar Selecionados
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2">
          {statsCards.map((card) => (
            <div
              key={card.key}
              className="flex min-w-[220px] shrink-0 flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </span>
              <span className={`text-2xl font-bold ${card.valueClass}`}>{card.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
