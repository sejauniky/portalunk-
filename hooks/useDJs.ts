import type { UseQueryResult } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { useSupabaseData } from "./useSupabaseData";
import { djServiceWrapper } from "@/services/djService";

type DjRecord = Tables<"djs"> & Record<string, unknown>;

type UseDJsResult = {
  djs: DjRecord[];
  loading: boolean;
  error: unknown;
  refetch: UseQueryResult<DjRecord[]>['refetch'];
};

export function useDJs(): UseDJsResult {
  const { data, loading, error, refetch } = useSupabaseData<DjRecord[]>(djServiceWrapper, "getAll", [], []);

  return {
    djs: Array.isArray(data) ? data : [],
    loading,
    error,
    refetch,
  };
}
