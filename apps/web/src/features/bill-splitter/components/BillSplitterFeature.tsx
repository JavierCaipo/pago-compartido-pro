'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Person } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import ItemAssignmentModal from './ItemAssignmentModal';

// --- ICONOS ---
const Icons = {
    Scan: () => (
        <svg className="w-12 h-12 text-white mx-auto mb-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Users: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Check: () => (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    )
};

export default function BillSplitterFeature() {
    const [isMounted, setIsMounted] = useState(false);
    const [step, setStep] = useState<'upload' | 'assign' | 'summary'>('upload');

    const [items, setItems] = useState<Item[]>([]);
    const [people, setPeople] = useState<Person[]>([{ id: 1, name: 'Yo' }, { id: 2, name: 'Amigo' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalItem, setModalItem] = useState<Item | null>(null);

    useEffect(() => setIsMounted(true), []);

    // --- LOGICA ---

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const rawItems = await analyzeReceiptAction(formData);

            if (!rawItems || rawItems.length === 0) throw new Error("No se encontraron items.");

            setItems(rawItems.map((item, idx) => ({
                id: idx, name: item.name, price: item.price, assignedTo: []
            })));

            setStep('assign'); // Avanzar al siguiente paso

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al leer el recibo.");
        } finally {
            setIsLoading(false);
        }
    };

    const addPerson = () => {
        const nextId = people.length > 0 ? Math.max(...people.map(p => p.id)) + 1 : 1;
        setPeople([...people, { id: nextId, name: `Persona ${nextId}` }]);
    };

    const updatePersonName = (id: number, name: string) => {
        setPeople(people.map(p => p.id === id ? { ...p, name } : p));
    };

    const removePerson = (id: number) => {
        if (people.length <= 1) return;
        setPeople(people.filter(p => p.id !== id));
        // Quitar asignaciones de esa persona
        setItems(items.map(i => ({
            ...i,
            assignedTo: i.assignedTo.filter(pid => pid !== id)
        })));
    };

    // Cálculos finales
    const totals = useMemo(() => {
        const map = new Map<number, number>();
        people.forEach(p => map.set(p.id, 0));
        let totalBill = 0;
        let unassigned = 0;

        items.forEach(item => {
            totalBill += item.price;
            if (item.assignedTo.length === 0) {
                unassigned += item.price;
            } else {
                const splitPrice = item.price / item.assignedTo.length;
                item.assignedTo.forEach(pid => {
                    map.set(pid, (map.get(pid) || 0) + splitPrice);
                });
            }
        });

        return { map, totalBill, unassigned };
    }, [items, people]);


    if (!isMounted) return <div className="min-h-screen bg-[#0a0a0a]" />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-indigo-500/30">

            {/* HEADER */}
            <header className="p-4 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur sticky top-0 z-20 flex justify-between items-center">
                <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Pago Compartido
                </h1>
                {step !== 'upload' && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStep('assign')}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${step === 'assign' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                        >
                            Asignar
                        </button>
                        <button
                            onClick={() => setStep('summary')}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${step === 'summary' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                        >
                            Resumen
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-md mx-auto px-4 py-6 pb-24">

                {/* ERROR */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center">
                        <span className="text-red-300 text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 font-bold">✕</button>
                    </div>
                )}

                {/* --- PASO 1: SUBIR --- */}
                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                        {isLoading ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                                <p className="text-indigo-300 animate-pulse text-sm">Analizando factura...</p>
                            </div>
                        ) : (
                            <>
                                <div className="relative group">
                                    <label className="block cursor-pointer">
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                        <div className="w-40 h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex flex-col items-center justify-center border border-white/10 group-hover:border-indigo-500/50 group-hover:scale-105 transition-all shadow-2xl">
                                            <Icons.Scan />
                                            <span className="text-xs text-gray-400 mt-2 font-medium">Escanear</span>
                                        </div>
                                    </label>
                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <p className="text-gray-500 text-sm max-w-[200px] text-center">Sube una foto. Nosotros detectamos los precios.</p>
                            </>
                        )}
                    </div>
                )}

                {/* --- PASO 2: ASIGNAR --- */}
                {step === 'assign' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

                        {/* Gestión de Personas */}
                        <section className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <Icons.Users /> Personas
                                </h2>
                                <button onClick={addPerson} className="text-xs bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-500 text-white transition-colors">
                                    + Agregar
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {people.map(p => (
                                    <div key={p.id} className="group relative">
                                        <input
                                            value={p.name}
                                            onChange={(e) => updatePersonName(p.id, e.target.value)}
                                            className="bg-black/30 text-white text-sm px-3 py-1.5 rounded-lg border border-transparent focus:border-indigo-500 focus:outline-none w-24 text-center transition-all"
                                        />
                                        {people.length > 1 && (
                                            <button
                                                onClick={() => removePerson(p.id)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Lista de Items */}
                        <section className="space-y-3">
                            <div className="flex justify-between items-end px-1">
                                <h2 className="text-sm font-bold text-gray-300">Items ({items.length})</h2>
                                {totals.unassigned > 0 ? (
                                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Falta asignar: ${totals.unassigned.toFixed(2)}</span>
                                ) : (
                                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">¡Todo listo!</span>
                                )}
                            </div>

                            {items.map(item => {
                                const isAssigned = item.assignedTo.length > 0;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setModalItem(item)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${isAssigned
                                                ? 'bg-indigo-500/10 border-indigo-500/30'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${isAssigned ? 'text-indigo-200' : 'text-gray-300'}`}>{item.name}</span>
                                                {isAssigned && <Icons.Check />}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                {isAssigned
                                                    ? item.assignedTo.map(pid => people.find(p => p.id === pid)?.name).join(', ')
                                                    : 'Toca para asignar'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-200">${item.price.toFixed(2)}</div>
                                            {isAssigned && item.assignedTo.length > 1 && (
                                                <div className="text-[10px] text-indigo-300">(${(item.price / item.assignedTo.length).toFixed(2)} c/u)</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </section>

                        {/* Floating Summary Button */}
                        {totals.unassigned === 0 && items.length > 0 && (
                            <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center">
                                <button
                                    onClick={() => setStep('summary')}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-emerald-500/20 transform hover:scale-105 transition-all"
                                >
                                    Ver Cuentas Finales →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- PASO 3: RESUMEN --- */}
                {step === 'summary' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-indigo-600 rounded-2xl p-6 text-center shadow-lg shadow-indigo-500/20">
                            <p className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Total de la Cuenta</p>
                            <h2 className="text-4xl font-black text-white">${totals.totalBill.toFixed(2)}</h2>
                        </div>

                        <div className="space-y-3">
                            {people.map(p => {
                                const amount = totals.map.get(p.id) || 0;
                                if (amount === 0) return null;
                                return (
                                    <div key={p.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                                                {p.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-200">{p.name}</span>
                                        </div>
                                        <span className="font-bold text-lg text-white">${amount.toFixed(2)}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => {
                                if (confirm("¿Seguro que quieres borrar todo?")) {
                                    setItems([]);
                                    setStep('upload');
                                }
                            }}
                            className="w-full py-4 text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                            Comenzar nueva cuenta
                        </button>
                    </div>
                )}

                {/* MODAL */}
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