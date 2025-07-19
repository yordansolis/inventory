"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Tiempo máximo que el spinner puede estar activo (en milisegundos)
const MAX_LOADING_TIME = 30000; // 30 segundos

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTimer, setLoadingTimer] = useState<NodeJS.Timeout | null>(null);

  // Función para establecer el estado de carga
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    
    // Si estamos activando el loading, configuramos un temporizador de seguridad
    if (loading) {
      // Limpiamos cualquier temporizador existente
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      
      // Configuramos un nuevo temporizador
      const timer = setTimeout(() => {
        console.warn('Loading spinner timeout - forcing reset after', MAX_LOADING_TIME/1000, 'seconds');
        setIsLoading(false);
      }, MAX_LOADING_TIME);
      
      setLoadingTimer(timer);
    } 
    // Si estamos desactivando el loading, limpiamos el temporizador
    else if (loadingTimer) {
      clearTimeout(loadingTimer);
      setLoadingTimer(null);
    }
  }, [loadingTimer]);

  // Limpiar el temporizador cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
    };
  }, [loadingTimer]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
} 