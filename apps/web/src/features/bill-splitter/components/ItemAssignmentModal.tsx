
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-base-content">Asignar Artículo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-semibold">{item.name}</p>
            <p className="text-2xl font-bold text-primary">${item.price.toFixed(2)}</p>
        </div>

        <h3 className="font-semibold mb-3 text-gray-700">¿Quién pagará por esto?</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {people.map(person => (
            <label key={person.id} className="flex items-center p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-teal-50 transition-colors">
              <input
                type="checkbox"
                className="h-5 w-5 rounded text-primary focus:ring-primary-focus"
                checked={selectedPeople.includes(person.id)}
                onChange={() => handleTogglePerson(person.id)}
              />
              <span className="ml-3 text-base-content font-medium">{person.name}</span>
            </label>
          ))}
        </div>

        {selectedPeople.length > 1 && (
            <div className="mt-4 text-center p-3 bg-teal-50 text-teal-800 rounded-lg">
                Se dividirá en <strong>${pricePerPerson}</strong> por persona.
            </div>
        )}

        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-primary text-primary-content hover:bg-primary-focus font-semibold shadow-md transition-colors">
            Guardar Asignación
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemAssignmentModal;
