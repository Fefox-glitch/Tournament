-- =============================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN DE BASE DE DATOS
-- =============================================

-- 1. ELIMINAR TODAS LAS TABLAS EXISTENTES (para limpiar)
DROP TABLE IF EXISTS map_ban_picks CASCADE;
DROP TABLE IF EXISTS map_ban_sessions CASCADE;
DROP TABLE IF EXISTS user_predictions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS tournament_history8 CASCADE;
DROP TABLE IF EXISTS tournament_matches8 CASCADE;
DROP TABLE IF EXISTS teams8 CASCADE;
DROP TABLE IF EXISTS tournament_history CASCADE;
DROP TABLE IF EXISTS tournament_matches CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Eliminar funciones y triggers si existen
DROP FUNCTION IF EXISTS update_prediction_timestamp CASCADE;
DROP FUNCTION IF EXISTS update_map_ban_session_timestamp CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- =============================================
-- 2. EJECUTAR MIGRACIONES EN ORDEN
-- =============================================

-- --- MIGRACIÓN 1: create_pickems_tables (12 equipos) ---
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text DEFAULT '',
  region text DEFAULT '',
  seed integer,
  color text DEFAULT '#dc2626',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_teams" ON teams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_teams" ON teams FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_teams" ON teams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_teams" ON teams FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS tournament_matches (
  id text PRIMARY KEY,
  section text NOT NULL CHECK (section IN ('upper', 'middle', 'lower')),
  team1_seed integer,
  team2_seed integer,
  team1_label text NOT NULL,
  team2_label text NOT NULL,
  team1_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  winner_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  score_team1 integer DEFAULT 0,
  score_team2 integer DEFAULT 0,
  played_at timestamptz,
  next_match_id text,
  next_match_slot text CHECK (next_match_slot IN ('team1', 'team2')),
  round_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_matches" ON tournament_matches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_matches" ON tournament_matches FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_matches" ON tournament_matches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_matches" ON tournament_matches FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS tournament_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text REFERENCES tournament_matches(id) ON DELETE CASCADE,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tournament_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_history" ON tournament_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_history" ON tournament_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_history" ON tournament_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_history" ON tournament_history FOR DELETE TO anon, authenticated USING (true);

INSERT INTO tournament_matches (id, section, team1_label, team2_label, team1_seed, team2_seed, next_match_id, next_match_slot, round_name) VALUES
  ('M01', 'upper', 'SEED 8',  'SEED 9',  8,  9, 'M05', 'team2', 'Ronda 1'),
  ('M02', 'upper', 'SEED 5',  'SEED 12', 5,  12, 'M06', 'team2', 'Ronda 1'),
  ('M03', 'upper', 'SEED 7',  'SEED 10', 7,  10, 'M07', 'team2', 'Ronda 1'),
  ('M04', 'upper', 'SEED 6',  'SEED 11', 6,  11, 'M08', 'team2', 'Ronda 1'),
  ('M05', 'upper', 'SEED 1',  'WIN M01', 1,  null, 'M19', 'team1', 'Ronda 2'),
  ('M06', 'upper', 'SEED 4',  'WIN M02', 4,  null, 'M19', 'team2', 'Ronda 2'),
  ('M07', 'upper', 'SEED 2',  'WIN M03', 2,  null, 'M20', 'team1', 'Ronda 2'),
  ('M08', 'upper', 'SEED 3',  'WIN M04', 3,  null, 'M20', 'team2', 'Ronda 2'),
  ('M19', 'upper', 'WIN M05', 'WIN M06', null, null, 'M25', 'team1', 'Semifinal Superior'),
  ('M20', 'upper', 'WIN M07', 'WIN M08', null, null, 'M25', 'team2', 'Semifinal Superior'),
  ('M25', 'upper', 'WIN M19', 'WIN M20', null, null, 'M29', 'team2', 'Final Superior'),
  ('M09', 'middle', 'LOS M01', 'LOS M08', null, null, 'M13', 'team1', 'Ronda 1 Middle'),
  ('M10', 'middle', 'LOS M02', 'LOS M07', null, null, 'M13', 'team2', 'Ronda 1 Middle'),
  ('M11', 'middle', 'LOS M03', 'LOS M06', null, null, 'M14', 'team1', 'Ronda 1 Middle'),
  ('M12', 'middle', 'LOS M04', 'LOS M05', null, null, 'M14', 'team2', 'Ronda 1 Middle'),
  ('M13', 'middle', 'WIN M09', 'WIN M10', null, null, 'M21', 'team1', 'Ronda 2 Middle'),
  ('M14', 'middle', 'WIN M11', 'WIN M12', null, null, 'M22', 'team1', 'Ronda 2 Middle'),
  ('M21', 'middle', 'WIN M13', 'LOS M19', null, null, 'M26', 'team1', 'Semifinal Middle'),
  ('M22', 'middle', 'WIN M14', 'LOS M20', null, null, 'M26', 'team2', 'Semifinal Middle'),
  ('M26', 'middle', 'WIN M21', 'WIN M22', null, null, 'M29', 'team1', 'Final Middle'),
  ('M29', 'middle', 'WIN M26', 'LOS M25', null, null, 'M30', 'team2', 'Final Lower'),
  ('M15', 'lower', 'LOS M09', 'LOS M10', null, null, 'M17', 'team1', 'Ronda 1 Lower'),
  ('M16', 'lower', 'LOS M11', 'LOS M12', null, null, 'M18', 'team1', 'Ronda 1 Lower'),
  ('M17', 'lower', 'WIN M15', 'LOS M14', null, null, 'M23', 'team1', 'Ronda 2 Lower'),
  ('M18', 'lower', 'WIN M16', 'LOS M13', null, null, 'M24', 'team1', 'Ronda 2 Lower'),
  ('M23', 'lower', 'WIN M17', 'LOS M21', null, null, 'M27', 'team1', 'Semifinal Lower'),
  ('M24', 'lower', 'WIN M18', 'LOS M22', null, null, 'M27', 'team2', 'Semifinal Lower'),
  ('M27', 'lower', 'WIN M23', 'WIN M24', null, null, 'M28', 'team1', 'Final Lower R1'),
  ('M28', 'lower', 'WIN M27', 'LOS M26', null, null, 'M30', 'team1', 'Final Lower R2'),
  ('M30', 'lower', 'WIN M28', 'LOS M29', null, null, null, null, 'Gran Final')
ON CONFLICT (id) DO NOTHING;


-- --- MIGRACIÓN 2: create_8team_tournament_tables ---
CREATE TABLE IF NOT EXISTS teams8 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text DEFAULT '',
  region text DEFAULT '',
  seed integer,
  color text DEFAULT '#dc2626',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams8 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_teams8" ON teams8 FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_teams8" ON teams8 FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_teams8" ON teams8 FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_teams8" ON teams8 FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS tournament_matches8 (
  id text PRIMARY KEY,
  section text NOT NULL CHECK (section IN ('upper', 'lower')),
  team1_seed integer,
  team2_seed integer,
  team1_label text NOT NULL,
  team2_label text NOT NULL,
  team1_id uuid REFERENCES teams8(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES teams8(id) ON DELETE SET NULL,
  winner_id uuid REFERENCES teams8(id) ON DELETE SET NULL,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  score_team1 integer DEFAULT 0,
  score_team2 integer DEFAULT 0,
  played_at timestamptz,
  round_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tournament_matches8 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_matches8" ON tournament_matches8 FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_matches8" ON tournament_matches8 FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_matches8" ON tournament_matches8 FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_matches8" ON tournament_matches8 FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS tournament_history8 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text REFERENCES tournament_matches8(id) ON DELETE CASCADE,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tournament_history8 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_history8" ON tournament_history8 FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_history8" ON tournament_history8 FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_history8" ON tournament_history8 FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_history8" ON tournament_history8 FOR DELETE TO anon, authenticated USING (true);

INSERT INTO tournament_matches8 (id, section, team1_label, team2_label, team1_seed, team2_seed, round_name) VALUES
  ('M1',  'upper', 'SEED 1',   'SEED 8',   1, 8,    'Ronda 1'),
  ('M2',  'upper', 'SEED 4',   'SEED 5',   4, 5,    'Ronda 1'),
  ('M3',  'upper', 'SEED 2',   'SEED 7',   2, 7,    'Ronda 1'),
  ('M4',  'upper', 'SEED 3',   'SEED 6',   3, 6,    'Ronda 1'),
  ('M5',  'upper', 'WIN M1',   'WIN M2',   null, null, 'Semifinal Upper'),
  ('M6',  'upper', 'WIN M3',   'WIN M4',   null, null, 'Semifinal Upper'),
  ('M7',  'upper', 'WIN M5',   'WIN M6',   null, null, 'Final Upper'),
  ('M8',  'lower', 'LOS M1',   'LOS M2',   null, null, 'Ronda 1 LB'),
  ('M9',  'lower', 'LOS M3',   'LOS M4',   null, null, 'Ronda 1 LB'),
  ('M10', 'lower', 'WIN M8',   'LOS M5',   null, null, 'Ronda 2 LB'),
  ('M11', 'lower', 'WIN M9',   'LOS M6',   null, null, 'Ronda 2 LB'),
  ('M12', 'lower', 'WIN M10',  'WIN M11',  null, null, 'Ronda 3 LB'),
  ('M13', 'lower', 'WIN M12',  'LOS M7',   null, null, 'Final Lower'),
  ('M16', 'upper', 'WIN M7',   'WIN M13',  null, null, 'Gran Final')
ON CONFLICT (id) DO NOTHING;


-- --- MIGRACIÓN 3: add_user_roles ---
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  role text NOT NULL CHECK (role IN ('admin', 'team_captain', 'fan')),
  tournament_mode text CHECK (tournament_mode IN ('12', '8')),
  team_id uuid,
  team_id8 uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;


-- --- MIGRACIÓN 4: add_user_predictions ---
CREATE TABLE IF NOT EXISTS user_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id text NOT NULL,
  tournament_mode text NOT NULL CHECK (tournament_mode IN ('12', '8')),
  predicted_winner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id, tournament_mode)
);

ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_read_own" ON user_predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_write_own" ON user_predictions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_prediction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_prediction_updated_at ON user_predictions;
CREATE TRIGGER set_prediction_updated_at
  BEFORE UPDATE ON user_predictions
  FOR EACH ROW EXECUTE FUNCTION update_prediction_timestamp();


-- --- MIGRACIÓN 5: extend_user_roles_add_fan ---
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'team_captain', 'fan'));


