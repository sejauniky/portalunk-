-- Fix RLS policies to use get_user_role() function instead of JWT

-- DJs table
DROP POLICY IF EXISTS "admin_full_access" ON public.djs;
DROP POLICY IF EXISTS "producer_can_select" ON public.djs;

CREATE POLICY "admin_full_access_djs" 
ON public.djs 
FOR ALL 
USING (public.get_user_role() = 'admin');

CREATE POLICY "producer_and_admin_can_select_djs" 
ON public.djs 
FOR SELECT 
USING (public.get_user_role() IN ('admin', 'producer'));

-- Events table
DROP POLICY IF EXISTS "admin_full_access" ON public.events;
DROP POLICY IF EXISTS "producer_can_select" ON public.events;

CREATE POLICY "admin_full_access_events" 
ON public.events 
FOR ALL 
USING (public.get_user_role() = 'admin');

CREATE POLICY "producer_and_admin_can_select_events" 
ON public.events 
FOR SELECT 
USING (public.get_user_role() IN ('admin', 'producer'));

-- Event_djs table
ALTER TABLE public.event_djs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_event_djs" 
ON public.event_djs 
FOR ALL 
USING (public.get_user_role() = 'admin');

CREATE POLICY "producer_and_admin_can_select_event_djs" 
ON public.event_djs 
FOR SELECT 
USING (public.get_user_role() IN ('admin', 'producer'));