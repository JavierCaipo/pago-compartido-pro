'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-ssr';
import { uploadImageToSupabase, revokeObjectUrl } from '@/lib/storage';

type FormState = {
  nombre: string;
  slug: string;
  color_primario: string;
  logo: File | null;
};

type Message = {
  type: 'success' | 'error';
  text: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [form, setForm] = useState<FormState>({
    nombre: '',
    slug: '',
    color_primario: '#8b5cf6',
    logo: null,
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
      } else {
        setUserEmail(user.email || null);
      }
      setIsAuthLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Cleanup de preview URL cuando el componente se desmonte
  useEffect(() => {
    return () => {
      revokeObjectUrl(preview);
    };
  }, [preview]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle file selection with preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limpiar preview anterior si existe
      revokeObjectUrl(preview);
      
      setForm(prev => ({ ...prev, logo: file }));
      // Este es el "truco": genera una URL temporal local en el navegador
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  // Remove preview and file
  const clearPreview = () => {
    revokeObjectUrl(preview);
    setPreview(null);
    setForm(prev => ({ ...prev, logo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Normalize slug (lowercase, replace spaces with hyphens)
  const normalizeSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!form.nombre.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa el nombre del local' });
      return;
    }
    if (!form.slug.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa el slug' });
      return;
    }
    if (!form.logo) {
      setMessage({ type: 'error', text: 'Por favor selecciona un logo' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      let logoUrl = '';

      // Step 1: Upload logo a Supabase Storage usando la función reutilizable
      if (form.logo) {
        const ext = form.logo.name.split('.').pop() || 'png';
        const fileName = `${normalizeSlug(form.slug)}-${Date.now()}.${ext}`;
        
        logoUrl = await uploadImageToSupabase(
          form.logo,
          'locales_assets',
          'logos',
          fileName
        );
      }

      if (!logoUrl) {
        throw new Error('No se pudo obtener la URL de la imagen');
      }

      // Step 2: Insert into database con la URL obtenida
      const { error: dbError } = await supabase
        .from('negocios')
        .insert([
          {
            nombre: form.nombre.trim(),
            slug: normalizeSlug(form.slug),
            color_primario: form.color_primario,
            logo_url: logoUrl,
          },
        ]);

      if (dbError) {
        throw new Error(`Error al guardar en la base de datos: ${dbError.message}`);
      }

      // Success
      setMessage({
        type: 'success',
        text: `✓ Local "${form.nombre}" registrado exitosamente`,
      });

      // Reset form
      setForm({
        nombre: '',
        slug: '',
        color_primario: '#8b5cf6',
        logo: null,
      });
      clearPreview();

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <main className="min-block-size-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-size-12 block-size-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mb-4"></div>
          <p className="text-zinc-400">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-block-size-screen bg-black text-white font-sans">
      {/* Background blobs */}
      <div className="fixed inset-block-start-[-20%] inset-inline-start-[-10%] inline-size-[500px] block-size-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed inset-block-end-[-10%] inset-inline-end-[-10%] inline-size-[400px] block-size-[400px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky inset-block-start-0 z-50 backdrop-blur-md bg-black/80 border-block-end border-block-end-2 transition-colors duration-300 border-block-end-zinc-800">
          <div className="max-inline-size-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">Panel de Admin</h1>
              <p className="text-zinc-500 text-xs mt-0.5">
                {userEmail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-semibold"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 py-12">
          <div className="max-inline-size-2xl mx-auto">
            {/* Header Section */}
            <div className="mb-12">
              <h2 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Registrar Nuevo Local
              </h2>
              <p className="text-zinc-400 text-sm">Crea una marca blanca para tu restaurante o negocio</p>
            </div>

            {/* Main Form Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 shadow-2xl mb-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Message Alert */}
                {message && (
                  <div
                    className={`p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-2 ${
                      message.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {/* Form Grid */}
                <div className="space-y-6">
                  {/* Nombre del Local */}
                  <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-3">
                      Nombre del Local *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="ej: La Benita Restaurant"
                      disabled={isLoading}
                      className="inline-size-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Slug / URL */}
                  <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-3">
                      Slug / URL *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-sm whitespace-nowrap">miapp.com/</span>
                      <input
                        type="text"
                        name="slug"
                        value={form.slug}
                        onChange={handleChange}
                        placeholder="ej: la-benita"
                        disabled={isLoading}
                        className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      Se convertirá a: <span className="text-purple-400 font-mono">{normalizeSlug(form.slug) || 'slug-aqui'}</span>
                    </p>
                  </div>

                  {/* Color Primario */}
                  <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-3">
                      Color Primario *
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="color_primario"
                        value={form.color_primario}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="inline-size-16 block-size-14 rounded-2xl cursor-pointer border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={form.color_primario}
                        onChange={(e) =>
                          setForm(prev => ({ ...prev, color_primario: e.target.value }))
                        }
                        placeholder="#8b5cf6"
                        disabled={isLoading}
                        className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="pt-4">
                    <label className="block text-sm font-bold text-zinc-300 mb-4">
                      Logo del Local *
                    </label>

                    {/* Preview Area */}
                    <div className="mb-6 flex justify-center">
                      {preview ? (
                        <div className="relative group">
                          <img
                            src={preview}
                            alt="Preview del logo"
                            className="inline-size-24 block-size-24 object-cover rounded-full border-4 border-purple-500/50 shadow-xl"
                          />
                          <button
                            type="button"
                            onClick={clearPreview}
                            disabled={isLoading}
                            className="absolute -inset-block-start-1 -inset-inline-end-1 inline-size-7 block-size-7 bg-red-600 rounded-full text-white flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="inline-size-24 block-size-24 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/50">
                          <span className="text-2xl">📷</span>
                        </div>
                      )}
                    </div>

                    {/* File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="inline-size-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {preview ? 'Cambiar Logo' : 'Seleccionar Logo'}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !form.logo}
                  className="inline-size-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl hover:shadow-purple-500/50 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                >
                  {isLoading ? '⏳ Guardando...' : '✓ Registrar Local'}
                </button>

                {/* Required Fields Note */}
                <p className="text-xs text-zinc-500 text-center">
                  Los campos marcados con * son obligatorios
                </p>
              </form>
            </div>

            {/* Info Box */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <h3 className="text-sm font-bold text-purple-400 mb-3">💡 Información</h3>
              <ul className="text-xs text-zinc-400 space-y-2">
                <li>• El logo se subirá a Supabase Storage en la carpeta <span className="text-purple-300">locales_assets/logos/</span></li>
                <li>• El slug se convertirá automáticamente a minúsculas y se reemplazarán espacios con guiones</li>
                <li>• El color primario se usa para personalizar la interfaz del splitter</li>
                <li>• Una vez registrado, el local estará disponible en la plataforma</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
