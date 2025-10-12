import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import ContractTable from './components/ContractTable';
import ContractFilters from './components/ContractFilters';
import ContractModal from './components/ContractModal';
import QuickActions from './components/QuickActions';
import ContractMobileCard from './components/ContractMobileCard';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui/button';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { contractService } from '../../services/supabaseService';

const ContractManagement = () => {
  const [, navigate] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedContract, setSelectedContract] = useState(null);
  const [filters, setFilters] = useState({});
  const [filteredContracts, setFilteredContracts] = useState([]);

  // Dados reais do Supabase
  const { data: contracts } = useSupabaseData(contractService, 'getAll', [], []);
  const normalizedContracts = useMemo(() => (
    (contracts || [])?.map(c => ({
      id: c?.id,
      contractId: c?.contract_number || `CTR-${c?.id}`,
      eventName: c?.event?.title,
      eventDate: c?.event?.event_date,
      parties: [
        { name: c?.event?.dj?.name, role: 'DJ', email: c?.event?.dj?.email },
        { name: c?.event?.producer?.name || c?.event?.producer?.company_name, role: 'Produtor', email: c?.event?.producer?.email }
      ]?.filter(p => p?.name),
      status: c?.signed ? 'signed' : (c?.signature_status || 'pending'),
      signatures: [
        { signerName: c?.event?.dj?.name, signerRole: 'DJ', signed: !!c?.signed, signedAt: c?.signed_at },
      ],
      terms: c?.terms || '',
      createdAt: c?.created_at,
      history: []
    }))
  ), [contracts]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Apply filters to contracts
    let filtered = [...(normalizedContracts || [])];
    
    if (filters?.status && filters?.status !== 'all') {
      filtered = filtered?.filter(contract => contract?.status === filters?.status);
    }
    
    if (filters?.searchTerm) {
      const searchTerm = filters?.searchTerm?.toLowerCase();
      filtered = filtered?.filter(contract => 
        contract?.contractId?.toLowerCase()?.includes(searchTerm) ||
        contract?.eventName?.toLowerCase()?.includes(searchTerm) ||
        contract?.parties?.some(party => party?.name?.toLowerCase()?.includes(searchTerm))
      );
    }
    
    if (filters?.dateRange && filters?.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters?.dateRange) {
        case 'today':
          filterDate?.setHours(0, 0, 0, 0);
          filtered = filtered?.filter(contract => 
            new Date(contract.createdAt) >= filterDate
          );
          break;
        case 'week':
          filterDate?.setDate(now?.getDate() - 7);
          filtered = filtered?.filter(contract => 
            new Date(contract.createdAt) >= filterDate
          );
          break;
        case 'month':
          filterDate?.setMonth(now?.getMonth() - 1);
          filtered = filtered?.filter(contract => 
            new Date(contract.createdAt) >= filterDate
          );
          break;
      }
    }
    
    setFilteredContracts(filtered);
  }, [filters, normalizedContracts]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSelectContract = (contractId) => {
    setSelectedContracts(prev => 
      prev?.includes(contractId)
        ? prev?.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSelectAll = (contractIds) => {
    setSelectedContracts(contractIds);
  };

  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditContract = (contract) => {
    setSelectedContract(contract);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleCreateContract = () => {
    setSelectedContract(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleSendForSignature = (contract) => {
    // Mock send for signature
    console.log('Enviando contrato para assinatura:', contract?.contractId);
    // Here you would integrate with signature service
  };

  const handleDownloadContract = (contract) => {
    // Mock download
    console.log('Baixando contrato:', contract?.contractId);
    // Here you would generate and download PDF
  };

  const handleBulkExport = (contractIds = null) => {
    const contractsToExport = contractIds || selectedContracts;
    console.log('Exportando contratos:', contractsToExport);
    // Here you would export selected contracts
  };

  const handleBulkStatusUpdate = (contractIds, newStatus) => {
    console.log('Atualizando status dos contratos:', contractIds, 'para:', newStatus);
    // Here you would update contract statuses
  };

  const handleTemplateCreate = (templateType) => {
    console.log('Criando contrato com modelo:', templateType);
    handleCreateContract();
  };

  const handleSaveContract = (contractData) => {
    console.log('Salvando contrato:', contractData);
    setShowModal(false);
    // Here you would save the contract
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContract(null);
  };

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin-dashboard', isActive: false },
    { label: 'Gestão de Contratos', path: '/contract-management', isActive: true }
  ];

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <BreadcrumbTrail customBreadcrumbs={breadcrumbs} />
        <div className="flex items-center justify-between mt-4 glass-card p-6 rounded-2xl border border-border/50 hover-glow transition-all duration-300">
              <div className="animate-slide-up">
                <h1 className="text-3xl font-bold gradient-text">Gestão de Contratos</h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie contratos, assinaturas digitais e templates
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  iconName="RefreshCw"
                  onClick={() => window.location?.reload()}
                  className="glass-button hover-scale"
                >
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  iconName="Settings"
                  onClick={() => {/* Open settings */}}
                  className="glass-button hover-scale"
                >
                  Configurações
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions
            selectedContracts={selectedContracts}
            contracts={normalizedContracts}
            onCreateContract={handleCreateContract}
            onBulkExport={handleBulkExport}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onTemplateCreate={handleTemplateCreate}
      />

      {/* Filters */}
      <ContractFilters
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            activeFilters={filters}
            contractsCount={filteredContracts?.length}
      />

      {/* Content */}
      {isMobile ? (
        <div className="space-y-4">
              {filteredContracts?.map((contract) => (
                <ContractMobileCard
                  key={contract?.id}
                  contract={contract}
                  onViewContract={handleViewContract}
                  onEditContract={handleEditContract}
                  onSendForSignature={handleSendForSignature}
                  onDownloadContract={handleDownloadContract}
                  isSelected={selectedContracts?.includes(contract?.id)}
                  onSelect={handleSelectContract}
            />
          ))}
        </div>
      ) : (
        <ContractTable
              contracts={filteredContracts}
              onEditContract={handleEditContract}
              onViewContract={handleViewContract}
              onSendForSignature={handleSendForSignature}
              onDownloadContract={handleDownloadContract}
              onBulkAction={handleBulkStatusUpdate}
              selectedContracts={selectedContracts}
              onSelectContract={handleSelectContract}
              onSelectAll={handleSelectAll}
          />
        )}

        {/* Empty State */}
        {filteredContracts?.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="FileText" size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum contrato encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                {Object.keys(filters)?.length > 0 
                  ? "Tente ajustar os filtros ou criar um novo contrato." :"Comece criando seu primeiro contrato."
                }
              </p>
              <Button
                variant="default"
                iconName="Plus"
                onClick={handleCreateContract}
              >
                Criar Primeiro Contrato
              </Button>
            </div>
          )}
        {/* Contract Modal */}
        <ContractModal
          isOpen={showModal}
          onClose={handleCloseModal}
          contract={selectedContract}
          mode={modalMode}
          onSave={handleSaveContract}
          onSendForSignature={handleSendForSignature}
        />
    </div>
  );
};

export default ContractManagement;
