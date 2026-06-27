import { useState } from 'react';
import { Plus, Trash2, Link2, Play, ChevronDown, ChevronUp, Check, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const VALORANT_MAPS = [
  { name: 'Abyss',    img: 'https://www.mapban.gg/images/maps/valorant/abyss.jpg' },
  { name: 'Ascent',   img: 'https://www.mapban.gg/images/maps/valorant/ascent.jpg' },
  { name: 'Bind',     img: 'https://www.mapban.gg/images/maps/valorant/bind.jpg' },
  { name: 'Breeze',   img: 'https://www.mapban.gg/images/maps/valorant/breeze.jpg' },
  { name: 'Corrode',  img: 'https://www.mapban.gg/images/maps/valorant/corrode.jpg' },
  { name: 'Fracture', img: 'https://www.mapban.gg/images/maps/valorant/fracture.jpg' },
  { name: 'Haven',    img: 'https://www.mapban.gg/images/maps/valorant/haven.jpg' },
  { name: 'Icebox',   img: 'https://www.mapban.gg/images/maps/valorant/icebox.jpg' },
  { name: 'Lotus',    img: 'https://www.mapban.gg/images/maps/valorant/lotus.jpg' },
  { name: 'Pearl',    img: 'https://www.mapban.gg/images/maps/valorant/perl.jpg' },
  { name: 'Split',    img: 'https://www.mapban.gg/images/maps/valorant/split.jpg' },
  { name: 'Sunset',   img: 'https://www.mapban.gg/images/maps/valorant/sunset.jpg' },
];

// Standard sequences per format
// Each step: { action: 'ban'|'pick'|'random', team: 1|2|null }
// 'random' = system randomly removes leftover (decider)
const SEQUENCES: Record<string, { action: 'ban' | 'pick' | 'random'; team: 1 | 2 | null }[]> = {
  bo1: [
    { action: 'ban', team: 1 }, { action: 'ban', team: 2 },
    { action: 'ban', team: 1 }, { action: 'ban', team: 2 },
    { action: 'ban', team: 1 }, { action: 'ban', team: 2 },
    { action: 'random', team: null },
  ],
  bo3: [
    { action: 'ban', team: 1 }, { action: 'ban', team: 2 },
    { action: 'pick', team: 1 }, { action: 'pick', team: 2 },
    { action: 'ban', team: 1 }, { action: 'ban', team: 2 },
    { action: 'random', team: null },
  ],
  bo5: [
    { action: 'ban', team: 1 }, { action: 'ban', team: 2 },
    { action: 'pick', team: 1 }, { action: 'pick', team: 2 },
    { action: 'pick', team: 1 }, { action: 'pick', team: 2 },
    { action: 'random', team: null },
  ],
};

interface CreatedSession {
  id: string;
  team1_token: string;
  team2_token: string;
  team1_name: string;
  team2_name: string;
}

interface Props {
  onSessionCreated?: (id: string) => void;
}

export default function MapBanSetup({ onSessionCreated }: Props) {
  const { user } = useAuth();
  const [matchLabel, setMatchLabel] = useState('');
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [format, setFormat] = useState<'bo1' | 'bo3' | 'bo5'>('bo3');
  const [selectedMaps, setSelectedMaps] = useState<string[]>([
    'Abyss', 'Ascent', 'Bind', 'Breeze', 'Haven', 'Icebox', 'Split',
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedSession | null>(null);
  const [copied, setCopied] = useState<'team1' | 'team2' | 'admin' | null>(null);

  function toggleMap(name: string) {
    setSelectedMaps(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  }

  const minMaps = { bo1: 7, bo3: 7, bo5: 7 }[format];

  async function handleCreate() {
    if (!team1Name.trim() || !team2Name.trim()) { setError('Ingresa el nombre de ambos equipos.'); return; }
    if (selectedMaps.length < minMaps) { setError(`Selecciona al menos ${minMaps} mapas para el formato ${format.toUpperCase()}.`); return; }
    setError(null);
    setLoading(true);

    const sequence = SEQUENCES[format];
    const { data, error: err } = await supabase
      .from('map_ban_sessions')
      .insert({
        match_label: matchLabel.trim() || `${team1Name} vs ${team2Name}`,
        team1_name: team1Name.trim(),
        team2_name: team2Name.trim(),
        map_pool: selectedMaps,
        format,
        sequence,
        status: 'waiting',
        created_by: user?.id ?? null,
      })
      .select('id, team1_token, team2_token, team1_name, team2_name')
      .single();

    setLoading(false);
    if (err) { setError(err.message); return; }
    setCreated(data as CreatedSession);
    if (onSessionCreated) onSessionCreated((data as CreatedSession).id);
  }

  function buildUrl(sessionId: string, slot: '1' | '2', token: string) {
    return `${window.location.origin}?mapban=${sessionId}&team=${slot}&token=${token}`;
  }

  function buildAdminUrl(sessionId: string) {
    return `${window.location.origin}?mapban=${sessionId}&admin=1`;
  }

  async function copyLink(text: string, key: 'team1' | 'team2' | 'admin') {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (created) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/40">
          <div className="flex items-center gap-2 mb-1">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-bold">Sesión creada exitosamente</span>
          </div>
          <p className="text-sm text-green-400/70">{created.team1_name} vs {created.team2_name} · Formato {format.toUpperCase()}</p>
        </div>

        <div className="space-y-3">
          {[
            { label: `Enlace para ${created.team1_name}`, url: buildUrl(created.id, '1', created.team1_token), key: 'team1' as const, color: 'blue' },
            { label: `Enlace para ${created.team2_name}`, url: buildUrl(created.id, '2', created.team2_token), key: 'team2' as const, color: 'red' },
            { label: 'Enlace de observador (admin)', url: buildAdminUrl(created.id), key: 'admin' as const, color: 'gray' },
          ].map(({ label, url, key, color }) => (
            <div key={key} className={`p-3 rounded-xl border ${color === 'blue' ? 'bg-blue-900/20 border-blue-800/30' : color === 'red' ? 'bg-red-900/20 border-red-800/30' : 'bg-gray-900 border-gray-700'}`}>
              <p className="text-xs font-bold text-gray-400 mb-2">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-gray-300 bg-black/40 rounded px-2 py-1.5 truncate">{url}</code>
                <button
                  onClick={() => copyLink(url, key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                    copied === key ? 'bg-green-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {copied === key ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Link2 className="w-3.5 h-3.5" /> Copiar</>}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-600 text-center">
          Envía el enlace correspondiente a cada equipo. El admin puede observar sin participar.
        </p>

        <button
          onClick={() => { setCreated(null); setTeam1Name(''); setTeam2Name(''); setMatchLabel(''); }}
          className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors"
        >
          Crear otra sesión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Teams */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Etiqueta del partido (opcional)</label>
        <input
          value={matchLabel}
          onChange={e => setMatchLabel(e.target.value)}
          placeholder="Ej: Semifinal Upper Bracket"
          className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-600 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Equipo 1', value: team1Name, set: setTeam1Name, color: 'border-blue-800/50 focus:border-blue-500' },
          { label: 'Equipo 2', value: team2Name, set: setTeam2Name, color: 'border-red-800/50 focus:border-red-500' },
        ].map(({ label, value, set, color }) => (
          <div key={label}>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={label}
              className={`w-full px-3 py-2.5 rounded-lg bg-gray-900 border text-white placeholder-gray-600 text-sm focus:outline-none transition-colors ${color}`}
            />
          </div>
        ))}
      </div>

      {/* Format */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Formato</label>
        <div className="grid grid-cols-3 gap-2">
          {(['bo1', 'bo3', 'bo5'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${
                format === f ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-1.5">{SEQUENCE_DESC[format]}</p>
      </div>

      {/* Map pool */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Pool de Mapas <span className="text-gray-600 font-normal normal-case">({selectedMaps.length} seleccionados, mín {minMaps})</span>
          </label>
          <div className="flex gap-2">
            <button onClick={() => setSelectedMaps(VALORANT_MAPS.map(m => m.name))} className="text-xs text-gray-500 hover:text-white transition-colors">Todo</button>
            <span className="text-gray-700">·</span>
            <button onClick={() => setSelectedMaps([])} className="text-xs text-gray-500 hover:text-white transition-colors">Limpiar</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {VALORANT_MAPS.map(map => {
            const sel = selectedMaps.includes(map.name);
            return (
              <button
                key={map.name}
                onClick={() => toggleMap(map.name)}
                className={`relative rounded-lg overflow-hidden aspect-[4/3] border-2 transition-all ${sel ? 'border-red-500 scale-[1.02]' : 'border-transparent opacity-50 hover:opacity-75'}`}
              >
                <img src={map.img} alt={map.name} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 transition-colors ${sel ? 'bg-red-900/30' : 'bg-black/30'}`} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pt-3 pb-1 px-1">
                  <p className="text-white text-[10px] font-bold text-center">{map.name}</p>
                </div>
                {sel && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sequence preview */}
      <SequencePreview format={format} />

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-sm tracking-wider transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
      >
        {loading
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><Play className="w-4 h-4" /> Crear Sesión de Ban/Pick</>
        }
      </button>
    </div>
  );
}

const SEQUENCE_DESC: Record<string, string> = {
  bo1: 'Ban Ban Ban Ban Ban Ban — Aleatorio (decider)',
  bo3: 'Ban Ban — Pick Pick — Ban Ban — Aleatorio (decider)',
  bo5: 'Ban Ban — Pick Pick Pick Pick — Aleatorio (decider)',
};

function SequencePreview({ format }: { format: 'bo1' | 'bo3' | 'bo5' }) {
  const [open, setOpen] = useState(false);
  const seq = SEQUENCES[format];
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
      >
        <span>Ver secuencia de {format.toUpperCase()}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {seq.map((step, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                step.action === 'ban' ? 'bg-red-900/50 text-red-300 border border-red-800/40' :
                step.action === 'pick' ? 'bg-green-900/50 text-green-300 border border-green-800/40' :
                'bg-gray-700 text-gray-300 border border-gray-600'
              }`}
            >
              {step.action === 'random' ? '? Decider' : `T${step.team} ${step.action === 'ban' ? 'BAN' : 'PICK'}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { VALORANT_MAPS, SEQUENCES };
