'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Person } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import ItemAssignmentModal from './ItemAssignmentModal';
import { Scan, Users, Check, Plus, ArrowRight, Receipt, AlertCircle, Loader2 } from 'lucide-react';

// --- COMPONENTS ---

const BackgroundBlobs = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/10 blur-[100px] mix-blend-screen"></div>
        <div className="absolute top-[40%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-purple-900/20 blur-[120px] mix-blend-screen opacity-40"></div>
    </div>
);

export default function BillSplitterFeature() {
    const [isMounted, setIsMounted] = useState(false);
    const [step, setStep] = useState<'upload' | 'assign' | 'summary'>('upload');

    // Datos
    const [items, setItems] = useState<Item[]>([]);
    const [people, setPeople] = useState<Person[]>([{ id: 1, name: 'Yo' }, { id: 2, name: 'Amigo' }]);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalItem, setModalItem] = useState<Item | null>(null);

    useEffect(() => setIsMounted(true), []);

    // --- LÓGICA PRINCIPAL ---

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Llamamos al Server Action
            const result = await analyzeReceiptAction(formData);

            if (!result.success) {
                // @ts-ignore
                throw new Error(result.error);
            }

            const rawItems = result.data;
            if (!rawItems || rawItems.length === 0) throw new Error("No se encontraron items en la factura.");

            // Inicializamos los items
            setItems(rawItems.map((item, idx) => ({
                id: idx,
                name: item.name,
                price: item.price,
                assignedTo: [] // Al inicio nadie tiene asignado nada
            })));

            setStep('assign');

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al leer el recibo.");
        } finally {
            setIsLoading(false);
        }
    };

    // Gestión de Personas
    const addPerson = () => {
        const nextId = people.length > 0 ? Math.max(...people.map(p => p.id)) + 1 : 1;
        setPeople([...people, { id: nextId, name: `Persona ${nextId}` }]);
    };

    const updatePersonName = (id: number, name: string) => {
        setPeople(people.map(p => p.id === id ? { ...p, name } : p));
    };

    const removePerson = (id: number) => {
        if (people.length <= 1) return; // Mínimo 1 persona
        setPeople(people.filter(p => p.id !== id));
        // Si borramos a alguien, quitamos sus asignaciones
        setItems(items.map(i => ({
            ...i,
            assignedTo: i.assignedTo.filter(pid => pid !== id)
        })));
    };

    // Cálculo de Totales
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

    if (!isMounted) return <div className="min-h-screen bg-black" />;

    return (
        <div className="relative min-h-screen bg-[#0a0a0a] text-white font-sans pb-32 overflow-hidden selection:bg-indigo-500/30">
            <BackgroundBlobs />

            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 z-30 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 flex justify-between items-center transition-all duration-300">
                <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-indigo-500" />
                    <h1 className="font-bold text-xl text-white tracking-tight">
                        SplitPay
                    </h1>
                </div>
                {step !== 'upload' && (
                    <nav className="flex bg-[#1A1A1A] rounded-full p-1 border border-white/5">
                        <button
                            onClick={() => setStep('assign')}
                            className={`text-xs px-4 py-1.5 rounded-full transition-all duration-300 font-medium ${step === 'assign' ? 'bg-[#252525] text-white shadow-lg shadow-black/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Asignar
                        </button>
                        <button
                            onClick={() => setStep('summary')}
                            className={`text-xs px-4 py-1.5 rounded-full transition-all duration-300 font-medium ${step === 'summary' ? 'bg-[#252525] text-white shadow-lg shadow-black/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Resumen
                        </button>
                    </nav>
                )}
            </header>

            <main className="relative z-10 max-w-md mx-auto px-6 pt-28">

                {/* ERROR DISPLAY */}
                {error && (
                    <div className="mb-6 p-4 bg-red-400/5 border border-red-500/20 rounded-2xl flex gap-3 items-start animate-in slide-in-from-top-2 backdrop-blur-md">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-red-400 font-semibold text-sm mb-1">Error al procesar</h3>
                            <p className="text-red-200/60 text-xs leading-relaxed">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 transition-colors">✕</button>
                    </div>
                )}

                {/* --- PASO 1: UPLOAD --- */}
                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-in fade-in duration-700">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-8">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-white font-medium text-xl tracking-tight">Analizando Recibo...</p>
                                    <p className="text-gray-500 text-sm">Nuestra IA está leyendo los precios</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative group cursor-pointer">
                                    <label className="block cursor-pointer">
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                        <div className="w-64 h-64 bg-[#1A1A1A] rounded-full flex flex-col items-center justify-center border border-white/5 group-hover:border-indigo-500/30 group-hover:scale-105 transition-all duration-500 shadow-2xl relative z-10 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <Scan className="w-20 h-20 text-indigo-500 group-hover:text-indigo-400 transition-colors duration-300 mb-6" strokeWidth={1} />
                                            <span className="text-sm text-gray-400 font-medium px-6 py-2.5 bg-black/20 rounded-full backdrop-blur-md group-hover:bg-indigo-500/10 group-hover:text-indigo-300 transition-all border border-white/5">
                                                Escanear Recibo
                                            </span>
                                        </div>
                                    </label>
                                    {/* Glow Effect */}
                                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[80px] -z-10 opacity-30 group-hover:opacity-60 transition-all duration-700"></div>
                                </div>

                                <div className="text-center space-y-3 max-w-[280px]">
                                    <h2 className="text-2xl font-bold text-white tracking-tight">
                                        Divide la cuenta
                                    </h2>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Suba una foto clara de su factura. Detectamos todos los ítems automáticamente.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- PASO 2: ASIGNAR --- */}
                {step === 'assign' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">

                        {/* HERO TOTAL CARD */}
                        <div className="relative overflow-hidden rounded-3xl bg-[#1A1A1A] border border-white/5 p-8 text-center shadow-2xl">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <p className="text-indigo-400/80 text-xs font-bold uppercase tracking-widest mb-3">Total Detectado</p>
                            <h2 className="text-6xl font-bold text-white tracking-tighter mb-6">
                                ${totals.totalBill.toFixed(2)}
                            </h2>

                            {totals.unassigned > 0.01 ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Falta asignar: ${totals.unassigned.toFixed(2)}</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/10">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Cuenta cuadrada</span>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN PERSONAS */}
                        <section>
                            <div className="flex justify-between items-center mb-4 px-1">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Personas ({people.length})
                                </h2>
                                <button
                                    onClick={addPerson}
                                    className="text-xs bg-[#1A1A1A] hover:bg-[#222] border border-white/10 text-white px-4 py-2 rounded-full transition-all flex items-center gap-1.5 active:scale-95 shadow-lg"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Agregar
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {people.map(p => (
                                    <div key={p.id} className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <input
                                            value={p.name}
                                            onChange={(e) => updatePersonName(p.id, e.target.value)}
                                            className="relative w-full bg-[#111] text-white text-sm font-medium px-4 py-4 rounded-2xl border border-white/5 focus:border-indigo-500/50 focus:outline-none transition-all text-center focus:bg-[#151515] placeholder-gray-700"
                                            placeholder="Nombre"
                                        />
                                        {people.length > 1 && (
                                            <button
                                                onClick={() => removePerson(p.id)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 group-hover:scale-100 z-20"
                                                tabIndex={-1}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SECCIÓN ITEMS */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                                Items ({items.length})
                            </h2>

                            <div className="space-y-3">
                                {items.map(item => {
                                    const isAssigned = item.assignedTo.length > 0;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setModalItem(item)}
                                            className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden active:scale-[0.98] ${isAssigned
                                                ? 'bg-[#111] border-indigo-500/30 shadow-lg shadow-indigo-900/10'
                                                : 'bg-[#111] border-white/5 hover:bg-[#151515] hover:border-white/10'
                                                }`}
                                        >
                                            {/* Status Bar */}
                                            {isAssigned && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                                            )}

                                            <div className="flex justify-between items-start pl-3">
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-start justify-between">
                                                        <span className={`text-base font-semibold leading-snug ${isAssigned ? 'text-white' : 'text-gray-300'}`}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {isAssigned ? (
                                                            item.assignedTo.map(pid => {
                                                                const person = people.find(p => p.id === pid);
                                                                return person ? (
                                                                    <span key={pid} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#1A1A1A] text-gray-400 border border-white/5 uppercase tracking-wide">
                                                                        {person.name}
                                                                    </span>
                                                                ) : null;
                                                            })
                                                        ) : (
                                                            <span className="text-xs text-gray-600 font-medium italic flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Sin asignar
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className={`text-lg font-bold tracking-tight ${isAssigned ? 'text-[#9d25f4]' : 'text-gray-500'}`}>
                                                        ${item.price.toFixed(2)}
                                                    </div>
                                                    {isAssigned && item.assignedTo.length > 1 && (
                                                        <div className="text-[10px] text-gray-500 font-mono mt-1 opacity-70">
                                                            ${(item.price / item.assignedTo.length).toFixed(2)} c/u
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <div className="h-24"></div>
                        {/* Botón Flotante */}
                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent z-20 flex justify-center pointer-events-none">
                            <button
                                onClick={() => setStep('summary')}
                                className={`pointer-events-auto w-full max-w-sm py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-black/50 transition-all transform active:scale-95 text-lg tracking-wide ${totals.unassigned < 0.1
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-900/40 hover:brightness-110'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-900/40 hover:brightness-110'
                                    }`}
                            >
                                {totals.unassigned < 0.1 ? (
                                    <>Ver Cuentas Finales <ArrowRight className="w-5 h-5 ml-1" /></>
                                ) : (
                                    <>Ver Resumen <span className="opacity-70 text-sm ml-1 font-normal">({((1 - (totals.unassigned / totals.totalBill)) * 100).toFixed(0)}%)</span></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- PASO 3: RESUMEN FINAL --- */}
                {step === 'summary' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">

                        {/* Tarjeta Total */}
                        <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                            <p className="text-indigo-400/80 text-xs uppercase tracking-widest font-bold mb-4 relative z-10">Total de la Cuenta</p>
                            <h2 className="text-7xl font-black text-white tracking-tighter relative z-10">
                                ${totals.totalBill.toFixed(2)}
                            </h2>
                        </div>

                        {/* Lista de Deudores */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">Desglose por Persona</h3>
                            {people.map(p => {
                                const amount = totals.map.get(p.id) || 0;
                                if (amount === 0) return null;

                                return (
                                    <div key={p.id} className="bg-[#111] p-6 rounded-3xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-full bg-[#1A1A1A] flex items-center justify-center text-xl font-bold text-white shadow-inner border border-white/5">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="block font-bold text-xl text-white mb-0.5">{p.name}</span>
                                                <span className="text-xs text-gray-500 font-medium">Debe pagar</span>
                                            </div>
                                        </div>
                                        <span className="font-bold text-3xl text-emerald-400 tracking-tight font-mono">
                                            ${amount.toFixed(2)}
                                        </span>
                                    </div>
                                )
                            })}

                            {totals.unassigned > 0.01 && (
                                <div className="p-6 rounded-2xl border border-red-500/10 bg-red-500/5 text-center">
                                    <p className="text-red-300 text-sm font-medium">
                                        Oops, faltan <strong>${totals.unassigned.toFixed(2)}</strong> por asignar.
                                    </p>
                                    <button onClick={() => setStep('assign')} className="text-xs text-red-400 hover:text-red-300 underline mt-3 font-bold uppercase tracking-wide">
                                        Volver y corregir
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="pt-12 pb-8">
                            <button
                                onClick={() => {
                                    if (confirm("¿Seguro que quieres borrar todo y empezar de nuevo?")) {
                                        setItems([]);
                                        setStep('upload');
                                    }
                                }}
                                className="w-full text-center text-xs text-gray-600 hover:text-red-400 transition-colors py-4 font-medium uppercase tracking-widest opacity-60 hover:opacity-100"
                            >
                                Borrar y comenzar de nuevo
                            </button>
                        </div>
                    </div>
                )}

                {/* MODAL DE ASIGNACIÓN */}
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