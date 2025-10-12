import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentService, storageService } from "@/services/supabaseService";

type Nullable<T> = T | null | undefined;

export interface UsePendingPaymentsOptions {
  producerId?: Nullable<string>;
  djId?: Nullable<string>;
  status?: Nullable<string>;
}

export interface ConfirmPaymentsPayload {
  payment_method?: string;
  paid_at?: string;
  proofUrl?: string | null;
  notes?: string;
}

const DEFAULT_BUCKET = "payment-proofs";

function createExportFile(payments: any[], filename: string) {
  const blob = new Blob([JSON.stringify(payments, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const formatCurrencyIntl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function usePendingPayments(options: UsePendingPaymentsOptions = {}) {
  const { producerId, djId, status } = options;
  const queryClient = useQueryClient();

  const queryKey = ["payments", "pending", { producerId, djId, status }];

  const paymentsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await paymentService.getAll();
      return response ?? [];
    },
  });

  const payments = paymentsQuery.data ?? [];

  const financialStats = useMemo(() => {
    const totals = payments.reduce(
      (acc: { pendingCount: number; overdueCount: number; totalPending: number }, payment: any) => {
        const statusValue = String(payment?.status || "").toLowerCase();
        const amount = parseFloat(payment?.amount ?? 0) || 0;
        if (statusValue === "paid") {
          return acc;
        }
        if (statusValue === "overdue") {
          acc.overdueCount += 1;
        } else {
          acc.pendingCount += 1;
        }
        acc.totalPending += amount;
        return acc;
      },
      { pendingCount: 0, overdueCount: 0, totalPending: 0 },
    );
    return totals;
  }, [payments]);

  const formatCurrency = useCallback((value: number | string | null | undefined) => {
    const numeric = typeof value === "string" ? parseFloat(value) : value ?? 0;
    return formatCurrencyIntl.format(Number.isFinite(numeric as number) ? (numeric as number) : 0);
  }, []);

  const formatDate = useCallback((dateLike: Nullable<string | Date>) => {
    if (!dateLike) return "";
    const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR");
  }, []);

  const isOverdue = useCallback((payment: any) => {
    if (!payment) return false;
    const statusValue = String(payment?.status || "").toLowerCase();
    if (statusValue === "paid") return false;

    const eventDateValue = payment?.event?.event_date ?? payment?.due_date;
    if (!eventDateValue) return false;

    const eventDate = new Date(eventDateValue);
    const today = new Date();
    if (Number.isNaN(eventDate.getTime())) return false;

    eventDate.setHours(23, 59, 59, 999);
    today.setHours(0, 0, 0, 0);
    return today > eventDate;
  }, []);

  const [uploadingProof, setUploadingProof] = useState(false);

  const uploadPaymentProof = useCallback(
    async (paymentId: string, file: File | null | undefined, description?: string) => {
      if (!paymentId) {
        return { error: "Pagamento não informado" };
      }
      if (!file) {
        return { error: "Arquivo não selecionado" };
      }

      setUploadingProof(true);
      try {
        const extension = file.name.split(".").pop() ?? "dat";
        const path = `${paymentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { data, error } = await storageService.uploadFile(DEFAULT_BUCKET, path, file);
        if (error) {
          return { error };
        }

        const proofUrl = data?.publicUrl ?? storageService.getPublicUrl(DEFAULT_BUCKET, path);
        const updateResult = await paymentService.update(paymentId, { payment_proof_url: proofUrl });
        if (updateResult?.error) {
          return { error: updateResult.error };
        }

        await queryClient.invalidateQueries({ queryKey });
        return { data: proofUrl };
      } finally {
        setUploadingProof(false);
      }
    },
    [queryClient, queryKey],
  );

  const confirmPaymentsMutation = useMutation({
    mutationFn: async ({ ids, payload }: { ids: string[]; payload: ConfirmPaymentsPayload }) => {
      const results = await Promise.all(
        ids.map(async (id) => {
          const result = await paymentService.confirmPayment(id, payload);
          return { id, ...result };
        }),
      );
      const errors = results.filter((item) => item.error);
      if (errors.length > 0) {
        const messages = errors
          .map((item) => (typeof item.error === "string" ? item.error : (item.error as Error)?.message))
          .filter(Boolean)
          .join("; ");
        throw new Error(messages || "Falha ao confirmar pagamentos");
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const result = await paymentService.delete(paymentId);
      if (result?.error) {
        const message = typeof result.error === "string" ? result.error : (result.error as Error)?.message;
        throw new Error(message ?? "Erro ao remover pagamento");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const exportPayments = useCallback(() => {
    if (!payments || payments.length === 0) return;
    const filename = `pagamentos_${new Date().toISOString().split("T")[0]}.json`;
    createExportFile(payments, filename);
  }, [payments]);

  return {
    payments,
    financialStats,
    loading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    uploadingProof,
    uploadPaymentProof,
    confirmPayments: async (ids: string[], payload: ConfirmPaymentsPayload) => {
      if (!ids || ids.length === 0) return { error: "Nenhum pagamento selecionado" };
      try {
        await confirmPaymentsMutation.mutateAsync({ ids, payload });
        return { data: true };
      } catch (error) {
        return { error };
      }
    },
    confirmPaymentsStatus: confirmPaymentsMutation.status,
    deletePayment: async (paymentId: string) => {
      if (!paymentId) return { error: "Pagamento não informado" };
      try {
        await deletePaymentMutation.mutateAsync(paymentId);
        return { data: true };
      } catch (error) {
        return { error };
      }
    },
    deletePaymentStatus: deletePaymentMutation.status,
    exportPayments,
    formatCurrency,
    formatDate,
    isOverdue,
    refetchPayments: paymentsQuery.refetch,
  } as const;
}
