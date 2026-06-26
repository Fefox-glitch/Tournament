import { useState, useEffect } from 'react';
import { Users, Save, AlertCircle, CheckCircle, Flag, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Team } from '../types';

const REGIONS = ['NA', 'EMEA', 'APAC', 'KR', 'BR', 'LATAM', 'CN', 'JP'];

interface Props {
  tournamentMode: '12' | '8';
  onRegistered: () => void;
}

export default function TeamRegistration({ tournamentMode, onRegistered }: Props) {
  const { user, userRole, refreshRole } = useAuth();
  const table = tournamentMode === '12' ? 'teams' : 'teams8';

  const [existingTeam, setExistingTeam] = useState<Team | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    region: 'NA',
    color: '#dc2626',
  });

  useEffect(() => {
    const teamId = tournamentMode === '12' ? userRole?.team_id : userRole?.team_id8;
    if (!teamId) { setLoadingTeam(false); return; }

    supabase
      .from(table)
      .select('*')
      .eq('id', teamId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const t = data as Team;
          setExistingTeam(t);
          setForm({ name: t.name, logo_url: t.logo_url ?? '', region: t.region ?? 'NA', color: t.color ?? '#dc2626' });
        }
        setLoadingTeam(false);
      });
  }, [userRole, table, tournamentMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.name.trim()) { setError('El nombre del equipo es requerido.'); return; }
    setSaving(true);

    try {
      if (existingTeam) {
        const { error: err } = await supabase
          .from(table)
          .update({ name: form.name.trim(), logo_url: form.logo_url.trim(), region: form.region, color: form.color })
          .eq('id', existingTeam.id);
        if (err) throw err;
        setSuccess('Equipo actualizado correctamente.');
        setExistingTeam({ ...existingTeam, ...form, name: form.name.trim() });
      } else {
        const { data: inserted, error: err } = await supabase
          .from(table)
          .insert({ name: form.name.trim(), logo_url: form.logo_url.trim(), region: form.region, color: form.color })
          .select('id')
          .single();
        if (err) throw err;

        const roleField = tournamentMode === '12' ? 'team_id' : 'team_id8';
        const { error: roleErr } = await supabase
          .from('user_roles')
          .update({ [roleField]: inserted.id })
          .eq('user_id', user!.id);
        if (roleErr) throw roleErr;

        await refreshRole();
        setSuccess('¡Equipo registrado exitosamente!');
        onRegistered();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el equipo.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingTeam) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">
            {existingTeam ? 'Editar Equipo' : 'Registrar Equipo'}
          </h2>
          <p className="text-xs text-gray-500">
            Torneo {tournamentMode} equipos · {existingTeam ? `Seed ${existingTeam.seed ?? 'sin asignar'}` : 'Nuevo registro'}
          </p>
        </div>
      </div>

      {existingTeam && (
        <div className="mb-5 p-4 rounded-xl bg-green-900/20 border border-green-700/30 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-300">Equipo registrado</p>
            <p className="text-xs text-green-500 mt-0.5">
              Seed asignado por el administrador: <strong>{existingTeam.seed ?? 'pendiente'}</strong>
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-green-900/30 border border-green-700/40 text-green-300 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-5 rounded-xl bg-gray-950 border border-red-900/20">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Nombre del equipo *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Sentinels"
                maxLength={60}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                URL del logo
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
                {form.logo_url && (
                  <div className="w-10 h-10 rounded-lg border border-gray-700 overflow-hidden flex-shrink-0 bg-gray-900">
                    <img src={form.logo_url} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>

            {/* Region + Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Flag className="inline w-3 h-3 mr-1" /> Región
                </label>
                <select
                  value={form.region}
                  onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-600 transition-colors"
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Color del equipo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-700 bg-gray-900 cursor-pointer p-0.5"
                  />
                  <span className="text-sm font-mono text-gray-400">{form.color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save className="w-4 h-4" /> {existingTeam ? 'Guardar cambios' : 'Registrar equipo'}</>
          )}
        </button>
      </form>

      {existingTeam && (
        <div className="mt-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Ve al <strong className="text-gray-400">Bracket</strong> para seguir el progreso del torneo en tiempo real.
          </p>
        </div>
      )}
    </div>
  );
}
