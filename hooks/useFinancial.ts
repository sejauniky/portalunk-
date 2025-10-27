'use client';

import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { useSupabaseData } from "./useSupabaseData";
import { eventService, paymentService } from "@/services/supabaseService";

export type EventRecord = (Tables<"events"> & {
  commission_rate?: number | string | null;
  commission_amount?: number | string | null;
}) & Record<string, unknown>;

export type PaymentRecord = (Tables<"payments"> & {
  event?: EventRecord | null;
  commission_rate?: number | string | null;
  commission_amount?: number | string | null;
}) & Record<string, unknown>;

export type FinancialStats = {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  pendingCount: number;
  totalCommission: number;
  netRevenue: number;
};

type NumberLike = number | string | null | undefined;

type QueryResult<TData> = {
  data: TData;
  isLoading: boolean;
  error: unknown;
  refetch: UseQueryResult<TData>['refetch'];
};

function parseNumber(value: NumberLike): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(",", ".");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveCommissionAmount(payment: PaymentRecord, amount: number): number {
  const explicitCommission = [payment.commission_amount, payment.event?.commission_amount]
    .map(parseNumber)
    .find((candidate): candidate is number => candidate != null);

  if (explicitCommission != null) {
    return roundCurrency(Math.max(explicitCommission, 0));
  }

  const rateCandidate = [payment.commission_rate, payment.event?.commission_rate]
    .map(parseNumber)
    .find((candidate): candidate is number => candidate != null);

  if (rateCandidate != null) {
    const rate = Math.max(rateCandidate, 0);
    return roundCurrency(amount * (rate / 100));
  }

  return 0;
}

export function usePayments(): QueryResult<PaymentRecord[]> {
  const { data, loading, error, refetch } = useSupabaseData<PaymentRecord[]>(paymentService, "getAll", [], []);

  return {
    data: Array.isArray(data) ? data : [],
    isLoading: loading,
    error,
    refetch,
  };
}

export function useEvents(): QueryResult<EventRecord[]> {
  const { data, loading, error, refetch } = useSupabaseData<EventRecord[]>(eventService, "getAll", [], []);

  return {
    data: Array.isArray(data) ? data : [],
    isLoading: loading,
    error,
    refetch,
  };
}

export function useFinancialStats(payments: readonly PaymentRecord[] | null | undefined): FinancialStats {
  return useMemo(() => {
    const aggregate = (payments ?? []).reduce(
      (
        acc: {
          totalRevenue: number;
          paidRevenue: number;
          pendingRevenue: number;
          pendingCount: number;
          totalCommission: number;
        },
        payment,
      ) => {
        const amount = parseNumber(payment.amount) ?? 0;
        const status = String(payment.status ?? "").toLowerCase();

        acc.totalRevenue += amount;

        if (status === "paid" || status === "pago") {
          acc.paidRevenue += amount;
        } else if (status === "pending" || status === "pendente" || status === "overdue" || status === "atrasado") {
          acc.pendingRevenue += amount;
          acc.pendingCount += 1;
        }

        acc.totalCommission += resolveCommissionAmount(payment, amount);
        return acc;
      },
      {
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        pendingCount: 0,
        totalCommission: 0,
      },
    );

    const netRevenue = aggregate.totalRevenue - aggregate.totalCommission;

    return {
      totalRevenue: roundCurrency(aggregate.totalRevenue),
      paidRevenue: roundCurrency(aggregate.paidRevenue),
      pendingRevenue: roundCurrency(aggregate.pendingRevenue),
      pendingCount: aggregate.pendingCount,
      totalCommission: roundCurrency(aggregate.totalCommission),
      netRevenue: roundCurrency(netRevenue < 0 ? 0 : netRevenue),
    };
  }, [payments]);
}
