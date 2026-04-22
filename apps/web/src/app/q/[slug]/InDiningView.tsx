"use client";

import { useEffect, useState } from "react";
import { Receipt, CreditCard, Loader2 } from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";

type InDiningViewProps = {
  ticketId: string;
  negocioId: string;
  moneda: string;
  primaryColor: string;
  supabase: SupabaseClient;
};

export default function InDiningView({
  ticketId,
  negocioId,
  moneda,
  primaryColor,
  supabase,
}: InDiningViewProps) {
  const [comanda, setComanda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pedirCuentaLoad, setPedirCuentaLoad] = useState(false);
  const [mesaId, setMesaId] = useState<string | null>(null);
  
  const [items, setItems] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [total, setTotal] = useState(0);

  const formatCurrency = (amount: number) => {
    try {
      const locale = moneda === 'USD' ? 'en-US' : 'es-PE';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: moneda || 'PEN',
      }).format(amount);
    } catch (e) {
      return `${moneda || 'S/'} ${amount.toFixed(2)}`;
    }
  };

  useEffect(() => {
    fetchComanda();
  }, [ticketId]);

  useEffect(() => {
    if (!mesaId) return;

    const channel = supabase
      .channel(`mesa_status_${mesaId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mesas",
          filter: `id=eq.${mesaId}`,
        },
        (payload) => {
          const newRecord = payload.new as Record<string, any>;
          if (newRecord.estado === "disponible") {
            localStorage.removeItem(`ticket_${negocioId}`);
            localStorage.removeItem(`mesa_${negocioId}`);
            window.location.href = "/gracias";
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comandas",
          filter: `mesa_id=eq.${mesaId}`,
        },
        () => {
          fetchComanda(true); // silent fetch
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comanda_items",
        },
        () => {
          fetchComanda(true); // silent fetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mesaId, negocioId, supabase]);

  const fetchComanda = async (silent = false) => {
    if (!silent) setLoading(true);
    // 1. Buscar la información base en lista_espera (Fallback a pre_comanda)
    const { data: lista } = await supabase
      .from("lista_espera")
      .select("mesa_id, pre_comanda")
      .eq("id", ticketId)
      .maybeSingle();

    let loadedItems: any[] = [];
    let pendingStatus = false;
    let fetchedMesaId = lista?.mesa_id || null;

    if (fetchedMesaId) {
      setMesaId(fetchedMesaId);
      
      // 2. Fetch limpio de comandas
      const { data: comandas } = await supabase
        .from("comandas")
        .select("*, comanda_items(*, productos(nombre))")
        .eq("mesa_id", fetchedMesaId)
        .neq("estado", "pagado")
        .neq("estado", "cancelado")
        .order("created_at", { ascending: false });
        
      if (comandas && comandas.length > 0) {
        comandas.forEach(c => {
           if (c.comanda_items) {
             const normalized = c.comanda_items.map((item: any) => ({
               ...item,
               nombre: item.productos?.nombre || item.nombre || 'Producto'
             }));
             loadedItems = [...loadedItems, ...normalized];
           }
        });
        setComanda(comandas[0]); 
      }
    }

    // Fallback Agresivo: Si no hay items de comandas, usar pre_comanda
    if (loadedItems.length === 0 && lista?.pre_comanda?.items) {
      loadedItems = lista.pre_comanda.items.map((item: any) => ({
        ...item,
        nombre: item.nombre || 'Producto'
      }));
      pendingStatus = true;
    }

    setItems(loadedItems);
    setIsPending(pendingStatus);
    
    // Calcular total de manera segura
    const calcTotal = loadedItems.reduce((acc: number, item: any) => {
      const price = Number(item.precio || item.precio_unitario || 0);
      const amount = Number(item.cantidad || 1);
      if (item.subtotal) return acc + Number(item.subtotal);
      return acc + (price * amount);
    }, 0);
    setTotal(calcTotal);
    
    setLoading(false);
  };

  const handlePedirCuenta = async () => {
    if (!mesaId) {
      alert("No podemos identificar tu mesa en este momento.");
      return;
    }
    setPedirCuentaLoad(true);
    try {
      // Usar RPC para evitar errores de RLS y parpadeos
      await supabase.rpc('marcar_requiere_cuenta', { p_mesa_id: mesaId });
      alert("El mozo ha sido notificado para llevar la cuenta.");
    } catch (err) {
      console.error("Error al pedir cuenta:", err);
    } finally {
      setPedirCuentaLoad(false);
    }
  };

  const handleDividirCuenta = () => {
    if (!mesaId) {
      alert("No podemos identificar tu mesa.");
      return;
    }
    const slug = window.location.pathname.split("/").pop();
    // Pasar ref=slug y ticketId para que BillSplitterFeature pueda hacer fallback a pre_comanda si es necesario
    window.location.href = `/?ref=${slug}&mesaId=${mesaId}&ticketId=${ticketId}&checkout=true`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
        <span className="text-zinc-400">Cargando tu cuenta...</span>
      </div>
    );
  }

  let statusMessage = "";
  if (comanda) {
    if (comanda.estado === "preparando" || comanda.estado === "cocinando") statusMessage = "Tus platos se están preparando con cariño.";
    else if (comanda.estado === "listo") statusMessage = "¡Tus platos van en camino a la mesa!";
    else if (comanda.estado === "servido" || comanda.estado === "entregado") statusMessage = "¡Buen provecho! 🍽️";
    else if (comanda.estado === "pendiente") statusMessage = "Esperando confirmación de la cocina...";
    else if (comanda.estado === "abierta") statusMessage = "Tu orden ha sido recibida.";
  }

  return (
    <div className="space-y-6 pb-2 text-left w-full mt-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Tu Mesa</h2>
        {statusMessage && (
          <span className="inline-block px-4 py-1.5 mt-2 bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-full text-xs text-zinc-300 font-medium shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            {statusMessage}
          </span>
        )}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-inner">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
          <span>Desglose de Cuenta</span>
          <span style={{ color: primaryColor }}>{formatCurrency(total)}</span>
        </h3>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">No hay items ordenados aún.</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {items.map((item: any, i: number) => {
              const rowTotal = item.subtotal ? Number(item.subtotal) : (item.precio || 0) * (item.cantidad || 1);
              return (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 font-medium">{item.cantidad}x</span>
                    <span className="text-zinc-200">{item.nombre}</span>
                  </div>
                  <span className="text-zinc-300">{formatCurrency(rowTotal)}</span>
                </div>
              );
            })}
          </div>
        )}

        {isPending && items.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <p className="text-xs text-amber-500/80 text-center italic">
              (Pendiente de confirmación por el mozo)
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handlePedirCuenta}
          disabled={pedirCuentaLoad}
          className="w-full relative flex items-center justify-center gap-2 text-white font-semibold py-4 px-4 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xl bg-zinc-800 disabled:opacity-50"
        >
          {pedirCuentaLoad ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Receipt className="w-5 h-5" />
          )}
          Pedir la Cuenta
        </button>

        <button
          onClick={handleDividirCuenta}
          disabled={!mesaId}
          className="w-full relative flex items-center justify-center gap-2 text-white font-semibold py-4 px-4 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:grayscale"
          style={{ backgroundColor: mesaId ? primaryColor : undefined }}
        >
          <CreditCard className="w-5 h-5" />
          Dividir Cuenta
        </button>
      </div>
    </div>
  );
}
