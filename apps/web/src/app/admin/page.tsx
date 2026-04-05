'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-ssr';

export default function AdminPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email || null);
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="w-full max-w-4xl mx-auto p-4">
        {/* Header */}
        <header className="flex items-center justify-between py-6 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-black text-white">Panel de Administración</h1>
            <p className="text-zinc-500 text-sm mt-1">Autenticado como: <span className="font-mono text-zinc-300">{userEmail}</span></p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-semibold"
          >
            Cerrar Sesión
          </button>
        </header>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Welcome Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">Bienvenido</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Has accedido exitosamente al panel de administración. Este es un área restringida para administradores autorizados solamente.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">Estado del Sistema</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-sm">Autenticación</span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-emerald-400 text-xs font-medium">Activo</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-white mb-2">🔒 Seguridad</h3>
          <p className="text-zinc-400 text-sm">
            Esta ruta está protegida por autenticación de Supabase con cookies. El middleware verifica tu sesión automáticamente en cada petición.
          </p>
        </div>
      </div>
    </main>
  );
}
