"use client"

import { useState } from "react"
import { crearNegocio } from "@/features/admin/actions"
import { Loader2, Send, Building, Link as LinkIcon, Mail } from "lucide-react"

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMensaje(null)
    
    try {
      const response = await crearNegocio(formData)
      if (response.success) {
        setMensaje({ type: "success", text: response.message || "Negocio creado y administrador invitado exitosamente" })
        const form = document.getElementById("form-crear-negocio") as HTMLFormElement
        if (form) form.reset()
      } else {
        setMensaje({ type: "error", text: response.error || "Ocurrió un error inesperado" })
      }
    } catch (error) {
      setMensaje({ type: "error", text: "Fallo la comunicación con el servidor" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Command Center</h1>
          <p className="text-gray-400 text-sm">Alta de Nuevo Negocio (SuperAdmin)</p>
        </div>

        <form id="form-crear-negocio" action={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-1">Nombre del Restaurante</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="nombre"
                name="nombre"
                required
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej. El Buen Sabor"
              />
            </div>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-1">Slug (URL amigable)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="slug"
                name="slug"
                required
                pattern="^[a-z0-9-]+$"
                title="Solo minúsculas, números y guiones"
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="ej-el-buen-sabor"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Solo letras minúsculas, números y guiones.</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo del Administrador</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@restaurante.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Procesando...
              </>
            ) : (
              <>
                <Send className="-ml-1 mr-2 h-5 w-5" />
                Crear y Enviar Invitación
              </>
            )}
          </button>
        </form>

        {mensaje && (
          <div className={`mt-6 p-4 rounded-lg border flex items-center justify-center ${mensaje.type === 'success' ? 'bg-green-900/30 border-green-800/50 text-green-300' : 'bg-red-900/30 border-red-800/50 text-red-300'}`}>
            <p className="text-sm font-medium text-center">{mensaje.text}</p>
          </div>
        )}
      </div>
    </div>
  )
}
