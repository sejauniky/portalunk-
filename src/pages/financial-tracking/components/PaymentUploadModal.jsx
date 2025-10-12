import React, { useState, useRef } from 'react';
import { Icon } from '../../../components/Icon';
import Button from '../../../components/ui/button';
import Input from '../../../components/ui/input';
import { storageService } from '../../../services/supabaseService';
import paymentService from '../../../services/paymentService';

const PaymentUploadModal = ({ isOpen, onClose, transactionIds, onUploadComplete }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e?.type === "dragenter" || e?.type === "dragover") {
      setDragActive(true);
    } else if (e?.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDragActive(false);
    
    if (e?.dataTransfer?.files && e?.dataTransfer?.files?.[0]) {
      handleFiles(e?.dataTransfer?.files);
    }
  };

  const handleChange = (e) => {
    e?.preventDefault();
    if (e?.target?.files && e?.target?.files?.[0]) {
      handleFiles(e?.target?.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files)?.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file?.name,
      size: file?.size,
      type: file?.type,
      preview: file?.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
      transactionId: transactionIds?.[0] || null,
      description: ''
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => {
      const updated = prev?.filter(f => f?.id !== fileId);
      // Clean up preview URLs
      const removed = prev?.find(f => f?.id === fileId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed?.preview);
      }
      return updated;
    });
  };

  const updateFileDescription = (fileId, description) => {
    setUploadedFiles(prev => 
      prev?.map(f => f?.id === fileId ? { ...f, description } : f)
    );
  };

  const updateFileTransaction = (fileId, transactionId) => {
    setUploadedFiles(prev => 
      prev?.map(f => f?.id === fileId ? { ...f, transactionId } : f)
    );
  };

  const handleUpload = async () => {
    if (uploadedFiles?.length === 0) return;
    if (!transactionIds || transactionIds?.length === 0) return;
    
    setUploading(true);
    
    try {
      const processedFiles = [];

      for (const file of uploadedFiles) {
        const txnId = file?.transactionId || transactionIds?.[0];
        if (!txnId) continue;
        const path = `${txnId}/${Date.now()}-${file?.name}`;

        // Upload para Supabase Storage (bucket 'payment-proofs')
        const { data, error } = await storageService?.uploadFile('payment-proofs', path, file?.file);
        if (error) {
          const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
          throw new Error(message || 'Erro ao fazer upload do comprovante');
        }

        // Atualiza pagamento com URL pública
        await paymentService?.updateWithProof(txnId, data?.publicUrl);

        processedFiles.push({
          id: file?.id,
          name: file?.name,
          transactionId: txnId,
          description: file?.description,
          uploadDate: new Date()?.toISOString(),
          status: 'uploaded',
          url: data?.publicUrl
        });
      }
      
      onUploadComplete(processedFiles);
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    uploadedFiles?.forEach(file => {
      if (file?.preview) {
        URL.revokeObjectURL(file?.preview);
      }
    });
    setUploadedFiles([]);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl my-8 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Upload de Comprovantes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {transactionIds?.length === 1 
                ? 'Enviando comprovante para 1 transação'
                : `Enviando comprovantes para ${transactionIds?.length} transações`
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={handleClose}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              dragActive 
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Icon name="Upload" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Suporte para PDF, JPG, PNG até 10MB cada
            </p>
            <Button
              variant="outline"
              iconName="FolderOpen"
              iconPosition="left"
              onClick={() => fileInputRef?.current?.click()}
            >
              Selecionar Arquivos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              className="hidden"
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                Arquivos Selecionados ({uploadedFiles?.length})
              </h3>
              
              <div className="space-y-3">
                {uploadedFiles?.map((file) => (
                  <div key={file?.id} className="bg-muted/30 border border-border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {/* File Preview/Icon */}
                      <div className="flex-shrink-0">
                        {file?.preview ? (
                          <img 
                            src={file?.preview} 
                            alt={file?.name}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                            <Icon 
                              name={file?.type?.includes('pdf') ? 'FileText' : 'File'} 
                              size={24} 
                              className="text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>

                      {/* File Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{file?.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file?.size)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            iconName="Trash2"
                            onClick={() => removeFile(file?.id)}
                            className="text-error hover:text-error"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            label="Descrição"
                            placeholder="Descrição do comprovante"
                            value={file?.description}
                            onChange={(e) => updateFileDescription(file?.id, e?.target?.value)}
                          />
                          
                          {transactionIds?.length > 1 && (
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Transação
                              </label>
                              <select
                                value={file?.transactionId || ''}
                                onChange={(e) => updateFileTransaction(file?.id, e?.target?.value)}
                                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                              >
                                <option value="">Selecionar transação</option>
                                {transactionIds?.map(id => (
                                  <option key={id} value={id}>Transação #{id}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {uploadedFiles?.length} arquivo(s) selecionado(s)
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              iconName="Upload"
              iconPosition="left"
              loading={uploading}
              disabled={uploadedFiles?.length === 0}
              onClick={handleUpload}
            >
              {uploading ? 'Enviando...' : 'Enviar Comprovantes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentUploadModal;
