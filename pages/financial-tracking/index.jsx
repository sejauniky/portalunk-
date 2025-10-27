'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle,
  Clock,
  Banknote,
  PieChart,
  Search,
  Eye,
  Download,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePayments, useEvents, useFinancialStats } from '@/hooks/useFinancial';
import { useDJs } from '@/hooks/useDJs';
import { useProducers } from '@/hooks/useProducers';
import ConfirmPaymentModal from './components/ConfirmPaymentModal';
import { useQueryClient } from '@tanstack/react-query';

const FinancialTracking = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  
  const queryClient = useQueryClient();

  // Fetch data using React Query hooks
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: events = [], isLoading: loadingEvents } = useEvents();
  const { djs = [], loading: loadingDJs } = useDJs();
  const { producers = [], loading: loadingProducers } = useProducers();

  const normalizeId = (value) => (value == null ? null : String(value));
  const ensureArray = (value) => (Array.isArray(value) ? value : []);
  const pickFirstString = (...values) => {
    for (const value of values) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }
    return '';
  };
  const getDjDisplayName = (dj) => {
    if (!dj || typeof dj !== 'object') {
      return '';
    }
    return pickFirstString(dj.artist_name, dj.name, dj.real_name);
  };
  const getProducerDisplayName = (producer) => {
    if (!producer || typeof producer !== 'object') {
      return '';
    }
    return pickFirstString(producer.company_name, producer.name);
  };
  const parseNullableNumber = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const normalized = value.replace(/\s+/g, '').replace(',', '.');
      if (!normalized) return null;
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const paymentsWithRelations = useMemo(() => {
    return payments.map((payment) => {
      const fallbackEvent = payment?.event ?? null;
      const targetEventId = normalizeId(payment?.event_id ?? fallbackEvent?.id);
      const resolvedEvent =
        (targetEventId
          ? events.find((candidate) => normalizeId(candidate?.id) === targetEventId)
          : null) ??
        (fallbackEvent && (!targetEventId || normalizeId(fallbackEvent?.id) === targetEventId)
          ? fallbackEvent
          : fallbackEvent);

      const relatedEvent = resolvedEvent ?? fallbackEvent ?? null;

      const candidateDjIds = [
        relatedEvent?.dj_id ?? null,
        fallbackEvent?.dj_id ?? null,
        relatedEvent?.dj?.id ?? null,
        fallbackEvent?.dj?.id ?? null,
        payment?.dj_id ?? null,
      ];
      ensureArray(relatedEvent?.event_djs).forEach((relation) => {
        candidateDjIds.push(relation?.dj_id ?? null);
        candidateDjIds.push(relation?.dj?.id ?? null);
      });
      ensureArray(fallbackEvent?.event_djs).forEach((relation) => {
        candidateDjIds.push(relation?.dj_id ?? null);
        candidateDjIds.push(relation?.dj?.id ?? null);
      });

      const resolvedDjId = candidateDjIds.map(normalizeId).find(Boolean);
      const resolvedDj =
        (resolvedDjId
          ? djs.find((candidate) => normalizeId(candidate?.id) === resolvedDjId)
          : null) ??
        relatedEvent?.dj ??
        fallbackEvent?.dj ??
        ensureArray(relatedEvent?.event_djs).find((relation) => relation?.dj)?.dj ??
        ensureArray(fallbackEvent?.event_djs).find((relation) => relation?.dj)?.dj ??
        null;

      const candidateProducerIds = [
        relatedEvent?.producer_id ?? null,
        fallbackEvent?.producer_id ?? null,
        relatedEvent?.producer?.id ?? null,
        fallbackEvent?.producer?.id ?? null,
        payment?.producer_id ?? null,
      ];
      const resolvedProducerId = candidateProducerIds.map(normalizeId).find(Boolean);
      const resolvedProducer =
        (resolvedProducerId
          ? producers.find((candidate) => normalizeId(candidate?.id) === resolvedProducerId)
          : null) ??
        relatedEvent?.producer ??
        fallbackEvent?.producer ??
        null;

      const amount = parseNullableNumber(payment?.amount) ?? 0;
      const commissionRate =
        parseNullableNumber(relatedEvent?.commission_rate) ??
        parseNullableNumber(payment?.commission_rate) ??
        15;
      const commissionAmount =
        parseNullableNumber(relatedEvent?.commission_amount) ??
        parseNullableNumber(payment?.commission_amount) ??
        amount * (commissionRate / 100);

      const relationDjNames = [
        ...ensureArray(relatedEvent?.event_djs).map((relation) => {
          // relation might have a nested dj object, or the relation itself might be missing dj
          const djFromRelation = relation?.dj || relation;
          return getDjDisplayName(djFromRelation);
        }),
        ...ensureArray(fallbackEvent?.event_djs).map((relation) => {
          const djFromRelation = relation?.dj || relation;
          return getDjDisplayName(djFromRelation);
        }),
      ].filter(Boolean);
      const joinedRelationDjNames = relationDjNames.join(', ');

      return {
        ...payment,
        amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        resolvedEvent,
        resolvedDj,
        resolvedProducer,
        eventName: pickFirstString(
          relatedEvent?.event_name,
          fallbackEvent?.event_name,
          payment?.event_name,
          payment?.event?.event_name,
        ),
        eventType: pickFirstString(
          relatedEvent?.event_type,
          fallbackEvent?.event_type,
          payment?.event_type,
          payment?.event?.event_type,
        ),
        djName: pickFirstString(
          getDjDisplayName(resolvedDj),
          joinedRelationDjNames,
          payment?.djName,
          payment?.dj_name,
          payment?.event?.dj_name,
        ),
        producerName: pickFirstString(
          getProducerDisplayName(resolvedProducer),
          fallbackEvent?.producer_name,
          payment?.producerName,
          payment?.producer_name,
          payment?.event?.producer_name,
        ),
      };
    });
  }, [payments, events, djs, producers]);

  const stats = useFinancialStats(paymentsWithRelations);

  const pendingIds = useMemo(() => {
    return paymentsWithRelations
      .filter((p) => {
        const s = String(p?.status || '').toLowerCase();
        return s === 'pending' || s === 'pendente';
      })
      .map((p) => p.id)
      .filter(Boolean);
  }, [paymentsWithRelations]);

  const searchValue = searchTerm.trim().toLowerCase();

  const filteredPayments = paymentsWithRelations.filter((payment) => {
    const eventMatches = (payment.eventName || '').toLowerCase().includes(searchValue);
    const djMatches = (payment.djName || '').toLowerCase().includes(searchValue);
    const producerMatches = (payment.producerName || '').toLowerCase().includes(searchValue);

    const matchesSearch = !searchValue || eventMatches || djMatches || producerMatches;

    const normalizedStatus = String(payment.status ?? '').toLowerCase();
    const normalizedFilter = statusFilter.toLowerCase();
    const matchesStatus = normalizedFilter === 'all' || normalizedStatus === normalizedFilter;

    return matchesSearch && matchesStatus;
  });

  const growthPercentage = 12.5;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago':
      case 'paid': 
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pendente':
      case 'pending': 
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'atrasado':
      case 'overdue': 
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: 
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pago':
      case 'paid': return 'Pago';
      case 'pendente':
      case 'pending': return 'Pendente';
      case 'atrasado':
      case 'overdue': return 'Atrasado';
      default: return status;
    }
  };

  const formatDateForDisplay = (value) => {
    if (!value) return '';

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? '' : value.toLocaleDateString('pt-BR');
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';

      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }

      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('pt-BR');
      }

      return '';
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }

    return '';
  };

  const resolveTransactionDate = (payment, eventRecord) => {
    const candidates = [
      eventRecord?.event_date,
      eventRecord?.eventDate,
      eventRecord?.date,
      payment?.event_date,
      payment?.eventDate,
    ];

    for (const candidate of candidates) {
      const formatted = formatDateForDisplay(candidate);
      if (formatted) {
        return formatted;
      }
    }

    const fallback = formatDateForDisplay(payment?.paid_at) || formatDateForDisplay(payment?.created_at);
    return fallback || '--';
  };

  const resolveEventTitle = (eventRecord) => {
    if (!eventRecord) return 'Evento não encontrado';
    return (
      eventRecord.event_name ||
      eventRecord.title ||
      eventRecord.name ||
      'Evento não encontrado'
    );
  };

  const resolveDjDisplayName = (eventRecord, djRecord) => {
    if (djRecord) {
      return (
        djRecord.artist_name ||
        djRecord.name ||
        djRecord.stage_name ||
        djRecord.real_name ||
        'DJ não encontrado'
      );
    }

    const eventDj = eventRecord?.dj;
    if (eventDj && typeof eventDj === 'object') {
      return (
        eventDj.artist_name ||
        eventDj.name ||
        eventDj.stage_name ||
        eventDj.real_name ||
        'DJ não encontrado'
      );
    }

    return 'DJ não encontrado';
  };

  const handleConfirmPayment = (paymentId) => {
    setSelectedPaymentIds([paymentId]);
    setIsConfirmModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedPaymentIds([]);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries(['payments']);
    queryClient.invalidateQueries(['events']);
  };

  const handleConfirmAllPending = () => {
    if (pendingIds.length === 0) return;
    setSelectedPaymentIds(pendingIds);
    setIsConfirmModalOpen(true);
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: PieChart },
    { id: 'transactions', label: 'Transações', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: TrendingUp }
  ];

  if (loadingPayments || loadingEvents || loadingDJs || loadingProducers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sistema financeiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Controle Financeiro</h1>
            <p className="text-muted-foreground">
              Gerencie receitas, comissões e pagamentos
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="glass-card glow-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Total
              </CardTitle>
              <DollarSign className="h-8 w-8 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card glow-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Recebido
              </CardTitle>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                R$ {stats.paidRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.paidRevenue / stats.totalRevenue) * 100 || 0).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card glow-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                A Receber
              </CardTitle>
              <Clock className="h-8 w-8 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                R$ {stats.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingCount} transações pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card glow-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comissão UNK Total
              </CardTitle>
              <Banknote className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalRevenue > 0 ? ((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1) : 0}% da receita total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div 
          className="glass-card p-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex space-x-1">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 ${isActive ? 'glow-effect' : ''}`}
                  style={isActive ? { backgroundColor: 'rgba(127, 63, 160, 0.55)', border: '1px solid rgba(77, 29, 98, 0.33)' } : undefined}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <Card className="glass-card glow-effect">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-primary" />
                    Breakdown de Receitas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-card/50 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">Valor Bruto</p>
                      <p className="text-sm text-muted-foreground">Total dos cachês</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl">
                    <div>
                      <p className="font-medium text-primary">Comissão UNK Total</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.totalRevenue > 0 ? ((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1) : 0}% da receita
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      R$ {stats.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div>
                      <p className="font-medium text-green-400">Valor Líquido DJs</p>
                      <p className="text-sm text-muted-foreground">Valor repassado aos DJs</p>
                    </div>
                    <p className="text-xl font-bold text-green-400">
                      R$ {stats.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="glass-card glow-effect">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-accent" />
                    Transações Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentsWithRelations.length > 0 ? (
                    <div className="space-y-3">
                      {paymentsWithRelations.slice(0, 5).map(payment => {
                        const event = payment.resolvedEvent || payment.event || null;
                        const dj = payment.resolvedDj || null;
                        
                        return (
                          <div key={payment.id} className="flex items-center justify-between p-3 bg-card/50 rounded-xl">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{resolveEventTitle(event)}</p>
                              <p className="text-sm text-muted-foreground">{resolveDjDisplayName(event, dj)}</p>
                              <p className="text-xs text-muted-foreground">
                                {resolveTransactionDate(payment, event)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">
                                R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <Badge className={getStatusColor(payment.status)}>
                                {getStatusLabel(payment.status)}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Filters */}
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        placeholder="Buscar por DJ, evento ou produtor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-input border border-border rounded-md text-foreground"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="pago">Pago</option>
                      <option value="paid">Paid</option>
                      <option value="pendente">Pendente</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Atrasado</option>
                    </select>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleConfirmAllPending}
                      disabled={pendingIds.length === 0}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Dar baixa em todas pendentes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions Table */}
              <Card className="glass-card glow-effect">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-card/50 border-b border-border">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Evento / DJ</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Produtor</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor Bruto</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Comissão UNK</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Líquido DJ</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => {
                        const event = payment.resolvedEvent || payment.event || null;
                        const dj = payment.resolvedDj || null;
                        const djNetAmount = payment.amount - payment.commission_amount;

                        return (
                          <tr key={payment.id} className="border-b border-border/50 hover:bg-card/30 transition-colors">
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-foreground">{resolveEventTitle(event)}</p>
                                <p className="text-sm text-muted-foreground">{resolveDjDisplayName(event, dj)}</p>
                                <p className="font-medium text-foreground">{payment.eventName || 'Evento não encontrado'}</p>
                                <p className="text-sm text-muted-foreground">{payment.djName || 'DJ não encontrado'}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-foreground">{payment.producerName || 'Produtor não encontrado'}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-foreground">
                                R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">Cachê total</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-primary">
                                R$ {payment.commission_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payment.commission_rate.toFixed(0)}%
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-green-400">
                                R$ {djNetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">Para o DJ</p>
                            </td>
                            <td className="p-4">
                              <Badge className={getStatusColor(payment.status)}>
                                {getStatusLabel(payment.status)}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <p className="text-muted-foreground text-sm">
                                {resolveTransactionDate(payment, event)}
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                {(payment.status === 'pendente' || payment.status === 'pending') && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleConfirmPayment(payment.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Dar Baixa
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {payment.payment_proof_url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={payment.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredPayments.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                      Nenhuma transação encontrada
                    </h3>
                    <p className="text-muted-foreground">
                      {payments.length === 0 
                        ? 'As transações aparecerão aqui quando eventos forem criados'
                        : 'Tente ajustar os filtros de busca'
                      }
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <Card className="glass-card glow-effect">
              <CardContent className="pt-8">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Relatórios Financeiros</h3>
                  <p className="text-muted-foreground mb-6">
                    Funcionalidade em desenvolvimento
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-card/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">Relatório Mensal</h4>
                      <p className="text-sm text-muted-foreground">Receitas e comissões por mês</p>
                    </div>
                    <div className="p-4 bg-card/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">Relatório por DJ</h4>
                      <p className="text-sm text-muted-foreground">Performance individual dos DJs</p>
                    </div>
                    <div className="p-4 bg-card/50 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">Relatório por Produtor</h4>
                      <p className="text-sm text-muted-foreground">Atividade dos produtores</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Confirm Payment Modal */}
      <ConfirmPaymentModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModal}
        transactionIds={selectedPaymentIds}
      />
    </div>
  );
};

export default FinancialTracking;
