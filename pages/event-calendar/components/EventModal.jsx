import React, { useState, useEffect } from 'react';
import { Icon } from '../../../components/Icon';
import Button from '../../../components/ui/button';
import Input from '../../../components/ui/input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/checkbox';

const EventModal = ({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete,
  producers,
  djs,
  selectedDate,
  mode = 'create',
  onChangeMode
}) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    venue: '',
    city: '',
    description: '',
    producerId: '',
    djIds: [],
    status: 'pending',
    cache: '',
    cacheIsento: false,
    commissionPercentage: '',
    advancePaid: false,
    advancePercentage: '',
    requirements: '',
    contractType: 'basic',
    attachContract: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [djFees, setDjFees] = useState({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event?.title || '',
        date: event?.date || '',
        venue: event?.venue || '',
        city: event?.city || '',
        description: event?.description || '',
        producerId: event?.producerId || '',
        djIds: event?.djIds || [],
        status: event?.status || 'pending',
        cache: event?.budget || '',
        commissionPercentage: event?.commission_percentage ?? '',
        advancePaid: false,
        advancePercentage: '',
        requirements: event?.requirements || '',
        contractType: event?.contractType || 'basic',
        attachContract: event?.contract_attached || false
      });
      // Initialize per-DJ fees from event if provided
      try {
        if (event?.djFees && typeof event.djFees === 'object') {
          setDjFees(event.djFees);
        } else {
          setDjFees({});
        }
      } catch { setDjFees({}); }
    } else if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`; // local date, no timezone shift
      setFormData(prev => ({
        ...prev,
        date: dateStr
      }));
    }
  }, [event, selectedDate]);

  const statusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'completed', label: 'Concluído' }
  ];

  const producerOptions = producers?.map(producer => ({
    value: producer?.id,
    label: producer?.name || producer?.company_name || producer?.email
  }));

  const djOptions = djs?.map(dj => ({
    value: dj?.id,
    label: dj?.name || dj?.artist_name || 'DJ sem nome',
    description: dj?.genre
  }));

  // Debug logs and loading check
  const hasData = producers && producers.length > 0 && djs && djs.length > 0;
  const isDataLoading = !producers || !djs;

  useEffect(() => {
    console.log('[EventModal] Producers:', producers);
    console.log('[EventModal] Producer Options:', producerOptions);
    console.log('[EventModal] DJs:', djs);
    console.log('[EventModal] DJ Options:', djOptions);
    console.log('[EventModal] Has Data:', hasData);
    console.log('[EventModal] Is Loading:', isDataLoading);
  }, [producers, djs, producerOptions, djOptions, hasData, isDataLoading]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDjSelection = (djId, checked) => {
    setFormData(prev => ({
      ...prev,
      djIds: checked
        ? [...prev?.djIds, djId]
        : prev?.djIds?.filter(id => id !== djId)
    }));
    setDjFees(prev => {
      const next = { ...prev };
      if (checked) {
        if (next[djId] == null) next[djId] = '';
      } else {
        delete next[djId];
      }
      return next;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.title?.trim()) newErrors.title = 'Título é obrigatório';
    if (!formData?.date) newErrors.date = 'Data é obrigatória';
    if (!formData?.venue?.trim()) newErrors.venue = 'Local é obrigatório';
    if (!formData?.city?.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData?.producerId) newErrors.producerId = 'Produtor é obrigatório';
    if (!Array.isArray(formData?.djIds) || formData?.djIds.length === 0) newErrors.djIds = 'Selecione pelo menos um DJ';

    // Validate fees: if not isento and no event-level cache, ensure at least one per-DJ fee > 0
    const selectedFees = (formData?.djIds || []).map(id => parseFloat(djFees?.[id] || '0')).filter(v => !isNaN(v));
    const perDjTotal = selectedFees.reduce((a, b) => a + b, 0);
    const cacheVal = parseFloat(formData?.cache || '0');
    if (!formData?.cacheIsento) {
      if ((!formData?.cache || isNaN(cacheVal)) && perDjTotal <= 0) {
        newErrors.cache = 'Informe o cachê do evento ou valores por DJ, ou marque como isento';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const requirementsNote = formData?.advancePaid
        ? `Pagamento de cachê antecipado: ${formData?.advancePercentage || 0}%\n` : '';

      // Build per-DJ fees map (only selected DJs)
      const feeMap = {};
      (formData?.djIds || []).forEach(id => {
        const v = djFees?.[id];
        if (v !== undefined && v !== '') {
          const n = parseFloat(String(v).replace(',', '.'));
          if (!isNaN(n) && n >= 0) feeMap[id] = n;
        }
      });
      const perDjTotal = Object.values(feeMap).reduce((a, b) => a + Number(b || 0), 0);

      const payload = {
        title: formData?.title,
        event_name: formData?.title,
        event_date: formData?.date,
        location: formData?.venue,
        city: formData?.city,
        description: formData?.description,
        producer_id: formData?.producerId,
        dj_id: Array.isArray(formData?.djIds) && formData?.djIds?.length > 0 ? formData?.djIds[0] : null,
        dj_ids: Array.isArray(formData?.djIds) ? formData.djIds : [],
        status: formData?.status,
        // cache_value must be NOT NULL in DB; use 0.00 to represent isento
        cache_value: formData?.cacheIsento ? 0.00 : (perDjTotal > 0 ? perDjTotal : (formData?.cache ? parseFloat(formData?.cache) : 0.00)),
        commission_rate: formData?.commissionPercentage !== '' ? parseFloat(formData?.commissionPercentage) : 20.00,
        requirements: `${requirementsNote}${formData?.requirements || ''}`.trim(),
        dj_fee_map: feeMap,
        contract_type: formData?.contractType || 'basic',
        contract_attached: formData?.attachContract || false
      };

      const result = await onSave(payload);
      
      // Se deve anexar contrato e o evento foi criado/atualizado, criar contratos automáticos
      if (formData?.attachContract && result?.id && Array.isArray(formData?.djIds) && formData.djIds.length > 0) {
        try {
          const { data: supabase } = await import('@/integrations/supabase/client');
          await supabase.supabase.functions.invoke('create-event-contracts', {
            body: {
              eventId: result.id,
              djIds: formData.djIds,
              contractType: formData.contractType || 'basic',
              producerId: formData.producerId,
            }
          });
          if (typeof window !== 'undefined' && window?.toast) {
            try { window.toast('Contratos criados e disponibilizados para o produtor'); } catch(e) {}
          }
        } catch (contractError) {
          console.error('Erro ao criar contratos:', contractError);
          if (typeof window !== 'undefined' && window?.toast) {
            try { window.toast('Evento salvo, mas erro ao criar contratos'); } catch(e) {}
          }
        }
      }
      
      onClose();
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      console.error('Erro ao salvar evento:', error);
      // Surface a user friendly toast when saving fails
      if (typeof window !== 'undefined' && window?.toast) {
        try { window.toast('Erro ao salvar evento: ' + (message || 'Erro desconhecido')); } catch(e) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      setIsLoading(true);
      try {
        await onDelete(event?.id);
        onClose();
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  // Show loading state while data is being fetched
  if (isDataLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Show warning if no data available
  if (!hasData) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <Icon name="AlertCircle" size={48} className="text-yellow-500" />
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Dados Incompletos
              </h3>
              <p className="text-muted-foreground mb-4">
                {!producers || producers.length === 0 ? 'Nenhum produtor cadastrado. ' : ''}
                {!djs || djs.length === 0 ? 'Nenhum DJ cadastrado. ' : ''}
                Cadastre produtores e DJs antes de criar eventos.
              </p>
            </div>
            <Button onClick={onClose} variant="default">
              Entendi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="glass-card rounded-2xl w-full max-w-4xl my-8 shadow-glass animate-scale-in flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <Icon name={mode === 'view' ? "Eye" : (event ? "Edit" : "Plus")} size={20} className="text-primary" />
            <span className="truncate">
              {mode === 'view' ? 'Detalhes do Evento' : (event ? 'Editar Evento' : 'Criar Novo Evento')}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {mode === 'view' && event && (
              <button
                onClick={() => onChangeMode && onChangeMode('edit')}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                title="Editar"
              >
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted/50 rounded-lg transition-all hover:scale-105"
            >
              <Icon name="X" size={20} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Título do Evento"
                type="text"
                required
                value={formData?.title}
                onChange={(e) => handleInputChange('title', e?.target?.value)}
                error={errors?.title}
                placeholder="Nome do evento"
              />


              <Input
                label="Data"
                type="date"
                required
                value={formData?.date}
                onChange={(e) => handleInputChange('date', e?.target?.value)}
                error={errors?.date}
              />


              <Input
                label="Local"
                type="text"
                value={formData?.venue}
                onChange={(e) => handleInputChange('venue', e?.target?.value)}
                error={errors?.venue}
                placeholder="Nome do local"
              />

              <Input
                label="Cidade"
                type="text"
                value={formData?.city}
                onChange={(e) => handleInputChange('city', e?.target?.value)}
                error={errors?.city}
                placeholder="Cidade"
              />
            </div>

            {/* Producer and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Produtor"
                options={producerOptions}
                value={formData?.producerId}
                onChange={(value) => handleInputChange('producerId', value)}
                error={errors?.producerId}
                searchable
              />

              <Select
                label="Status"
                options={statusOptions}
                value={formData?.status}
                onChange={(value) => handleInputChange('status', value)}
              />
            </div>

            {/* Contract Type */}
            <div>
              <Select
                label="Tipo de Contrato"
                options={[
                  { value: 'basic', label: 'Contrato Básico' },
                  { value: 'intermediate', label: 'Contrato Intermediário' },
                  { value: 'premium', label: 'Contrato Premium' }
                ]}
                value={formData?.contractType}
                onChange={(value) => handleInputChange('contractType', value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Selecione o tipo de contrato que será usado para este evento. Por padrão, eventos recebem o contrato básico.
              </p>
            </div>

            {/* DJ Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-foreground">
                  Seleção de DJs
                </label>
                <span className="text-xs text-muted-foreground">
                  {djs?.length} DJs disponíveis
                </span>
              </div>
              {errors?.djIds && (
                <p className="text-sm text-error mb-2">{errors?.djIds}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-border rounded-md p-4">
                {djs?.map((dj) => (
                  <div key={dj?.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={formData?.djIds?.includes(dj?.id)}
                      onCheckedChange={(checked) => handleDjSelection(dj?.id, checked === true)}
                      disabled={!dj?.is_active}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {dj?.name || dj?.artist_name || 'DJ sem nome'}
                        </p>
                        {!dj?.is_active && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {dj?.genre}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fees per selected DJ */}
              {Array.isArray(formData?.djIds) && formData.djIds.length > 0 && (
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-foreground">Cachê por DJ (opcional)</label>
                  <div className="space-y-2">
                    {formData.djIds.map((id) => {
                      const dj = djs?.find(d => d.id === id);
                      return (
                        <div key={id} className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                          <div className="md:col-span-2 text-sm text-foreground truncate">{dj?.name || dj?.artist_name || id}</div>
                          <Input
                            label=""
                            type="number"
                            value={djFees?.[id] ?? ''}
                            onChange={(e) => setDjFees(prev => ({ ...prev, [id]: e?.target?.value }))}
                            placeholder="0,00"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cachê, Comissão e Pagamento Antecipado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Cachê (R$)"
                  type="number"
                  value={formData?.cache}
                  onChange={(e) => handleInputChange('cache', e?.target?.value)}
                  placeholder="0,00"
                  error={errors?.cache}
                  disabled={formData?.cacheIsento}
                />
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    id="cacheIsento"
                    type="checkbox"
                    checked={!!formData?.cacheIsento}
                    onChange={(e) => handleInputChange('cacheIsento', e.target.checked)}
                  />
                  <label htmlFor="cacheIsento" className="text-sm text-muted-foreground">Cachê isento</label>
                </div>
              </div>

              <Input
                label="Comissão UNK (%)"
                type="number"
                min={0}
                max={100}
                value={formData?.commissionPercentage}
                onChange={(e) => handleInputChange('commissionPercentage', e?.target?.value)}
                placeholder="Ex: 10"
                disabled={mode === 'view'}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Pagamento de cachê antecipado?</label>
                <div className="flex items-center space-x-3">
                  <input
                    id="advancePaid"
                    type="checkbox"
                    checked={!!formData?.advancePaid}
                    onChange={(e) => handleInputChange('advancePaid', e.target.checked)}
                  />
                  <label htmlFor="advancePaid" className="text-sm text-foreground">Sim</label>
                </div>
                {formData?.advancePaid && (
                  <Input
                    label="Porcentagem adiantada (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={formData?.advancePercentage}
                    onChange={(e) => handleInputChange('advancePercentage', e?.target?.value)}
                    placeholder="Ex: 50"
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData?.description}
                  onChange={(e) => handleInputChange('description', e?.target?.value)}
                  placeholder="Descrição detalhada do evento..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Observações / Requisitos
                </label>
                <textarea
                  value={formData?.requirements}
                  onChange={(e) => handleInputChange('requirements', e?.target?.value)}
                  placeholder="Observações, requisitos, e detalhes de pagamento antecipado"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                <input
                  id="attachContract"
                  type="checkbox"
                  checked={!!formData?.attachContract}
                  onChange={(e) => handleInputChange('attachContract', e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="attachContract" className="text-sm font-medium text-foreground cursor-pointer">
                  Anexar contrato automaticamente ao salvar evento (ficará visível para o produtor)
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t border-border/50 bg-gradient-to-r from-muted/30 to-muted/10 flex-shrink-0">
            <div className="w-full sm:w-auto">
              {event && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                  iconName="Trash2"
                  iconPosition="left"
                  className="w-full sm:w-auto"
                >
                  Excluir Evento
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                loading={isLoading}
                iconName="Save"
                iconPosition="left"
                className="w-full sm:w-auto"
              >
                {event ? 'Salvar Alterações' : 'Criar Evento'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
