import { Team, TournamentMatch } from '../types';
import { Trophy, Users, Calendar, Clock } from 'lucide-react';

interface Props {
  teams: Team[];
  matches: TournamentMatch[];
}

export default function TournamentStats({ teams, matches }: Props) {
  // Calculate stats
  const playedMatches = matches.filter(m => m.status === 'completed').length;
  const liveMatches = matches.filter(m => m.status === 'live').length;
  const totalMatches = matches.length;

  // Get active teams (still in tournament)
  const activeTeams = teams.filter(team => {
    // A team is active if they haven't been eliminated (i.e., haven't lost twice)
    // For simplicity, we'll just check if they are in any upcoming or live match
    return matches.some(match => 
      (match.status !== 'completed' && (match.team1_id === team.id || match.team2_id === team.id))
    );
  });

  // Get eliminated teams
  const eliminatedTeams = teams.filter(team => !activeTeams.some(at => at.id === team.id));

  // Get champion
  const finalMatch = matches.find(m => m.id === 'M30');
  const champion = finalMatch?.winner_id ? teams.find(t => t.id === finalMatch.winner_id) : null;

  // Find next match
  const nextMatch = matches.find(m => m.status === 'upcoming' && m.team1_id && m.team2_id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Matches played */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-red-900/30">
            <Trophy className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Partidos Jugados</div>
            <div className="text-2xl font-bold text-white">{playedMatches}/{totalMatches}</div>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500"
            style={{ width: `${(playedMatches / totalMatches) * 100}%` }}
          />
        </div>
      </div>

      {/* Active teams */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-900/30">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Equipos Activos</div>
            <div className="text-2xl font-bold text-white">{activeTeams.length}/{teams.length}</div>
          </div>
        </div>
        {activeTeams.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {activeTeams.slice(0, 4).map(team => (
              <span
                key={team.id}
                className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-300"
              >
                {team.name}
              </span>
            ))}
            {activeTeams.length > 4 && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-500">
                +{activeTeams.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Eliminated teams */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-red-900/30">
            <Users className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Equipos Eliminados</div>
            <div className="text-2xl font-bold text-white">{eliminatedTeams.length}</div>
          </div>
        </div>
      </div>

      {/* Champion / Next match */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        {champion ? (
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-900/30">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">CAMPEÓN</div>
              <div className="text-xl font-bold text-amber-400">{champion.name}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-900/30">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Próximo Partido</div>
              {nextMatch ? (
                <div className="text-sm font-bold text-white">
                  {nextMatch.id}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Ninguno</div>
              )}
            </div>
          </div>
        )}
        {liveMatches > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-500 font-semibold">{liveMatches} partido(s) en vivo</span>
          </div>
        )}
      </div>
    </div>
  );
}
