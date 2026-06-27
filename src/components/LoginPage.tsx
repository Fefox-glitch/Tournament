import { useState } from 'react';
import { Gamepad2, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, Users, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register_fan' | 'register_staff';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim() || !password.trim()) { setError('Completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        const err = await signIn(email, password);
        if (err) setError(translateError(err));
      } else if (mode === 'register_fan') {
        const err = await signUp(email, password, true);
        if (err) { setError(translateError(err)); }
        else { setSuccess('¡Cuenta creada! Ahora puedes iniciar sesion como fan.'); setMode('login'); setPassword(''); }
      } else {
        const err = await signUp(email, password, false);
        if (err) { setError(translateError(err)); }
        else { setSuccess('Cuenta creada. Un administrador asignará tu rol antes de que puedas acceder.'); setMode('login'); setPassword(''); }
      }
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode !== 'login';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-700 rounded-full blur-[160px] opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-red-900 rounded-full blur-[120px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 border border-red-600/30 mb-4">
            <Gamepad2 className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            TOURNAMENT TRACKER
          </h1>
          <p className="text-gray-500 text-sm mt-1">VALORANT Champions 2026</p>
        </div>

        <div className="bg-gray-950 border border-red-900/30 rounded-2xl p-6 shadow-2xl shadow-red-950/20">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-gray-900 p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'login' ? 'bg-red-600 text-white shadow shadow-red-900/50' : 'text-gray-400 hover:text-white'}`}
            >
              <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión
            </button>
            <button
              onClick={() => { setMode('register_fan'); setError(null); setSuccess(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'register_fan' ? 'bg-red-600 text-white shadow shadow-red-900/50' : 'text-gray-400 hover:text-white'}`}
            >
              <Users className="w-3.5 h-3.5" /> Fan
            </button>
            <button
              onClick={() => { setMode('register_staff'); setError(null); setSuccess(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'register_staff' ? 'bg-red-600 text-white shadow shadow-red-900/50' : 'text-gray-400 hover:text-white'}`}
            >
              <Shield className="w-3.5 h-3.5" /> Equipo
            </button>
          </div>

          {/* Register type explanation */}
          {mode === 'register_fan' && (
            <div className="mb-4 p-3 rounded-lg bg-blue-900/20 border border-blue-800/30">
              <p className="text-xs text-blue-300 font-semibold mb-0.5">Registro de Fan</p>
              <p className="text-xs text-blue-400/70">Podrás hacer predicciones de partidos y competir en el ranking. Acceso inmediato.</p>
            </div>
          )}
          {mode === 'register_staff' && (
            <div className="mb-4 p-3 rounded-lg bg-amber-900/20 border border-amber-800/30">
              <p className="text-xs text-amber-300 font-semibold mb-0.5">Registro de Equipo / Staff</p>
              <p className="text-xs text-amber-400/70">Para capitanes de equipo y administradores. Un admin debe aprobar tu acceso.</p>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-900/30 border border-green-700/40 text-green-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {success}
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : mode === 'login'
                  ? <><LogIn className="w-4 h-4" /> Iniciar Sesión</>
                  : <><UserPlus className="w-4 h-4" /> Crear Cuenta</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'User already registered': 'Ya existe una cuenta con ese correo.',
  'Email not confirmed': 'Confirma tu correo antes de iniciar sesión.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
};

function translateError(msg: string): string {
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return val;
  }
  return msg;
}
