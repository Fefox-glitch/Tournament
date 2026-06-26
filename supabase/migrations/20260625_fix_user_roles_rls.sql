-- Fix user_roles RLS policies to allow admins to manage all roles
-- First, create a policy for admins to read all user roles
DROP POLICY IF EXISTS "admins_read_all_roles" ON user_roles;
CREATE POLICY "admins_read_all_roles" ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create a policy for admins to insert any user role
DROP POLICY IF EXISTS "admins_insert_all_roles" ON user_roles;
CREATE POLICY "admins_insert_all_roles" ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create a policy for admins to update any user role
DROP POLICY IF EXISTS "admins_update_all_roles" ON user_roles;
CREATE POLICY "admins_update_all_roles" ON user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create a policy for admins to delete any user role
DROP POLICY IF EXISTS "admins_delete_all_roles" ON user_roles;
CREATE POLICY "admins_delete_all_roles" ON user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Also, keep the existing policies for users to manage their own roles
DROP POLICY IF EXISTS "users_read_own_role" ON user_roles;
CREATE POLICY "users_read_own_role" ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_role" ON user_roles;
CREATE POLICY "users_insert_own_role" ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_role" ON user_roles;
CREATE POLICY "users_update_own_role" ON user_roles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_role" ON user_roles;
CREATE POLICY "users_delete_own_role" ON user_roles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
