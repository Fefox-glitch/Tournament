import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Gamepad2, Trophy, Users, BookOpen, Settings,
  MapPin, Calendar, Info, Loader2, LogOut, Shield, UserCheck, Target, Medal,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Team, TournamentMatch, TournamentMatch8 } from './types';
import BracketVis from './components/BracketVis';
import BracketVis8 from './components/BracketVis8';
import TeamsAdmin from './components/TeamsAdmin';
import TeamsAdmin8 from './components/TeamsAdmin8';
import TournamentAdmin from './components/TournamentAdmin';
import TournamentAdmin8 from './components/TournamentAdmin8';
import TournamentStats from './components/TournamentStats';
import TournamentStats8 from './components/TournamentStats8';
import LoginPage from './components/LoginPage';
import TeamRegistration from './components/TeamRegistration';
import AdminUserManager from './components/AdminUserManager';
import PendingApprovalPage from './components/PendingApprovalPage';
import PickemsDashboard from './components/PickemsDashboard';
import Leaderboard from './components/Leaderboard';
import MapBanSetup from './components/MapBanSetup';
import MapBanRoom from './components/MapBanRoom';

// ── hydration helpers ─────────────────────────────────────────────────────────
function hydrateBracket(
  matches: TournamentMatch[],
  teams: Team[],
): Record<string, TournamentMatch> {
  const seedMap: Record<number, Team> = {};
  teams.forEach(t => { if (t.seed) seedMap[t.seed] = t; });
  const result: Record<string, TournamentMatch> = {};
  matches.forEach(m => {
    const h = { ...m };
    h.score_team1 = typeof m.score_team1 === 'number' ? m.score_team1 : 0;
    h.score_team2 = typeof m.score_team2 === 'number' ? m.score_team2 : 0;
    if (!h.team1_id && m.team1_seed && seedMap[m.team1_seed]) h.team1_id = seedMap[m.team1_seed].id;
    if (!h.team2_id && m.team2_seed && seedMap[m.team2_seed]) h.team2_id = seedMap[m.team2_seed].id;
    result[m.id] = h;
  });
  return result;
}

function hydrateBracket8(
  matches: TournamentMatch8[],
  teams: Team[],
): Record<string, TournamentMatch8> {
  const seedMap: Record<number, Team> = {};
  teams.forEach(t => { if (t.seed) seedMap[t.seed] = t; });
  const result: Record<string, TournamentMatch8> = {};
  matches.forEach(m => {
    const h = { ...m };
    h.score_team1 = typeof m.score_team1 === 'number' ? m.score_team1 : 0;
    h.score_team2 = typeof m.score_team2 === 'number' ? m.score_team2 : 0;
    if (!h.team1_id && m.team1_seed && seedMap[m.team1_seed]) h.team1_id = seedMap[m.team1_seed].id;
    if (!h.team2_id && m.team2_seed && seedMap[m.team2_seed]) h.team2_id = seedMap[m.team2_seed].id;
    result[m.id] = h;
  });
  return result;
}

type TournamentMode = '12' | '8';
type AdminTab = 'bracket' | 'teams' | 'matches' | 'users' | 'rules' | 'mapban';
type CaptainTab = 'bracket' | 'registration';
type FanTab = 'picks' | 'bracket' | 'leaderboard';

// ── root wrapper ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

