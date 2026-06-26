import { useState } from 'react';
import { Plus, Trash2, CreditCard as Edit3, Check, X, Users, Flag } from 'lucide-react';
import { Team } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  teams: Team[];
  onTeamsChange: () => void;
}

const REGIONS = ['NA', 'EMEA', 'APAC', 'KR', 'BR', 'LATAM', 'CN', 'JP'];
const emptyTeam = (): Omit<Team, 'id'> => ({ name: '', logo_url: '', region: 'NA', seed: null, color: '#dc2626' });

export default function TeamsAdmin8({ teams, onTeamsChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<Team, 'id'>>(emptyTeam());
  const [editDraft, setEditDraft] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedTeams = [...teams].sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99));

  async function saveNew() {
    if (!draft.name.trim()) { setError('El nombre del equipo es requerido.'); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from('teams8').insert({
      name: draft.name.trim(), logo_url: draft.logo_url.trim(),
      region: draft.region, seed: draft.seed, color: draft.color,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setAdding(false); setDraft(emptyTeam()); onTeamsChange();
  }

  async function saveEdit() {
    if (!editDraft?.name.trim()) { setError('El nombre del equipo es requerido.'); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from('teams8').update({
      name: editDraft.name.trim(), logo_url: editDraft.logo_url.trim(),
      region: editDraft.region, seed: editDraft.seed, color: editDraft.color,
    }).eq('id', editDraft.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditing(null); setEditDraft(null); onTeamsChange();
  }

  async function deleteTeam(id: string) {
    if (!confirm('¿Eliminar este equipo?')) return;
    const { error: err } = await supabase.from('teams8').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    onTeamsChange();
  }

  const TeamForm = ({
    value, onChange, onSave, onCancel,
  }: {
    value: Omit<Team, 'id'>; onChange: (v: Omit<Team, 'id'>) => void;
    onSave: () => void; onCancel: () => void;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-950 border border-red-900/40">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Nombre del equipo *</label>
        <input className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-white text-sm focus:outline-none focus:border-red-600"
          placeholder="ej. Team Liquid" value={value.name}
          onChange={e => onChange({ ...value, name: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">URL del Logo</label>
        <input className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-white text-sm focus:outline-none focus:border-red-600"
          placeholder="https://..." value={value.logo_url}
          onChange={e => onChange({ ...value, logo_url: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Región</label>
        <select className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-white text-sm focus:outline-none focus:border-red-600"
          value={value.region} onChange={e => onChange({ ...value, region: e.target.value })}>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Seed (1–8)</label>
        <input type="number" min={1} max={8}
          className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-white text-sm focus:outline-none focus:border-red-600"
          placeholder="ej. 1" value={value.seed ?? ''}
          onChange={e => onChange({ ...value, seed: e.target.value ? Number(e.target.value) : null })} />
      </div>
      <div className="sm:col-span-2 flex items-center justify-between gap-3">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2 ml-auto">
          <button onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-60">
            <Check className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Equipos — Torneo 8</h2>
            <p className="text-sm text-gray-500">{teams.length}/8 equipos registrados</p>
          </div>
        </div>
        {!adding && (
          <button onClick={() => { setAdding(true); setEditing(null); setError(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
            <Plus className="w-4 h-4" /> Agregar Equipo
          </button>
        )}
      </div>

      <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-900/30 flex items-start gap-2">
        <Flag className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          Asigna seeds 1–8. Matchups: 1v8, 4v5, 2v7, 3v6 en Ronda 1.
        </p>
      </div>

      {adding && (
        <div className="mb-4">
          <TeamForm value={draft} onChange={setDraft} onSave={saveNew}
            onCancel={() => { setAdding(false); setDraft(emptyTeam()); setError(null); }} />
        </div>
      )}

      <div className="space-y-2">
        {sortedTeams.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Sin equipos. Agrega hasta 8 equipos para poblar el bracket.</p>
          </div>
        )}

        {sortedTeams.map(team => (
          <div key={team.id}>
            {editing === team.id && editDraft ? (
              <TeamForm value={editDraft} onChange={v => setEditDraft({ ...editDraft, ...v })}
                onSave={saveEdit} onCancel={() => { setEditing(null); setEditDraft(null); setError(null); }} />
            ) : (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-gray-950 to-black border border-gray-800/60 hover:border-red-900/50 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{team.seed ?? '?'}</span>
                </div>
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name}
                    className="w-8 h-8 rounded object-contain bg-gray-900 flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{team.name[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{team.name}</div>
                  <div className="text-xs text-gray-500">{team.region}</div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(team.id); setEditDraft({ ...team }); setAdding(false); }}
                    className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteTeam(team.id)}
                    className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-700 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {teams.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gray-950 border border-gray-800">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cobertura de Seeds</p>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 8 }, (_, i) => i + 1).map(seed => {
              const assigned = teams.find(t => t.seed === seed);
              return (
                <div key={seed}
                  title={assigned ? assigned.name : `Seed ${seed} — vacío`}
                  className={`h-8 rounded flex items-center justify-center text-xs font-bold transition-colors
                    ${assigned ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-600'}`}
                >
                  {seed}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
