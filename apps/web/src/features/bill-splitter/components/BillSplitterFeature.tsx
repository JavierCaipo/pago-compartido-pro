'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Person } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import ItemAssignmentModal from './ItemAssignmentModal';

// --- ICONOS PREMIUM ---
const Icons = {
    Scan: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="2" /></svg>,
    Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>,
    Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>,
    Sparkles: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
};

// --- UTILIDAD DE COMPRESIÓN DE IMAGEN ---
const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Redimensionar si es muy grande (Max 1024px)
                const MAX_WIDTH = 1024;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Comprimir a JPEG calidad 70%
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error('Error al comprimir imagen'));
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.7);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        setIsLoading(true);
        setError(null);

        try {
            // 1. COMPRIMIR IMAGEN (Soluciona error móvil)
            const compressedFile = await compressImage(rawFile);

            const formData = new FormData();
            formData.append('file', compressedFile);

            const result = await analyzeReceiptAction(formData);

            if (!result.success) throw new Error((result as any).error);

            const rawItems = result.data;
            if (!rawItems || rawItems.length === 0) throw new Error("No se encontraron items.");

            setItems(rawItems.map((item, idx) => ({
                id: idx, name: item.name, price: item.price, assignedTo: []
            })));
            setStep('assign');

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
                item.assignedTo.forEach(pid => map.set(pid, (map.get(pid) || 0) + splitPrice));
            }
        });
        return { map, totalBill, unassigned };
    }, [items, people]);

    if (!isMounted) return <div className="min-h-screen bg-black" />;

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">

            {/* BACKGROUND BLOBS */}
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* HEADER */}
            <header className="p-6 flex justify-between items-center relative z-20">
                <h1 className="font-bold text-xl tracking-tight flex items-center gap-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Pago</span>
                    <span className="text-white">Compartido</span>
                </h1>
                {step !== 'upload' && (
                    <button onClick={() => { setItems([]); setStep('upload'); }} className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">
                        Reiniciar
                    </button>
                )}
            </header>

            <main className="max-w-md mx-auto px-6 relative z-10 pb-32">

                {/* ERROR MSG */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                        <p className="text-red-300 text-xs font-medium">{error}</p>
                        <button onClick={() => setError(null)} className="text-white opacity-50 hover:opacity-100">✕</button>
                    </div>
                )}

                {/* --- PASO 1: UPLOAD (Scanner) --- */}
                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
                        {isLoading ? (
                            <div className="text-center">
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-purple-400"><Icons.Sparkles /></div>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Analizando Recibo</h2>
                                <p className="text-zinc-500 text-sm">Optimizando imagen y leyendo precios...</p>
                            </div>
                        ) : (
                            <>
                                <div className="relative group">
                                    <label className="cursor-pointer block">
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                        <div className="w-56 h-56 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2rem] border border-zinc-700 flex flex-col items-center justify-center shadow-2xl group-hover:border-purple-500/50 group-hover:shadow-purple-500/20 transition-all duration-300 transform group-hover:scale-105">
                                            <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center text-white mb-4 shadow-inner group-hover:text-purple-400 transition-colors">
                                                <Icons.Scan />
                                            </div>
                                            <span className="font-bold text-lg text-white">Escanear</span>
                                            <span className="text-xs text-zinc-500 mt-1">Toca para subir foto</span>
                                        </div>
                                    </label>
                                    <div className="absolute inset-0 bg-purple-600/20 rounded-[2rem] blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-zinc-400 text-sm font-medium">Formatos soportados</p>
                                    <div className="flex gap-2 justify-center">
                                        <span className="px-3 py-1 bg-zinc-900 rounded-full text-[10px] text-zinc-500 border border-zinc-800">JPG</span>
                                        <span className="px-3 py-1 bg-zinc-900 rounded-full text-[10px] text-zinc-500 border border-zinc-800">PNG</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- PASO 2: ASIGNAR --- */}
                {step === 'assign' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">

                        {/* HERO CARD */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 mb-8 text-center relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">Total a Dividir</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter">${totals.totalBill.toFixed(2)}</h2>

                            {totals.unassigned > 0.01 ? (
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                                    <span className="text-xs text-zinc-400 font-medium">Falta asignar: <span className="text-white">${totals.unassigned.toFixed(2)}</span></span>
                                </div>
                            ) : (
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-900/50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs text-emerald-400 font-medium">¡Todo asignado!</span>
                                </div>
                            )}
                        </div>

                        {/* PERSONAS */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Participantes</h3>
                                <button onClick={addPerson} className="text-purple-400 text-xs font-bold hover:text-purple-300">+ Nuevo</button>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                                {people.map(p => (
                                    <div key={p.id} className="relative flex-shrink-0 group">
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-14 px-5 flex items-center justify-center min-w-[100px] shadow-sm group-hover:border-purple-500/50 transition-colors">
                                            <input
                                                value={p.name}
                                                onChange={(e) => updatePersonName(p.id, e.target.value)}
                                                className="bg-transparent text-white text-sm font-medium text-center w-full focus:outline-none"
                                            />
                                        </div>
                                        {people.length > 1 && (
                                            <button onClick={() => updatePersonName(p.id, "")} className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-800 rounded-full text-zinc-500 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-700">✕</button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addPerson} className="flex-shrink-0 w-14 h-14 rounded-2xl bg-zinc-900/50 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-all">
                                    <Icons.Plus />
                                </button>
                            </div>
                        </div>

                        {/* LISTA ITEMS */}
                        <div className="space-y-3 mb-32">
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 px-1">Consumos</h3>
                            {items.map(item => {
                                const isAssigned = item.assignedTo.length > 0;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setModalItem(item)}
                                        className={`relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group ${isAssigned
                                                ? 'bg-zinc-900 border-purple-500/30 shadow-[0_4px_20px_-10px_rgba(147,51,234,0.3)]'
                                                : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="flex-1 pr-4">
                                                <h4 className={`text-sm font-medium leading-relaxed ${isAssigned ? 'text-white' : 'text-zinc-400'}`}>{item.name}</h4>
                                                <div className="mt-2 flex items-center gap-2">
                                                    {isAssigned ? (
                                                        <div className="flex -space-x-2">
                                                            {item.assignedTo.map(pid => (
                                                                <div key={pid} className="w-6 h-6 rounded-full bg-purple-600 border-2 border-zinc-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                                                                    {people.find(p => p.id === pid)?.name.charAt(0)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-zinc-800">Toca para asignar</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-base font-bold ${isAssigned ? 'text-purple-400' : 'text-zinc-500'}`}>${item.price.toFixed(2)}</span>
                                                {isAssigned && item.assignedTo.length > 1 && (
                                                    <div className="text-[10px] text-zinc-500 mt-1 font-medium bg-zinc-950/50 px-1.5 py-0.5 rounded-md inline-block">
                                                        ${(item.price / item.assignedTo.length).toFixed(2)} c/u
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isAssigned && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500"></div>}
                                    </div>
                                )
                            })}
                        </div>

                        {/* BOTÓN FLOTANTE */}
                        <div className="fixed bottom-6 left-6 right-6 z-40">
                            <button
                                onClick={() => setStep('summary')}
                                disabled={totals.unassigned > 0.1}
                                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${totals.unassigned < 0.1
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-900/40 hover:scale-[1.02]'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                                    }`}
                            >
                                {totals.unassigned < 0.1 ? (
                                    <>Ver Resumen Final <Icons.ArrowRight /></>
                                ) : (
                                    `Faltan asignar $${totals.unassigned.toFixed(2)}`
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- PASO 3: RESUMEN FINAL --- */}
                {step === 'summary' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pt-8">
                        <div className="text-center mb-12">
                            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-3">Total del Grupo</p>
                            <h2 className="text-6xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
                                ${totals.totalBill.toFixed(2)}
                            </h2>
                        </div>

                        <div className="space-y-4 mb-32">
                            {people.map(p => {
                                const amount = totals.map.get(p.id) || 0;
                                if (amount === 0) return null;
                                return (
                                    <div key={p.id} className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-purple-900/20">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white">{p.name}</h3>
                                                <p className="text-xs text-zinc-500">Su parte</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-bold text-white">${amount.toFixed(2)}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="fixed bottom-6 left-6 right-6 z-40 flex flex-col gap-3">
                            <button className="w-full py-4 rounded-2xl font-bold text-sm bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg">
                                Compartir Resultados
                            </button>
                            <button
                                onClick={() => { setItems([]); setStep('upload'); }}
                                className="w-full py-4 rounded-2xl font-bold text-sm bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                            >
                                Empezar de nuevo
                            </button>
                        </div>
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