-- --- MIGRACIÓN 6: create_map_ban_system ---
CREATE TABLE IF NOT EXISTS map_ban_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_mode text NOT NULL CHECK (tournament_mode IN ('12', '8')),
  match_id text NOT NULL,
  team1_name text NOT NULL,
  team2_name text NOT NULL,
  maps text[] NOT NULL DEFAULT ARRAY['Bind','Haven','Split','Ascent','Icebox','Breeze','Fracture','Pearl','Lotus','Sunset','Abyss'],
  current_step integer DEFAULT 0,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','finished')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS map_ban_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES map_ban_sessions(id) ON DELETE CASCADE,
  step_index int NOT NULL,
  action text NOT NULL CHECK (action IN ('ban','pick','random')),
  team_slot int CHECK (team_slot IN (1,2)),
  map_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE map_ban_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_ban_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mapban_sessions_select" ON map_ban_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapban_sessions_insert" ON map_ban_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "mapban_sessions_update" ON map_ban_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mapban_sessions_delete" ON map_ban_sessions FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "mapban_sessions_anon_select" ON map_ban_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "mapban_picks_anon_select" ON map_ban_picks FOR SELECT TO anon USING (true);
CREATE POLICY "mapban_picks_anon_insert" ON map_ban_picks FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "mapban_picks_select" ON map_ban_picks FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapban_picks_insert" ON map_ban_picks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mapban_picks_delete" ON map_ban_picks FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION update_map_ban_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_map_ban_session_updated_at ON map_ban_sessions;
CREATE TRIGGER set_map_ban_session_updated_at
  BEFORE UPDATE ON map_ban_sessions
  FOR EACH ROW EXECUTE FUNCTION update_map_ban_session_timestamp();


-- --- MIGRACIÓN 7: fix_user_roles_rls_v2 ---
DROP POLICY IF EXISTS "users_read_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_insert_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_update_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_delete_own_role" ON user_roles;

CREATE POLICY "user_read_own" ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_insert_own" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "admin_all" ON user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- MIGRACIÓN 8: Función para obtener roles con correos ---
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN QUERY
    SELECT ur.id, ur.user_id, ur.role, ur.tournament_mode, ur.team_id, ur.team_id8, ur.created_at, au.email
    FROM public.user_roles ur
    LEFT JOIN auth.users au ON ur.user_id = au.id
    ORDER BY ur.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$;

-- --- MIGRACIÓN 9: Función para obtener todos los usuarios de Auth ---
CREATE OR REPLACE FUNCTION public.get_all_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN QUERY
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    ORDER BY au.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$;
