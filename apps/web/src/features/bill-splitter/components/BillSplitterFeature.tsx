'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Item, Person, RawItem } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import Spinner from './Spinner';

type ViewMode = 'upload' | 'items' | 'summary';

const BillSplitterFeature: React.FC = () => {
    // State
    const [viewMode, setViewMode] = useState<ViewMode>('upload');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [nextPersonId, setNextPersonId] = useState<number>(1);
    const [isSSR, setIsSSR] = useState(true);

    // File input ref for the FAB
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Avoid hydration mismatch
    useEffect(() => {
        setIsSSR(false);
        // Initialize default people if empty
        if (people.length === 0) {
            setPeople([
                { id: 1, name: 'Tú' },
                { id: 2, name: 'Ana' },
            ]);
            setNextPersonId(3);
        }
    }, [people.length]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setItems([]);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const extractedItems: RawItem[] = await analyzeReceiptAction(formData);

            setItems(extractedItems.map((item, index) => ({
                id: index,
                name: item.name,
                price: item.price,
                assignedTo: [],
            })));

            setViewMode('items');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Error procesando la factura.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItemAssignment = (itemId: number, personId: number) => {
        setItems(current => current.map(item => {
            if (item.id === itemId) {
                const isAssigned = item.assignedTo.includes(personId);
                return {
                    ...item,
                    assignedTo: isAssigned
                        ? item.assignedTo.filter(id => id !== personId)
                        : [...item.assignedTo, personId]
                };
            }
            return item;
        }));
    };

    const personTotals = useMemo(() => {
        const totals = new Map<number, number>();
        people.forEach(person => totals.set(person.id, 0));

        items.forEach(item => {
            if (item.assignedTo.length > 0) {
                const pricePerPerson = item.price / item.assignedTo.length;
                item.assignedTo.forEach(personId => {
                    totals.set(personId, (totals.get(personId) || 0) + pricePerPerson);
                });
            }
        });
        return totals;
    }, [items, people]);

    const grandTotal = useMemo(() => {
        return items.reduce((sum, item) => sum + item.price, 0);
    }, [items]);

    const getPersonInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    if (isSSR) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-dark">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="relative z-10 flex flex-col h-screen max-w-md mx-auto overflow-hidden bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white antialiased">

            {/* Organic Background Shapes */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/10 blur-[100px] mix-blend-screen opacity-50"></div>
                <div className="absolute top-[40%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen opacity-50"></div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="fixed top-4 left-4 right-4 z-[100] p-4 bg-red-500/90 backdrop-blur-md text-white rounded-xl shadow-lg flex justify-between items-center animate-in fade-in slide-in-from-top-4">
                    <p className="text-sm font-bold">{error}</p>
                    <button onClick={() => setError(null)} className="material-symbols-outlined w-6 h-6">close</button>
                </div>
            )}

            {/* View Switching */}
            {viewMode === 'upload' && (
                <div className="relative z-10 flex flex-col h-full items-center justify-center px-6 text-center space-y-12">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">Pago Compartido</h1>
                        <p className="text-gray-400 text-lg">Escanea tu recibo y divide la cuenta con IA</p>
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="group relative flex flex-col items-center gap-6 p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300 w-full shadow-2xl"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Spinner />
                                <span className="text-primary font-bold animate-pulse">Analizando Recibo...</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                    <span className="material-symbols-outlined text-5xl">document_scanner</span>
                                </div>
                                <span className="text-xl font-bold text-white">Escanear Recibo</span>
                            </>
                        )}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
            )}

            {viewMode === 'items' && (
                <>
                    {/* Header Section */}
                    <header className="relative z-20 flex-none px-6 pt-12 pb-2">
                        <div className="flex items-center justify-between h-12 mb-4">
                            <button
                                onClick={() => setViewMode('upload')}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm text-white"
                            >
                                <span className="material-symbols-outlined w-6 h-6">arrow_back</span>
                            </button>
                            <button
                                onClick={() => setViewMode('summary')}
                                className="px-4 py-2 text-sm font-bold text-neon-green hover:text-white transition-colors"
                            >
                                Resumen
                            </button>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">Asignar Ítems</h1>
                            <p className="text-gray-400 text-sm font-medium">Toca un ítem para asignártelo</p>
                        </div>
                    </header>

                    {/* Summary / Total */}
                    <div className="relative z-20 flex-none px-6 py-4">
                        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-md">
                            <span className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-widest">Total del Recibo</span>
                            <h2 className="text-4xl font-extrabold text-white tracking-tight">$ {grandTotal.toFixed(2)}</h2>
                        </div>
                    </div>

                    {/* Scrollable List Area */}
                    <div className="relative z-20 flex-1 overflow-y-auto no-scrollbar px-6 pb-32 space-y-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-2">Ítems ({items.length})</p>

                        {items.map(item => {
                            const isAssignedToMe = item.assignedTo.includes(1); // "Tú" is ID 1
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItemAssignment(item.id, 1)}
                                    className={`group relative border transition-all duration-300 rounded-2xl p-4 cursor-pointer active:scale-95 ${isAssignedToMe
                                            ? 'bg-card-dark border-primary/40 shadow-glow'
                                            : 'bg-card-dark/60 border-white/5 border-dashed hover:bg-card-dark'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="pr-4">
                                            <p className="text-white text-lg font-bold leading-tight">{item.name}</p>
                                        </div>
                                        <div className="shrink-0">
                                            <p className={`text-xl font-bold tracking-tight transition-colors ${isAssignedToMe ? 'text-primary' : 'text-gray-400 opacity-70'}`}>
                                                ${item.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {item.assignedTo.map(pId => {
                                            const person = people.find(p => p.id === pId);
                                            if (!person) return null;
                                            return (
                                                <div key={pId} className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-[10px] font-bold ${pId === 1 ? 'bg-primary/20 border border-primary/20 text-white' : 'bg-white/5 border border-white/5 text-gray-300'}`}>
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${pId === 1 ? 'bg-gradient-to-br from-primary to-fuchsia-500' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                                                        {getPersonInitials(person.name)}
                                                    </div>
                                                    <span>{pId === 1 ? 'Tú' : person.name}</span>
                                                </div>
                                            );
                                        })}
                                        {item.assignedTo.length === 0 && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                                                <span className="text-[10px] uppercase font-bold tracking-tighter">Sin asignar</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="h-8"></div>
                    </div>

                    {/* Bottom Gradient Overlay */}
                    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background-dark to-transparent pointer-events-none z-20"></div>
                </>
            )}

            {viewMode === 'summary' && (
                <>
                    {/* Top App Bar */}
                    <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/5">
                        <button
                            onClick={() => setViewMode('items')}
                            className="text-gray-800 dark:text-white flex size-12 shrink-0 items-center justify-start hover:opacity-70 transition-opacity"
                        >
                            <span className="material-symbols-outlined w-7 h-7">arrow_back</span>
                        </button>
                        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Resumen de Gastos</h2>
                        <div className="w-12"></div>
                    </div>

                    {/* Grand Total Headline */}
                    <div className="relative z-10 flex flex-col items-center justify-center pt-8 pb-10 text-center">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Consumido</span>
                        <h1 className="text-gray-900 dark:text-white tracking-tight text-5xl font-extrabold leading-none px-4 inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            ${grandTotal.toFixed(2)}
                        </h1>
                    </div>

                    {/* List of Person Cards */}
                    <div className="relative z-10 flex flex-col gap-5 px-5 pb-40 overflow-y-auto no-scrollbar">
                        {people.map(person => {
                            const total = personTotals.get(person.id) || 0;
                            const assignedItems = items.filter(it => it.assignedTo.includes(person.id));
                            const initials = getPersonInitials(person.name);
                            const isMe = person.id === 1;

                            return (
                                <div key={person.id} className="group relative flex flex-col gap-4 bg-white dark:bg-card-dark p-6 rounded-2xl shadow-xl dark:shadow-none border border-gray-100 dark:border-white/5 transition-all hover:border-primary/20">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Avatar */}
                                        <div className={`aspect-square rounded-full h-14 w-14 flex items-center justify-center shrink-0 shadow-lg ${isMe ? 'bg-gradient-to-br from-primary to-fuchsia-500 shadow-primary/30' : 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-blue-500/30'
                                            }`}>
                                            <span className="text-white text-lg font-bold tracking-tight">{initials}</span>
                                        </div>
                                        {/* Content */}
                                        <div className="flex flex-1 flex-col">
                                            <div className="flex justify-between items-start">
                                                <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight">{person.name}</p>
                                                <span className="material-symbols-outlined text-gray-600 w-5 h-5">expand_more</span>
                                            </div>
                                            {/* Large Total */}
                                            <p className={`text-3xl font-extrabold leading-tight mt-1 mb-3 ${total > 0 ? 'text-primary' : 'text-gray-500 opacity-50'}`}>
                                                ${total.toFixed(2)}
                                            </p>
                                            {/* Items List */}
                                            <div className="flex flex-wrap gap-2">
                                                {assignedItems.length > 0 ? (
                                                    assignedItems.map(it => (
                                                        <div key={it.id} className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-white/5 px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-transparent dark:border-white/5">
                                                            {it.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-400 dark:text-gray-600 text-xs italic font-medium">Sin ítems asignados</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-12 z-50">
                        <button
                            onClick={() => alert('¡Proximamente integración con Mercado Pago!')}
                            className="w-full bg-primary hover:bg-purple-600 text-white font-bold text-lg py-4 rounded-2xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined w-6 h-6">payment</span>
                            Dividir con Amigos
                        </button>
                    </div>
                </>
            )}

            {/* Floating Scan Button (Global) */}
            {(viewMode === 'items' || viewMode === 'summary') && (
                <div className="fixed bottom-28 left-0 right-0 flex justify-center z-[60] pointer-events-none">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="pointer-events-auto shadow-glow group relative flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all duration-300 transform active:scale-95"
                    >
                        <span className="material-symbols-outlined text-white text-[24px] w-6 h-6">document_scanner</span>
                        <span className="text-white font-bold text-sm tracking-wide">Nuevo Escaneo</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
            )}
        </div>
    );
};

export default BillSplitterFeature;
