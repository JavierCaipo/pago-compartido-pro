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

type Negocio = {
  id: string;
  nombre: string;
  slug: string;
  color_primario: string;
  logo_url: string;
  activo: boolean;
  fecha_suscripcion: string; // ISO date string
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

  // Estados para pestañas y gestión
  const [activeTab, setActiveTab] = useState<'register' | 'manage'>('register');
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isLoadingNegocios, setIsLoadingNegocios] = useState(false);

  // Fetch negocios
  const fetchNegocios = async () => {
    setIsLoadingNegocios(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .order('fecha_suscripcion', { ascending: false });

      if (error) throw error;
      setNegocios(data || []);
    } catch (error) {
      console.error('Error fetching negocios:', error);
      setMessage({ type: 'error', text: 'Error al cargar los locales' });
    } finally {
      setIsLoadingNegocios(false);
    }
  };

  // Toggle activo
  const toggleActivo = async (id: string, currentActivo: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('negocios')
        .update({ activo: !currentActivo })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setNegocios(prev => prev.map(n => 
        n.id === id ? { ...n, activo: !currentActivo } : n
      ));

      setMessage({ 
        type: 'success', 
        text: `Local ${!currentActivo ? 'activado' : 'desactivado'} correctamente` 
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error toggling activo:', error);
      setMessage({ type: 'error', text: 'Error al cambiar el estado del local' });
    }
  };

  // Eliminar negocio
  const deleteNegocio = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('negocios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setNegocios(prev => prev.filter(n => n.id !== id));

      setMessage({ type: 'success', text: `Local "${nombre}" eliminado correctamente` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting negocio:', error);
      setMessage({ type: 'error', text: 'Error al eliminar el local' });
    }
  };

  // Load negocios when tab changes to manage
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchNegocios();
    }
  }, [activeTab]);

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRenewalDays = (fechaSuscripcion: string) => {
    const subDate = new Date(fechaSuscripcion);
    const nextMonth = new Date(subDate.getFullYear(), subDate.getMonth() + 1, subDate.getDate());
    const today = new Date();
    const diffTime = nextMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
    <div className="min-block-size-screen bg-black text-white font-sans overflow-x-hidden w-full max-w-full px-4">
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
          <div className="max-inline-size-6xl mx-auto">
            {/* Tabs */}
            <div className="mb-8">
              <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === 'register'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Registrar Local
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === 'manage'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Gestionar Locales
                </button>
              </div>
            </div>

            {/* Global Message Alert */}
            {message && (
              <div
                className={`mb-8 p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'register' && (
              <>
                {/* Header Section */}
                <div className="mb-12">
                  <h2 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    Registrar Nuevo Local
                  </h2>
                  <p className="text-zinc-400 text-sm">Crea una marca blanca para tu restaurante o negocio</p>
                </div>

                {/* Main Form Card */}
                <div className="max-inline-size-2xl mx-auto">
                  <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 shadow-2xl mb-8">
                    <form onSubmit={handleSubmit} className="space-y-8">

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
                      className="w-full box-border bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="flex-1 w-full box-border bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="flex-1 w-full box-border bg-zinc-800/50 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-mono"
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
              </>
            )}

            {activeTab === 'manage' && (
              <>
                {/* Header Section */}
                <div className="mb-12">
                  <h2 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    Gestionar Locales
                  </h2>
                  <p className="text-zinc-400 text-sm">Administra los locales registrados y sus suscripciones</p>
                </div>

                {/* Loading State */}
                {isLoadingNegocios && (
                  <div className="text-center py-12">
                    <div className="inline-size-12 block-size-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mb-4"></div>
                    <p className="text-zinc-400">Cargando locales...</p>
                  </div>
                )}

                {/* Negocios List */}
                {!isLoadingNegocios && negocios.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-size-24 block-size-24 rounded-full bg-zinc-900/50 flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🏪</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-300 mb-2">No hay locales registrados</h3>
                    <p className="text-zinc-500">Registra tu primer local usando la pestaña "Registrar Local"</p>
                  </div>
                )}

                {!isLoadingNegocios && negocios.length > 0 && (
                  <div className="space-y-4">
                    {negocios.map((negocio) => {
                      const renewalDays = getRenewalDays(negocio.fecha_suscripcion);
                      return (
                        <div key={negocio.id} className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <img
                                src={negocio.logo_url}
                                alt={negocio.nombre}
                                className="shrink-0 w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white truncate">{negocio.nombre}</h3>
                                <p className="text-sm text-zinc-400 break-words">miapp.com/{negocio.slug}</p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                              {/* Fecha y renovación */}
                              <div className="text-left sm:text-right">
                                <p className="text-sm text-zinc-400">Suscripción</p>
                                <p className="text-sm font-medium text-white">{formatDate(negocio.fecha_suscripcion)}</p>
                                {renewalDays <= 7 && renewalDays > 0 && (
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                                    Renueva en {renewalDays} día{renewalDays !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {renewalDays <= 0 && (
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                                    Vencida
                                  </span>
                                )}
                              </div>

                              {/* Toggle y Delete */}
                              <div className="flex flex-row w-full sm:w-auto justify-between sm:justify-end items-center gap-4 mt-2 sm:mt-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-zinc-400">Activo</span>
                                  <button
                                    onClick={() => toggleActivo(negocio.id, negocio.activo)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                      negocio.activo ? 'bg-purple-600' : 'bg-zinc-600'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        negocio.activo ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </div>

                                <button
                                  onClick={() => deleteNegocio(negocio.id, negocio.nombre)}
                                  className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-semibold"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
