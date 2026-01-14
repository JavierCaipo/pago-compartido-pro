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

  useEffect(() => {
    if (item) setSelected(item.assignedTo);
  }, [item]);

  if (!item) return null;

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const splitPrice = selected.length > 0 ? item.price / selected.length : item.price;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] border-t sm:border border-white/10 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">

        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wider">Asignando</h3>
            <h2 className="text-lg font-bold text-white leading-tight">{item.name}</h2>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-indigo-400">${item.price.toFixed(2)}</div>
            {selected.length > 1 && (
              <div className="text-xs text-gray-500">${splitPrice.toFixed(2)} c/u</div>
            )}
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-6 custom-scrollbar">
          {people.map(p => {
            const isSelected = selected.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-white/20' : 'bg-gray-700'}`}>
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-medium">{p.name}</span>
                </div>
                {isSelected && <span>✓</span>}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3.5 rounded-xl font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onSave(item.id, selected); onClose(); }}
            className="py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-colors"
          >
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
}