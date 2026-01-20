'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Person } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import ItemAssignmentModal from './ItemAssignmentModal';

// --- ICONOS CON ESTILOS FORZADOS (NUCLEAR OPTION) ---
const Icons = {
    Scan: () => (
        // style={{...}} tiene prioridad sobre clases CSS. Esto arreglará el icono gigante sí o sí.
        <svg
            style={{ width: '80px', height: '80px', display: 'block', margin: '0 auto', color: 'white' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Check: () => (
        <svg style={{ width: '20px', height: '20px' }} className="text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    )
};

export default function BillSplitterFeature() {
    const [isMounted, setIsMounted] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [people, setPeople] = useState<Person[]>([{ id: 1, name: 'Yo' }, { id: 2, name: 'Amigo' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalItem, setModalItem] = useState<Item | null>(null);

    useEffect(() => { setIsMounted(true); }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Llamada segura al servidor
            const result = await analyzeReceiptAction(formData);

            if (!result.success) {
                // Si falló, mostramos el error exacto que vino del servidor
                throw new Error(result.error);
            }

            if (result.data.length === 0) {
                throw new Error("La IA no encontró items.");
            }

            setItems(result.data.map((item, idx) => ({
                id: idx,
                name: item.name,
                price: item.price,
                assignedTo: []
            })));

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error desconocido.");
        } finally {
            setIsLoading(false);
        }
    };

    const totals = useMemo(() => items.reduce((acc, i) => acc + i.price, 0), [items]);

    if (!isMounted) return <div className="min-h-screen bg-black text-white p-10">Cargando...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20">

            {/* HEADER DEBUG */}
            <header className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900">
                <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Pago Compartido
                </h1>
                <div className="px-2 py-1 bg-red-900/50 border border-red-500 rounded text-[10px] font-mono text-red-200">
                    v3.5 DEBUG MODE
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-8">

                {/* --- ERROR BOX (ROJO) --- */}
                {error && (
                    <div className="mb-8 p-4 bg-red-900/20 border-2 border-red-500 rounded-xl text-red-100 animate-pulse">
                        <h3 className="font-bold text-red-400 mb-1">⚠️ ERROR DEL SERVIDOR:</h3>
                        <p className="font-mono text-xs break-words">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="mt-3 text-xs bg-red-500/20 px-3 py-1 rounded hover:bg-red-500/40"
                        >
                            Cerrar
                        </button>
                    </div>
                )}

                {/* --- PANTALLA DE CARGA --- */}
                {!isLoading && items.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
                        <label className="group relative cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                            {/* CIRCULO CENTRAL */}
                            <div className="w-48 h-48 bg-gray-800 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-gray-600 group-hover:border-purple-500 transition-all">
                                {/* ICONO CON TAMAÑO FORZADO */}
                                <Icons.Scan />
                                <span className="text-sm font-medium text-gray-400 mt-2">Toca para Escanear</span>
                            </div>
                        </label>
                        <p className="text-xs text-gray-500 text-center">
                            Modo Debug: Los errores se mostrarán arriba en rojo.
                        </p>
                    </div>
                )}

                {/* --- LOADING --- */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-400 text-sm font-mono">Conectando con Google...</p>
                    </div>
                )}

                {/* --- RESULTADOS --- */}
                {!isLoading && items.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-white/10 pb-2">
                            <span className="text-gray-400">Total</span>
                            <span className="text-2xl font-bold">${totals.toFixed(2)}</span>
                        </div>

                        {items.map(item => (
                            <div key={item.id} onClick={() => setModalItem(item)} className="p-3 bg-white/5 rounded-lg flex justify-between cursor-pointer hover:bg-white/10">
                                <span>{item.name}</span>
                                <span className="font-bold">${item.price.toFixed(2)}</span>
                            </div>
                        ))}

                        <button
                            onClick={() => setItems([])}
                            className="w-full py-3 bg-red-500/10 text-red-400 rounded-lg mt-8 text-sm"
                        >
                            Reiniciar Debug
                        </button>
                    </div>
                )}

                <ItemAssignmentModal
                    item={modalItem}
                    people={people}
                    onClose={() => setModalItem(null)}
                    onSave={(id, assigned) => {
                        setItems(items.map(i => i.id === id ? { ...i, assignedTo: assigned } : i));
                        setModalItem(null);
                    }}
                />

            </main>
        </div>
    );
}