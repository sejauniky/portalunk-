import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Edit, Calendar as CalendarIcon, DollarSign, Image as ImageIcon, User, FileText, List } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { useAuth } from '../../../hooks/use-auth';
import { eventService } from '../../../services/supabaseService';
import paymentService from '../../../services/paymentService';
import ContractModal from '../../event-calendar/components/ContractModal';
import { useToast } from '../../../hooks/use-toast';
import DJMediaGallery from './DJMediaGallery';
import { supabase } from '@/integrations/supabase/client';
const DJProfileDetail = ({
  dj,
  onBack
}) => {
  const {
    userProfile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('agenda');
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedEventForContract, setSelectedEventForContract] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(null);

  // Buscar dados relacionados ao DJ
  const {
    data: allEvents
  } = useSupabaseData(eventService, 'getAll', [], []);
  const {
    data: payments
  } = useSupabaseData(paymentService, 'getAll', [], []);

  // Filtrar eventos do produtor logado que incluem este DJ
  const djEvents = useMemo(() => {
    if (!allEvents || !userProfile?.id || !dj?.id) return [];
    return allEvents.filter(event => {
      // Verificar se é do produtor atual
      const isProducerEvent = (event?.producer?.id ?? event?.producer_id) === userProfile.id;

      // Verificar se o DJ está vinculado (primário ou adicional)
      const isPrimaryDJ = event?.dj?.id === dj.id || event?.dj_id === dj.id;
      const isAdditionalDJ = Array.isArray(event?.event_djs) && event.event_djs.some(ed => ed?.dj?.id === dj.id || ed?.dj_id === dj.id);
      return isProducerEvent && (isPrimaryDJ || isAdditionalDJ);
    });
  }, [allEvents, userProfile?.id, dj?.id]);

  // Calcular informações financeiras
  const financialInfo = useMemo(() => {
    const eventIds = djEvents.map(e => e?.id).filter(Boolean);
    const relatedPayments = (payments || []).filter(p => eventIds.includes(p?.event?.id || p?.event_id));
    const totalPaid = relatedPayments.filter(p => p?.status?.toLowerCase() === 'paid' || p?.status?.toLowerCase() === 'pago').reduce((sum, p) => sum + (parseFloat(p?.amount) || 0), 0);
    const totalPending = relatedPayments.filter(p => p?.status?.toLowerCase() === 'pending' || p?.status?.toLowerCase() === 'pendente').reduce((sum, p) => sum + (parseFloat(p?.amount) || 0), 0);
    const totalRevenue = relatedPayments.reduce((sum, p) => sum + (parseFloat(p?.amount) || 0), 0);
    return {
      totalEvents: djEvents.length,
      totalPaid,
      totalPending,
      totalRevenue,
      payments: relatedPayments
    };
  }, [djEvents, payments]);
  const displayName = dj?.artist_name || dj?.name || 'DJ';
  const profileImage = dj?.avatar_url || dj?.profile_image_url || '/placeholder.svg';
  const genre = dj?.genre || 'Electronic';
  const instagramHandle = dj?.instagram_url?.replace('https://instagram.com/', '').replace('@', '') || 'pedrotheo';
  const status = dj?.status || 'disponivel';
  const statusLabel = status === 'disponivel' ? 'Disponível' : status === 'ocupado' ? 'Ocupado' : 'Inativo';
  const statusColor = status === 'disponivel' ? 'bg-emerald-500' : status === 'ocupado' ? 'bg-amber-500' : 'bg-gray-500';
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };
  const formatDate = date => {
    if (!date) return 'Data não informada';
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  const tabs = [{
    id: 'overview',
    label: 'Visão Geral',
    icon: User
  }, {
    id: 'agenda',
    label: 'Eventos',
    icon: CalendarIcon
  }, {
    id: 'media',
    label: 'Mídia',
    icon: ImageIcon
  }, {
    id: 'financial',
    label: 'Financeiro',
    icon: DollarSign
  }];

  // Get events for selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate || !djEvents) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return djEvents.filter(event => {
      if (!event?.event_date) return false;
      const eventDateStr = format(new Date(event.event_date + 'T00:00:00'), 'yyyy-MM-dd');
      return eventDateStr === dateStr;
    });
  }, [selectedDate, djEvents]);

  // Get dates that have events
  const eventDates = useMemo(() => {
    if (!djEvents) return [];
    return djEvents
      .filter(e => e?.event_date)
      .map(e => new Date(e.event_date + 'T00:00:00'));
  }, [djEvents]);
  return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
    {/* Header */}
    <div className="bg-[#0a0a0a]/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Perfil do DJ</h1>
            <p className="text-sm text-white/60">{displayName}</p>
          </div>
        </div>

      </div>
    </div>

    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* DJ Profile Card */}
      <div className="relative overflow-hidden rounded-2xl mb-6 border border-white/10">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: dj?.backdrop_url ? `url(${dj.backdrop_url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/20 shadow-2xl">
              <img src={profileImage} alt={displayName} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {displayName}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30">
                    {genre}
                  </span>
                  {instagramHandle && <span className="px-4 py-1.5 rounded-full bg-pink-500/20 text-pink-300 text-sm font-medium border border-pink-500/30">
                    @{instagramHandle}
                  </span>}
                </div>
              </div>
            </div>

            {/* Status Badge */}

          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1a1a2e]/50 backdrop-blur-sm rounded-xl border border-white/10 mb-6">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-white bg-purple-600/20 border-b-2 border-purple-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>;
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
              <p className="text-purple-300 text-sm mb-2">Total de Eventos</p>
              <p className="text-3xl font-bold text-white">{financialInfo.totalEvents}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
              <p className="text-emerald-300 text-sm mb-2">Receita Total</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(financialInfo.totalRevenue)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6">
              <p className="text-blue-300 text-sm mb-2">Próximo Evento</p>
              <p className="text-lg font-bold text-white">
                {djEvents[0] ? formatDate(djEvents[0].event_date) : 'Nenhum'}
              </p>
            </div>
          </div>

          {dj?.bio && <div className="bg-[#1a1a2e]/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Sobre</h3>
            <p className="text-white/70 leading-relaxed">{dj.bio}</p>
          </div>}
        </div>}

        {/* Agenda Tab */}
        {activeTab === 'agenda' && <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Eventos Contratados</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">{djEvents.length} eventos</span>
              <div className="flex gap-1 bg-[#1a1a2e]/80 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {djEvents.length === 0 ? (
            <div className="bg-[#1a1a2e]/50 border border-white/10 rounded-xl p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Nenhum evento agendado com este DJ</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {djEvents.map(event => {
                const EventItem = () => {
                  const [isSigned, setIsSigned] = useState(false);
                  const [isAttached, setIsAttached] = useState(event?.contract_attached || false);

                  useEffect(() => {
                    const checkSignature = async () => {
                      if (!event?.id) return;
                      try {
                        const { data } = await supabase
                          .from('digital_signatures')
                          .select('*')
                          .eq('contract_instance_id', event.id)
                          .eq('signer_type', 'producer')
                          .maybeSingle();

                        if (data) {
                          setIsSigned(true);
                        }
                      } catch (error) {
                        setIsSigned(false);
                      }
                    };
                    checkSignature();
                  }, []);

                  return (
                    <div className="bg-[#1a1a2e]/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h4 className="text-lg font-semibold text-white">
                            {event?.event_name || event?.title || 'Evento'}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/60">
                            <p><strong className="text-white/80">Data:</strong> {formatDate(event?.event_date)}</p>
                            <p><strong className="text-white/80">Local:</strong> {event?.venue || event?.location || 'N/A'}</p>
                            <p><strong className="text-white/80">Cidade:</strong> {event?.city || 'N/A'}</p>
                            <p><strong className="text-white/80">Cachê:</strong> {formatCurrency(event?.cache_value || event?.fee)}</p>
                          </div>
                        </div>

                        {isAttached && (
                          <button
                            onClick={() => {
                              setSelectedEventForContract(event);
                              setIsContractModalOpen(true);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                              isSigned
                                ? 'bg-emerald-600/20 border border-emerald-600/40 text-emerald-200 hover:bg-emerald-600/30'
                                : 'bg-yellow-600/20 border border-yellow-600/40 text-yellow-200 hover:bg-yellow-600/30'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            {isSigned ? 'Contrato Assinado' : 'Assinar Contrato'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                };

                return <EventItem key={event.id} />;
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#1a1a2e]/50 border border-white/10 rounded-xl p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className="mx-auto"
                  modifiers={{
                    hasEvent: eventDates
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      backgroundColor: 'rgba(139, 92, 246, 0.3)',
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </div>

              {selectedDate && eventsForSelectedDate.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-white font-semibold">
                    Eventos em {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </h4>
                  {eventsForSelectedDate.map(event => {
                    const EventItem = () => {
                      const [isSigned, setIsSigned] = useState(false);
                      const [isAttached, setIsAttached] = useState(event?.contract_attached || false);

                      useEffect(() => {
                        const checkSignature = async () => {
                          if (!event?.id) return;
                          try {
                            const { data } = await supabase
                              .from('digital_signatures')
                              .select('*')
                              .eq('contract_instance_id', event.id)
                              .eq('signer_type', 'producer')
                              .maybeSingle();

                            if (data) {
                              setIsSigned(true);
                            }
                          } catch (error) {
                            setIsSigned(false);
                          }
                        };
                        checkSignature();
                      }, []);

                      return (
                        <div className="bg-[#1a1a2e]/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <h4 className="text-lg font-semibold text-white">
                                {event?.event_name || event?.title || 'Evento'}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/60">
                                <p><strong className="text-white/80">Local:</strong> {event?.venue || event?.location || 'N/A'}</p>
                                <p><strong className="text-white/80">Cidade:</strong> {event?.city || 'N/A'}</p>
                                <p><strong className="text-white/80">Cachê:</strong> {formatCurrency(event?.cache_value || event?.fee)}</p>
                              </div>
                            </div>

                            {isAttached && (
                              <button
                                onClick={() => {
                                  setSelectedEventForContract(event);
                                  setIsContractModalOpen(true);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                                  isSigned
                                    ? 'bg-emerald-600/20 border border-emerald-600/40 text-emerald-200 hover:bg-emerald-600/30'
                                    : 'bg-yellow-600/20 border border-yellow-600/40 text-yellow-200 hover:bg-yellow-600/30'
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                                {isSigned ? 'Contrato Assinado' : 'Assinar Contrato'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    };

                    return <EventItem key={event.id} />;
                  })}
                </div>
              )}

              {selectedDate && eventsForSelectedDate.length === 0 && (
                <div className="bg-[#1a1a2e]/50 border border-white/10 rounded-xl p-8 text-center">
                  <p className="text-white/60">Nenhum evento nesta data</p>
                </div>
              )}
            </div>
          )}
        </div>}

        {/* Media Tab */}
        {activeTab === 'media' && <DJMediaGallery djId={dj?.id} />}

        {/* Financial Tab */}
        {activeTab === 'financial' && <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Informações Financeiras</h3>
          <p className="text-white/60 text-sm">Dados financeiros e histórico de pagamentos</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
              <p className="text-emerald-300 text-sm mb-2">Total Pago</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(financialInfo.totalPaid)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-6">
              <p className="text-amber-300 text-sm mb-2">Pendente</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(financialInfo.totalPending)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
              <p className="text-purple-300 text-sm mb-2">Receita Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(financialInfo.totalRevenue)}</p>
            </div>
          </div>

          {financialInfo.payments.length > 0 && <div className="bg-[#1a1a2e]/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Evento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {financialInfo.payments.map(payment => <tr key={payment.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-sm text-white">
                      {payment?.event?.event_name || payment?.event?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {payment?.due_date ? formatDate(payment.due_date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {formatCurrency(payment?.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment?.status?.toLowerCase() === 'paid' || payment?.status?.toLowerCase() === 'pago' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {payment?.status?.toLowerCase() === 'paid' || payment?.status?.toLowerCase() === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>}
        </div>}
      </div>
    </div>

    <ContractModal isOpen={isContractModalOpen} onClose={() => {
      setIsContractModalOpen(false);
      setSelectedEventForContract(null);
    }} event={selectedEventForContract} onSign={async () => {
      setIsContractModalOpen(false);
      setSelectedEventForContract(null);
      toast({
        title: 'Contrato assinado',
        description: 'O contrato foi assinado com sucesso!'
      });
    }} />
  </div>;
};
export default DJProfileDetail;