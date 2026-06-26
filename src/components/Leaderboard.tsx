import { useState, useEffect, useCallback } from 'react';
import { Medal, RefreshCw, AlertCircle, Crown, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_picks: number;
  correct_picks: number;
  total_points: number;
  accuracy: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Aggregate predictions per user
    const { data, error: err } = await supabase
      .from('user_predictions')
      .select('user_id, is_correct, points_earned');

    if (err) { setError(err.message); setLoading(false); return; }

    const agg: Record<string, { total: number; correct: number; points: number }> = {};
    ((data ?? []) as { user_id: string; is_correct: boolean | null; points_earned: number }[]).forEach(row => {
      if (!agg[row.user_id]) agg[row.user_id] = { total: 0, correct: 0, points: 0 };
      agg[row.user_id].total += 1;
      if (row.is_correct === true) agg[row.user_id].correct += 1;
      agg[row.user_id].points += row.points_earned;
    });

    // Fetch roles to get display info (we only have user_id, no emails from auth.users via anon key)
    const userIds = Object.keys(agg);
    if (userIds.length === 0) { setEntries([]); setLoading(false); return; }

    const result: LeaderboardEntry[] = userIds.map(uid => {
      const { total, correct, points } = agg[uid];
      const resolved = total - Object.values(agg[uid]).filter(v => v === null).length;
      return {
        user_id: uid,
        email: uid === user?.id ? 'Tú' : `Fan #${uid.slice(0, 6)}`,
        total_picks: total,
        correct_picks: correct,
        total_points: points,
        accuracy: resolved > 0 ? Math.round((correct / resolved) * 100) : 0,
      };
    });

    // Sort by points desc, then correct picks
    result.sort((a, b) => b.total_points - a.total_points || b.correct_picks - a.correct_picks || b.total_picks - a.total_picks);
    setEntries(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const myEntry = entries.find(e => e.user_id === user?.id);
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Medal className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-black text-white">Ranking de Predicciones</h3>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* My position callout */}
      {myEntry && myRank !== null && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-900/20 border border-red-800/30">
          <RankBadge rank={myRank} />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Tu posición</p>
            <p className="text-xs text-gray-400">{myEntry.correct_picks} correctas · {myEntry.total_points} pts</p>
          </div>
          <Target className="w-4 h-4 text-red-400" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-gray-600">
          <Medal className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aún no hay predicciones. ¡Sé el primero!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.user_id === user?.id;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isMe
                    ? 'bg-red-900/20 border-red-800/30'
                    : rank <= 3
                      ? 'bg-gray-900 border-amber-800/20'
                      : 'bg-gray-900/60 border-gray-800'
                }`}
              >
                <RankBadge rank={rank} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white truncate">
                      {isMe ? 'Tú' : entry.email}
                    </p>
                    {rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    {isMe && !entry.user_id.startsWith('Tú') && (
                      <span className="text-xs text-red-400 font-semibold">(tú)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {entry.total_picks} predicciones · {entry.accuracy}% precisión
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-amber-400">{entry.total_points} pts</p>
                  <p className="text-xs text-gray-500">{entry.correct_picks} correctas</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-700 text-center pt-2">
        Las predicciones se bloquean cuando un partido está en vivo o finalizado.
        Ganas 1 punto por cada predicción correcta.
      </p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-black text-amber-400">1</span>
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-lg bg-gray-500/20 border border-gray-500/30 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-black text-gray-300">2</span>
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-lg bg-orange-900/30 border border-orange-700/30 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-black text-orange-400">3</span>
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-gray-500">{rank}</span>
    </div>
  );
}
