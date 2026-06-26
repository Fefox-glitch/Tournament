/*
# Extend user_roles: add 'fan' role

## Changes
- Drops and recreates the CHECK constraint on user_roles.role to include 'fan'
- Fans auto-register their own role on signup (no admin approval needed for fan)
*/

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'team_captain', 'fan'));
