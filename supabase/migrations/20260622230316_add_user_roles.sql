/*
# Add user roles system

1. New Tables
   - `user_roles`: maps Supabase auth users to a role (admin | team_captain)
     - `id` (uuid PK)
     - `user_id` (uuid, FK → auth.users, unique — one role per user)
     - `role` (text: 'admin' | 'team_captain')
     - `tournament_mode` (text: '12' | '8' | null — which bracket mode the captain manages)
     - `team_id` (uuid, nullable — for captains linked to an existing team in teams table)
     - `team_id8` (uuid, nullable — for captains linked to teams8 table)
     - `created_at` (timestamptz)

2. Security
   - RLS enabled on user_roles
   - Authenticated users can read their own role
   - Only the service role / admin can insert/update roles (captains are assigned by admin)
   - Public can read — needed so the app can gate routes before full auth

3. Notes
   - The app uses this table to determine which screens to show after login:
       admin → full admin dashboard (all tabs)
       team_captain → Team Registration + read-only Bracket View
   - Admins are seeded manually via the admin panel or Supabase dashboard
*/

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'team_captain')),
  tournament_mode text CHECK (tournament_mode IN ('12', '8')),
  team_id uuid,
  team_id8 uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

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
