"use client";

import { useCallback } from 'react';
import { useLoading } from './LoadingContext';

// Tipos para las respuestas de la API
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Función auxiliar para integrar el spinner de carga con tus APIs
export function useApi() {
  const { setLoading } = useLoading();

  // Función para mostrar el spinner durante las llamadas API
  const withLoading = useCallback(async <T>(apiCallFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    
    try {
      return await apiCallFn();
    } catch (error) {
      console.error("Error en la petición API:", error);
      throw error;
    } finally {
      // Aseguramos que el spinner siempre se oculte, incluso si hay errores
      setLoading(false);
    }
  }, [setLoading]);

  // Función para hacer peticiones GET con manejo de errores y spinner
  const get = useCallback(async <T>(url: string): Promise<ApiResponse<T>> => {
    return withLoading(async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(url, {
          headers: {
            'Authorization': `bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return { data, status: response.status };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return { 
            error: errorData.detail || 'Error en la petición', 
            status: response.status 
          };
        }
      } catch (error) {
        console.error('Error en la petición:', error);
        return { 
          error: 'Error de conexión', 
          status: 0 
        };
      }
    });
  }, [withLoading]);

  // Función para hacer peticiones POST con manejo de errores y spinner
  const post = useCallback(async <T>(url: string, body: any): Promise<ApiResponse<T>> => {
    return withLoading(async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data = await response.json();
          return { data, status: response.status };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return { 
            error: errorData.detail || 'Error en la petición', 
            status: response.status 
          };
        }
      } catch (error) {
        console.error('Error en la petición:', error);
        return { 
          error: 'Error de conexión', 
          status: 0 
        };
      }
    });
  }, [withLoading]);

  // Función para hacer peticiones PUT con manejo de errores y spinner
  const put = useCallback(async <T>(url: string, body: any): Promise<ApiResponse<T>> => {
    return withLoading(async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data = await response.json();
          return { data, status: response.status };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return { 
            error: errorData.detail || 'Error en la petición', 
            status: response.status 
          };
        }
      } catch (error) {
        console.error('Error en la petición:', error);
        return { 
          error: 'Error de conexión', 
          status: 0 
        };
      }
    });
  }, [withLoading]);

  // Función para hacer peticiones DELETE con manejo de errores y spinner
  const del = useCallback(async <T>(url: string): Promise<ApiResponse<T>> => {
    return withLoading(async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          return { data, status: response.status };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return { 
            error: errorData.detail || 'Error en la petición', 
            status: response.status 
          };
        }
      } catch (error) {
        console.error('Error en la petición:', error);
        return { 
          error: 'Error de conexión', 
          status: 0 
        };
      }
    });
  }, [withLoading]);

  return {
    withLoading,
    get,
    post,
    put,
    delete: del
  };
} 