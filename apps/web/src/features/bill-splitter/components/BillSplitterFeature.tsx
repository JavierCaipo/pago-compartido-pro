'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Person } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import ItemAssignmentModal from './ItemAssignmentModal';

// --- Iconos SVG Simples ---
const Icons = {
    Scan: () => (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    User: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Check: () => (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    )
};

export default function BillSplitterFeature() {
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [people, setPeople] = useState<Person[]>([{ id: 1, name: 'Yo' }, { id: 2, name: 'Amigo' }]);
    const [modalItem, setModalItem] = useState<Item | null>(null);

    // Evitar error de hidratación (SSR)
    useEffect(() => { setIsMounted(true); }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const rawItems = await analyzeReceiptAction(formData); // Server Action

            setItems(rawItems.map((item, idx) => ({
                id: idx,
                name: item.name,
                price: item.price,
                assignedTo: []
            })));
        } catch (err: any) {
            console.error(err);
            setError("No pudimos leer el recibo. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const totals = useMemo(() => {
        return items.reduce((acc, item) => acc + item.price, 0);
    }, [items]);

    if (!isMounted) return <div className="min-h-screen bg-black" />;

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500 selection:text-white">

            {/* Navbar Simple */}
            <header className="p-6 flex justify-between items-center max-w-5xl mx-auto">
                <h1 className="text-xl font-bold tracking-tight">Pago Compartido</h1>
                <div className="text-xs text-gray-400 opacity-50">Hoy, 14:30</div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">

                {/* Pantalla Inicial (Upload) */}
                {items.length === 0 && !isLoading && (
                    <div className="w-full text-center space-y-12">

                        <div className="space-y-2">
                            <p className="text-gray-400 text-sm uppercase tracking-wider">Total del Recibo</p>
                            <h2 className="text-6xl font-bold text-white tracking-tighter">$0.00</h2>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-900/30 border border-red-800 text-red-200 p-4 rounded-xl max-w-md mx-auto">
                                {error}
                            </div>
                        )}

                        {/* Botón Flotante Gigante (Estilo Captura) */}
                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
                            <label className="cursor-pointer group relative block w-full max-w-3xl mx-auto">
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                                {/* Glow Effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-green-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>

                                {/* Button Body */}
                                <div className="relative h-16 bg-gradient-to-r from-purple-800 to-emerald-600 rounded-full flex items-center justify-center gap-3 transition-transform active:scale-95">
                                    <Icons.Scan />
                                    <span className="font-bold text-lg">Escanear Recibo</span>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Pantalla de Carga */}
                {isLoading && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                        <p className="text-purple-300 animate-pulse">Analizando con IA...</p>
                    </div>
                )}

                {/* Lista de Items (Resultados) */}
                {items.length > 0 && (
                    <div className="w-full space-y-6 pb-32">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <h3 className="text-2xl font-bold">Items Detectados</h3>
                            <p className="text-emerald-400 font-mono text-xl">${totals.toFixed(2)}</p>
                        </div>

                        <div className="grid gap-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setModalItem(item)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${item.assignedTo.length > 0 ? 'bg-purple-900/20 border-purple-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-lg">{item.name}</span>
                                            {item.assignedTo.length > 0 && <Icons.Check />}
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            {item.assignedTo.length > 0
                                                ? item.assignedTo.map(id => people.find(p => p.id === id)?.name).join(', ')
                                                : 'Toca para asignar'}
                                        </p>
                                    </div>
                                    <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={() => setItems([])}
                            className="w-full py-4 text-gray-500 hover:text-red-400 text-sm transition-colors"
                        >
                            Cancelar y empezar de nuevo
                        </button>
                    </div>
                )}

                {/* Modal Simple */}
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