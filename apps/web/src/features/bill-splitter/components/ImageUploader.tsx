import React, { useRef, useState } from 'react';
import CameraScanner from './CameraScanner';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (files: FileList | null) => {
    if (files && files[0]) {
      onImageUpload(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFile(e.target.files);
  };
  
  const onButtonClick = () => {
    inputRef.current?.click();
  };
  
  const handleCapture = (file: File) => {
    onImageUpload(file);
    setIsCameraOpen(false); // Close camera after capture
  }


  return (
    <>
      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300 hover:border-primary" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
        <input
          ref={inputRef}
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={isLoading}
        />
        <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center justify-center ${dragActive ? 'text-primary' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="font-semibold">Arrastra y suelta la foto de tu factura aquí</p>
          <p className="text-sm text-gray-500 mt-1">o</p>
          <div className="mt-4 w-full max-w-sm flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={onButtonClick} disabled={isLoading} className="flex-1 px-6 py-3 bg-primary text-primary-content font-bold rounded-lg shadow-md hover:bg-primary-focus transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Seleccionar Archivo
              </button>
              <button type="button" onClick={() => setIsCameraOpen(true)} disabled={isLoading} className="flex-1 px-6 py-3 bg-secondary text-white font-bold rounded-lg shadow-md hover:bg-indigo-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h1.172a2 2 0 011.414.586l.828.828A2 2 0 008.828 6H12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    <path d="M15 8a1 1 0 10-2 0v2a1 1 0 102 0V8z" />
                  </svg>
                  Escanear con Cámara
              </button>
          </div>
        </label>
      </div>

      {isCameraOpen && <CameraScanner onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
    </>
  );
};

export default ImageUploader;