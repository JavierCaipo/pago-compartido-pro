
import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../types';

interface PersonCardProps {
  person: Person;
  total: number;
  onRemove: (id: number) => void;
  onUpdateName: (id: number, newName: string) => void;
}

const PersonCard: React.FC<PersonCardProps> = ({ person, total, onRemove, onUpdateName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(person.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editedName.trim() !== '' && editedName.trim() !== person.name) {
      onUpdateName(person.id, editedName);
    } else {
      setEditedName(person.name); // Revert if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(person.name);
      setIsEditing(false);
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md flex justify-between items-center transition-all duration-200 hover:scale-105 ${isEditing ? 'ring-2 ring-secondary' : ''}`}>
      <div className="flex-grow mr-4">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="text-lg font-bold text-secondary bg-gray-100 rounded p-1 w-full focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        ) : (
          <div onClick={() => setIsEditing(true)} className="flex items-center gap-2 cursor-pointer group w-fit">
            <h3 className="font-bold text-lg text-secondary">{person.name}</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
            </svg>
          </div>
        )}
        <p className="text-2xl font-black text-base-content tracking-tight">${total.toFixed(2)}</p>
      </div>
      <button onClick={() => onRemove(person.id)} className="text-gray-400 hover:text-accent transition-colors flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default PersonCard;
