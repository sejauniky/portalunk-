-- Adiciona política RLS para permitir que admins criem perfis de novos usuários
CREATE POLICY "admin_can_insert_profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'::user_role
  )
);