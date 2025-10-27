'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fxkhkcvnmvqqjzgsdoec.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4a2hrY3ZubXZxcWp6Z3Nkb2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MjQ5MDksImV4cCI6MjA3MTMwMDkwOX0.4qhFc1-3tg6V9HMP1RazrZokzD81vJO7y7iKrkNydZI";

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

function createSupabaseClient() {
  if (typeof window === 'undefined') {
    // Return a dummy object for server-side that won't be used
    return {
      auth: { 
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: null } }),
      },
      from: () => ({ 
        select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) 
      }),
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
}

// Lazy export - the function won't execute until the module is actually used
export const supabase = new Proxy({}, {
  get: (_target, prop) => {
    const client = createSupabaseClient();
    return Reflect.get(client, prop);
  }
}) as ReturnType<typeof createClient<Database>>;
