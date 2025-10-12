import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'react-hot-toast';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { storageService } from '../../services/supabaseService';
import { supabase } from '@/lib/supabase';

const CompanySettings = () => {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState({
    company_name: 'UNK ASSESSORIA',
    cnpj: '12.345.678/0001-90',
    address: '',
    city: '',
    state: '',
    cep: '',
    phone: '',
    email: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    pix_key: '',
    contract_basic: '',
    contract_intermediate: '',
    contract_premium: '',
    payment_instructions: '',
    avatar_url: '',
    avatar_url_preview: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Normalize incoming company settings so text fields are never `null` (React controlled inputs expect '' or undefined)
  const normalizeCompanySettings = (raw = {}) => {
    const copy = { ...(raw || {}) };
    const textFields = [
      'company_name','cnpj','address','city','state','cep','phone','email',
      'bank_name','bank_agency','bank_account','pix_key',
      'contract_basic','contract_intermediate','contract_premium','payment_instructions',
      'avatar_url','avatar_url_preview'
    ];
    for (const key of textFields) {
      if (copy[key] === null || typeof copy[key] === 'undefined') copy[key] = '';
    }
    return copy;
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    { id: 'company', label: 'Dados da Empresa', icon: 'Building' },
    { id: 'banking', label: 'Dados Bancários', icon: 'CreditCard' },
    { id: 'contracts', label: 'Contratos', icon: 'FileText' },
    { id: 'payments', label: 'Pagamentos', icon: 'DollarSign' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (formData._avatarFile) {
        const file = formData._avatarFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `company_avatar_${Date.now()}.${fileExt}`;
        const path = `company/${fileName}`;
        const { data, error } = await storageService.uploadFile('company-avatars', path, file);
        if (error) {
          const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
          throw new Error(message || 'Erro ao fazer upload do arquivo');
        }
        const publicUrl = data?.publicUrl;
        setFormData(prev => ({ ...prev, avatar_url: publicUrl, avatar_url_preview: '' }));
        try { localStorage.setItem('company_avatar_url', publicUrl); } catch (e) {}
      }

      try {
        const payload = { ...formData };
        delete payload._avatarFile;
        delete payload.avatar_url_preview;

        // Verificar se já existe um registro
        const { data: existing } = await supabase
          .from('company_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        let result;
        if (existing?.id) {
          // Atualizar registro existente
          result = await supabase
            .from('company_settings')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          // Criar novo registro
          result = await supabase
            .from('company_settings')
            .insert(payload)
            .select()
            .single();
        }

        if (result.error) {
          const err = result.error;
          const message = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
          console.error('Erro ao salvar no Supabase:', err);
          toast?.error('Erro ao salvar: ' + (message || 'Erro desconhecido'));
          return;
        }

        const normalized = normalizeCompanySettings(result.data || {});
        setFormData(prev => ({ ...prev, ...normalized }));
        try { localStorage.setItem('company_settings', JSON.stringify(normalized)); } catch (e) {}
      } catch (e) {
        console.error('Erro ao persistir configurações:', e);
        toast?.error('Erro ao salvar configurações');
        return;
      }

      toast?.success('Configurações salvas com sucesso!');
      setSaveSuccess(true);
      setEditing(false);
      setOriginalData(formData);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast?.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Imagem Perfil</label>
          <div className="flex items-center gap-4 -ml-[17px] w-[439.2px] h-[90px]">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
              {(formData.avatar_url_preview || formData.avatar_url) ? (
                <img src={formData.avatar_url_preview || formData.avatar_url} alt="Avatar" className="w-full h-full object-cover object-center" />
              ) : (
                <span className="text-muted-foreground">UNK</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                disabled={!editing}
                onChange={(e) => {
                  const file = e?.target?.files?.[0];
                  if (!file) return;
                  const previewUrl = URL.createObjectURL(file);
                  setFormData(prev => ({ ...prev, _avatarFile: file, avatar_url_preview: previewUrl }));
                }}
                className="text-sm text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground"><span>upload de imagem do perfil</span></p>
            </div>
          </div>
        </div>

        <Input
          label="Nome da Empresa"
          required
          value={formData.company_name}
          onChange={(e) => handleInputChange('company_name', e.target.value)}
          placeholder="UNK ASSESSORIA"
          disabled={!editing}
        />

        <Input
          label="CNPJ"
          required
          value={formData.cnpj}
          onChange={(e) => handleInputChange('cnpj', e.target.value)}
          placeholder="12.345.678/0001-90"
          disabled={!editing}
        />

        <Input
          label="Endereço"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Rua das Flores, 123"
          disabled={!editing}
        />

        <Input
          label="Cidade"
          value={formData.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
          placeholder="São Paulo"
          disabled={!editing}
        />

        <Input
          label="Estado"
          value={formData.state}
          onChange={(e) => handleInputChange('state', e.target.value)}
          placeholder="SP"
          disabled={!editing}
        />

        <Input
          label="CEP"
          value={formData.cep}
          onChange={(e) => handleInputChange('cep', e.target.value)}
          placeholder="01234-567"
          disabled={!editing}
        />

        <Input
          label="Telefone"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="(11) 99999-9999"
          disabled={!editing}
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="contato@unkassessoria.com"
          disabled={!editing}
        />
      </div>
    </div>
  );

  const renderBankingTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Banco"
          value={formData.bank_name}
          onChange={(e) => handleInputChange('bank_name', e.target.value)}
          placeholder="Banco do Brasil"
          disabled={!editing}
        />

        <Input
          label="Agência"
          value={formData.bank_agency}
          onChange={(e) => handleInputChange('bank_agency', e.target.value)}
          placeholder="1234"
          disabled={!editing}
        />

        <Input
          label="Conta"
          value={formData.bank_account}
          onChange={(e) => handleInputChange('bank_account', e.target.value)}
          placeholder="12345-6"
          disabled={!editing}
        />

        <Input
          label="Chave PIX"
          value={formData.pix_key}
          onChange={(e) => handleInputChange('pix_key', e.target.value)}
          placeholder="contato@unkassessoria.com"
          disabled={!editing}
        />
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Icon name="Info" size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-600">
            <p className="font-medium">Informações importantes:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Os dados bancários serão usados nos contratos e pagamentos</li>
              <li>• A chave PIX será exibida para facilitar transferências</li>
              <li>• Mantenha as informações sempre atualizadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContractsTab = () => (
    <div className="space-y-6">
      {/* Contrato Básico */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Icon name="FileText" size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Contrato Básico</h3>
        </div>
        <textarea
          value={formData.contract_basic}
          onChange={(e) => handleInputChange('contract_basic', e.target.value)}
          placeholder="Digite o template do contrato básico..."
          rows={8}
          disabled={!editing}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Contrato padrão para eventos simples e iniciantes
        </p>
      </div>

      {/* Contrato Intermediário */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Icon name="FileText" size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Contrato Intermediário</h3>
        </div>
        <textarea
          value={formData.contract_intermediate}
          onChange={(e) => handleInputChange('contract_intermediate', e.target.value)}
          placeholder="Digite o template do contrato intermediário..."
          rows={8}
          disabled={!editing}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Contrato com cláusulas adicionais para eventos de médio porte
        </p>
      </div>

      {/* Contrato Premium */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Icon name="FileText" size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Contrato Premium</h3>
        </div>
        <textarea
          value={formData.contract_premium}
          onChange={(e) => handleInputChange('contract_premium', e.target.value)}
          placeholder="Digite o template do contrato premium..."
          rows={8}
          disabled={!editing}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Contrato completo para eventos de grande porte com todas as cláusulas
        </p>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Icon name="FileText" size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-600">
            <p className="font-medium">Templates de Contrato:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Use variáveis como {`{DJ_NAME}, {EVENT_DATE}, {AMOUNT}`} para personalização</li>
              <li>• Os templates serão usados automaticamente na criação de eventos</li>
              <li>• Por padrão, eventos novos recebem o contrato básico</li>
              <li>• Você pode trocar o tipo de contrato ao editar o evento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Instruções de Pagamento
        </label>
        <textarea
          value={formData.payment_instructions}
          onChange={(e) => handleInputChange('payment_instructions', e.target.value)}
          placeholder="Digite as instruções padrão para pagamentos..."
          rows={8}
          disabled={!editing}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Icon name="DollarSign" size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-600">
            <p className="font-medium">Instruções de Pagamento:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Essas instruções aparecerão nos contratos e comprovantes</li>
              <li>• Inclua informações sobre prazos, formas de pagamento, etc.</li>
              <li>• Seja específico sobre valores e condições</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    return () => {
      if (formData.avatar_url_preview) {
        try { URL.revokeObjectURL(formData.avatar_url_preview); } catch {}
      }
    };
  }, [formData.avatar_url_preview]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase.from('company_settings').select('*').limit(1).single();
        if (!error && data && mounted) {
          const normalized = normalizeCompanySettings(data);
          setFormData(prev => ({ ...prev, ...normalized }));
          setOriginalData(normalized);
          return;
        }
      } catch (e) {}

      try {
        const raw = localStorage.getItem('company_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (mounted) {
            const normalized = normalizeCompanySettings(parsed);
            setFormData(prev => ({ ...prev, ...normalized }));
            setOriginalData(normalized);
          }
        } else {
          const avatar = localStorage.getItem('company_avatar_url');
          if (avatar && mounted) setFormData(prev => ({ ...prev, avatar_url: avatar }));
        }
      } catch (e) {}
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleEdit = () => {
    setOriginalData({ ...formData });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (originalData) setFormData(originalData);
    setEditing(false);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const isSaveCombo = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
      if (isSaveCombo) {
        e.preventDefault();
        if (editing && !loading) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editing, loading, formData]);

  return (
    <div className="p-8">
      <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    setLocation('/admin-dashboard');
                  }
                }}
                iconName="ArrowLeft"
                iconPosition="left"
              >
                Voltar
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Configurações da Empresa
            </h1>
            <p className="text-muted-foreground">
              Gerencie as informações da UNK ASSESSORIA para contratos e pagamentos
            </p>
          </div>

          <div className="mb-6">
            <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name={tab.icon} size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            {activeTab === 'company' && renderCompanyTab()}
            {activeTab === 'banking' && renderBankingTab()}
            {activeTab === 'contracts' && renderContractsTab()}
            {activeTab === 'payments' && renderPaymentsTab()}

            {saveSuccess && (
              <div className="mt-4 p-3 rounded-md bg-green-600/10 border border-green-600/20 text-green-700 text-sm">
                Configurações salvas com sucesso
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            {!editing ? (
              <Button onClick={handleEdit} iconName="Edit" iconPosition="left" size="lg">Editar</Button>
            ) : (
              <>
                <Button onClick={handleCancelEdit} variant="outline" size="lg">Cancelar</Button>
                <Button onClick={handleSave} aria-label="Salvar alterações" loading={loading} iconName="Save" iconPosition="left" size="lg">Salvar Alterações</Button>
              </>
            )}
          </div>
    </div>
  );
};

export default CompanySettings;
