import { useState, useEffect, useCallback } from 'react';
import { Trophy, Target, CheckCircle2, XCircle, Clock, Lock, Star, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Team, TournamentMatch, TournamentMatch8 } from '../types';

interface Prediction {
  id: string;
  match_id: string;
  tournament_mode: '12' | '8';
  predicted_winner_id: string;
  is_correct: boolean | null;
  points_earned: number;
}

interface Props {
  mode: '12' | '8';
  matches: Array<TournamentMatch | TournamentMatch8>;
  teams: Record<string, Team>;
  onModeChange: (m: '12' | '8') => void;
}

export default function PickemsDashboard({ mode, matches, teams, onModeChange }: Props) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPredictions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_predictions')
      .select('id, match_id, tournament_mode, predicted_winner_id, is_correct, points_earned')
      .eq('user_id', user.id)
      .eq('tournament_mode', mode);
    const map: Record<string, Prediction> = {};
    ((data ?? []) as Prediction[]).forEach(p => { map[p.match_id] = p; });
    setPredictions(map);
    setLoading(false);
  }, [user, mode]);

  useEffect(() => {
    setLoading(true);
    loadPredictions();
  }, [loadPredictions]);

  async function pickWinner(match: TournamentMatch | TournamentMatch8, teamId: string) {
    if (!user) return;
    const matchId = match.id;
    setError(null);
    setSaving(matchId);

    const existing = predictions[matchId];
    let err;

    if (existing) {
      if (existing.predicted_winner_id === teamId) {
        // toggle off
        const { error: e } = await supabase.from('user_predictions').delete().eq('id', existing.id);
        err = e;
        if (!e) {
          setPredictions(prev => { const next = { ...prev }; delete next[matchId]; return next; });
        }
      } else {
        const { error: e } = await supabase
          .from('user_predictions')
          .update({ predicted_winner_id: teamId })
          .eq('id', existing.id);
        err = e;
        if (!e) setPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], predicted_winner_id: teamId } }));
      }
    } else {
      const { data, error: e } = await supabase
        .from('user_predictions')
        .insert({ match_id: matchId, tournament_mode: mode, predicted_winner_id: teamId })
        .select()
        .single();
      err = e;
      if (!e && data) setPredictions(prev => ({ ...prev, [matchId]: data as Prediction }));
    }

    if (err) setError(err.message);
    setSaving(null);
  }

  const pickableMatches = matches.filter(m => m.status === 'upcoming' && m.team1_id && m.team2_id);
  const liveMatches = matches.filter(m => m.status === 'live' && m.team1_id && m.team2_id);
  const completedMatches = matches.filter(m => m.status === 'completed' && m.team1_id && m.team2_id);

  const totalPicks = Object.keys(predictions).length;
  const correctPicks = Object.values(predictions).filter(p => p.is_correct === true).length;
  const totalPoints = Object.values(predictions).reduce((s, p) => s + p.points_earned, 0);
  const accuracy = totalPicks > 0 ? Math.round((correctPicks / Object.values(predictions).filter(p => p.is_correct !== null).length || 0) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Predicciones" value={`${totalPicks}`} sub={`de ${pickableMatches.length + liveMatches.length + completedMatches.length} partidos`} color="blue" />
        <StatCard label="Correctas" value={`${correctPicks}`} sub={`${accuracy}% precisión`} color="green" />
        <StatCard label="Puntos" value={`${totalPoints}`} sub="1 punto c/acierto" color="amber" />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Mode switcher */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bracket:</span>
        <div className="flex p-1 rounded-lg bg-gray-900 border border-red-900/20">
          {(['12', '8'] as const).map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === m ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {m} Equipos
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming — pickable */}
      {pickableMatches.length > 0 && (
        <section>
          <SectionHeader icon={<Target className="w-4 h-4 text-blue-400" />} label="Predicciones abiertas" badge={pickableMatches.length} color="blue" />
          <div className="space-y-2 mt-3">
            {pickableMatches.map(m => (
              <MatchPickCard
                key={m.id}
                match={m}
                teams={teams}
                prediction={predictions[m.id] ?? null}
                saving={saving === m.id}
                locked={false}
                onPick={(teamId) => pickWinner(m, teamId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Live — locked */}
      {liveMatches.length > 0 && (
        <section>
          <SectionHeader icon={<Lock className="w-4 h-4 text-yellow-400" />} label="En vivo (cerradas)" badge={liveMatches.length} color="yellow" />
          <div className="space-y-2 mt-3">
            {liveMatches.map(m => (
              <MatchPickCard
                key={m.id}
                match={m}
                teams={teams}
                prediction={predictions[m.id] ?? null}
                saving={false}
                locked
                onPick={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed — show results */}
      {completedMatches.length > 0 && (
        <section>
          <SectionHeader icon={<CheckCircle2 className="w-4 h-4 text-gray-400" />} label="Finalizados" badge={completedMatches.length} color="gray" />
          <div className="space-y-2 mt-3">
            {completedMatches.map(m => (
              <MatchPickCard
                key={m.id}
                match={m}
                teams={teams}
                prediction={predictions[m.id] ?? null}
                saving={false}
                locked
                onPick={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      {pickableMatches.length === 0 && liveMatches.length === 0 && completedMatches.length === 0 && (
        <div className="py-16 text-center text-gray-600">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay partidos disponibles aún en el bracket de {mode} equipos.</p>
        </div>
      )}
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'blue' | 'green' | 'amber' }) {
  const colors = {
    blue: 'bg-blue-900/20 border-blue-800/30 text-blue-400',
    green: 'bg-green-900/20 border-green-800/30 text-green-400',
    amber: 'bg-amber-900/20 border-amber-800/30 text-amber-400',
  };
  return (
    <div className={`p-3 rounded-xl border ${colors[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${colors[color].split(' ').pop()}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
    </div>
  );
}

function SectionHeader({ icon, label, badge, color }: { icon: React.ReactNode; label: string; badge: number; color: string }) {
  const badgeColors: Record<string, string> = {
    blue: 'bg-blue-900/40 text-blue-300',
    yellow: 'bg-yellow-900/40 text-yellow-300',
    green: 'bg-green-900/40 text-green-300',
    gray: 'bg-gray-800 text-gray-400',
  };
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-bold text-white">{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badgeColors[color] ?? badgeColors.gray}`}>{badge}</span>
    </div>
  );
}

interface MatchPickCardProps {
  match: TournamentMatch | TournamentMatch8;
  teams: Record<string, Team>;
  prediction: Prediction | null;
  saving: boolean;
  locked: boolean;
  onPick: (teamId: string) => void;
}

function MatchPickCard({ match, teams, prediction, saving, locked, onPick }: MatchPickCardProps) {
  const team1 = match.team1_id ? teams[match.team1_id] : null;
  const team2 = match.team2_id ? teams[match.team2_id] : null;
  if (!team1 || !team2) return null;

  const picked1 = prediction?.predicted_winner_id === team1.id;
  const picked2 = prediction?.predicted_winner_id === team2.id;
  const isCompleted = match.status === 'completed';
  const winner = isCompleted && match.winner_id ? teams[match.winner_id] : null;

  function resultIcon(teamId: string) {
    if (!isCompleted || !prediction) return null;
    if (prediction.predicted_winner_id !== teamId) return null;
    return prediction.is_correct === true
      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
      : prediction.is_correct === false
        ? <XCircle className="w-4 h-4 text-red-400" />
        : <Clock className="w-4 h-4 text-gray-500" />;
  }

  return (
    <div className={`rounded-xl border transition-all ${locked ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-950 border-red-900/20 hover:border-red-900/40'}`}>
      {/* Match header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <span className="text-xs font-semibold text-gray-600">{match.round_name}</span>
        <div className="flex items-center gap-1.5">
          {locked && <Lock className="w-3 h-3 text-gray-600" />}
          {match.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
          {isCompleted && winner && (
            <span className="text-xs text-green-400 font-semibold">{winner.name} ganó</span>
          )}
          {saving && <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>

      {/* Pick buttons */}
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        {[{ team: team1, picked: picked1 }, { team: team2, picked: picked2 }].map(({ team, picked }) => {
          const isWinner = winner?.id === team.id;
          const isLoser = isCompleted && winner && winner.id !== team.id;
          return (
            <button
              key={team.id}
              onClick={() => !locked && !saving && onPick(team.id)}
              disabled={locked || saving}
              className={`
                relative flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left
                ${locked ? 'cursor-default' : 'cursor-pointer'}
                ${picked && !isCompleted ? 'bg-red-900/30 border-red-600/60 shadow-sm shadow-red-900/30' : ''}
                ${picked && isCompleted && prediction?.is_correct === true ? 'bg-green-900/20 border-green-600/50' : ''}
                ${picked && isCompleted && prediction?.is_correct === false ? 'bg-red-900/20 border-red-600/30' : ''}
                ${!picked && !locked ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : ''}
                ${!picked && locked ? 'bg-gray-900/40 border-gray-800/50' : ''}
                ${isLoser ? 'opacity-40' : ''}
                ${isWinner && !picked ? 'border-green-800/40' : ''}
              `}
            >
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-7 h-7 rounded object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-7 h-7 rounded flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: team.color + '33', color: team.color }}>
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{team.name}</p>
                <p className="text-xs text-gray-500">{team.region}</p>
              </div>
              <div className="flex-shrink-0">
                {picked ? resultIcon(team.id) ?? <Star className="w-3.5 h-3.5 text-red-400" /> : null}
                {isWinner && !picked && <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
