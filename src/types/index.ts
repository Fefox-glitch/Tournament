export interface Team {
  id: string;
  name: string;
  logo_url: string;
  region: string;
  seed: number | null;
  color: string;
}

export interface TournamentMatch {
  id: string;
  section: 'upper' | 'middle' | 'lower';
  team1_seed: number | null;
  team2_seed: number | null;
  team1_label: string;
  team2_label: string;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
  status: 'upcoming' | 'live' | 'completed';
  score_team1: number;
  score_team2: number;
  played_at: string | null;
  next_match_id: string | null;
  next_match_slot: 'team1' | 'team2' | null;
  round_name: string;
}

export interface TournamentMatch8 {
  id: string;
  section: 'upper' | 'lower';
  team1_seed: number | null;
  team2_seed: number | null;
  team1_label: string;
  team2_label: string;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
  status: 'upcoming' | 'live' | 'completed';
  score_team1: number;
  score_team2: number;
  played_at: string | null;
  round_name: string;
}

export interface TournamentHistory {
  id: string;
  match_id: string;
  action: string;
  created_at: string;
}

export interface MatchPosition {
  id: string;
  x: number;
  y: number;
}

export type SectionLabel = 'upper' | 'middle' | 'lower';
