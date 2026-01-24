import React, { useState, useEffect } from 'react';
import { Item, Person } from '../types';
import { Check, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      <div className="relative w-full sm:max-w-md bg-[#1A1A1A] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[85vh]">

        {/* Drag Handle (Mobile aesthetic) */}
        <div className="w-full h-6 flex items-center justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-white/10"></div>
        </div>

        <div className="px-6 pb-6 flex-1 flex flex-col overflow-hidden">
          {/* Header del Item */}
          <div className="flex justify-between items-start mb-6 shrink-0">
            <div className='flex-1 pr-4'>
              <h3 className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Asignando Item</h3>
              <h2 className="text-2xl font-bold text-white leading-tight">{item.name}</h2>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-[#9d25f4] tracking-tight">${item.price.toFixed(2)}</div>
              {selected.length > 1 && (
                <div className="text-xs text-gray-400 font-mono mt-1">
                  ${splitPrice.toFixed(2)} c/u
                </div>
              )}
            </div>
          </div>

          {/* Lista de Personas */}
          <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2 pb-4">
            {people.map(p => {
              const isSelected = selected.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border duration-200 active:scale-[0.98] ${isSelected
                    ? 'bg-[#9d25f4] border-[#9d25f4] text-white shadow-lg shadow-purple-900/30'
                    : 'bg-[#111] border-white/5 text-gray-400 hover:bg-[#222]'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isSelected ? 'bg-white text-[#9d25f4]' : 'bg-gray-800 text-gray-500'}`}>
                      {p.name.charAt(0)}
                    </div>
                    <span className={`text-base font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>{p.name}</span>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-white text-[#9d25f4] flex items-center justify-center">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-700"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botones de Acción */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 shrink-0">
            <button
              onClick={onClose}
              className="py-4 rounded-xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onSave(item.id, selected); onClose(); }}
              className="py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Confirmar <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">{selected.length}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}