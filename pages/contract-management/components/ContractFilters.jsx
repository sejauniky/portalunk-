import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/input';

const ContractFilters = ({ 
  onFilterChange, 
  onClearFilters, 
  activeFilters = {},
  contractsCount = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    partyType: 'all',
    dateRange: 'all',
    searchTerm: '',
    ...activeFilters
  });

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'draft', label: 'Rascunho' },
    { value: 'pending', label: 'Pendente' },
    { value: 'signed', label: 'Assinado' },
    { value: 'expired', label: 'Expirado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  const partyTypeOptions = [
    { value: 'all', label: 'Todas as Partes' },
    { value: 'dj', label: 'DJ' },
    { value: 'producer', label: 'Produtor' },
    { value: 'venue', label: 'Local' },
    { value: 'sponsor', label: 'Patrocinador' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Todas as Datas' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mês' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Ano' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: 'all',
      partyType: 'all',
      dateRange: 'all',
      searchTerm: ''
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters?.status !== 'all') count++;
    if (filters?.partyType !== 'all') count++;
    if (filters?.dateRange !== 'all') count++;
    if (filters?.searchTerm?.trim()) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      {/* Quick Filters Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Buscar por ID, evento ou parte..."
              value={filters?.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e?.target?.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              options={statusOptions}
              value={filters?.status}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Status"
              className="min-w-[140px]"
            />
            
            <Button
              variant="outline"
              size="sm"
              iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {contractsCount} contratos encontrados
          </span>
          
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={handleClearFilters}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>
      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Tipo de Parte"
              options={partyTypeOptions}
              value={filters?.partyType}
              onChange={(value) => handleFilterChange('partyType', value)}
            />
            
            <Select
              label="Período"
              options={dateRangeOptions}
              value={filters?.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
            />
            
            <div className="flex items-end">
              <Button
                variant="outline"
                iconName="Filter"
                onClick={() => {
                  // Apply additional filters logic here
                }}
                className="w-full"
              >
                Filtros Avançados
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              
              {filters?.status !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Status: {statusOptions?.find(opt => opt?.value === filters?.status)?.label}
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className="ml-1 hover:text-primary/80"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </span>
              )}
              
              {filters?.partyType !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                  Parte: {partyTypeOptions?.find(opt => opt?.value === filters?.partyType)?.label}
                  <button
                    onClick={() => handleFilterChange('partyType', 'all')}
                    className="ml-1 hover:text-secondary/80"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </span>
              )}
              
              {filters?.dateRange !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  Período: {dateRangeOptions?.find(opt => opt?.value === filters?.dateRange)?.label}
                  <button
                    onClick={() => handleFilterChange('dateRange', 'all')}
                    className="ml-1 hover:text-accent/80"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </span>
              )}
              
              {filters?.searchTerm?.trim() && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                  Busca: "{filters?.searchTerm}"
                  <button
                    onClick={() => handleFilterChange('searchTerm', '')}
                    className="ml-1 hover:text-success/80"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractFilters;