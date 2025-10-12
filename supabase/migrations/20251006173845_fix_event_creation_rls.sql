/*
  # Fix RLS policies for event creation
  
  1. Changes
    - Add policies for admins to create/update/delete events
    - Add policies for producers to create/update their own events
    - Ensure producers can view all DJs (needed for event creation)
    - Ensure producers can view all other producers (needed for event creation)
  
  2. Security
    - Maintain restrictive access while allowing necessary operations
    - Admins have full access to everything
    - Producers can create events and see necessary data
*/

-- Allow admins to create, update, and delete events
DROP POLICY IF EXISTS "admin_can_insert_events" ON public.events;
DROP POLICY IF EXISTS "admin_can_update_events" ON public.events;
DROP POLICY IF EXISTS "admin_can_delete_events" ON public.events;

CREATE POLICY "admin_can_insert_events" 
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_can_update_events" 
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_can_delete_events" 
  ON public.events FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Allow producers to create events
DROP POLICY IF EXISTS "producer_can_insert_events" ON public.events;

CREATE POLICY "producer_can_insert_events" 
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'producer' 
    AND producer_id = public.get_producer_id()
  );

-- Allow producers to update their own events
DROP POLICY IF EXISTS "producer_can_update_own_events" ON public.events;

CREATE POLICY "producer_can_update_own_events" 
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'producer' 
    AND producer_id = public.get_producer_id()
  );

-- Allow producers to delete their own events
DROP POLICY IF EXISTS "producer_can_delete_own_events" ON public.events;

CREATE POLICY "producer_can_delete_own_events" 
  ON public.events FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'producer' 
    AND producer_id = public.get_producer_id()
  );

-- Allow admins and producers to view all producers (needed for event creation dropdown)
DROP POLICY IF EXISTS "producer_and_admin_can_select_producers" ON public.producers;

CREATE POLICY "producer_and_admin_can_select_producers" 
  ON public.producers FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'producer'));

-- Allow admins to create/update event_djs relationships
DROP POLICY IF EXISTS "admin_can_insert_event_djs" ON public.event_djs;
DROP POLICY IF EXISTS "admin_can_update_event_djs" ON public.event_djs;
DROP POLICY IF EXISTS "admin_can_delete_event_djs" ON public.event_djs;

CREATE POLICY "admin_can_insert_event_djs" 
  ON public.event_djs FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_can_update_event_djs" 
  ON public.event_djs FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_can_delete_event_djs" 
  ON public.event_djs FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Allow producers to manage event_djs for their own events
DROP POLICY IF EXISTS "producer_can_insert_event_djs" ON public.event_djs;
DROP POLICY IF EXISTS "producer_can_update_event_djs" ON public.event_djs;
DROP POLICY IF EXISTS "producer_can_delete_event_djs" ON public.event_djs;

CREATE POLICY "producer_can_insert_event_djs" 
  ON public.event_djs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'producer'
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_djs.event_id
      AND events.producer_id = public.get_producer_id()
    )
  );

CREATE POLICY "producer_can_update_event_djs" 
  ON public.event_djs FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'producer'
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_djs.event_id
      AND events.producer_id = public.get_producer_id()
    )
  );

CREATE POLICY "producer_can_delete_event_djs" 
  ON public.event_djs FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'producer'
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_djs.event_id
      AND events.producer_id = public.get_producer_id()
    )
  );