function AppRouter() {
  const { session, userRole, loading } = useAuth();

  // Handle map ban room links (?mapban=ID&team=1&token=XYZ or ?mapban=ID&admin=1)
  const params = new URLSearchParams(window.location.search);
  const mapbanId = params.get('mapban');
  if (mapbanId) {
    const teamParam = params.get('team');
    const tokenParam = params.get('token');
    const isAdmin = params.get('admin') === '1';
    const slot = isAdmin ? null : (teamParam === '1' ? 1 : teamParam === '2' ? 2 : null) as 1 | 2 | null;
    return <MapBanRoom sessionId={mapbanId} teamSlot={slot} token={tokenParam ?? undefined} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
          <span className="text-red-400 font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!session) return <LoginPage />;
  if (!userRole) return <PendingApprovalPage />;
  if (userRole.role === 'admin') return <AdminDashboard />;
  if (userRole.role === 'fan') return <FanDashboard />;
  return <CaptainDashboard />;
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [mode, setMode] = useState<TournamentMode>('12');
  const [activeTab, setActiveTab] = useState<AdminTab>('bracket');
  const [loading, setLoading] = useState(true);

  const [teams12, setTeams12] = useState<Team[]>([]);
  const [rawMatches12, setRawMatches12] = useState<TournamentMatch[]>([]);
  const [matches12, setMatches12] = useState<Record<string, TournamentMatch>>({});
  const [teamsMap12, setTeamsMap12] = useState<Record<string, Team>>({});

  const [teams8, setTeams8] = useState<Team[]>([]);
  const [rawMatches8, setRawMatches8] = useState<TournamentMatch8[]>([]);
  const [matches8, setMatches8] = useState<Record<string, TournamentMatch8>>({});
  const [teamsMap8, setTeamsMap8] = useState<Record<string, Team>>({});

  const loadData12 = useCallback(async () => {
    const [{ data: td }, { data: md }] = await Promise.all([
      supabase.from('teams').select('*').order('seed'),
      supabase.from('tournament_matches').select('*').order('id'),
    ]);
    const t = (td as Team[]) ?? [];
    const m = (md as TournamentMatch[]) ?? [];
    const tMap: Record<string, Team> = {};
    t.forEach(team => { tMap[team.id] = team; });
    setTeams12(t); setRawMatches12(m); setTeamsMap12(tMap);
    setMatches12(hydrateBracket(m, t));
  }, []);

  const loadData8 = useCallback(async () => {
    const [{ data: td }, { data: md }] = await Promise.all([
      supabase.from('teams8').select('*').order('seed'),
      supabase.from('tournament_matches8').select('*').order('id'),
    ]);
    const t = (td as Team[]) ?? [];
    const m = (md as TournamentMatch8[]) ?? [];
    const tMap: Record<string, Team> = {};
    t.forEach(team => { tMap[team.id] = team; });
    setTeams8(t); setRawMatches8(m); setTeamsMap8(tMap);
    setMatches8(hydrateBracket8(m, t));
  }, []);

  useEffect(() => {
    Promise.all([loadData12(), loadData8()]).then(() => setLoading(false));
  }, [loadData12, loadData8]);

  useEffect(() => {
    setMatches12(hydrateBracket(rawMatches12, teams12));
    const tMap: Record<string, Team> = {};
    teams12.forEach(t => { tMap[t.id] = t; });
    setTeamsMap12(tMap);
  }, [teams12, rawMatches12]);

  useEffect(() => {
    setMatches8(hydrateBracket8(rawMatches8, teams8));
    const tMap: Record<string, Team> = {};
    teams8.forEach(t => { tMap[t.id] = t; });
    setTeamsMap8(tMap);
  }, [teams8, rawMatches8]);

  const adminMatches12 = useMemo(() => Object.values(matches12), [matches12]);
  const adminMatches8  = useMemo(() => Object.values(matches8),  [matches8]);

  const playedMatches = mode === '12'
    ? rawMatches12.filter(m => m.status === 'completed').length
    : rawMatches8.filter(m => m.status === 'completed').length;
  const totalMatches = mode === '12' ? rawMatches12.length : rawMatches8.length;
  const pct = totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'bracket',      label: 'Bracket',   icon: <Trophy className="w-4 h-4" /> },
    { id: 'teams',        label: 'Equipos',   icon: <Users className="w-4 h-4" /> },
    { id: 'matches',      label: 'Partidos',  icon: <Settings className="w-4 h-4" /> },
    { id: 'users',        label: 'Usuarios',  icon: <Shield className="w-4 h-4" /> },
    { id: 'rules',        label: 'Formato',   icon: <BookOpen className="w-4 h-4" /> },
    { id: 'mapban',       label: 'Map Ban',   icon: <Target className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-black" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-700 rounded-full blur-[120px] opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-red-900 rounded-full blur-[100px] opacity-15 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="relative z-10">
          <nav className="flex items-center justify-between px-6 py-3 border-b border-red-900/20">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-7 h-7 text-red-500" />
              <span className="text-lg font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent tracking-wider">
                TOURNAMENT TRACKER
              </span>
              <span className="px-2 py-0.5 rounded bg-red-900/40 border border-red-800/40 text-xs font-bold text-red-400 uppercase tracking-wider">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Mode switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-900 border border-red-900/30">
                <button
                  onClick={() => { setMode('12'); setActiveTab('bracket'); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === '12' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-400 hover:text-white'}`}
                >12 Equipos</button>
                <button
                  onClick={() => { setMode('8'); setActiveTab('bracket'); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === '8' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-400 hover:text-white'}`}
                >8 Equipos</button>
              </div>
              {/* User + logout */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-gray-400 max-w-[120px] truncate">{user?.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Salir
              </button>
            </div>
          </nav>

          <div className="px-6 py-5">
            <div className="max-w-5xl">
              <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Torneo en Curso</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">VALORANT Champions 2026</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-500" /> Santiago, Chile</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-red-500" /> Jun 19 – Jul 05, 2026</span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/30 border border-red-800/40">
                  <Trophy className="w-3.5 h-3.5 text-red-400" /><span className="text-red-300 font-semibold">$50,000</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-md bg-red-900/30 border border-red-800/40 text-xs font-bold text-red-300 uppercase tracking-wider">Doble Eliminación</span>
                {mode === '12' ? (
                  <>
                    <span className="px-2.5 py-1 rounded-md bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-400">28 partidos Bo3</span>
                    <span className="px-2.5 py-1 rounded-md bg-amber-900/30 border border-amber-800/40 text-xs font-bold text-amber-400">2 partidos Bo5</span>
                    <span className="px-2.5 py-1 rounded-md bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-400">12 equipos</span>
                  </>
                ) : (
                  <>
                    <span className="px-2.5 py-1 rounded-md bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-400">13 partidos Bo3</span>
                    <span className="px-2.5 py-1 rounded-md bg-amber-900/30 border border-amber-800/40 text-xs font-bold text-amber-400">Gran Final Bo5</span>
                    <span className="px-2.5 py-1 rounded-md bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-400">8 equipos</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-red-900/20 px-6 py-2.5">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Progreso del Torneo</span>
              <span className="text-red-500 font-semibold">{playedMatches}/{totalMatches}</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="px-6 py-4">
        {mode === '12'
          ? <TournamentStats teams={teams12} matches={rawMatches12} />
          : <TournamentStats8 teams={teams8} matches={rawMatches8} />
        }
      </div>

      {/* TABS */}
      <div className="bg-gray-950 border-b border-red-900/20 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'border-red-600 text-red-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="px-4 py-6">
        {activeTab === 'bracket' && (
          <div>
            {mode === '12' && teams12.length < 2 && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-amber-900/30 border border-amber-700/40">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-300">Agrega equipos en la pestaña <strong>Equipos</strong> y asigna seeds para poblar el bracket.</p>
              </div>
            )}
            {mode === '12'
              ? <BracketVis matches={matches12} teams={teamsMap12} />
              : <BracketVis8 matches={matches8} teams={teamsMap8} />
            }
          </div>
        )}

        {activeTab === 'teams' && (
          mode === '12'
            ? <TeamsAdmin teams={teams12} onTeamsChange={loadData12} />
            : <TeamsAdmin8 teams={teams8} onTeamsChange={loadData8} />
        )}

        {activeTab === 'matches' && (
          mode === '12'
            ? <TournamentAdmin teams={teams12} matches={adminMatches12} onMatchesChange={loadData12} />
            : <TournamentAdmin8 teams={teams8} matches={adminMatches8} onMatchesChange={loadData8} />
        )}

        {activeTab === 'users' && (
          <div className="max-w-2xl mx-auto">
            <AdminUserManager />
          </div>
        )}

        {activeTab === 'rules' && <RulesSection mode={mode} />}

        {activeTab === 'mapban' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-5">
              <h2 className="text-lg font-black text-white mb-1">Map Ban / Pick</h2>
              <p className="text-sm text-gray-500">Crea una sesión de ban/pick para un partido. Comparte los enlaces con cada equipo.</p>
            </div>
            <MapBanSetup />
          </div>
        )}
      </main>
    </div>
  );
}

// ── CAPTAIN DASHBOARD ─────────────────────────────────────────────────────────
function CaptainDashboard() {
  const { signOut, user, userRole, refreshRole } = useAuth();
  const mode = (userRole?.tournament_mode ?? '12') as TournamentMode;
  const [activeTab, setActiveTab] = useState<CaptainTab>('bracket');
  const [loading, setLoading] = useState(true);

  const [teams12, setTeams12] = useState<Team[]>([]);
  const [rawMatches12, setRawMatches12] = useState<TournamentMatch[]>([]);
  const [matches12, setMatches12] = useState<Record<string, TournamentMatch>>({});
  const [teamsMap12, setTeamsMap12] = useState<Record<string, Team>>({});

  const [teams8, setTeams8] = useState<Team[]>([]);
  const [rawMatches8, setRawMatches8] = useState<TournamentMatch8[]>([]);
  const [matches8, setMatches8] = useState<Record<string, TournamentMatch8>>({});
  const [teamsMap8, setTeamsMap8] = useState<Record<string, Team>>({});

  const loadData12 = useCallback(async () => {
    const [{ data: td }, { data: md }] = await Promise.all([
      supabase.from('teams').select('*').order('seed'),
      supabase.from('tournament_matches').select('*').order('id'),
    ]);
    const t = (td as Team[]) ?? [];
    const m = (md as TournamentMatch[]) ?? [];
    const tMap: Record<string, Team> = {};
    t.forEach(team => { tMap[team.id] = team; });
    setTeams12(t); setRawMatches12(m); setTeamsMap12(tMap);
    setMatches12(hydrateBracket(m, t));
  }, []);

  const loadData8 = useCallback(async () => {
    const [{ data: td }, { data: md }] = await Promise.all([
      supabase.from('teams8').select('*').order('seed'),
      supabase.from('tournament_matches8').select('*').order('id'),
    ]);
    const t = (td as Team[]) ?? [];
    const m = (md as TournamentMatch8[]) ?? [];
    const tMap: Record<string, Team> = {};
    t.forEach(team => { tMap[team.id] = team; });
    setTeams8(t); setRawMatches8(m); setTeamsMap8(tMap);
    setMatches8(hydrateBracket8(m, t));
  }, []);

  useEffect(() => {
    Promise.all([loadData12(), loadData8()]).then(() => setLoading(false));
  }, [loadData12, loadData8]);

  useEffect(() => {
    setMatches12(hydrateBracket(rawMatches12, teams12));
    const tMap: Record<string, Team> = {};
    teams12.forEach(t => { tMap[t.id] = t; });
    setTeamsMap12(tMap);
  }, [teams12, rawMatches12]);

  useEffect(() => {
    setMatches8(hydrateBracket8(rawMatches8, teams8));
    const tMap: Record<string, Team> = {};
    teams8.forEach(t => { tMap[t.id] = t; });
    setTeamsMap8(tMap);
  }, [teams8, rawMatches8]);

  const playedMatches = mode === '12'
    ? rawMatches12.filter(m => m.status === 'completed').length
    : rawMatches8.filter(m => m.status === 'completed').length;
  const totalMatches = mode === '12' ? rawMatches12.length : rawMatches8.length;
  const pct = totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0;

  const tabs: { id: CaptainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'bracket',      label: 'Bracket',         icon: <Trophy className="w-4 h-4" /> },
    { id: 'registration', label: 'Mi Equipo',        icon: <UserCheck className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-black" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-700 rounded-full blur-[120px] opacity-20 animate-pulse" />
        </div>
        <div className="relative z-10">
          <nav className="flex items-center justify-between px-6 py-3 border-b border-red-900/20">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-7 h-7 text-red-500" />
              <span className="text-lg font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent tracking-wider">
                TOURNAMENT TRACKER
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-900/40 border border-blue-800/40 text-xs font-bold text-blue-400 uppercase tracking-wider">
                Capitán
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-gray-400 max-w-[120px] truncate">{user?.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Salir
              </button>
            </div>
          </nav>

          <div className="px-6 py-5">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Torneo en Curso</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">VALORANT Champions 2026</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-500" /> Santiago, Chile</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-red-500" /> Jun 19 – Jul 05, 2026</span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/30 border border-red-800/40">
                <Trophy className="w-3.5 h-3.5 text-red-400" /><span className="text-red-300 font-semibold">$50,000</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-md bg-red-900/30 border border-red-800/40 text-xs font-bold text-red-300 uppercase tracking-wider">Doble Eliminación</span>
              <span className="px-2.5 py-1 rounded-md bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-400">
                {mode === '12' ? '12 equipos' : '8 equipos'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* PROGRESS */}
      <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-red-900/20 px-6 py-2.5">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Progreso del Torneo</span>
            <span className="text-red-500 font-semibold">{playedMatches}/{totalMatches}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-gray-950 border-b border-red-900/20 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id ? 'border-red-600 text-red-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <main className="px-4 py-6">
        {activeTab === 'bracket' && (
          <div>
            {mode === '12'
              ? <BracketVis matches={matches12} teams={teamsMap12} />
              : <BracketVis8 matches={matches8} teams={teamsMap8} />
            }
          </div>
        )}

        {activeTab === 'registration' && (
          <TeamRegistration
            tournamentMode={mode}
            onRegistered={async () => {
              await refreshRole();
              if (mode === '12') loadData12(); else loadData8();
            }}
          />
        )}
      </main>
    </div>
  );
}

// ── FAN DASHBOARD ─────────────────────────────────────────────────────────────
function FanDashboard() {
  const { signOut, user } = useAuth();
  const [mode, setMode] = useState<TournamentMode>('12');
  const [activeTab, setActiveTab] = useState<FanTab>('picks');
  const [loading, setLoading] = useState(true);

  const [teams12, setTeams12] = useState<Team[]>([]);
  const [rawMatches12, setRawMatches12] = useState<TournamentMatch[]>([]);
  const [matches12, setMatches12] = useState<Record<string, TournamentMatch>>({});
  const [teamsMap12, setTeamsMap12] = useState<Record<string, Team>>({});

  const [teams8, setTeams8] = useState<Team[]>([]);
  const [rawMatches8, setRawMatches8] = useState<TournamentMatch8[]>([]);
  const [matches8, setMatches8] = useState<Record<string, TournamentMatch8>>({});
  const [teamsMap8, setTeamsMap8] = useState<Record<string, Team>>({});

  const loadData12 = useCallback(async () => {
    const [{ data: td }, { data: md }] = await Promise.all([
      supabase.from('teams').select('*').order('seed'),
      supabase.from('tournament_matches').select('*').order('id'),
    ]);
    const t = (td as Team[]) ?? [];
    const m = (md as TournamentMatch[]) ?? [];
    const tMap: Record<string, Team> = {};
    t.forEach(team => { tMap[team.id] = team; });
    setTeams12(t); setRawMatches12(m); setTeamsMap12(tMap);
    setMatches12(hydrateBracket(m, t));
  }, []);

  const loadData8 = useCallback(async () => {
    const [{ data: td }, { data: md }] = await Promise.all([
      supabase.from('teams8').select('*').order('seed'),
      supabase.from('tournament_matches8').select('*').order('id'),
    ]);
    const t = (td as Team[]) ?? [];
    const m = (md as TournamentMatch8[]) ?? [];
    const tMap: Record<string, Team> = {};
    t.forEach(team => { tMap[team.id] = team; });
    setTeams8(t); setRawMatches8(m); setTeamsMap8(tMap);
    setMatches8(hydrateBracket8(m, t));
  }, []);

  useEffect(() => {
    Promise.all([loadData12(), loadData8()]).then(() => setLoading(false));
  }, [loadData12, loadData8]);

  useEffect(() => {
    setMatches12(hydrateBracket(rawMatches12, teams12));
    const tMap: Record<string, Team> = {};
    teams12.forEach(t => { tMap[t.id] = t; });
    setTeamsMap12(tMap);
  }, [teams12, rawMatches12]);

  useEffect(() => {
    setMatches8(hydrateBracket8(rawMatches8, teams8));
    const tMap: Record<string, Team> = {};
    teams8.forEach(t => { tMap[t.id] = t; });
    setTeamsMap8(tMap);
  }, [teams8, rawMatches8]);

  const allMatches12 = useMemo(() => Object.values(matches12).filter(m => m.team1_id && m.team2_id), [matches12]);
  const allMatches8 = useMemo(() => Object.values(matches8).filter(m => m.team1_id && m.team2_id), [matches8]);

  const tabs: { id: FanTab; label: string; icon: React.ReactNode }[] = [
    { id: 'picks',       label: 'Predicciones', icon: <Target className="w-4 h-4" /> },
    { id: 'bracket',     label: 'Bracket',      icon: <Trophy className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Ranking',       icon: <Medal className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-black" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-700 rounded-full blur-[120px] opacity-20 animate-pulse" />
        </div>
        <div className="relative z-10">
          <nav className="flex items-center justify-between px-6 py-3 border-b border-red-900/20">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-7 h-7 text-red-500" />
              <span className="text-lg font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent tracking-wider">
                TOURNAMENT TRACKER
              </span>
              <span className="px-2 py-0.5 rounded bg-green-900/40 border border-green-800/40 text-xs font-bold text-green-400 uppercase tracking-wider">
                Fan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800">
                <Users className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-gray-400 max-w-[140px] truncate">{user?.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Salir
              </button>
            </div>
          </nav>

          <div className="px-6 py-5">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Pick'ems — Torneo en Curso</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">VALORANT Champions 2026</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-500" /> Santiago, Chile</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-red-500" /> Jun 19 – Jul 05, 2026</span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/30 border border-red-800/40">
                <Trophy className="w-3.5 h-3.5 text-red-400" /><span className="text-red-300 font-semibold">$50,000</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-md bg-green-900/30 border border-green-800/40 text-xs font-bold text-green-300 uppercase tracking-wider">Pick'ems activos</span>
              <span className="px-2.5 py-1 rounded-md bg-red-900/30 border border-red-800/40 text-xs font-bold text-red-300 uppercase tracking-wider">Doble Eliminación</span>
            </div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-gray-950 border-b border-red-900/20 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id ? 'border-red-600 text-red-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <main className="px-4 py-6 max-w-3xl mx-auto">
        {activeTab === 'picks' && (
          <PickemsDashboard
            mode={mode}
            matches={mode === '12' ? allMatches12 : allMatches8}
            teams={mode === '12' ? teamsMap12 : teamsMap8}
            onModeChange={m => { setMode(m); }}
          />
        )}

        {activeTab === 'bracket' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bracket:</span>
              <div className="flex p-1 rounded-lg bg-gray-900 border border-red-900/20">
                {(['12', '8'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === m ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {m} Equipos
                  </button>
                ))}
              </div>
            </div>
            {mode === '12' && teams12.length < 2 && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-amber-900/30 border border-amber-700/40">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-300">El bracket se publicará cuando el administrador configure los equipos.</p>
              </div>
            )}
            {mode === '12'
              ? <BracketVis matches={matches12} teams={teamsMap12} />
              : <BracketVis8 matches={matches8} teams={teamsMap8} />
            }
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard />
        )}
      </main>
    </div>
  );
}

// ── RULES ─────────────────────────────────────────────────────────────────────
function RulesSection({ mode }: { mode: TournamentMode }) {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="p-5 rounded-xl bg-gradient-to-br from-red-900/30 to-black border border-red-800/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white mb-1">Doble Eliminación</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Un equipo queda eliminado <strong className="text-white">solo después de dos derrotas</strong>.
              La bracket se divide en <strong className="text-red-400">Upper</strong> e <strong className="text-orange-400">Lower</strong>.
            </p>
          </div>
        </div>
      </div>

      {mode === '12' ? (
        <RulesCard
          title="Estructura — 12 Equipos"
          items={[
            'UPPER: Seeds 1–4 entran en Ronda 2; Seeds 5–12 juegan desde Ronda 1.',
            'MIDDLE (1ra Oportunidad): Los perdedores del bracket superior tienen una segunda chance.',
            'LOWER (Última Oportunidad): Los perdedores del Middle. Una derrota más y quedan eliminados.',
            'Gran Final Bo5: El ganador del Upper vs el ganador del Lower Final.',
          ]}
        />
      ) : (
        <RulesCard
          title="Estructura — 8 Equipos"
          items={[
            'Upper Bracket: Ronda 1 (1v8, 4v5, 2v7, 3v6) → Semis → Final Upper.',
            'Lower Bracket: Perdedores de Ronda 1, luego perdedores de Semis Upper.',
            'Lower Final: Ganador LB Ronda 3 vs Perdedor de la Final Upper.',
            'Gran Final Bo5: Ganador Upper vs Ganador Lower.',
          ]}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormatCard title="Bo3 — Mejor de 3" subtitle={mode === '12' ? '28 partidos' : '13 partidos'} description="El primer equipo en ganar 2 mapas avanza." color="gray" />
        <FormatCard title="Bo5 — Mejor de 5" subtitle={mode === '12' ? '2 partidos' : '1 partido'} description="El primero en ganar 3 mapas se lleva la victoria." color="amber" />
      </div>
    </div>
  );
}

function RulesCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-5 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-red-900/30">
      <h3 className="text-base font-bold text-red-400 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-gray-300">
            <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormatCard({ title, subtitle, description, color }: { title: string; subtitle: string; description: string; color: 'gray' | 'amber' }) {
  const isAmber = color === 'amber';
  return (
    <div className={`p-4 rounded-xl border ${isAmber ? 'bg-amber-900/30 border-amber-800/40' : 'bg-gray-900 border-gray-800'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-black ${isAmber ? 'text-amber-400' : 'text-white'}`}>{title}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${isAmber ? 'bg-amber-700 text-black' : 'bg-gray-800 text-gray-400'}`}>{subtitle}</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
