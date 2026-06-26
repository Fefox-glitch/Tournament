import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Team, TournamentMatch8 } from '../types';
import { supabase } from '../lib/supabase';
import { NEXT_MATCH8, LOSER_NEXT_MATCH8 } from '../data/bracketLayout8';

interface Props {
  teams: Team[];
  matches: TournamentMatch8[];
  onMatchesChange: () => void;
}

type FilterType = 'all' | 'upper' | 'lower' | 'upcoming' | 'live' | 'completed';

export default function TournamentAdmin8({ teams, matches, onMatchesChange }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [localScores, setLocalScores] = useState<Record<string, { team1: number; team2: number }>>({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    const initial: Record<string, { team1: number; team2: number }> = {};
    matches.forEach(m => {
      initial[m.id] = {
        team1: typeof m.score_team1 === 'number' ? m.score_team1 : 0,
        team2: typeof m.score_team2 === 'number' ? m.score_team2 : 0,
      };
    });
    setLocalScores(initial);
    initializedRef.current = true;
  }, []);

  const getTeamName = useCallback((teamId: string | null) => {
    if (!teamId) return 'TBD';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'TBD';
  }, [teams]);

  const updateMatch = useCallback(async (matchId: string, updates: Partial<TournamentMatch8>) => {
    const { error } = await supabase
      .from('tournament_matches8')
      .update(updates)
      .eq('id', matchId);
    if (error) alert(`Error al actualizar partido ${matchId}: ${error.message}`);
  }, []);

  const addHistory = useCallback(async (matchId: string, action: string) => {
    await supabase.from('tournament_history8').insert({ match_id: matchId, action });
  }, []);

  const handleLocalScoreChange = (matchId: string, team: 'team1' | 'team2', value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalScores(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { team1: 0, team2: 0 }), [team]: numValue },
    }));
  };

  const handleStatusChange = useCallback(async (matchId: string, status: TournamentMatch8['status']) => {
    await updateMatch(matchId, { status });
    onMatchesChange();
  }, [updateMatch, onMatchesChange]);

  const handleSaveResult = useCallback(async (match: TournamentMatch8) => {
    const scores = localScores[match.id] || { team1: 0, team2: 0 };
    if (!match.team1_id || !match.team2_id) return;
    if (scores.team1 === scores.team2) return;

    setIsSaving(match.id);

    const winnerId = scores.team1 > scores.team2 ? match.team1_id : match.team2_id;
    const loserId  = scores.team1 > scores.team2 ? match.team2_id : match.team1_id;
    const winnerName = getTeamName(winnerId);
    const loserName  = getTeamName(loserId);

    await updateMatch(match.id, {
      score_team1: scores.team1,
      score_team2: scores.team2,
      winner_id: winnerId,
      status: 'completed',
      played_at: new Date().toISOString(),
    });

    await addHistory(match.id, `${winnerName} ganó ${match.id} ${scores.team1}-${scores.team2} vs ${loserName}`);

    const winnerNext = NEXT_MATCH8[match.id];
    if (winnerNext) {
      await updateMatch(winnerNext.id, {
        [winnerNext.slot === 'team1' ? 'team1_id' : 'team2_id']: winnerId,
      });
      await addHistory(match.id, `${winnerName} avanzó a ${winnerNext.id}`);
    }

    const loserNext = LOSER_NEXT_MATCH8[match.id];
    if (loserNext) {
      await updateMatch(loserNext.id, {
        [loserNext.slot === 'team1' ? 'team1_id' : 'team2_id']: loserId,
      });
      await addHistory(match.id, `${loserName} va a ${loserNext.id}`);
    } else {
      await addHistory(match.id, `${loserName} eliminado`);
    }

    onMatchesChange();
    setIsSaving(null);
  }, [localScores, updateMatch, addHistory, onMatchesChange, getTeamName]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (filter === 'all') return true;
      if (filter === 'upper' || filter === 'lower') return m.section === filter;
      return m.status === filter;
    });
  }, [matches, filter]);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all',       label: 'Todos' },
    { id: 'upper',     label: 'Upper' },
    { id: 'lower',     label: 'Lower' },
    { id: 'upcoming',  label: 'Pendientes' },
    { id: 'live',      label: 'En Vivo' },
    { id: 'completed', label: 'Finalizados' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              filter === f.id ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredMatches.map(match => {
          const scores = localScores[match.id] || { team1: 0, team2: 0 };
          const canSave = !!(match.team1_id && match.team2_id && scores.team1 !== scores.team2);
          const isThisSaving = isSaving === match.id;

          return (
            <div key={match.id} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-400 text-xs font-bold">
                    {match.id}
                  </span>
                  <span className="text-sm text-gray-400">{match.round_name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    match.section === 'upper' ? 'bg-red-900/30 text-red-400' : 'bg-orange-900/30 text-orange-400'
                  }`}>
                    {match.section === 'upper' ? 'Upper' : 'Lower'}
                  </span>
                </div>
                <select
                  value={match.status}
                  onChange={(e) => handleStatusChange(match.id, e.target.value as TournamentMatch8['status'])}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                >
                  <option value="upcoming">Pendiente</option>
                  <option value="live">En Vivo</option>
                  <option value="completed">Finalizado</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{getTeamName(match.team1_id)}</div>
                    {match.team1_seed && <div className="text-xs text-gray-500">Seed {match.team1_seed}</div>}
                  </div>
                  <input
                    type="number" min="0"
                    value={scores.team1}
                    onChange={e => handleLocalScoreChange(match.id, 'team1', e.target.value)}
                    className="w-16 text-center bg-gray-700 border border-gray-600 rounded px-2 py-1 text-lg font-bold text-white"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className="flex-1 text-right">
                    <div className="text-sm font-semibold text-white">{getTeamName(match.team2_id)}</div>
                    {match.team2_seed && <div className="text-xs text-gray-500">Seed {match.team2_seed}</div>}
                  </div>
                  <input
                    type="number" min="0"
                    value={scores.team2}
                    onChange={e => handleLocalScoreChange(match.id, 'team2', e.target.value)}
                    className="w-16 text-center bg-gray-700 border border-gray-600 rounded px-2 py-1 text-lg font-bold text-white"
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
