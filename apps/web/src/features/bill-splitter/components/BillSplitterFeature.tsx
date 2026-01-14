'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Person } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import ItemAssignmentModal from './ItemAssignmentModal';

// --- Iconos SVG con tamaños fijos ---
const Icons = {
    Scan: () => (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    History: () => (
        <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Check: () => (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Close: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    )
};

export default function BillSplitterFeature() {
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [people] = useState<Person[]>([
        { id: 1, name: 'Yo' },
        { id: 2, name: 'Amigo' }
    ]);
    const [modalItem, setModalItem] = useState<Item | null>(null);

    // SSR Guard
    useEffect(() => { setIsMounted(true); }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const rawItems = await analyzeReceiptAction(formData);

            setItems(rawItems.map((item, idx) => ({
                id: idx,
                name: item.name,
                price: item.price,
                assignedTo: []
            })));
        } catch (err: any) {
            console.error(err);
            setError("No pudimos procesar la imagen. Prueba con otra más clara.");
        } finally {
            setIsLoading(false);
        }
    };

    const totalBill = useMemo(() => {
        return items.reduce((acc, item) => acc + item.price, 0);
    }, [items]);

    if (!isMounted) return <div className="min-h-screen bg-[#0a0a0a]" />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-900 selection:text-white">

            {/* Navbar Refinada */}
            <header className="p-6 flex justify-between items-center max-w-5xl mx-auto border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">P</div>
                    <h1 className="text-lg font-semibold tracking-tight">Pago Compartido</h1>
                </div>
                <Icons.History />
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">

                {/* Vista Inicial o Error */}
                {items.length === 0 && !isLoading && (
                    <div className="w-full text-center space-y-16 animate-in fade-in zoom-in duration-500">

                        <div className="space-y-4">
                            <p className="text-purple-400/60 text-xs font-bold uppercase tracking-[0.2em]">Escáner de Inteligencia Artificial</p>
                            <h2 className="text-7xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent">
                                $0.00
                            </h2>
                            <p className="text-white/40 max-w-xs mx-auto text-sm leading-relaxed">
                                Sube una foto de tu recibo y divide la cuenta con tus amigos en segundos.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl max-w-md mx-auto text-sm">
                                {error}
                            </div>
                        )}

                        {/* Botón de Acción Principal (Control Inferior) */}
                        <div className="fixed bottom-10 left-0 right-0 p-6 z-40">
                            <label className="cursor-pointer group relative block w-full max-w-sm mx-auto overflow-hidden rounded-full">
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                                {/* Background Shimmer */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-[length:200%_auto] animate-gradient transition duration-1000"></div>

                                {/* Button Body */}
                                <div className="relative h-16 bg-black/20 backdrop-blur-sm flex items-center justify-center gap-3 active:scale-95 transition-transform duration-200">
                                    <Icons.Scan />
                                    <span className="font-bold text-lg">Escanear Recibo</span>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Cargando con Estilo */}
                {isLoading && (
                    <div className="text-center space-y-8 animate-in fade-in duration-300">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-purple-500/10 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-4 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xl font-bold">Analizando Recibo</p>
                            <p className="text-white/40 text-sm italic">Gemini 1.5 está leyendo los datos...</p>
                        </div>
                    </div>
                )}

                {/* Lista de Resultados Post-Lulú */}
                {items.length > 0 && (
                    <div className="w-full space-y-8 pb-32 animate-in slide-in-from-bottom-5 duration-500">
                        <div className="flex justify-between items-end border-b border-white/5 pb-6">
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight">Recibo</h3>
                                <p className="text-white/40 text-sm mt-1">Toca un item para asignarlo</p>
                            </div>
                            <p className="text-emerald-400 font-mono text-3xl font-bold tracking-tighter">${totalBill.toFixed(2)}</p>
                        </div>

                        <div className="grid gap-4">
                            {items.map((item) => {
                                const isAssigned = item.assignedTo.length > 0;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setModalItem(item)}
                                        className={`group p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex justify-between items-center ${isAssigned
                                                ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold text-lg transition-colors ${isAssigned ? 'text-purple-300' : 'text-white/90'}`}>{item.name}</span>
                                                {isAssigned && <Icons.Check />}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm text-white/40">
                                                    {isAssigned
                                                        ? item.assignedTo.map(id => people.find(p => p.id === id)?.name).join(', ')
                                                        : 'Sin asignar'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-bold text-xl tracking-tight transition-colors ${isAssigned ? 'text-purple-300' : 'text-white'}`}>
                                                ${item.price.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pie de página con acciones */}
                        <div className="flex flex-col items-center gap-4 pt-8">
                            <button
                                onClick={() => setItems([])}
                                className="px-8 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-medium hover:bg-red-500/20 transition-all"
                            >
                                Borrar y empezar de nuevo
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal adaptado al Dark Mode */}
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