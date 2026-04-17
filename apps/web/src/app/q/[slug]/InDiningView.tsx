"use client";

import { useEffect, useState } from "react";
import { Receipt, CreditCard, Loader2 } from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";

type InDiningViewProps = {
  ticketId: string;
  negocioId: string;
  primaryColor: string;
  supabase: SupabaseClient;
};

export default function InDiningView({
  ticketId,
  negocioId,
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

  useEffect(() => {
    fetchComanda();
  }, [ticketId]);

  const fetchComanda = async () => {
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
      
      // 2. Fetch limpio de comandas sin JOINs conflictivos
      const { data: comandas } = await supabase
        .from("comandas")
        .select("*, comanda_items(*)")
        .eq("mesa_id", fetchedMesaId)
        .in("estado", ["preparando", "listo", "pendiente"]);
        
      if (comandas && comandas.length > 0) {
        comandas.forEach(c => {
           if (c.comanda_items) {
             loadedItems = [...loadedItems, ...c.comanda_items];
           }
        });
        setComanda(comandas[0]); 
      } else if (lista?.pre_comanda?.items) {
        loadedItems = lista.pre_comanda.items;
        pendingStatus = true;
      }
    } else if (lista?.pre_comanda?.items) {
      loadedItems = lista.pre_comanda.items;
      pendingStatus = true;
    }

    setItems(loadedItems);
    setIsPending(pendingStatus);
    
    // Calcular total de manera segura (subtotal de bd o cant * precio del json)
    const calcTotal = loadedItems.reduce((acc: number, item: any) => {
      const price = item.precio || 0;
      const amount = item.cantidad || 1;
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
    await supabase.from("mesas").update({ requiere_cuenta: true }).eq("id", mesaId);
    setPedirCuentaLoad(false);
    alert("El mozo ha sido notificado para llevar la cuenta.");
  };

  const handleDividirCuenta = () => {
    if (!mesaId) {
      alert("No podemos identificar tu mesa.");
      return;
    }
    const slug = window.location.pathname.split("/").pop();
    window.location.href = `/?ref=${slug}&mesaId=${mesaId}&checkout=true`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
        <span className="text-zinc-400">Cargando tu cuenta...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2 text-left w-full mt-4">
      <h2 className="text-2xl font-bold text-white mb-2 text-center">Tu Mesa</h2>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-inner">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
          <span>Desglose de Cuenta</span>
          <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
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
                  <span className="text-zinc-300">${rowTotal.toFixed(2)}</span>
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
