import { Loader2, Clock, Gamepad2 } from 'lucide-react';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-red-900 rounded-full blur-[160px] opacity-10 animate-pulse" />
      </div>

      <div className="relative z-10 text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 border border-red-600/30 mb-4">
          <Gamepad2 className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">Cuenta en revisión</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Tu cuenta fue creada. Un administrador revisará tu solicitud y te asignará un rol antes de que puedas acceder al panel.
        </p>
        <div className="flex items-center justify-center gap-2 text-yellow-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">Esperando aprobación...</span>
        </div>
        <div className="mt-4 flex justify-center">
          <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
        </div>
      </div>
    </div>
  );
}
