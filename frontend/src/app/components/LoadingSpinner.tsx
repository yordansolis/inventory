"use client";

import React, { useState, useEffect } from 'react';
import { Spinner } from '../../../components/ui';
import { useLoading } from '../utils/LoadingContext';

export default function LoadingSpinner() {
  const { isLoading } = useLoading();
  const [showDelayMessage, setShowDelayMessage] = useState(false);

  // Mostrar un mensaje si la carga tarda más de 5 segundos
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setShowDelayMessage(true);
      }, 5000);
    } else {
      setShowDelayMessage(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <Spinner size="xl" className="mb-4" />
        <p className="text-slate-700 font-medium">Cargando...</p>
        {showDelayMessage && (
          <p className="text-slate-500 text-sm mt-2 max-w-xs text-center">
            Esto está tardando más de lo esperado. Por favor, espere un momento...
          </p>
        )}
      </div>
    </div>
  );
} 