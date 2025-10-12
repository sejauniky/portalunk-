import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatError } from '../lib/errorUtils';

const isSupabaseConfigured = true;

export const eventService = {
  __serviceName: 'eventService',
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service skipped - Supabase not configured');
        return { data: [], error: 'supabase_not_configured' };
      }

      // Simplificando a query para evitar joins complexos
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          dj:djs (
            id,
            name,
            artist_name,
            email
          ),
          producer:producers (
            id,
            name,
            company_name,
            email,
            profile_id
          )
        `)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return { data: events || [], error: null };

    } catch (error) {
      console.error('Error fetching events:', formatError(error));
      return { data: [], error: formatError(error) };
    }
  }
};

export const contractService = {
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Contract service skipped - Supabase not configured');
        return [];
      }

      // Simplificando a query para evitar joins complexos aninhados
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          dj:djs (
            id,
            name,
            artist_name,
            email
          ),
          producer:producers (
            id,
            name,
            company_name,
            email
          ),
          event:events (
            id,
            title,
            event_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return contracts || [];

    } catch (error) {
      console.error('Error fetching contracts:', formatError(error));
      toast.error('Erro ao carregar contratos');
      return [];
    }
  }
};