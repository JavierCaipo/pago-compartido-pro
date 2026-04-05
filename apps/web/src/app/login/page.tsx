'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-ssr';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Por favor ingresa correo electrónico y contraseña.');
        setIsLoading(false);
        return;
      }

      // Email basic validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Por favor ingresa un correo electrónico válido.');
        setIsLoading(false);
        return;
      }

      // Get Supabase client (browser client with cookie support)
      const supabase = createClient();

      // Attempt login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Error real de Supabase:', authError.message);
        setError(authError.message || 'Credenciales inválidas. Intenta de nuevo.');
        setIsLoading(false);
        return;
      }

      if (data.session) {
        console.log('Login exitoso, sesión creada:', data.session.user.email);
        // The session is now in cookies, redirect to admin
        // Use a small delay to ensure cookies are set
        setTimeout(() => {
          router.push('/admin');
        }, 500);
      }
    } catch (err) {
      console.error('Error real de Supabase:', err);
      setError('Ocurrió un error inesperado. Por favor intenta más tarde.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Panel Admin</h1>
          <p className="text-zinc-500 text-sm">Acceso restringido para administradores</p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-zinc-300 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-zinc-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-top-2">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                isLoading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 active:scale-95 shadow-lg shadow-purple-900/40'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 text-center">
              Este panel está restringido a administradores autorizados. Para acceso, contacta al equipo.
            </p>
          </div>
        </div>

        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-purple-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-indigo-900/20 rounded-full blur-[100px]"></div>
        </div>
      </div>
    </main>
  );
}
