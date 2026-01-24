import React, { useState, useEffect } from 'react';
import { Item, Person } from '../types';

interface Props {
  item: Item | null;
  people: Person[];
  onClose: () => void;
  onSave: (itemId: number, assignedTo: number[]) => void;
}

export default function ItemAssignmentModal({ item, people, onClose, onSave }: Props) {
  const [selected, setSelected] = useState<number[]>([]);

  // Al abrir, cargar los asignados actuales
  useEffect(() => {
    if (item) setSelected(item.assignedTo);
  }, [item]);

  if (!item) return null;

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Cálculo en tiempo real de cuánto pagaría cada uno
  const splitPrice = selected.length > 0 ? item.price / selected.length : item.price;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">

      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative bg-[#111] border-t sm:border border-white/10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">

        {/* Header del Item */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/5">
          <div>
            <h3 className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Asignando Item</h3>
            <h2 className="text-xl font-bold text-white leading-tight pr-4">{item.name}</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-indigo-400">${item.price.toFixed(2)}</div>
            {selected.length > 1 && (
              <div className="text-xs text-emerald-400 font-mono mt-1">
                ${splitPrice.toFixed(2)} c/u
              </div>
            )}
          </div>
        </div>

        {/* Lista de Personas */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto mb-8 pr-1 custom-scrollbar">
          {people.map(p => {
            const isSelected = selected.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50'
                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'bg-white text-indigo-600' : 'bg-gray-700 text-gray-300'}`}>
                    {p.name.charAt(0)}
                  </div>
                  <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>{p.name}</span>
                </div>

                {isSelected ? (
                  <span className="text-white font-bold text-lg">✓</span>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-600"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-4 rounded-xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onSave(item.id, selected); onClose(); }}
            className="py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            Confirmar ({selected.length})
          </button>
        </div>

      </div>
    </div>
  );
}