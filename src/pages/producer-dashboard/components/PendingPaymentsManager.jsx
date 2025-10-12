import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/button';
import PillActionButton from '../../../components/ui/PillActionButton';
import Input from '../../../components/ui/input';
import { usePendingPayments } from '../../../hooks/usePendingPayments';
import { useAuth } from '../../../hooks/use-auth';

const PendingPaymentsManager = ({ onPaymentUpdate, producerId: producerIdProp = null, djId: djIdProp = null }) => {
  const getEventDJNames = (event) => {
    if (!event) return [];
    const extras = Array.isArray(event?.event_djs)
      ? event.event_djs.map(ed => ed?.dj?.name).filter(Boolean)
      : [];
    const all = [event?.dj?.name, ...extras].filter(Boolean);
    return all;
  };
  const { userProfile } = useAuth();
  const effectiveProducerId = producerIdProp ?? userProfile?.id ?? null;
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [description, setDescription] = useState('');

  // Use the hook with producer filter
  const {
    payments,
    financialStats,
    loading,
    uploadingProof,
    uploadPaymentProof,
    confirmPayments,
    formatCurrency,
    formatDate,
    isOverdue,
    refetchPayments
  } = usePendingPayments({
    producerId: effectiveProducerId,
    djId: djIdProp ?? undefined
  });

  // Enhanced overdue detection for completed events
  const isPaymentOverdue = (payment) => {
    const eventDate = payment?.event?.event_date ? new Date(payment.event.event_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate) {
      eventDate.setHours(23, 59, 59, 999);
      // If event date has passed and payment is still pending/processing, it's overdue
      if (today > eventDate && (payment?.status === 'pending' || payment?.status === 'processing')) {
        return true;
      }
    }
    
    return false;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Apenas arquivos JPG, PNG ou PDF são permitidos');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !selectedPaymentId) {
      toast.error('Selecione um arquivo e um pagamento');
      return;
    }

    const result = await uploadPaymentProof(selectedPaymentId, selectedFile, description);
    
    if (!result?.error) {
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedPaymentId(null);
      setDescription('');
      onPaymentUpdate?.();
    }
  };

  const openUploadModal = (paymentId) => {
    setSelectedPaymentId(paymentId);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setSelectedPaymentId(null);
    setDescription('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
              <p className="text-xl font-bold text-foreground">{financialStats?.pendingCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Icon name="AlertTriangle" size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Atraso</p>
              <p className="text-xl font-bold text-foreground">{financialStats?.overdueCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Icon name="DollarSign" size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pendente</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(financialStats?.totalPending || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Pagamentos Pendentes</h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="CheckCircle" size={48} className="text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">
              Todos os pagamentos estão em dia!
            </h4>
            <p className="text-muted-foreground">
              Não há pagamentos pendentes no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((payment) => {
              const djNames = getEventDJNames(payment?.event);
              return (
              <div key={payment.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">
                          {payment?.event?.title || 'Evento sem título'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          DJs: {djNames?.length ? djNames.join(', ') : 'N/A'}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xl font-bold text-foreground">
                          {formatCurrency(payment?.amount)}
                        </p>
                        {isOverdue(payment) && (
                          <div className="flex items-center text-red-500 text-sm mt-1">
                            <Icon name="AlertTriangle" size={14} className="mr-1" />
                            <span>Em atraso</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                      <div>
                        <p><strong>Data do Evento:</strong> {formatDate(payment?.event?.event_date)}</p>
                        <p><strong>Local:</strong> {payment?.event?.location || 'N/A'}</p>
                      </div>
                      <div>
                        <p><strong>Criado em:</strong> {formatDate(payment?.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        {payment?.status === 'paid' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">Pago</span>
                        ) : (payment?.status === 'processing' || payment?.payment_proof_url) ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">Enviado</span>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment?.status === 'overdue' || isPaymentOverdue(payment) 
                              ? 'bg-red-500/20 text-red-500' 
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {payment?.status === 'overdue' || isPaymentOverdue(payment) ? 'Em Atraso' : 'Pendente'}
                          </span>
                        )}
                        {payment?.status === 'paid' && payment?.payment_proof_url && (
                          <a
                            href={payment.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:text-primary/80"
                            title="Visualizar comprovante"
                          >
                            <Icon name="Eye" size={16} />
                          </a>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {payment?.status === 'paid' ? (
                          <PillActionButton color="green" iconName="Check" disabled className="px-3 py-1.5 text-xs sm:text-sm">
                            Pago
                          </PillActionButton>
                        ) : (payment?.status === 'processing' || payment?.payment_proof_url) ? (
                          <PillActionButton color="blue" iconName="Send" disabled className="px-3 py-1.5 text-xs sm:text-sm">
                            Enviado Pagamento
                          </PillActionButton>
                        ) : (
                          <PillActionButton
                            color="green"
                            iconName="Check"
                            onClick={() => openUploadModal(payment.id)}
                            className="px-3 py-1.5 text-xs sm:text-sm font-semibold"
                          >
                            Dar Baixa
                          </PillActionButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Dar Baixa - Enviar Comprovante
              </h3>
              <Button
                variant="ghost"
                size="sm"
                iconName="X"
                onClick={closeUploadModal}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-sm">
                <p className="font-semibold text-amber-300 mb-1">Instruções para Pagamento</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Realize o pagamento do valor total pendente deste evento.</li>
                  <li>Faça o upload do comprovante.</li>
                  <li>Para baixa automática é necessário que o comprovante esteja no CNPJ 59.839.507/0001-86 e o valor correto referente a esta pendência.</li>
                  <li>Aguarde a análise e confirmação do pagamento.</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Arquivo do Comprovante
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: JPG, PNG, PDF (máximo 10MB)
                </p>
              </div>

              <Input
                label="Descrição (opcional)"
                placeholder="Descrição do comprovante..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {selectedFile && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <Icon name="File" size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={closeUploadModal}
                disabled={uploadingProof}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadProof}
                disabled={!selectedFile || uploadingProof}
                loading={uploadingProof}
                iconName="Upload"
                iconPosition="left"
              >
                Enviar Comprovante
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingPaymentsManager;
