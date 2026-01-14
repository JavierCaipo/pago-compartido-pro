import React, { useState, useEffect } from 'react';
import { Item, Person } from '../types';

interface ItemAssignmentModalProps {
  item: Item | null;
  people: Person[];
  onClose: () => void;
  onSave: (itemId: number, assignedTo: number[]) => void;
}

const ItemAssignmentModal: React.FC<ItemAssignmentModalProps> = ({ item, people, onClose, onSave }) => {
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);

  useEffect(() => {
    if (item) {
      setSelectedPeople(item.assignedTo);
    }
  }, [item]);

  if (!item) return null;

  const handleTogglePerson = (personId: number) => {
    setSelectedPeople(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const handleSave = () => {
    onSave(item.id, selectedPeople);
    onClose();
  };

  const pricePerPerson = selectedPeople.length > 0 ? (item.price / selectedPeople.length).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center z-[100] p-0 md:p-4">
      <div
        className="bg-[#121212] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in slide-in-from-bottom-10 duration-300"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Asignar Item</h2>
            <p className="text-white/40 text-sm">Selecciona quién pagará esto</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8 p-6 bg-white/5 rounded-[2rem] border border-white/5">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{item.name}</p>
          <div className="flex justify-between items-end">
            <p className="text-4xl font-bold tracking-tighter">${item.price.toFixed(2)}</p>
            {selectedPeople.length > 1 && (
              <p className="text-emerald-400 text-sm font-mono pb-1">
                ${pricePerPerson} c/u
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {people.map(person => {
            const isSelected = selectedPeople.includes(person.id);
            return (
              <button
                key={person.id}
                onClick={() => handleTogglePerson(person.id)}
                className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 border ${isSelected
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-white/5 border-transparent hover:border-white/10'
                  }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                  }`}>
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`ml-4 font-semibold text-lg ${isSelected ? 'text-white' : 'text-white/60'}`}>{person.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            className="h-14 font-bold text-white/40 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="h-14 bg-white text-black rounded-full font-bold hover:bg-white/90 active:scale-95 transition-all shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)]"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemAssignmentModal;
