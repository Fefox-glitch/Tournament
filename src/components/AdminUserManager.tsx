import { useState, useEffect, useCallback } from 'react';
import { Shield, User, UserCheck, UserX, RefreshCw, AlertCircle, ChevronDown, Users, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserRoleRow {
  id: string;
  user_id: string;
  nickname?: string | null;
  role: 'admin' | 'team_captain' | 'fan';
  tournament_mode: '12' | '8' | null;
  team_id: string | null;
  team_id8: string | null;
  created_at: string;
  email?: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminUserManager() {
  const [rows, setRows] = useState<UserRoleRow[]>([]);
  const [allAuthUsers, setAllAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'team_captain' | 'fan'>('fan');
  const [newMode, setNewMode] = useState<'12' | '8' | null>(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Versión simple: solo cargar roles (sin correos) para probar
      const { data, error: err } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at');
      if (err) throw err;
      setRows((data as UserRoleRow[]) ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  async function addRole() {
    if (!newUserId.trim()) {
      setError('Por favor ingresa el ID del usuario');
      return;
    }
    setSaving('new');
    try {
      const { data, error: err } = await supabase.from('user_roles').insert({
        user_id: newUserId.trim(),
        nickname: newNickname.trim() || null,
        role: newRole,
        tournament_mode: newMode,
        team_id: null,
        team_id8: null
      }).select('*').single();
      if (err) throw err;
      setRows([data as UserRoleRow, ...rows]);
      setAddingUser(false);
      setNewUserId('');
      setNewNickname('');
      setNewRole('fan');
      setNewMode(null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-black text-white">Gestión de Usuarios</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddingUser(!addingUser)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> {addingUser ? 'Cancelar' : 'Agregar Usuario'}
          </button>
          <button
            onClick={loadRoles}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      {addingUser && (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <h4 className="text-sm font-bold text-white mb-3">Agregar nuevo rol de usuario</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">User ID</label>
              <input
                type="text"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-600"
                placeholder="Ingresa el UUID del usuario"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nickname</label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-600"
                placeholder="Ingresa el nickname"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Rol</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-600"
              >
                <option value="admin">Admin</option>
                <option value="team_captain">Capitán</option>
                <option value="fan">Fan</option>
              </select>
            </div>
            {newRole === 'team_captain' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Modo Torneo</label>
                <select
                  value={newMode ?? ''}
                  onChange={(e) => setNewMode(e.target.value ? (e.target.value as '12' | '8') : null)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="">Sin modo</option>
                  <option value="12">12 equipos</option>
                  <option value="8">8 equipos</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={addRole}
              disabled={saving === 'new'}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving === 'new' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2"></span> : null}
              Guardar
            </button>
          </div>
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
                <input
                  type="text"
                  value={row.nickname || ''}
                  onChange={(e) => updateRole(row.id, { nickname: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-transparent text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-red-600"
                  placeholder="Nickname"
                />
                <p className="text-xs font-mono text-gray-500 truncate mt-1">{row.user_id}</p>
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
