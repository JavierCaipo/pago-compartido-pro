
import React from 'react';
import { Item, Person } from '../types';

interface ItemCardProps {
  item: Item;
  people: Person[];
  onAssign: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, people, onAssign }) => {
  const isAssigned = item.assignedTo.length > 0;

  const getAssignedNames = () => {
    if (!isAssigned) {
      return <span className="text-gray-500 italic">Sin asignar</span>;
    }
    return item.assignedTo
      .map(personId => people.find(p => p.id === personId)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm flex justify-between items-center transition-colors duration-300 ${isAssigned ? 'bg-teal-50 border-l-4 border-primary' : 'bg-white'}`}>
      <div className="flex items-center gap-3">
        {isAssigned && (
            <div className="text-primary flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            </div>
        )}
        <div className="overflow-hidden">
            <p className="font-semibold text-base-content truncate">{item.name}</p>
            <p className="text-sm text-gray-600 truncate">{getAssignedNames()}</p>
        </div>
      </div>
      <div className="text-right ml-4 flex-shrink-0">
        <p className="font-bold text-lg text-primary">${item.price.toFixed(2)}</p>
        <button onClick={() => onAssign(item)} className="text-sm text-secondary font-semibold hover:underline">
          {isAssigned ? 'Editar' : 'Asignar'}
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
