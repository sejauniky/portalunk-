// ...existing code...
import React, { useState } from 'react';
import Button from '../../../components/ui/button';

const TransactionTable = ({ transactions, onViewDetails, onProcessPayment, onDeleteTransaction }) => {
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransactions(transactions?.map(t => t?.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId, checked) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, transactionId]);
    } else {
      setSelectedTransactions(selectedTransactions?.filter(id => id !== transactionId));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': { color: 'bg-success text-success-foreground', label: 'Pago' },
      'pending': { color: 'bg-warning text-warning-foreground', label: 'Pendente' },
      'overdue': { color: 'bg-error text-error-foreground', label: 'Atrasado' },
      'processing': { color: 'bg-accent text-accent-foreground', label: 'Processando' }
    };
    
    const config = statusConfig?.[status] || statusConfig?.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        {config?.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Table Header with Bulk Actions */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTransactions?.length === transactions?.length}
                onChange={(e) => handleSelectAll(e?.target?.checked)}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                {selectedTransactions?.length > 0 
                  ? `${selectedTransactions?.length} selecionados`
                  : 'Selecionar todos'
                }
              </span>
            </label>
          </div>
          {selectedTransactions?.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                iconName="Check"
                iconPosition="left"
                onClick={() => onProcessPayment(selectedTransactions)}
              >
                Confirmar Pagamentos
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/20">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="w-4"></div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Evento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Partes Envolvidas
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Distribuição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions?.map((transaction) => (
              <tr key={transaction?.id} className="hover:bg-muted/10 transition-colors duration-150">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedTransactions?.includes(transaction?.id)}
                    onChange={(e) => handleSelectTransaction(transaction?.id, e?.target?.checked)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-4 text-sm text-foreground">
                  {formatDate(transaction?.date)}
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{transaction?.eventName}</p>
                    <p className="text-xs text-muted-foreground">{transaction?.eventType}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">DJ: {transaction?.djName}</p>
                    <p className="text-xs text-muted-foreground">Produtor: {transaction?.producerName}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-foreground">
                  {formatCurrency(transaction?.totalAmount)}
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comissão UNK:</span>
                      <span className="text-foreground">{formatCurrency(transaction?.distribution?.unkCommission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DJ (Líquido):</span>
                      <span className="text-foreground">{formatCurrency(transaction?.distribution?.djNet)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produtor (Paga):</span>
                      <span className="text-foreground">{formatCurrency(transaction?.totalAmount)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {getStatusBadge(transaction?.status)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Eye"
                      onClick={() => onViewDetails(transaction)}
                    />
                    {transaction?.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Check"
                        onClick={() => onProcessPayment([transaction?.id])}
                        title="Confirmar Pagamento"
                      />
                    )}
                    {transaction?.status === 'paid' && transaction?.paymentProofUrl && (
                      <a href={transaction?.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="ExternalLink"
                          title="Visualizar Comprovante"
                        />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      className="text-error hover:text-error"
                      onClick={() => onDeleteTransaction(transaction?.id)}
                      title="Excluir Transação"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-border">
        {transactions?.map((transaction) => (
          <div key={transaction?.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedTransactions?.includes(transaction?.id)}
                  onChange={(e) => handleSelectTransaction(transaction?.id, e?.target?.checked)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{transaction?.eventName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(transaction?.date)}</p>
                </div>
              </div>
              {getStatusBadge(transaction?.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                <p className="font-medium text-foreground">{formatCurrency(transaction?.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">DJ</p>
                <p className="text-foreground">{transaction?.djName}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                Produtor: {transaction?.producerName}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Eye"
                  onClick={() => onViewDetails(transaction)}
                />
                {transaction?.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Check"
                    onClick={() => onProcessPayment([transaction?.id])}
                    title="Confirmar Pagamento"
                  />
                )}
                {transaction?.status === 'paid' && transaction?.paymentProofUrl && (
                  <a href={transaction?.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="ExternalLink"
                      title="Visualizar Comprovante"
                    />
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Trash2"
                  className="text-error hover:text-error"
                  onClick={() => onDeleteTransaction(transaction?.id)}
                  title="Excluir Transação"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionTable;
