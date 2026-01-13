'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Item, Person, RawItem } from '../types';
// Importamos el Server Action que acabamos de crear
import { analyzeReceiptAction } from '../actions/analyze-receipt';
// Importamos los componentes (asumiendo que están en la misma carpeta components)
import ImageUploader from './ImageUploader';
import Spinner from './Spinner';
import PersonCard from './PersonCard';
import ItemCard from './ItemCard';
import ItemAssignmentModal from './ItemAssignmentModal';

const BillSplitterFeature: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [nextPersonId, setNextPersonId] = useState<number>(1);
    const [modalItem, setModalItem] = useState<Item | null>(null);

    const handleImageUpload = async (file: File) => {
        setImageFile(file);
        setIsLoading(true);
        setError(null);
        setItems([]);
        setPeople([]);
        setNextPersonId(1);

        try {
            // Preparamos FormData para el Server Action
            const formData = new FormData();
            formData.append('file', file);

            // Llamada al Server Action
            const extractedItems: RawItem[] = await analyzeReceiptAction(formData);

            setItems(extractedItems.map((item, index) => ({
                id: index,
                name: item.name,
                price: item.price,
                assignedTo: [],
            })));

            // Inicializar personas por defecto
            const person1: Person = { id: 1, name: 'Yo' };
            const person2: Person = { id: 2, name: 'Amigo' };
            setPeople([person1, person2]);
            setNextPersonId(3);

        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Ocurrió un error desconocido procesando la imagen.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const addPerson = useCallback(() => {
        const newPerson: Person = { id: nextPersonId, name: `Persona ${nextPersonId}` };
        setPeople(p => [...p, newPerson]);
        setNextPersonId(id => id + 1);
    }, [nextPersonId]);


    const removePerson = (id: number) => {
        setPeople(p => p.filter(person => person.id !== id));
        setItems(currentItems =>
            currentItems.map(item => ({
                ...item,
                assignedTo: item.assignedTo.filter(personId => personId !== id),
            }))
        );
    };

    const handleUpdatePersonName = (id: number, newName: string) => {
        if (newName.trim() === '') return;
        setPeople(p =>
            p.map(person => (person.id === id ? { ...person, name: newName.trim() } : person))
        );
    };

    const handleOpenModal = (item: Item) => {
        setModalItem(item);
    };

    const handleCloseModal = () => {
        setModalItem(null);
    };

    const handleSaveAssignment = (itemId: number, assignedTo: number[]) => {
        setItems(currentItems =>
            currentItems.map(item =>
                item.id === itemId ? { ...item, assignedTo } : item
            )
        );
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

    const unassignedTotal = useMemo(() => {
        return items
            .filter(item => item.assignedTo.length === 0)
            .reduce((sum, item) => sum + item.price, 0);
    }, [items]);

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            {/* Header integrado */}
            <header className="text-center py-8 mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500">
                    Pago Compartido
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Escanea, asigna y divide la cuenta con IA.
                </p>
            </header>

            <div className="space-y-8">
                {!imageFile && (
                    <div className="max-w-2xl mx-auto">
                        <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} />
                        {isLoading && <div className="mt-4"><Spinner /></div>}
                    </div>
                )}

                {error && (
                    <div className="max-w-4xl mx-auto my-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <button
                            onClick={() => { setError(null); setImageFile(null); }}
                            className="block mt-2 text-sm underline hover:text-red-900"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                )}

                {items.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Columna Izquierda: Personas */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">Personas</h2>
                                <button onClick={addPerson} className="px-4 py-2 bg-indigo-500 text-white font-bold rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
                                    + Agregar
                                </button>
                            </div>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {people.map(person => (
                                    <PersonCard
                                        key={person.id}
                                        person={person}
                                        total={personTotals.get(person.id) || 0}
                                        onRemove={removePerson}
                                        onUpdateName={handleUpdatePersonName}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Columna Derecha: Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                                <h2 className="text-2xl font-bold text-gray-800">Cuenta</h2>
                                {unassignedTotal > 0 ? (
                                    <div className="text-right">
                                        <span className="text-sm text-gray-500 mr-2">Falta asignar:</span>
                                        <span className="font-bold text-rose-500 text-xl">${unassignedTotal.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <span className="text-teal-500 font-bold bg-teal-50 px-3 py-1 rounded-full">¡Todo asignado!</span>
                                )}
                            </div>
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border h-[600px] overflow-y-auto">
                                {items.map(item => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        people={people}
                                        onAssign={handleOpenModal}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ItemAssignmentModal
                item={modalItem}
                people={people}
                onClose={handleCloseModal}
                onSave={handleSaveAssignment}
            />

            {items.length > 0 && (
                <div className="fixed bottom-8 right-8">
                    <button
                        onClick={() => {
                            if (confirm('¿Quieres empezar una nueva cuenta? Se perderán los datos actuales.')) {
                                setImageFile(null); setItems([]); setPeople([]);
                            }
                        }}
                        className="bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-black transition-all"
                        title="Nueva Cuenta"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default BillSplitterFeature;
