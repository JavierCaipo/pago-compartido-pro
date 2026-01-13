import React, { useRef, useEffect, useState } from 'react';

interface CameraScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } // Prefer back camera
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("No se pudo acceder a la cámara. Asegúrate de haber otorgado los permisos necesarios.");
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
          if (blob) {
            const imageFile = new File([blob], `receipt-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(imageFile);
            onClose();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-50 p-4">
      <div className="relative w-full max-w-2xl bg-neutral rounded-lg shadow-xl overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-4">Error de Cámara</h3>
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
        )}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>

      <div className="mt-6 flex items-center justify-center w-full space-x-4">
        <button 
          onClick={onClose} 
          className="px-6 py-3 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
        >
          Cancelar
        </button>
        {!error && (
            <button 
              onClick={handleCapture} 
              aria-label="Tomar Foto"
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 ring-4 ring-white ring-offset-4 ring-offset-transparent transition-all flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary hover:bg-primary-focus transition-colors"></div>
            </button>
        )}
      </div>
    </div>
  );
};

export default CameraScanner;