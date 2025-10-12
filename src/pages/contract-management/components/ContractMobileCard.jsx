import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/button';

const ContractMobileCard = ({ 
  contract, 
  onViewContract, 
  onEditContract, 
  onSendForSignature, 
  onDownloadContract,
  isSelected,
  onSelect 
}) => {
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

    return { completed, total, percentage };
  };

  const signatureProgress = getSignatureProgress(contract?.signatures);

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(contract?.id)}
            className="mt-1 rounded border-border text-primary focus:ring-primary"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-foreground">{contract?.contractId}</h3>
              {getStatusBadge(contract?.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {contract?.eventName}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconName="MoreVertical"
          onClick={() => {/* Show action menu */}}
        />
      </div>
      {/* Event Info */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Icon name="Calendar" size={16} />
        <span>{new Date(contract.eventDate)?.toLocaleDateString('pt-BR')}</span>
      </div>
      {/* Parties */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Icon name="Users" size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Partes Envolvidas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {contract?.parties?.slice(0, 3)?.map((party, index) => (
            <div key={index} className="flex items-center space-x-1 bg-muted/50 rounded-full px-2 py-1">
              <div className="w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
                <Icon name="User" size={8} color="white" />
              </div>
              <span className="text-xs text-foreground">{party?.name}</span>
            </div>
          ))}
          {contract?.parties?.length > 3 && (
            <span className="text-xs text-muted-foreground px-2 py-1">
              +{contract?.parties?.length - 3} mais
            </span>
          )}
        </div>
      </div>
      {/* Signature Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="PenTool" size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Assinaturas</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {signatureProgress?.completed}/{signatureProgress?.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${signatureProgress?.percentage}%` }}
          ></div>
        </div>
      </div>
      {/* Creation Date */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Icon name="Clock" size={16} />
        <span>
          Criado em {new Date(contract.createdAt)?.toLocaleDateString('pt-BR')}
        </span>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
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
        </div>
        <div className="flex items-center space-x-2">
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
      </div>
    </div>
  );
};

export default ContractMobileCard;