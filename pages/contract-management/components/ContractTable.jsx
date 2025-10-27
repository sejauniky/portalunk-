import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/button';



const ContractTable = ({ 
  contracts, 
  onEditContract, 
  onViewContract, 
  onSendForSignature, 
  onDownloadContract,
  onBulkAction,
  selectedContracts,
  onSelectContract,
  onSelectAll
}) => {
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'draft', label: 'Rascunho' },
    { value: 'pending', label: 'Pendente' },
    { value: 'signed', label: 'Assinado' },
    { value: 'expired', label: 'Expirado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      signed: { color: 'bg-green-100 text-green-800', label: 'Assinado' },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expirado' },
      cancelled: { color: 'bg-gray-100 text-gray-600', label: 'Cancelado' }
    };

    const config = statusConfig?.[status] || statusConfig?.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color}`}>
        {config?.label}
      </span>
    );
  };

  const getSignatureProgress = (signatures) => {
    const total = signatures?.length;
    const completed = signatures?.filter(sig => sig?.signed)?.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
    );
  };

  const sortedContracts = useMemo(() => {
    return [...contracts]?.sort((a, b) => {
      const aValue = a?.[sortField];
      const bValue = b?.[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [contracts, sortField, sortDirection]);

  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedContracts?.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedContracts, currentPage]);

  const totalPages = Math.ceil(sortedContracts?.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    const allSelected = selectedContracts?.length === paginatedContracts?.length;
    if (allSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(paginatedContracts?.map(contract => contract?.id));
    }
  };

  const isAllSelected = selectedContracts?.length === paginatedContracts?.length && paginatedContracts?.length > 0;
  const isPartiallySelected = selectedContracts?.length > 0 && selectedContracts?.length < paginatedContracts?.length;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-border text-primary focus:ring-primary"
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('contractId')}
              >
                <div className="flex items-center space-x-1">
                  <span>ID do Contrato</span>
                  <Icon 
                    name={sortField === 'contractId' ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} 
                    size={14} 
                  />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('eventName')}
              >
                <div className="flex items-center space-x-1">
                  <span>Evento</span>
                  <Icon 
                    name={sortField === 'eventName' ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} 
                    size={14} 
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Partes Envolvidas
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <Icon 
                    name={sortField === 'status' ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} 
                    size={14} 
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assinaturas
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Data de Criação</span>
                  <Icon 
                    name={sortField === 'createdAt' ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} 
                    size={14} 
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {paginatedContracts?.map((contract) => (
              <tr key={contract?.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedContracts?.includes(contract?.id)}
                    onChange={() => onSelectContract(contract?.id)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-foreground">
                      {contract?.contractId}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-foreground font-medium">
                    {contract?.eventName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(contract.eventDate)?.toLocaleDateString('pt-BR')}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    {contract?.parties?.map((party, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                          <Icon name="User" size={12} color="white" />
                        </div>
                        <span className="text-sm text-foreground">{party?.name}</span>
                        <span className="text-xs text-muted-foreground">({party?.role})</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {getStatusBadge(contract?.status)}
                </td>
                <td className="px-4 py-4">
                  {getSignatureProgress(contract?.signatures)}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-foreground">
                    {new Date(contract.createdAt)?.toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(contract.createdAt)?.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Eye"
                      onClick={() => onViewContract(contract)}
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Edit"
                      onClick={() => onEditContract(contract)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Send"
                      onClick={() => onSendForSignature(contract)}
                      disabled={contract?.status === 'signed'}
                    >
                      Enviar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Download"
                      onClick={() => onDownloadContract(contract)}
                    >
                      Download
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, sortedContracts?.length)} de {sortedContracts?.length} contratos
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronLeft"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronRight"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractTable;