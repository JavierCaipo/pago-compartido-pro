'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Person } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import ItemAssignmentModal from './ItemAssignmentModal';

// --- ICONOS SEGUROS (Con estilos inline para evitar bugs visuales) ---
const Icons = {
    Scan: () => (
        <svg
            style={{ width: '64px', height: '64px', display: 'block', margin: '0 auto', color: 'white' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Users: () => (
        <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Check: () => (
        <svg style={{ width: '20px', height: '20px' }} className="text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Plus: () => (
        <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    )
};

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

            // Llamamos al Server Action (Versión Model Hunter)
            const result = await analyzeReceiptAction(formData);

            // Verificamos si hubo éxito o error
            if (!result.success) {
                // Corrección de TypeScript aplicada aquí
                throw new Error((result as any).error);
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

            setStep('assign'); // Pasamos al paso 2

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

    // Cálculo de Totales (La magia matemática)
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
                // DIVISIÓN: Si un plato cuesta $20 y son 2 personas, son $10 c/u
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
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans pb-32">

            {/* HEADER */}
            <header className="p-4 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur sticky top-0 z-20 flex justify-between items-center">
                <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Pago Compartido
                </h1>
                {step !== 'upload' && (
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setStep('assign')}
                            className={`text-xs px-3 py-1 rounded-md transition-all ${step === 'assign' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Asignar
                        </button>
                        <button
                            onClick={() => setStep('summary')}
                            className={`text-xs px-3 py-1 rounded-md transition-all ${step === 'summary' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Resumen
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-md mx-auto px-4 py-6">

                {/* ERROR DISPLAY */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex justify-between items-start animate-in slide-in-from-top-2">
                        <div>
                            <h3 className="text-red-400 font-bold text-sm mb-1">Error</h3>
                            <p className="text-red-200 text-xs">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 font-bold ml-4">✕</button>
                    </div>
                )}

                {/* --- PASO 1: UPLOAD --- */}
                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                        {isLoading ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                                <p className="text-indigo-300 animate-pulse text-sm font-medium">Leyendo factura...</p>
                                <p className="text-xs text-gray-500">Probando modelos de IA...</p>
                            </div>
                        ) : (
                            <>
                                <div className="relative group">
                                    <label className="block cursor-pointer">
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                        <div className="w-48 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 group-hover:border-indigo-500/50 group-hover:scale-105 transition-all shadow-2xl">
                                            <Icons.Scan />
                                            <span className="text-xs text-gray-300 mt-4 font-medium px-4 py-2 bg-white/5 rounded-full">Escanear Recibo</span>
                                        </div>
                                    </label>
                                    {/* Efecto Glow */}
                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <p className="text-gray-500 text-xs text-center max-w-[200px]">
                                    Sube una foto. Nosotros detectamos los precios y tú divides la cuenta.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* --- PASO 2: ASIGNAR --- */}
                {step === 'assign' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

                        {/* SECCIÓN PERSONAS */}
                        <section className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Icons.Users /> Personas
                                </h2>
                                <button
                                    onClick={addPerson}
                                    className="text-xs bg-indigo-600/80 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                                >
                                    <Icons.Plus /> Agregar
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {people.map(p => (
                                    <div key={p.id} className="relative group">
                                        <input
                                            value={p.name}
                                            onChange={(e) => updatePersonName(p.id, e.target.value)}
                                            className="w-full bg-black/40 text-white text-sm px-3 py-2 rounded-lg border border-white/5 focus:border-indigo-500 focus:outline-none transition-all text-center"
                                        />
                                        {people.length > 1 && (
                                            <button
                                                onClick={() => removePerson(p.id)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SECCIÓN ITEMS */}
                        <section className="space-y-3">
                            <div className="flex justify-between items-end px-1 pb-2 border-b border-white/5">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Items Detectados ({items.length})
                                </h2>
                                {totals.unassigned > 0.01 ? (
                                    <span className="text-[10px] font-bold text-red-300 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                                        Falta asignar: ${totals.unassigned.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                        ¡Todo Asignado!
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {items.map(item => {
                                    const isAssigned = item.assignedTo.length > 0;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setModalItem(item)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden group ${isAssigned
                                                    ? 'bg-indigo-500/10 border-indigo-500/40'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start relative z-10">
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-medium ${isAssigned ? 'text-indigo-200' : 'text-gray-300'}`}>{item.name}</span>
                                                        {isAssigned && <Icons.Check />}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                                        {isAssigned
                                                            ? item.assignedTo.map(pid => people.find(p => p.id === pid)?.name).join(', ')
                                                            : 'Toca para asignar a alguien...'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-white">${item.price.toFixed(2)}</div>
                                                    {isAssigned && item.assignedTo.length > 1 && (
                                                        <div className="text-[10px] text-indigo-300 font-mono mt-1">
                                                            ${(item.price / item.assignedTo.length).toFixed(2)} c/u
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Barra de progreso visual si está asignado */}
                                            {isAssigned && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Botón Flotante para ir al Resumen (solo si todo está asignado o casi) */}
                        <div className="sticky bottom-4 pt-4 bg-gradient-to-t from-[#0a0a0a] to-transparent">
                            <button
                                onClick={() => setStep('summary')}
                                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 ${totals.unassigned < 0.1
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                    }`}
                            >
                                {totals.unassigned < 0.1 ? 'Ver Cuentas Finales →' : 'Ver Resumen Parcial'}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- PASO 3: RESUMEN FINAL --- */}
                {step === 'summary' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">

                        {/* Tarjeta Total */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-center shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <p className="text-indigo-100 text-xs uppercase tracking-widest font-medium mb-2">Total de la Cuenta</p>
                            <h2 className="text-5xl font-black text-white tracking-tight">${totals.totalBill.toFixed(2)}</h2>
                        </div>

                        {/* Lista de Deudores */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-2">Desglose por Persona</h3>
                            {people.map(p => {
                                const amount = totals.map.get(p.id) || 0;
                                if (amount === 0) return null;

                                return (
                                    <div key={p.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="block font-bold text-gray-200">{p.name}</span>
                                                <span className="text-[10px] text-gray-500">Debe pagar</span>
                                            </div>
                                        </div>
                                        <span className="font-bold text-xl text-emerald-400 font-mono">${amount.toFixed(2)}</span>
                                    </div>
                                )
                            })}

                            {totals.unassigned > 0.01 && (
                                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-center">
                                    <p className="text-red-300 text-sm">
                                        Quedan <strong>${totals.unassigned.toFixed(2)}</strong> sin asignar.
                                    </p>
                                    <button onClick={() => setStep('assign')} className="text-xs text-red-400 underline mt-1">Volver y asignar</button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                if (confirm("¿Seguro que quieres borrar todo y empezar de nuevo?")) {
                                    setItems([]);
                                    setStep('upload');
                                }
                            }}
                            className="w-full py-4 text-xs text-gray-500 hover:text-red-400 transition-colors mt-8"
                        >
                            Comenzar nueva cuenta (Borrar datos)
                        </button>
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