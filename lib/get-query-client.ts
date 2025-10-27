import { QueryClient } from "@tanstack/react-query";

const queryClientSingleton = (() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
    },
  });
})();

export function getQueryClient() {
  return queryClientSingleton;
}
