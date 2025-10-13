import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { producerService, djService, storageService, eventService } from '../../services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../../hooks/use-auth';
import { ProducerCreateModal } from './components/ProducerCreateModal';

const ProducerCard = ({ producer, eventCount, onView, onEdit, onChangePassword, onSelectDJ, onDelete, isDeleting }) => {
  const rawAvatar = producer?.avatar_url || producer?.profile_image_url || '';

  const getAvatarUrl = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'string' && raw.startsWith('http')) return raw;
    // If value looks like a storage path, try common buckets
    try {
      const candidates = ['producer-avatar', 'producer-avatars', 'avatars', 'producers', 'public'];
      for (const bucket of candidates) {
        const url = storageService.getPublicUrl(bucket, raw);
        if (url) return url;
      }
    } catch (e) {
      // ignore
    }
    // fallback to raw
    return raw;
  };

  const avatar = getAvatarUrl(rawAvatar);
  const totalEventsSource = eventCount ?? producer?.total_events ?? producer?.events_count ?? producer?.event_count ?? (Array.isArray(producer?.events) ? producer?.events.length : null);
  const totalEventsNumber = typeof totalEventsSource === 'number' ? totalEventsSource : Number(totalEventsSource);
  const totalEvents = Number.isFinite(totalEventsNumber) ? Math.max(0, totalEventsNumber) : null;
  const formattedLocation = '' /* endereço não exibido no card */;
  const contactName = producer?.contact_person || producer?.responsible || producer?.manager || '';
  const infoItems = [
    { icon: 'Mail', value: producer?.email },
    { icon: 'Phone', value: producer?.phone },
    { icon: 'User', value: contactName },
  ].filter((item) => item.value);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0d111f] via-[#0f1629] to-[#070915] p-6 text-foreground shadow-[0_30px_60px_-35px_rgba(15,23,42,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_35px_70px_-30px_rgba(59,130,246,0.35)]">
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/15 ring-1 ring-primary/30">
              {avatar ? (
                <img src={avatar} alt={producer?.name || producer?.company_name || 'Produtor'} className="h-full w-full object-cover" />
              ) : (
                <Icon name="Building2" size={28} className="text-primary" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-xl font-semibold leading-tight text-white truncate">
                {producer?.name || producer?.company_name || 'Produtor'}
              </h3>
              <p className="mt-1 text-sm text-slate-300/80 truncate">
                {producer?.company_name || producer?.email || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
            {producer?.is_active !== undefined && (
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${producer?.is_active ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-rose-400/40 bg-rose-500/15 text-rose-200'}`}>
                {producer?.is_active ? 'Ativo' : 'Inativo'}
              </span>
            )}
            <div className="text-right">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-300/60">Eventos</span>
              <span className="text-lg font-semibold text-white">
                {totalEvents === null ? '—' : `${totalEvents} evento${totalEvents === 1 ? '' : 's'}`}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          {infoItems.length === 0 ? (
            <span className="text-slate-400/70">Nenhuma informação de contato disponível.</span>
          ) : (
            infoItems.map((item, index) => (
              <div key={`${item.icon}-${index}`} className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 backdrop-blur-sm transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-primary group-hover:bg-primary/25">
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="truncate text-sm font-medium text-white/90">{item.value}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:border-primary/30 hover:bg-primary/10 sm:w-auto"
              onClick={() => onView(producer)}
              icon={<Icon name="Eye" size={16} className="text-sky-400" />}
            >
              Detalhes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:border-amber-300/40 hover:bg-amber-500/10 sm:w-auto"
              onClick={() => onEdit(producer)}
              icon={<Icon name="Pencil" size={16} className="text-amber-400" />}
            >
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:border-purple-300/40 hover:bg-purple-500/10 sm:w-auto"
              onClick={() => onChangePassword(producer)}
              icon={<Icon name="Key" size={16} className="text-purple-400" />}
            >
              Senha
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="w-full rounded-xl border border-primary/30 bg-primary/10 text-slate-100 hover:border-primary/50 hover:bg-primary/20 sm:w-auto"
              onClick={() => onSelectDJ(producer)}
              icon={<Icon name="Users" size={16} className="text-primary" />}
            >
              Selecionar DJ
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-xl border border-rose-400/40 text-rose-200 hover:bg-rose-500/15 sm:w-auto"
              onClick={() => onDelete?.(producer)}
              icon={<Icon name="Trash2" size={16} className="text-rose-400" />}
              loading={isDeleting}
              disabled={isDeleting}
            >
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-border/60">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground max-w-[60%] text-right truncate">{value || '-'}</span>
  </div>
);

const ProducerManagement = () => {
  const { userProfile, loading, profileLoading, isAuthenticated } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const { data: producers = [], loading: loadingProducers, refetch: refetchProducers, error: producersError } = useSupabaseData(producerService, 'getAll', [], []);
  const { data: djs = [], loading: loadingDjs } = useSupabaseData(djService, 'getAll', [], []);
  const { data: events = [] } = useSupabaseData(eventService, 'getAll', [], []);

  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [passwordFor, setPasswordFor] = useState(null);
  const [selectDJFor, setSelectDJFor] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [evaluationRating, setEvaluationRating] = useState(null);
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [savingEvaluation, setSavingEvaluation] = useState(false);

  const [search, setSearch] = useState('');
  const [isSidebarHover, setIsSidebarHover] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    cnpj: '',
    address: '',
    contact_person: '',
    is_active: true,
    avatar_url: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedAvatarPreview, setSelectedAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData?.name || '',
        email: editData?.email || '',
        phone: editData?.phone || '',
        company_name: editData?.company_name || '',
        cnpj: editData?.cnpj || '',
        address: editData?.address || '',
        contact_person: editData?.contact_person || '',
        is_active: editData?.is_active ?? true,
        avatar_url: editData?.avatar_url || editData?.profile_image_url || ''
      });
      setSelectedAvatar(null);
      setSelectedAvatarPreview('');
      setNewPassword('');
      setShowPassword(false);
    }
  }, [editData]);

  useEffect(() => {
    if (!selected) {
      setEvaluationRating(null);
      setEvaluationNotes('');
      return;
    }

    const rawRating = selected?.rating ?? selected?.profile?.rating ?? null;
    const numericRating = rawRating == null ? null : Number(rawRating);
    const sanitizedRating = Number.isFinite(numericRating) && numericRating >= 1 ? Math.min(5, Math.round(numericRating)) : null;
    setEvaluationRating(sanitizedRating);

    const notesValue = selected?.admin_notes ?? selected?.profile?.admin_notes ?? '';
    setEvaluationNotes(typeof notesValue === 'string' ? notesValue : notesValue ?? '');
  }, [selected]);

  // Generate preview URL when a file is selected
  useEffect(() => {
    if (!selectedAvatar) {
      setSelectedAvatarPreview('');
      return;
    }
    const url = URL.createObjectURL(selectedAvatar);
    setSelectedAvatarPreview(url);
    return () => {
      try { URL.revokeObjectURL(url); } catch {}
    };
  }, [selectedAvatar]);

  const handleAvatarSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }
    setSelectedAvatar(file);
  };

  const producerEventCounts = useMemo(() => {
    if (!Array.isArray(events)) return new Map();

    const counts = new Map();
    events.forEach((eventRecord) => {
      const candidateIds = [
        eventRecord?.producer_id,
        eventRecord?.producerId,
        eventRecord?.producer?.id,
        eventRecord?.producer?.profile_id,
        eventRecord?.producer?.profile?.id,
      ].filter((value) => value !== null && value !== undefined && value !== '');

      const uniqueIds = Array.from(new Set(candidateIds.map((value) => String(value))));
      uniqueIds.forEach((id) => {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      });
    });

    return counts;
  }, [events]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return producers || [];
    return (producers || []).filter(p =>
      (p?.name || '').toLowerCase().includes(term) ||
      (p?.company_name || '').toLowerCase().includes(term) ||
      (p?.email || '').toLowerCase().includes(term)
    );
  }, [search, producers]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const evaluationVariant = useMemo(() => {
    if (!evaluationRating) return 'neutral';
    if (evaluationRating >= 4) return 'positive';
    if (evaluationRating === 3) return 'warning';
    return 'negative';
  }, [evaluationRating]);

  const evaluationClasses = useMemo(() => {
    switch (evaluationVariant) {
      case 'positive':
        return {
          border: 'border-emerald-400/60',
          background: 'bg-emerald-500/10',
          text: 'text-emerald-300',
          dot: 'bg-emerald-400'
        };
      case 'warning':
        return {
          border: 'border-amber-400/60',
          background: 'bg-amber-500/10',
          text: 'text-amber-200',
          dot: 'bg-amber-400'
        };
      case 'negative':
        return {
          border: 'border-rose-400/60',
          background: 'bg-rose-500/10',
          text: 'text-rose-200',
          dot: 'bg-rose-400'
        };
      default:
        return {
          border: 'border-border/60',
          background: 'bg-muted/10',
          text: 'text-muted-foreground',
          dot: 'bg-muted-foreground/60'
        };
    }
  }, [evaluationVariant]);

  const evaluationStatusLabel = useMemo(() => {
    if (!evaluationRating) return 'Sem avaliação registrada';
    if (evaluationRating >= 4) return 'Bom produtor - Recomendado';
    if (evaluationRating === 3) return 'Produtor mediano - Monitorar';
    return 'Avaliação baixa - Revisar';
  }, [evaluationRating]);

  const onSaveEdit = async () => {
    if (!editData) return;
    if (!formData?.name || !formData?.email) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      // Upload avatar if selected
      if (selectedAvatar) {
        setUploadingAvatar(true);
        try {
          const res = await producerService.uploadAvatar(editData.id, selectedAvatar);
          if (res?.error) {
            alert(`Erro ao atualizar avatar: ${res.error}`);
            setUploadingAvatar(false);
            return;
          }
          if (res?.data?.url) {
            setFormData(prev => ({ ...prev, avatar_url: res.data.url }));
          }
        } finally {
          setUploadingAvatar(false);
        }
      }

      // Update profile directly; then try to sync producers table if present
      const updates = { ...formData };
      const profileId = editData.profile_id || editData.id;
      const profileUpdates = {
        full_name: updates.name,
        email: updates.email,
        phone: updates.phone,
        avatar_url: updates.avatar_url,
      };
      const { error: profileErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', profileId);

      if (profileErr) {
        alert(profileErr.message || 'Erro ao atualizar perfil do produtor');
        return;
      }

      const producerUpdates = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        company_name: updates.company_name,
        cnpj: updates.cnpj,
        address: updates.address,
        contact_person: updates.contact_person,
        is_active: updates.is_active,
        avatar_url: updates.avatar_url,
      };

      let prodUpdateError = null;
      try {
        const res1 = await supabase.from('producers').update(producerUpdates).eq('profile_id', profileId);
        if (res1.error) {
          const res2 = await supabase.from('producers').update(producerUpdates).eq('id', editData.id);
          prodUpdateError = res2.error || null;
        }
      } catch (e) {
        prodUpdateError = e;
      }
      if (prodUpdateError) {
        console.warn('Falha ao atualizar registro em producers:', prodUpdateError);
      }

      // Update password if provided (admin edge function)
      if (newPassword?.trim()) {
        const profileIdForPw = editData.profile_id || editData.id;
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', profileIdForPw)
          .single();
        if (profErr || !prof?.id) {
          alert('Erro ao obter usuário para atualizar senha');
          return;
        }
        const { data: pwRes, error: pwErr } = await supabase.functions.invoke('admin-reset-password', {
          body: { userId: prof.id, newPassword }
        });
        if (pwErr || pwRes?.error) {
          alert(pwErr?.message || pwRes?.error || 'Erro ao atualizar senha');
          return;
        }
      }

      alert(newPassword?.trim() ? 'Produtor atualizado e senha alterada com sucesso!' : 'Produtor atualizado com sucesso!');
      setEditData(null);
      setSelectedAvatar(null);
      setNewPassword('');
      refetchProducers();
    } catch (e) {
      console.error('Erro ao atualizar produtor:', e);
      alert('Erro ao atualizar produtor');
    }
  };

  const onSubmitPassword = async (producer) => {
    const newPass = window.prompt('Nova senha para ' + (producer?.email || 'produtor') + ':');
    if (!newPass) return;
    
    if (newPass.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      // Get user_id from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', producer?.id)
        .single();

      if (profileError || !profile) {
        toast.error('Erro ao buscar informações do produtor');
        return;
      }

      // Call admin-reset-password edge function
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { 
          userId: profile.id,
          newPassword: newPass 
        }
      });

      if (error || data?.error) {
        console.error('Erro ao resetar senha:', error || data?.error);
        toast.error(error?.message || data?.error || 'Erro ao resetar senha');
        return;
      }

      toast.success('Senha alterada com sucesso!');
      setPasswordFor(null);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro ao resetar senha');
    }
  };

  const onSubmitSelectDJ = async (producer, djId) => {
    const res = await producerService.setDashboardDJ(producer?.id, djId);
    if (res?.error) {
      alert(res.error);
    } else {
      alert('DJ definido para o dashboard do produtor');
      setSelectDJFor(null);
      refetchProducers();
    }
  };

  const handleDeleteProducer = async (producer) => {
    const profileId = producer?.id ?? producer?.profile_id;
    const userId = producer?.user_id ?? null;

    if (!profileId) {
      toast.error('Não foi possível identificar o produtor selecionado.');
      return;
    }

    const producerLabel = producer?.company_name || producer?.name || producer?.email || 'este produtor';
    const confirmed = window.confirm(`Tem certeza que deseja excluir ${producerLabel}? Esta ação não pode ser desfeita.`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(profileId);
      const { error } = await producerService.deleteProducer({ profileId, userId });

      if (error) {
        if (error === 'supabase_not_configured') {
          toast.error('Conecte o Supabase para excluir produtores.');
        } else {
          toast.error(typeof error === 'string' ? error : 'Erro ao excluir produtor.');
        }
        return;
      }

      toast.success('Produtor excluído com sucesso.');
      refetchProducers();
    } catch (error) {
      console.error('Erro ao excluir produtor:', error);
      toast.error('Erro ao excluir produtor.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && userProfile && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="ShieldAlert" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Acesso restrito a administradores</p>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground gradient-text">Produtores</h1>
          <p className="text-muted-foreground">Gerencie os produtores cadastrados</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar..." 
            className="flex-1 md:w-64"
          />
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 hover-glow"
            iconName="Plus"
            iconPosition="left"
          >
            Novo
          </Button>
        </div>
      </div>

      <ProducerCreateModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetchProducers()}
      />

          {loadingProducers ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : producersError ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
              <div className="flex items-start justify-between">
                <div>
                  <strong className="font-semibold">Falha ao carregar produtores</strong>
                  <div className="mt-1 text-xs text-destructive/90">{producersError}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => refetchProducers()}>Tentar novamente</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {(filtered || []).map((p) => {
                const profileId = p?.id ?? p?.profile_id;
                const isDeleting = deletingId !== null && profileId === deletingId;
                const eventCountCandidates = [p?.id, p?.profile_id, p?.profile?.id];
                let resolvedEventCount = null;
                for (const candidate of eventCountCandidates) {
                  if (candidate === null || candidate === undefined || candidate === '') continue;
                  const found = producerEventCounts.get(String(candidate));
                  if (found !== undefined) {
                    resolvedEventCount = found;
                    break;
                  }
                }

                return (
                  <ProducerCard
                    key={p?.id || p?.profile_id || p?.email}
                    producer={p}
                    eventCount={resolvedEventCount}
                    onView={setSelected}
                    onEdit={setEditData}
                    onChangePassword={setPasswordFor}
                    onSelectDJ={setSelectDJFor}
                    onDelete={handleDeleteProducer}
                    isDeleting={isDeleting}
                  />
                );
              })}
          </div>
        )}

        {/* Details Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Detalhes do Produtor</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><Icon name="X" size={18} /></Button>
              </div>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center">
                  {selected?.avatar_url || selected?.profile_image_url ? (
                    <img src={selected?.avatar_url || selected?.profile_image_url} alt={selected?.name || selected?.company_name || 'Produtor'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-semibold text-muted-foreground">
                      {(selected?.name || selected?.company_name || 'P').charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-foreground truncate">{selected?.name || selected?.company_name || 'Produtor'}</div>
                  {selected?.company_name && (selected?.company_name !== (selected?.name || '')) && (
                    <div className="text-sm text-muted-foreground truncate">{selected?.company_name}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailRow label="Email" value={selected?.email} />
                <DetailRow label="Telefone" value={selected?.phone} />
                <DetailRow label="CNPJ" value={selected?.cnpj} />
                <DetailRow label="Contato" value={selected?.contact_person} />
                <DetailRow label="Endereço" value={selected?.address} />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Editar Produtor</h2>
                <Button variant="ghost" size="icon" onClick={() => setEditData(null)}><Icon name="X" size={18} /></Button>
              </div>

              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 p-4 border border-border/60 rounded-lg mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border">
                    {selectedAvatarPreview ? (
                      <img src={selectedAvatarPreview} alt={formData?.name || 'Produtor'} className="w-full h-full object-cover object-center" />
                    ) : formData?.avatar_url || editData?.avatar_url ? (
                      <img src={formData?.avatar_url || editData?.avatar_url} alt={formData?.name || 'Produtor'} className="w-full h-full object-cover object-center" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xl font-semibold">
                        {(formData?.name || 'P').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-foreground">Foto do Perfil</div>
                    <div className="flex items-center space-x-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                        <Icon name="Upload" size={14} className="mr-2" />
                        {selectedAvatar ? 'Trocar Foto' : 'Adicionar Foto'}
                      </Button>
                      {selectedAvatar && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedAvatar(null)}>
                          <Icon name="X" size={14} />
                        </Button>
                      )}
                    </div>
                    {selectedAvatar && (
                      <p className="text-sm text-muted-foreground">{selectedAvatar.name}</p>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input value={formData?.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome *" />
                <Input value={formData?.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="Email *" type="email" />
                <Input value={formData?.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="Telefone" />
                <Input value={formData?.company_name} onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))} placeholder="Nome da Empresa" />
                <Input value={formData?.cnpj} onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))} placeholder="CNPJ" />
                <Input value={formData?.contact_person} onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))} placeholder="Pessoa de Contato" />
              </div>

              <div className="mt-4">
                <Input value={formData?.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="Endereço" />
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <input id="is_active" type="checkbox" checked={!!formData?.is_active} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} />
                <label htmlFor="is_active" className="text-sm text-foreground">Produtor ativo</label>
              </div>

              <div className="space-y-2 mt-4">
                <div className="text-sm text-foreground">Nova Senha (opcional)</div>
                <div className="relative">
                  <Input id="new_password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha (deixe vazio para manter)" />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditData(null)}>Cancelar</Button>
                <Button onClick={onSaveEdit} disabled={uploadingAvatar}>{uploadingAvatar ? 'Enviando foto...' : 'Salvar Alterações'}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal (prompt-based simple flow) */}
        {passwordFor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Alterar senha</h2>
                <Button variant="ghost" size="icon" onClick={() => setPasswordFor(null)}><Icon name="X" size={18} /></Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Defina uma nova senha para {passwordFor?.email}. Esta ação pode requerer um endpoint seguro no servidor (service_role) dependendo da sua configuração do Supabase.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPasswordFor(null)}>Cancelar</Button>
                <Button onClick={() => onSubmitPassword(passwordFor)}>Definir nova senha</Button>
              </div>
            </div>
          </div>
        )}

        {/* Select DJ Modal */}
        {selectDJFor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Selecionar DJ para o dashboard</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectDJFor(null)}><Icon name="X" size={18} /></Button>
              </div>
              {loadingDjs ? (
                <div className="flex justify-center py-8">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {(djs || []).map((dj) => (
                    <button key={dj?.id} className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted text-left" onClick={() => onSubmitSelectDJ(selectDJFor, dj?.id)}>
                      <span className="text-sm text-foreground">{dj?.name}</span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default ProducerManagement;
