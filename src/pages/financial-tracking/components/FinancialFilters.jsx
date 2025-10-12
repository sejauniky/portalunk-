import React, { useState } from 'react';
import { Icon } from '../../../components/Icon';
import Button from '../../../components/ui/button';
import Input from '../../../components/ui/input';
import Select from '../../../components/ui/Select';

const FinancialFilters = ({ onFiltersChange, onExport, onClearFilters }) => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    transactionType: '',
    status: '',
    party: '',
    minAmount: '',
    maxAmount: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const transactionTypeOptions = [
    { value: '', label: 'Todos os tipos' },
    { value: 'event_payment', label: 'Pagamento de Evento' },
    { value: 'contract_fee', label: 'Taxa de Contrato' },
    { value: 'commission', label: 'Comissão' },
    { value: 'refund', label: 'Reembolso' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'paid', label: 'Pago' },
    { value: 'pending', label: 'Pendente' },
    { value: 'overdue', label: 'Atrasado' },
    { value: 'processing', label: 'Processando' }
  ];

  const partyOptions = [
    { value: '', label: 'Todas as partes' },
    { value: 'dj', label: 'DJs' },
    { value: 'producer', label: 'Produtores' },
    { value: 'admin', label: 'Administração' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      transactionType: '',
      status: '',
      party: '',
      minAmount: '',
      maxAmount: ''
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters)?.some(value => value !== '');

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Quick Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="min-w-[140px]">
            <Input
              type="date"
              placeholder="Data inicial"
              value={filters?.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
              className="text-sm"
            />
          </div>

          <div className="min-w-[140px]">
            <Input
              type="date"
              placeholder="Data final"
              value={filters?.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
              className="text-sm"
            />
          </div>

          <div className="min-w-[160px]">
            <Select
              options={statusOptions}
              value={filters?.status}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Status"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
            iconPosition="right"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Mais Filtros
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={handleClearFilters}
            >
              Limpar
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={onExport}
          >
            Exportar
          </Button>
        </div>
      </div>
      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          <Select
            label="Tipo de Transação"
            options={transactionTypeOptions}
            value={filters?.transactionType}
            onChange={(value) => handleFilterChange('transactionType', value)}
          />

          <Select
            label="Parte Envolvida"
            options={partyOptions}
            value={filters?.party}
            onChange={(value) => handleFilterChange('party', value)}
          />

          <Input
            label="Valor Mínimo"
            type="number"
            placeholder="R$ 0,00"
            value={filters?.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e?.target?.value)}
          />

          <Input
            label="Valor Máximo"
            type="number"
            placeholder="R$ 10.000,00"
            value={filters?.maxAmount}
            onChange={(e) => handleFilterChange('maxAmount', e?.target?.value)}
          />
        </div>
      )}
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Filtros ativos:</span>
          {filters?.dateFrom && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              De: {new Date(filters.dateFrom)?.toLocaleDateString('pt-BR')}
              <button
                onClick={() => handleFilterChange('dateFrom', '')}
                className="ml-1 hover:text-primary/80"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
          {filters?.dateTo && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Até: {new Date(filters.dateTo)?.toLocaleDateString('pt-BR')}
              <button
                onClick={() => handleFilterChange('dateTo', '')}
                className="ml-1 hover:text-primary/80"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
          {filters?.status && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Status: {statusOptions?.find(opt => opt?.value === filters?.status)?.label}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-1 hover:text-primary/80"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialFilters;
