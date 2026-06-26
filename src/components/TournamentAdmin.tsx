import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Team, TournamentMatch } from '../types';
import { supabase } from '../lib/supabase';
import { NEXT_MATCH, LOSER_NEXT_MATCH } from '../data/bracketLayout';

interface Props {
  teams: Team[];
  matches: TournamentMatch[];
  onMatchesChange: () => void;
}

export default function TournamentAdmin({ teams, matches, onMatchesChange }: Props) {
  const [filter, setFilter] = useState<'all' | 'upper' | 'middle' | 'lower' | 'upcoming' | 'live' | 'completed'>('all');
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [localScores, setLocalScores] = useState<Record<string, { team1: number; team2: number }>>({});
  const initializedRef = useRef(false);

  // Inicializar el estado local con los puntajes de la BD
  useEffect(() => {
    if (initializedRef.current) return;
    const initialScores: Record<string, { team1: number; team2: number }> = {};
    matches.forEach(m => {
      initialScores[m.id] = {
        team1: typeof m.score_team1 === 'number' ? m.score_team1 : 0,
        team2: typeof m.score_team2 === 'number' ? m.score_team2 : 0,
      };
    });
    setLocalScores(initialScores);
    initializedRef.current = true;
  }, []);

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'TBD';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'TBD';
  };

  const updateMatch = useCallback(async (matchId: string, updates: Partial<TournamentMatch>) => {
    console.log(`[updateMatch] Updating match ${matchId}:`, updates);
    const { error } = await supabase
      .from('tournament_matches')
      .update(updates)
      .eq('id', matchId);
    if (error) {
      console.error('[updateMatch] Error:', error);
      alert(`Error al actualizar partido ${matchId}: ${error.message}`);
    }
  }, []);

  const addHistory = useCallback(async (matchId: string, action: string) => {
    console.log(`[addHistory] For ${matchId}:`, action);
    const { error } = await supabase
      .from('tournament_history')
      .insert({ match_id: matchId, action });
    if (error) {
      console.error('[addHistory] Error:', error);
    }
  }, []);

  const handleLocalScoreChange = (matchId: string, team: 'team1' | 'team2', value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalScores(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { team1: 0, team2: 0 }),
        [team]: numValue,
      },
    }));
  };

  const handleStatusChange = useCallback(async (matchId: string, status: TournamentMatch['status']) => {
    await updateMatch(matchId, { status });
    onMatchesChange();
  }, [updateMatch, onMatchesChange]);

  const handleSaveResult = useCallback(async (match: TournamentMatch) => {
    const scores = localScores[match.id] || { team1: 0, team2: 0 };
    console.log('[handleSaveResult] Starting for match:', match, 'with scores:', scores);

    if (!match.team1_id || !match.team2_id) {
      console.warn('[handleSaveResult] Missing team IDs');
      return;
    }
    if (scores.team1 === scores.team2) {
      console.warn('[handleSaveResult] Scores are equal');
      return;
    }

    setIsSaving(match.id);

    let winnerId: string | null = null;
    let loserId: string | null = null;

    if (scores.team1 > scores.team2) {
      winnerId = match.team1_id;
      loserId = match.team2_id;
    } else {
      winnerId = match.team2_id;
      loserId = match.team1_id;
    }

    console.log('[handleSaveResult] Winner:', getTeamName(winnerId));
    console.log('[handleSaveResult] Loser:', getTeamName(loserId));

    // Step 1: Update current match
    await updateMatch(match.id, {
      score_team1: scores.team1,
      score_team2: scores.team2,
      winner_id: winnerId,
      status: 'completed',
      played_at: new Date().toISOString(),
    });

    const winnerName = getTeamName(winnerId);
    const loserName = getTeamName(loserId);

    await addHistory(match.id, `${winnerName} ganó ${match.id} ${scores.team1}-${scores.team2} vs ${loserName}`);

    // Step 2: Advance winner
    const winnerNextMatch = NEXT_MATCH[match.id];
    if (winnerNextMatch) {
      console.log('[handleSaveResult] Advancing winner to:', winnerNextMatch.id);
      await updateMatch(winnerNextMatch.id, {
        [winnerNextMatch.slot === 'team1' ? 'team1_id' : 'team2_id']: winnerId,
      });
      await addHistory(match.id, `${winnerName} avanzó a ${winnerNextMatch.id}`);
    }

    // Step 3: Advance loser
    const loserNextMatch = LOSER_NEXT_MATCH[match.id];
    if (loserNextMatch) {
      console.log('[handleSaveResult] Sending loser to:', loserNextMatch.id);
      await updateMatch(loserNextMatch.id, {
        [loserNextMatch.slot === 'team1' ? 'team1_id' : 'team2_id']: loserId,
      });
      await addHistory(match.id, `${loserName} va a ${loserNextMatch.id}`);
    } else {
      await addHistory(match.id, `${loserName} eliminado`);
    }

    console.log('[handleSaveResult] Done! Reloading...');
    onMatchesChange();
    setIsSaving(null);
  }, [localScores, updateMatch, addHistory, onMatchesChange]);

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      if (filter === 'all') return true;
      if (['upper', 'middle', 'lower'].includes(filter)) return match.section === filter;
      return match.status === filter;
    });
  }, [matches, filter]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'upper', label: 'Upper' },
          { id: 'middle', label: 'Middle' },
          { id: 'lower', label: 'Lower' },
          { id: 'upcoming', label: 'Pendientes' },
          { id: 'live', label: 'En Vivo' },
          { id: 'completed', label: 'Finalizados' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              filter === f.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.map(match => {
          const scores = localScores[match.id] || { team1: 0, team2: 0 };
          const canSave = match.team1_id && match.team2_id && scores.team1 !== scores.team2;
          const isThisSaving = isSaving === match.id;

          return (
            <div
              key={match.id}
              className="p-4 rounded-xl bg-gray-900 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-400 text-xs font-bold">
                    {match.id}
                  </span>
                  <span className="text-sm text-gray-400">{match.round_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={match.status}
                    onChange={(e) => handleStatusChange(match.id, e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                  >
                    <option value="upcoming">Pendiente</option>
                    <option value="live">En Vivo</option>
                    <option value="completed">Finalizado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Team 1 */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">
                      {getTeamName(match.team1_id)}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={scores.team1}
                    onChange={(e) => handleLocalScoreChange(match.id, 'team1', e.target.value)}
                    className="w-16 text-center bg-gray-700 border border-gray-600 rounded px-2 py-1 text-lg font-bold"
                  />
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className="flex-1 text-right">
                    <div className="text-sm font-semibold text-white">
                      {getTeamName(match.team2_id)}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={scores.team2}
                    onChange={(e) => handleLocalScoreChange(match.id, 'team2', e.target.value)}
                    className="w-16 text-center bg-gray-700 border border-gray-600 rounded px-2 py-1 text-lg font-bold"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSaveResult(match)}
                disabled={!canSave || isThisSaving}
                className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                  canSave && !isThisSaving
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isThisSaving ? 'Guardando...' : 'Guardar Resultado'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
