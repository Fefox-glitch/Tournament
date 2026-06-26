/*
# Map Ban System

Creates tables for the interactive map ban/pick flow used before matches.
Each session has two team tokens (shareable links), a sequence of steps,
and a real-time log of bans/picks.

## Tables

### map_ban_sessions
- id (uuid PK)
- match_label (text) — e.g. "Semifinal: NaVi vs Sentinels"
- team1_name / team2_name (text)
- team1_token / team2_token (text, unique) — random tokens for the share links
- map_pool (text[]) — ordered list of map names
- format (text) — 'bo1', 'bo3', 'bo5'
- sequence (jsonb[]) — ordered array of {step, action:'ban'|'pick'|'random', team:1|2|null}
- status (text) — 'waiting', 'active', 'finished'
- created_by (uuid FK → auth.users)
- created_at / updated_at (timestamptz)

### map_ban_picks
- id (uuid PK)
- session_id (uuid FK → map_ban_sessions)
- step_index (int)
- action ('ban'|'pick'|'random')
- team_slot (int: 1 or 2)
- map_name (text)
- created_at (timestamptz)
*/

CREATE TABLE IF NOT EXISTS map_ban_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_label text NOT NULL DEFAULT '',
  team1_name text NOT NULL DEFAULT 'Team 1',
  team2_name text NOT NULL DEFAULT 'Team 2',
  team1_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'base64'),
  team2_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'base64'),
  map_pool text[] NOT NULL DEFAULT '{}',
  format text NOT NULL DEFAULT 'bo3' CHECK (format IN ('bo1','bo3','bo5')),
  sequence jsonb NOT NULL DEFAULT '[]',
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

-- Sessions: admins can do everything; anyone with a valid token can read (enforced in app)
CREATE POLICY "mapban_sessions_select" ON map_ban_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapban_sessions_insert" ON map_ban_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "mapban_sessions_update" ON map_ban_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mapban_sessions_delete" ON map_ban_sessions FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Allow anon reads so team links work without login
CREATE POLICY "mapban_sessions_anon_select" ON map_ban_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "mapban_picks_anon_select" ON map_ban_picks FOR SELECT TO anon USING (true);
CREATE POLICY "mapban_picks_anon_insert" ON map_ban_picks FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "mapban_picks_select" ON map_ban_picks FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapban_picks_insert" ON map_ban_picks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mapban_picks_delete" ON map_ban_picks FOR DELETE TO authenticated USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_map_ban_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_map_ban_session_updated_at ON map_ban_sessions;
CREATE TRIGGER set_map_ban_session_updated_at
  BEFORE UPDATE ON map_ban_sessions
  FOR EACH ROW EXECUTE FUNCTION update_map_ban_session_timestamp();
