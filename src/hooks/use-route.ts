"use client";

import { useSearchParams } from "next/navigation";

export function useRoute(pattern: string): [boolean, Record<string, any> | null] {
  const searchParams = useSearchParams();

  // Simple pattern matching for dynamic routes like '/share/:token'
  // In Next.js App Router, dynamic segments are handled through [param] folders
  // This hook provides backward compatibility by extracting params from URL

  // Parse the pattern to identify parameter names
  const paramNames = (pattern.match(/:[a-zA-Z_]+/g) || []).map((p) =>
    p.substring(1)
  );

  if (paramNames.length === 0) {
    return [false, null];
  }

  // For Next.js, we need to get params from the URL
  // In the context of layout.client.tsx, we can't use useParams directly
  // This is a limitation - we should pass params through other means

  // Return empty for now - the component should use props or context instead
  return [false, null];
}
