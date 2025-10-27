'use client';

import { supabase as supabaseClient } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://fxkhkcvnmvqqjzgsdoec.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4a2hrY3ZubXZxcWp6Z3Nkb2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MjQ5MDksImV4cCI6MjA3MTMwMDkwOX0.4qhFc1-3tg6V9HMP1RazrZokzD81vJO7y7iKrkNydZI";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
export const supabase = supabaseClient;
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
