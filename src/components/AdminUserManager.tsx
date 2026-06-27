import { useState, useEffect, useCallback } from 'react';
import { Shield, User, UserCheck, UserX, RefreshCw, AlertCircle, ChevronDown, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserRoleRow {
  id: string;
  user_id: string;
  role: 'admin' | 'team_captain' | 'fan';
  tournament_mode: '12' | '8' | null;
  team_id: string | null;
  team_id8: string | null;
  created_at: string;
  email?: string;
}

export default function AdminUserManager() {
  const [rows, setRows] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at');
    if (err) { setError(err.message); setLoading(false); return; }
    setRows((data as UserRoleRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  async function updateRole(id: string, patch: Partial<UserRoleRow>) {
    setSaving(id);
    const { error: err } = await supabase.from('user_roles').update(patch).eq('id', id);
    setSaving(null);
    if (err) { setError(err.message); return; }
    setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  async function deleteRole(id: string) {
    if (!confirm('¿Eliminar este rol de usuario? El usuario perderá acceso al panel.')) return;
    setSaving(id);
    const { error: err } = await supabase.from('user_roles').delete().eq('id', id);
    setSaving(null);
    if (err) { setError(err.message); return; }
    setRows(rs => rs.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-black text-white">Gestión de Usuarios</h3>
        </div>
        <button
          onClick={loadRoles}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-gray-600">
          <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay usuarios registrados aún.</p>
          <p className="text-xs mt-1">Los usuarios aparecen aquí luego de crear su cuenta.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <div
              key={row.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-red-900/40 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                {row.role === 'admin'
                  ? <Shield className="w-4 h-4 text-red-400" />
                  : row.role === 'fan'
                    ? <Users className="w-4 h-4 text-green-400" />
                    : <UserCheck className="w-4 h-4 text-blue-400" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-gray-400 truncate">{row.user_id}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Registrado: {new Date(row.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>

              {/* Role */}
              <div className="relative">
                <select
                  value={row.role}
                  onChange={e => updateRole(row.id, { role: e.target.value as 'admin' | 'team_captain' | 'fan' })}
                  disabled={saving === row.id}
                  className="appearance-none pl-2 pr-6 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs font-semibold focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="team_captain">Capitán</option>
                  <option value="fan">Fan</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>

              {/* Mode */}
              {row.role === 'team_captain' && (
                <div className="relative">
                  <select
                    value={row.tournament_mode ?? ''}
                    onChange={e => updateRole(row.id, { tournament_mode: (e.target.value || null) as '12' | '8' | null })}
                    disabled={saving === row.id}
                    className="appearance-none pl-2 pr-6 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs font-semibold focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                  >
                    <option value="">Sin modo</option>
                    <option value="12">12 equipos</option>
                    <option value="8">8 equipos</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                </div>
              )}

              <button
                onClick={() => deleteRole(row.id)}
                disabled={saving === row.id}
                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
                title="Eliminar rol"
              >
                {saving === row.id
                  ? <span className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin block" />
                  : <UserX className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
        <p className="text-xs text-gray-600">
          <strong className="text-gray-500">Nota:</strong> cuando un usuario se registra, su cuenta queda pendiente hasta que un administrador le asigne el rol de <em>Admin</em> o <em>Capitán</em> aquí. Sin rol asignado, el usuario verá una pantalla de espera.
        </p>
      </div>
    </div>
  );
}
