'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Item, Person, RawItem } from '../types';
import { analyzeReceiptAction } from '../actions/analyze-receipt';
import ItemAssignmentModal from './ItemAssignmentModal';

// --- Iconos Inline (Para no depender de librerías externas por ahora) ---
const Icons = {
    Upload: () => (
        <svg className="w-12 h-12 text-indigo-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
    ),
    Camera: () => (
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    UserPlus: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
    ),
    Check: () => (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Trash: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
};

export default function BillSplitterFeature() {
    // Estado para evitar errores de hidratación/SSR
    const [isMounted, setIsMounted] = useState(false);

    // Estados de la App
    const [view, setView] = useState<'items' | 'summary'>('items');
    const [items, setItems] = useState<Item[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalItem, setModalItem] = useState<Item | null>(null);

    // Efecto para marcar montaje
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- Lógica de Negocio ---

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

            // Personas iniciales
            setPeople([
                { id: 1, name: 'Yo' },
                { id: 2, name: 'Amigo' }
            ]);

        } catch (err) {
            console.error(err);
            setError("No pudimos leer el recibo. Intenta con una imagen más clara.");
        } finally {
            setIsLoading(false);
        }
    };

    const addPerson = () => {
        const nextId = people.length > 0 ? Math.max(...people.map(p => p.id)) + 1 : 1;
        setPeople([...people, { id: nextId, name: `Persona ${nextId}` }]);
    };

    const removePerson = (id: number) => {
        setPeople(people.filter(p => p.id !== id));
        setItems(items.map(item => ({
            ...item,
            assignedTo: item.assignedTo.filter(pId => pId !== id)
        })));
    };

    const handleAssign = (itemId: number, assignedTo: number[]) => {
        setItems(items.map(i => i.id === itemId ? { ...i, assignedTo } : i));
    };

    // Cálculos
    const totals = useMemo(() => {
        const map = new Map<number, number>();
        people.forEach(p => map.set(p.id, 0));

        let unassigned = 0;

        items.forEach(item => {
            if (item.assignedTo.length === 0) {
                unassigned += item.price;
            } else {
                const splitPrice = item.price / item.assignedTo.length;
                item.assignedTo.forEach(pId => {
                    map.set(pId, (map.get(pId) || 0) + splitPrice);
                });
            }
        });

        return { map, unassigned };
    }, [items, people]);

    // --- Renderizado Seguro (SSR Fix) ---
    if (!isMounted) return <div className="min-h-screen bg-gray-50" />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">

            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                        🧾 Pago Compartido
                    </h1>
                    {items.length > 0 && (
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setView('items')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${view === 'items' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            >
                                Items
                            </button>
                            <button
                                onClick={() => setView('summary')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${view === 'summary' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            >
                                Resumen
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6">

                {/* Estado Inicial: Carga */}
                {items.length === 0 && !isLoading && (
                    <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md mx-auto">
                        <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icons.Upload />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Sube tu factura</h2>
                        <p className="text-gray-500 mb-8">La IA detectará los artículos y precios automáticamente.</p>

                        <label className="block w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-transform active:scale-95 shadow-lg shadow-indigo-200">
                            <span>📸 Escanear o Subir Imagen</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Estado de Carga */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-500 animate-pulse">Analizando recibo con IA...</p>
                    </div>
                )}

                {/* Vista Principal */}
                {items.length > 0 && view === 'items' && (
                    <div className="grid md:grid-cols-3 gap-6">

                        {/* Columna Izquierda: Personas (Sticky en Desktop) */}
                        <div className="md:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-24">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-700">Personas</h3>
                                    <button onClick={addPerson} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-full">
                                        <Icons.UserPlus />
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {people.map(person => (
                                        <div key={person.id} className="flex justify-between items-center group p-2 hover:bg-gray-50 rounded-lg">
                                            <input
                                                className="bg-transparent border-none focus:ring-0 font-medium text-gray-800 w-full"
                                                value={person.name}
                                                onChange={(e) => setPeople(people.map(p => p.id === person.id ? { ...p, name: e.target.value } : p))}
                                            />
                                            <button onClick={() => removePerson(person.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Lista de Items */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex justify-between items-end px-1">
                                <h3 className="font-bold text-gray-700">Artículos ({items.length})</h3>
                                {totals.unassigned > 0 && (
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                                        Falta: ${totals.unassigned.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {items.map(item => {
                                const isAssigned = item.assignedTo.length > 0;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setModalItem(item)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.99] ${isAssigned ? 'bg-white border-indigo-100 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-300'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-medium ${isAssigned ? 'text-gray-900' : 'text-gray-700'}`}>{item.name}</p>
                                                    {isAssigned && <Icons.Check />}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {isAssigned
                                                        ? item.assignedTo.map(id => people.find(p => p.id === id)?.name).join(', ')
                                                        : 'Toque para asignar'}
                                                </p>
                                            </div>
                                            <span className="font-bold text-lg text-indigo-600 ml-4">
                                                ${item.price.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Vista Resumen */}
                {items.length > 0 && view === 'summary' && (
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        {people.map(person => {
                            const amount = totals.map.get(person.id) || 0;
                            if (amount === 0) return null;
                            return (
                                <div key={person.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800">{person.name}</h3>
                                        <p className="text-gray-500 text-sm">Debe pagar</p>
                                    </div>
                                    <div className="text-3xl font-black text-indigo-600 tracking-tight">
                                        ${amount.toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            onClick={() => {
                                if (confirm('¿Reiniciar todo?')) {
                                    setItems([]);
                                    setView('items');
                                }
                            }}
                            className="w-full py-4 text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
                        >
                            Comenzar nueva cuenta
                        </button>
                    </div>
                )}
            </main>

            {/* Modal de Asignación */}
            <ItemAssignmentModal
                item={modalItem}
                people={people}
                onClose={() => setModalItem(null)}
                onSave={(itemId, assigned) => {
                    handleAssign(itemId, assigned);
                    setModalItem(null);
                }}
            />
        </div>
    );
}