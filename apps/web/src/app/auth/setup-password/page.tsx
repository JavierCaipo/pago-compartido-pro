"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Create Supabase client
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error: updateError } = await supabase.auth.updateUser({ password });
    
    setLoading(false);
    
    if (updateError) {
      setError(updateError.message);
    } else {
      router.push("/portal");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 lg:p-10 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Establecer Contraseña</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">Por favor, ingresa una nueva contraseña para acceder de forma segura a tu cuenta administrativa.</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Nueva Contraseña</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Confirmar Contraseña</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-zinc-200 hover:scale-[1.01] transform transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Guardando..." : "Guardar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
