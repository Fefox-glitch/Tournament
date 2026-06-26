
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
