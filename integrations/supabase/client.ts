'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fxkhkcvnmvqqjzgsdoec.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4a2hrY3ZubXZxcWp6Z3Nkb2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MjQ5MDksImV4cCI6MjA3MTMwMDkwOX0.4qhFc1-3tg6V9HMP1RazrZokzD81vJO7y7iKrkNydZI";

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  // Only create once and only in the browser
  if (typeof window === 'undefined') {
    // Return a dummy object for server-side that won't be used
    return {
      auth: { getSession: async () => ({ data: { session: null } }) },
      from: () => ({ select: () => ({}) }),
    } as any;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }

  return supabaseInstance;
})();
