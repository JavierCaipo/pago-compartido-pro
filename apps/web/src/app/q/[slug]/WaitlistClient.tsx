"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Volume2 } from "lucide-react";

type Negocio = {
  id: string; // Negocio ID, can be treated as string
  nombre: string;
  logo_url: string;
  color_principal: string | null;
};

export default function WaitlistClient({ negocio }: { negocio: Negocio }) {
  const primaryColor = negocio.color_principal || "#8b5cf6";
  
  const [nombre, setNombre] = useState("");
  const [personas, setPersonas] = useState(2);
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [horaRegistro, setHoraRegistro] = useState<string | null>(null);
  const [posicion, setPosicion] = useState<number | null>(null);
  const [delaying, setDelaying] = useState(false);
  const [hasPlayedAlert, setHasPlayedAlert] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Restaurar el ticket del usuario en el navegador para este negocio
    const savedTicket = localStorage.getItem(`ticket_${negocio.id}`);
    if (savedTicket) {
      setTicketId(savedTicket);
      fetchTicketStatus(savedTicket);
    }
  }, [negocio.id]);

  const fetchTicketStatus = async (id: string) => {
    const { data } = await supabase
      .from("lista_espera")
      .select("estado, hora_registro")
      .eq("id", id)
      .single();
      
    if (data) {
      setEstado(data.estado);
      setHoraRegistro(data.hora_registro);
      if (data.estado === "esperando") {
        fetchPosition(data.hora_registro);
      }
    }
  };

  const fetchPosition = async (hora: string) => {
    const { count } = await supabase
      .from("lista_espera")
      .select("*", { count: "exact", head: true })
      .eq("negocio_id", negocio.id)
      .eq("estado", "esperando")
      .lt("hora_registro", hora);
      
    if (count !== null) {
      setPosicion(count + 1);
    }
  };

  useEffect(() => {
    if (!ticketId) return;

    // Escuchar TODOS los cambios de la cola de este restaurante
    const channel = supabase
      .channel(`waitlist_${negocio.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lista_espera",
          filter: `negocio_id=eq.${negocio.id}`,
        },
        (payload) => {
          const changedRecord = payload.new as Record<string, any>;
          
          if (changedRecord && changedRecord.id === ticketId) {
            setEstado(changedRecord.estado);
          }
          
          if (horaRegistro) {
            fetchPosition(horaRegistro);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase, negocio.id, horaRegistro]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from("lista_espera")
      .insert({
        negocio_id: negocio.id,
        nombre_cliente: nombre,
        personas: personas,
        estado: "esperando" // Estado inicial
      })
      .select("id, hora_registro")
      .single();

    if (data && !error) {
      const newTicketId = data.id;
      setTicketId(newTicketId);
      setEstado("esperando");
      setHoraRegistro(data.hora_registro);
      fetchPosition(data.hora_registro);
      localStorage.setItem(`ticket_${negocio.id}`, newTicketId);
    }
    
    setLoading(false);
  };

  const handleNuevaReserva = () => {
    localStorage.removeItem(`ticket_${negocio.id}`);
    setTicketId(null);
    setEstado(null);
    setHoraRegistro(null);
    setPosicion(null);
    setNombre("");
    setPersonas(2);
  };

  const handleDelay = async () => {
    if (!ticketId) return;
    setDelaying(true);
    // Add 10 minutes to current timestamp
    const nuevaHora = new Date(Date.now() + 10 * 60000).toISOString();
    
    const { error } = await supabase
      .from("lista_espera")
      .update({ hora_registro: nuevaHora })
      .eq("id", ticketId);
      
    if (!error) {
      setHoraRegistro(nuevaHora);
      fetchPosition(nuevaHora);
      alert("Turno retrasado 10 minutos. Has cedido el paso a otros comensales.");
    }
    setDelaying(false);
  };

  const isReady = estado === "sentado" || estado === "listo"; 
  
  // ── Marcapasos: `tick` se consume explícitamente para garantizar re-render ──
  // `tick` incrementa cada 60s vía setInterval (línea 29). Al referenciarlo aquí,
  // React re-evalúa Date.now() y el tiempo estimado baja orgánicamente.
  void tick; // eslint-disable-line @typescript-eslint/no-unused-expressions
  const minutosTranscurridos = horaRegistro 
    ? Math.floor((Date.now() - new Date(horaRegistro.endsWith('Z') ? horaRegistro : `${horaRegistro}Z`).getTime()) / 60000) 
    : 0;
  const baseTime = posicion !== null ? posicion * 8 : null;
  const estimatedTime = baseTime !== null ? Math.max(1, baseTime - Math.max(0, minutosTranscurridos)) : null;

  // Reset alerta sonora si el tiempo vuelve a subir (ej. tras "Ceder lugar")
  useEffect(() => {
    if (estimatedTime !== null && estimatedTime > 5) {
      setHasPlayedAlert(false);
    }
  }, [estimatedTime]);

  useEffect(() => {
    if (estimatedTime !== null && estimatedTime <= 5 && !hasPlayedAlert) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.7;
        audio.play().catch(e => console.warn("Audio play blocked by browser:", e));
      } catch (error) {
        console.warn("Audio API not supported", error);
      }
      setHasPlayedAlert(true);
    }
  }, [estimatedTime, hasPlayedAlert]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          
          {/* Cabecera del Inquilino */}
          <div className="text-center mb-8 relative z-10 pt-2">
            {negocio.logo_url ? (
              <img 
                src={negocio.logo_url} 
                alt={negocio.nombre} 
                className="w-20 h-20 mx-auto rounded-full object-cover border border-zinc-800 shadow-xl mb-5"
              />
            ) : (
              <div 
                className="w-20 h-20 mx-auto rounded-full shadow-xl mb-5 flex items-center justify-center text-2xl font-bold text-white border border-zinc-800"
                style={{ backgroundColor: primaryColor }}
              >
                {negocio.nombre.substring(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="text-3xl font-bold text-white tracking-tight">{negocio.nombre}</h1>
            <p className="text-zinc-400 mt-1 font-medium">Fila Virtual Interactiva</p>
          </div>

          {/* Vista Condicional: Formulario vs Rastreador */}
          <div className="relative z-10 w-full">
            {!ticketId ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Tu Nombre</label>
                  <input 
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    maxLength={50}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors placeholder:text-zinc-700"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    placeholder="Ej. Maria G."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Número de Personas</label>
                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-2 h-[52px]">
                    <button 
                      type="button"
                      onClick={() => setPersonas(Math.max(1, personas - 1))}
                      className="w-12 h-full rounded-lg bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-colors flex items-center justify-center text-xl font-medium active:scale-95"
                    >-</button>
                    <span className="text-xl font-semibold text-white">{personas}</span>
                    <button 
                      type="button"
                      onClick={() => setPersonas(Math.min(20, personas + 1))}
                      className="w-12 h-full rounded-lg bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-colors flex items-center justify-center text-xl font-medium active:scale-95"
                    >+</button>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-semibold py-4 px-4 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-95 transform transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? "Procesando..." : "Anotarme en la Fila"}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 px-2">
                {isReady ? (
                  <div className="space-y-4">
                    <div 
                      className="w-24 h-24 mx-auto rounded-full flex items-center justify-center animate-bounce shadow-2xl"
                      style={{ backgroundColor: primaryColor, boxShadow: `0 20px 25px -5px ${primaryColor}40` }}
                    >
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight mt-8">¡Tu mesa está lista!</h2>
                    <p className="text-zinc-300 text-lg leading-relaxed mt-3">Por favor, acércate a la recepción de {negocio.nombre}.</p>
                    <button 
                      onClick={handleNuevaReserva}
                      className="mt-6 text-zinc-400 hover:text-white underline decoration-zinc-700 underline-offset-4 text-sm font-medium transition-colors"
                    >
                      Hacer nueva reserva
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 pb-2">
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-[5px] opacity-20" style={{ borderColor: primaryColor }}></div>
                      <div className="absolute inset-0 rounded-full border-[5px] border-t-transparent animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}></div>
                      <span className="text-4xl font-bold text-white">{posicion || "#"}</span>
                    </div>
                    <div className="pt-4">
                      {estimatedTime !== null && (
                        <div className="mb-5 space-y-3">
                          <div className="inline-block bg-zinc-800/50 border border-zinc-700/50 rounded-full px-4 py-1.5 backdrop-blur-sm">
                            <span className="text-zinc-300 text-sm font-medium">
                              Tiempo est: <span className="text-white font-bold">~{estimatedTime} min</span>
                            </span>
                          </div>
                          {estimatedTime <= 5 && (
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mx-auto max-w-[90%] justify-center">
                              <Volume2 className="w-5 h-5 text-amber-400" />
                              <span className="text-amber-400/90 text-sm font-semibold tracking-wide">
                                ¡Prepárate! Tu mesa estará lista en breve.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <h2 className="text-2xl font-bold text-white mb-3">Estás en la fila</h2>
                      <p className="text-zinc-400 text-[15px] leading-relaxed mb-6">
                        Te avisaremos en esta pantalla apenas tu mesa esté lista. <br/> <strong className="text-zinc-200 font-semibold">¡No cierres esta pestaña!</strong>
                      </p>
                      
                      {estimatedTime !== null && (
                        <button
                          onClick={handleDelay}
                          disabled={delaying}
                          className="text-zinc-500 hover:text-zinc-300 text-sm tracking-wide transition-colors mt-2 disabled:opacity-50 underline decoration-zinc-800 hover:decoration-zinc-600 underline-offset-4"
                        >
                          {delaying ? "Actualizando..." : "Llegaré tarde (Ceder lugar)"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Marca estrictamente requerida */}
      <footer className="w-full py-8 text-center border-t border-zinc-900 bg-zinc-950 shrink-0 select-none">
        <a 
          href="https://vcard.tresapps.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 text-sm tracking-[0.2em] font-semibold uppercase hover:underline underline-offset-4 transition-all"
        >
          Developed by TresApps
        </a>
      </footer>
    </div>
  );
}
