import type { UseQueryResult } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { useSupabaseData } from "./useSupabaseData";
import { producerService } from "@/services/supabaseService";

type ProducerRecord = (Tables<"producers"> & {
  profile?: Tables<"profiles"> | null;
}) & Record<string, unknown>;

type UseProducersResult = {
  producers: ProducerRecord[];
  loading: boolean;
  error: unknown;
  refetch: UseQueryResult<ProducerRecord[]>['refetch'];
};

export function useProducers(): UseProducersResult {
  const { data, loading, error, refetch } = useSupabaseData<ProducerRecord[]>(producerService, "getAll", [], []);

  return {
    producers: Array.isArray(data) ? data : [],
    loading,
    error,
    refetch,
  };
}
