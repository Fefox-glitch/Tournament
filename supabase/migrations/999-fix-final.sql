-- Script de prueba final para solucionar el problema

-- 1. Borra funciones y vistas anteriores
DROP FUNCTION IF EXISTS public.get_user_roles_with_emails();
DROP FUNCTION IF EXISTS public.get_all_auth_users();
DROP FUNCTION IF EXISTS public.is_admin();
DROP VIEW IF EXISTS public.user_roles_with_emails CASCADE;

-- 2. Crea is_admin() primero
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crea get_user_roles_with_emails() de forma simple
CREATE OR REPLACE FUNCTION public.get_user_roles_with_emails()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role text,
  tournament_mode text,
  team_id uuid,
  team_id8 uuid,
  created_at timestamptz,
  email text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.tournament_mode,
    ur.team_id,
    ur.team_id8,
    ur.created_at,
    au.email
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON ur.user_id = au.id
  WHERE public.is_admin()
  ORDER BY ur.created_at DESC;
$$;

-- 4. Crea get_all_auth_users()
CREATE OR REPLACE FUNCTION public.get_all_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT au.id, au.email, au.created_at
  FROM auth.users au
  WHERE public.is_admin()
  ORDER BY au.created_at DESC;
$$;
