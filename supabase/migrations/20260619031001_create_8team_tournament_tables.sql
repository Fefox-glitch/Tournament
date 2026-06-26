
-- Teams for 8-team tournament (separate table)
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

-- Matches for 8-team tournament
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

-- History for 8-team tournament
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

-- Seed the 8-team match structure
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
