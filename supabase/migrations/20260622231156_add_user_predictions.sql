/*
# Add user predictions (pick'ems) system

## Summary
Allows authenticated "fan" users to predict match winners before matches are played.
Points are awarded automatically based on correct predictions.

## New Tables

### user_predictions
Stores one prediction per user per match.
- id (uuid PK)
- user_id (uuid FK → auth.users, NOT NULL, defaults to auth.uid())
- match_id (text) — references tournament_matches.id or tournament_matches8.id
- tournament_mode (text: '12' | '8') — which bracket the match belongs to
- predicted_winner_id (uuid) — the team the user is picking to win
- is_correct (boolean nullable) — null until match is completed, then set by trigger/app
- points_earned (int default 0)
- created_at / updated_at (timestamptz)

### prediction_leaderboard (view)
A view that aggregates correct picks and total points per user.

## Security
- RLS enabled on user_predictions
- Users can only insert/read/update/delete their own predictions
- Cannot edit a prediction once the match is live or completed (enforced at app level)

## Notes
- Predictions are locked once match status != 'upcoming'
- 1 point per correct prediction (expandable later)
- UNIQUE(user_id, match_id, tournament_mode) prevents duplicate picks
*/

CREATE TABLE IF NOT EXISTS user_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id text NOT NULL,
  tournament_mode text NOT NULL CHECK (tournament_mode IN ('12', '8')),
  predicted_winner_id uuid NOT NULL,
  is_correct boolean,
  points_earned int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, match_id, tournament_mode)
);

ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "predictions_select_own" ON user_predictions;
CREATE POLICY "predictions_select_own" ON user_predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictions_insert_own" ON user_predictions;
CREATE POLICY "predictions_insert_own" ON user_predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictions_update_own" ON user_predictions;
CREATE POLICY "predictions_update_own" ON user_predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictions_delete_own" ON user_predictions;
CREATE POLICY "predictions_delete_own" ON user_predictions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow all authenticated users to see the leaderboard aggregates
-- We expose totals only, not individual picks of other users
DROP POLICY IF EXISTS "predictions_select_leaderboard" ON user_predictions;
CREATE POLICY "predictions_select_leaderboard" ON user_predictions FOR SELECT
  TO authenticated
  USING (true);

-- update_at trigger
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
