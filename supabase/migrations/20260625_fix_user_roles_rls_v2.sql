-- =============================================
-- MIGRACIÓN 20260625 - CORRECCIÓN DE RLS user_roles
-- =============================================

-- 1. Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "users_read_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_insert_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_update_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_delete_own_role" ON user_roles;
DROP POLICY IF EXISTS "admins_read_all_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_insert_all_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_update_all_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_delete_all_roles" ON user_roles;

-- 2. Políticas para TODOS los usuarios autenticados
--    - Leer su propio rol
--    - Insertar su propio rol (para fans que se registran)
CREATE POLICY "user_read_own" ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_insert_own" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Políticas para ADMINS (usamos una función helper para evitar circularidad)
-- Primero, creamos la función que verifica si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER es clave aquí!

-- Ahora, las políticas de admin usando la función
CREATE POLICY "admin_all" ON user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
