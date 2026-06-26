import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Check, X, Shuffle, Clock, Trophy, AlertCircle, Loader2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VALORANT_MAPS } from './MapBanSetup';

interface SequenceStep {
  action: 'ban' | 'pick' | 'random';
  team: 1 | 2 | null;
}

interface MapBanSession {
  id: string;
  match_label: string;
  team1_name: string;
  team2_name: string;
  team1_token: string;
  team2_token: string;
  map_pool: string[];
  format: 'bo1' | 'bo3' | 'bo5';
  sequence: SequenceStep[];
  status: 'waiting' | 'active' | 'finished';
}

interface MapBanPick {
  id: string;
  session_id: string;
  step_index: number;
  action: 'ban' | 'pick' | 'random';
  team_slot: number | null;
  map_name: string;
}

interface Props {
  sessionId: string;
  teamSlot: 1 | 2 | null; // null = observer/admin
  token?: string;
}

const MAP_IMG: Record<string, string> = Object.fromEntries(
  VALORANT_MAPS.map(m => [m.name, m.img])
);

export default function MapBanRoom({ sessionId, teamSlot, token }: Props) {
  const [session, setSession] = useState<MapBanSession | null>(null);
  const [picks, setPicks] = useState<MapBanPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [hoveredMap, setHoveredMap] = useState<string | null>(null);

  const isObserver = teamSlot === null;

  const loadSession = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('map_ban_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (err) { setError('Sesión no encontrada.'); setLoading(false); return; }
    const s = data as MapBanSession;
    // Validate token
    if (!isObserver && token) {
      const validToken = teamSlot === 1 ? s.team1_token : s.team2_token;
      if (token !== validToken) { setError('Enlace inválido o expirado.'); setLoading(false); return; }
    }
    setSession(s);
  }, [sessionId, teamSlot, token, isObserver]);

  const loadPicks = useCallback(async () => {
    const { data } = await supabase
      .from('map_ban_picks')
      .select('*')
      .eq('session_id', sessionId)
      .order('step_index');
    setPicks((data ?? []) as MapBanPick[]);
  }, [sessionId]);

  useEffect(() => {
    Promise.all([loadSession(), loadPicks()]).then(() => setLoading(false));
  }, [loadSession, loadPicks]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`mapban-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'map_ban_picks', filter: `session_id=eq.${sessionId}` }, () => {
        loadPicks();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'map_ban_sessions', filter: `id=eq.${sessionId}` }, (payload) => {
        setSession(prev => prev ? { ...prev, ...(payload.new as Partial<MapBanSession>) } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, loadPicks]);

  // Derived state
  const currentStep = picks.length;
  const sequence = session?.sequence ?? [];
  const isFinished = session?.status === 'finished' || currentStep >= sequence.length;
  const currentStepDef = !isFinished ? sequence[currentStep] : null;
  const isMyTurn = !isObserver && currentStepDef && currentStepDef.action !== 'random' && currentStepDef.team === teamSlot;
  const isRandomStep = currentStepDef?.action === 'random';

  // Map states
  const bannedMaps = picks.filter(p => p.action === 'ban' || p.action === 'random').map(p => p.map_name);
  const pickedMaps = picks.filter(p => p.action === 'pick').map(p => p.map_name);
  const usedMaps = [...bannedMaps, ...pickedMaps];
  const availableMaps = (session?.map_pool ?? []).filter(m => !usedMaps.includes(m));

  // Auto-execute random step
  const randomDoneRef = useRef(false);
  useEffect(() => {
    if (!isRandomStep || acting || availableMaps.length === 0 || randomDoneRef.current) return;
    randomDoneRef.current = true;
    const randomMap = availableMaps[Math.floor(Math.random() * availableMaps.length)];
    setTimeout(() => executeAction(randomMap, 'random', null), 1200);
  }, [isRandomStep, availableMaps, acting]);

  useEffect(() => { randomDoneRef.current = false; }, [currentStep]);

  async function executeAction(mapName: string, action: 'ban' | 'pick' | 'random', teamSlotArg: 1 | 2 | null) {
    if (!session) return;
    setActing(true);
    const nextStep = picks.length;

    const { error: err } = await supabase.from('map_ban_picks').insert({
      session_id: sessionId,
      step_index: nextStep,
      action,
      team_slot: teamSlotArg,
      map_name: mapName,
    });

    if (!err) {
      const newPicks = [...picks, { id: '', session_id: sessionId, step_index: nextStep, action, team_slot: teamSlotArg, map_name: mapName }];
      const isNowFinished = newPicks.length >= sequence.length;
      if (isNowFinished) {
        await supabase.from('map_ban_sessions').update({ status: 'finished' }).eq('id', sessionId);
        setSession(prev => prev ? { ...prev, status: 'finished' } : prev);
      } else if (session.status === 'waiting') {
        await supabase.from('map_ban_sessions').update({ status: 'active' }).eq('id', sessionId);
        setSession(prev => prev ? { ...prev, status: 'active' } : prev);
      }
      await loadPicks();
    }

    setActing(false);
  }

  function handleMapClick(mapName: string) {
    if (!isMyTurn || acting || !currentStepDef) return;
    executeAction(mapName, currentStepDef.action, teamSlot);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-white font-bold text-lg">{error ?? 'Sesión no encontrada'}</p>
        </div>
      </div>
    );
  }

  const team1Name = session.team1_name;
  const team2Name = session.team2_name;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* HEADER */}
      <header className="bg-gradient-to-b from-[#12121a] to-[#0a0a0f] border-b border-white/5 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{session.format.toUpperCase()} · VALORANT</p>
              <p className="text-sm font-black text-white leading-tight">{session.match_label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isObserver && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs font-bold text-gray-400">
                <Eye className="w-3.5 h-3.5" /> Observador
              </span>
            )}
            {!isObserver && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${teamSlot === 1 ? 'bg-blue-900/30 border-blue-700/40 text-blue-300' : 'bg-red-900/30 border-red-700/40 text-red-300'}`}>
                {teamSlot === 1 ? team1Name : team2Name}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Teams + Status Banner */}
        <div className="rounded-2xl bg-[#12121a] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-3 items-center">
            <TeamPanel name={team1Name} slot={1} isYou={teamSlot === 1} picks={picks} seq={sequence} />
            <StatusBanner
              isFinished={isFinished}
              isRandomStep={!!isRandomStep}
              isMyTurn={!!isMyTurn}
              currentStepDef={currentStepDef}
              team1Name={team1Name}
              team2Name={team2Name}
              teamSlot={teamSlot}
              acting={acting}
            />
            <TeamPanel name={team2Name} slot={2} isYou={teamSlot === 2} picks={picks} seq={sequence} />
          </div>
        </div>

        {/* Sequence progress */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {sequence.map((step, i) => {
            const done = picks[i];
            const isCurrent = i === currentStep && !isFinished;
            return (
              <div
                key={i}
                className={`relative flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black border transition-all ${
                  done
                    ? done.action === 'ban' || done.action === 'random'
                      ? 'bg-red-900/40 border-red-800/50 text-red-300'
                      : 'bg-green-900/40 border-green-800/50 text-green-300'
                    : isCurrent
                      ? 'bg-white/10 border-white/30 text-white scale-110 shadow-lg shadow-white/5'
                      : 'bg-gray-900/50 border-gray-800 text-gray-600'
                }`}
                title={done ? `${done.map_name} (${done.action})` : step.action === 'random' ? 'Decider' : `T${step.team} ${step.action}`}
              >
                {done
                  ? done.action === 'ban' || done.action === 'random' ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />
                  : step.action === 'random' ? <Shuffle className="w-3 h-3" />
                  : step.action === 'ban' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />
                }
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Map Grid */}
        <div>
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
            {isFinished ? 'Resultado Final' : 'Pool de Mapas'}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {(session.map_pool).map(mapName => {
              const pickRecord = picks.find(p => p.map_name === mapName);
              const isBanned = pickRecord && (pickRecord.action === 'ban' || pickRecord.action === 'random');
              const isPicked = pickRecord?.action === 'pick';
              const isAvailable = !pickRecord;
              const canClick = isAvailable && !!isMyTurn && !acting;
              const isHovered = hoveredMap === mapName && canClick;

              return (
                <button
                  key={mapName}
                  disabled={!canClick}
                  onClick={() => handleMapClick(mapName)}
                  onMouseEnter={() => setHoveredMap(mapName)}
                  onMouseLeave={() => setHoveredMap(null)}
                  className={`relative rounded-xl overflow-hidden aspect-[16/9] border-2 transition-all duration-200 ${
                    isBanned
                      ? 'border-red-900/50 opacity-25 grayscale'
                      : isPicked
                        ? 'border-green-500/60 scale-[1.02] shadow-lg shadow-green-900/20'
                        : canClick
                          ? 'border-white/20 hover:border-red-400 hover:scale-[1.03] cursor-pointer'
                          : 'border-white/5 cursor-default'
                  } ${isHovered ? 'border-red-400' : ''}`}
                >
                  <img
                    src={MAP_IMG[mapName] ?? ''}
                    alt={mapName}
                    className={`w-full h-full object-cover transition-all duration-200 ${isBanned ? 'grayscale' : ''}`}
                  />

                  {/* Overlay */}
                  <div className={`absolute inset-0 transition-all ${
                    isBanned ? 'bg-black/70' :
                    isPicked ? 'bg-green-900/25' :
                    isHovered ? 'bg-red-900/40' :
                    'bg-black/30'
                  }`} />

                  {/* Map name */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-4 pb-1.5 px-2">
                    <p className="text-white text-xs font-black text-center tracking-wide">{mapName}</p>
                  </div>

                  {/* Status badge */}
                  {isBanned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <X className="w-8 h-8 text-red-400 drop-shadow-lg" />
                        <span className="text-xs font-black text-red-300 uppercase bg-black/60 px-2 py-0.5 rounded">
                          {pickRecord?.action === 'random' ? 'Decider' : `BAN · ${pickRecord?.team_slot === 1 ? team1Name : team2Name}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {isPicked && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className="flex items-center gap-1 bg-green-600/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <Check className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-black text-white">
                          {pickRecord?.team_slot === 1 ? team1Name : team2Name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action hint on hover */}
                  {canClick && isHovered && currentStepDef && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm font-black text-sm ${
                        currentStepDef.action === 'ban' ? 'bg-red-600/90 text-white' : 'bg-green-600/90 text-white'
                      }`}>
                        {currentStepDef.action === 'ban'
                          ? <><X className="w-4 h-4" /> BANEAR</>
                          : <><Check className="w-4 h-4" /> ELEGIR</>
                        }
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Final picks summary */}
        {isFinished && pickedMaps.length > 0 && (
          <div className="rounded-2xl bg-[#12121a] border border-green-800/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Mapas del Partido</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {picks.filter(p => p.action === 'pick').map((p, i) => (
                <div key={p.id || i} className="relative rounded-xl overflow-hidden aspect-video border border-green-700/30">
                  <img src={MAP_IMG[p.map_name] ?? ''} alt={p.map_name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 px-2 py-2">
                    <p className="text-xs font-black text-white">Mapa {i + 1}: {p.map_name}</p>
                    <p className="text-xs text-gray-400">Elegido por {p.team_slot === 1 ? team1Name : team2Name}</p>
                  </div>
                  <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-amber-500/90 flex items-center justify-center">
                    <span className="text-xs font-black text-black">{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────────

function TeamPanel({ name, slot, isYou, picks, seq }: {
  name: string; slot: 1 | 2; isYou: boolean;
  picks: MapBanPick[]; seq: SequenceStep[];
}) {
  const bans = picks.filter(p => (p.action === 'ban' || p.action === 'random') && p.team_slot === slot).length;
  const picksCount = picks.filter(p => p.action === 'pick' && p.team_slot === slot).length;
  const color = slot === 1 ? 'text-blue-300' : 'text-red-300';
  const bg = slot === 1 ? 'from-blue-900/20' : 'from-red-900/20';

  return (
    <div className={`bg-gradient-to-b ${bg} to-transparent p-4 text-${slot === 1 ? 'left' : 'right'}`}>
      <p className={`text-sm font-black ${color} truncate`}>{name}</p>
      {isYou && <p className="text-xs text-gray-600 font-semibold">(tú)</p>}
      <div className="flex gap-3 mt-2 justify-${slot === 1 ? 'start' : 'end'}">
        <span className="text-xs text-red-400"><X className="w-3 h-3 inline" /> {bans}</span>
        <span className="text-xs text-green-400"><Check className="w-3 h-3 inline" /> {picksCount}</span>
      </div>
    </div>
  );
}

function StatusBanner({ isFinished, isRandomStep, isMyTurn, currentStepDef, team1Name, team2Name, teamSlot, acting }: {
  isFinished: boolean;
  isRandomStep: boolean;
  isMyTurn: boolean;
  currentStepDef: SequenceStep | null;
  team1Name: string;
  team2Name: string;
  teamSlot: 1 | 2 | null;
  acting: boolean;
}) {
  if (isFinished) return (
    <div className="text-center py-4">
      <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-1" />
      <p className="text-sm font-black text-white">BAN/PICK LISTO</p>
      <p className="text-xs text-gray-500">HF&GL</p>
    </div>
  );

  if (isRandomStep) return (
    <div className="text-center py-4">
      <Shuffle className="w-7 h-7 text-gray-400 mx-auto mb-1 animate-spin" style={{ animationDuration: '1s' }} />
      <p className="text-xs font-black text-gray-300 uppercase tracking-wider">Seleccionando decider...</p>
    </div>
  );

  if (!currentStepDef) return null;

  const actingTeam = currentStepDef.team === 1 ? team1Name : team2Name;
  const isWaiting = !isMyTurn && teamSlot !== null;
  const isBan = currentStepDef.action === 'ban';

  return (
    <div className="text-center py-4 px-2">
      {acting ? (
        <div className="flex flex-col items-center gap-1">
          <span className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Procesando...</p>
        </div>
      ) : isMyTurn ? (
        <div className="space-y-1">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${isBan ? 'bg-red-600/20 border border-red-600/40 text-red-300' : 'bg-green-600/20 border border-green-600/40 text-green-300'}`}>
            {isBan ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {isBan ? 'TU TURNO DE BANEAR' : 'TU TURNO DE ELEGIR'}
          </div>
          <p className="text-[10px] text-gray-600">Haz click en un mapa</p>
        </div>
      ) : isWaiting ? (
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold">Esperando...</span>
          </div>
          <p className="text-[10px] text-gray-600">
            {actingTeam} debe {isBan ? 'banear' : 'elegir'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-black text-white">{actingTeam}</p>
          <p className={`text-[10px] font-bold uppercase ${isBan ? 'text-red-400' : 'text-green-400'}`}>
            {isBan ? 'debe banear' : 'debe elegir'}
          </p>
        </div>
      )}
    </div>
  );
}
