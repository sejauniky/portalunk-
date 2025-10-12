import { useEffect, useMemo, useState } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type ServiceMethod<TArgs extends any[] = any[], TResult = any> = (
  ...args: TArgs
) => Promise<{ data?: TResult; error?: unknown } | TResult>;

interface GenericService {
  __serviceName?: string;
  [key: string]: ServiceMethod | string | undefined;
}

type UseSupabaseDataReturn<TResult> = {
  data: TResult | undefined;
  loading: boolean;
  error: unknown;
  refetch: UseQueryResult<TResult>['refetch'];
};

function normalizeResult<TResult>(result: any): { data: TResult | undefined; error: unknown } {
  if (result && typeof result === "object" && "data" in result) {
    return {
      data: (result as { data?: TResult }).data,
      error: (result as { error?: unknown }).error,
    };
  }
  return { data: result as TResult, error: undefined };
}

export function useSupabaseData<TResult = any, TArgs extends any[] = any[]>(
  service: GenericService | null | undefined,
  methodName: keyof GenericService,
  args: TArgs = [] as unknown as TArgs,
  deps: unknown[] = [],
): UseSupabaseDataReturn<TResult> {
  const method = service?.[methodName as string] as ServiceMethod<TArgs, TResult> | undefined;
  const enabled = useMemo(() => {
    if (!method || typeof method !== 'function') return false;
    if (!deps || deps.length === 0) return true;
    return deps.every((dep) => dep !== undefined && dep !== null);
  }, [method, deps]);

  const queryKey = useMemo(
    () => ["supabase", service?.__serviceName ?? "service", methodName, ...(deps ?? []), ...(args as unknown as unknown[])],
    [service?.__serviceName, methodName, deps, args],
  );

  const query = useQuery<TResult>({
    queryKey,
    enabled,
    queryFn: async () => {
      if (!method || typeof method !== 'function') {
        throw new Error(`Método "${String(methodName)}" não encontrado no serviço informado.`);
      }
      const result = await method(...args);
      const { data, error } = normalizeResult<TResult>(result);
      if (error) {
        const errorMessage = typeof error === "string" ? error : (error as Error)?.message;
        throw new Error(errorMessage ?? "Falha ao carregar dados do Supabase");
      }
      return data as TResult;
    },
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export interface UseRealtimeDataOptions<TRecord> {
  primaryKey?: keyof TRecord & string;
  transform?: (payload: TRecord) => TRecord;
}

export function useRealtimeData<TRecord = Record<string, any>>(
  table: string,
  sourceData: TRecord[] | undefined,
  options: UseRealtimeDataOptions<TRecord> = {},
) {
  const { primaryKey = "id", transform } = options;
  const [data, setData] = useState<TRecord[]>(() => sourceData ?? []);

  useEffect(() => {
    setData(sourceData ?? []);
  }, [sourceData]);

  useEffect(() => {
    if (!table) return;

    const channel = supabase
      .channel(`public:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          setData((current) => {
            const next = [...current];
            const applyTransform = (record: TRecord): TRecord => (transform ? transform(record) : record);

            switch (payload.eventType) {
              case "INSERT": {
                const newRecord = applyTransform(payload.new as TRecord);
                const exists = next.some((item) => (item as any)?.[primaryKey] === (newRecord as any)?.[primaryKey]);
                if (!exists) {
                  next.unshift(newRecord);
                }
                break;
              }
              case "UPDATE": {
                const updatedRecord = applyTransform(payload.new as TRecord);
                const index = next.findIndex((item) => (item as any)?.[primaryKey] === (updatedRecord as any)?.[primaryKey]);
                if (index !== -1) {
                  next[index] = { ...next[index], ...updatedRecord };
                } else {
                  next.unshift(updatedRecord);
                }
                break;
              }
              case "DELETE": {
                const oldRecord = payload.old as TRecord;
                return next.filter((item) => (item as any)?.[primaryKey] !== (oldRecord as any)?.[primaryKey]);
              }
              default:
                return current;
            }

            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, primaryKey, transform]);

  return { data, setData } as const;
}
