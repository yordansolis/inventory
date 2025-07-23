"use client";

import { useCallback } from 'react';
import { useLoading } from './LoadingContext';
import { getAuthHeaders } from './auth';

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
      console.error("Error en la petición API:", error instanceof Error ? error.message : 'Error desconocido');
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
        const headers = getAuthHeaders(); // Usar la función de auth.ts para obtener los headers

        const response = await fetch(url, { headers });

        if (response.ok) {
          // Para respuestas vacías o no JSON
          if (response.status === 204) {
            return { status: response.status }; // No content
          }
          
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return { data, status: response.status };
          } else {
            return { status: response.status };
          }
        } else {
          let errorMessage = 'Error en la petición';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorMessage;
            } else {
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            }
          } catch (parseError) {
            console.warn('No se pudo parsear el error:', parseError);
          }
          
          return { error: errorMessage, status: response.status };
        }
      } catch (error) {
        console.error('Error en la petición:', error instanceof Error ? error.message : 'Error desconocido');
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
        const headers = getAuthHeaders();
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (response.ok) {
          // Para respuestas vacías o no JSON
          if (response.status === 204) {
            return { status: response.status }; // No content
          }
          
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return { data, status: response.status };
          } else {
            return { status: response.status };
          }
        } else {
          let errorMessage = 'Error en la petición';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorMessage;
            } else {
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            }
          } catch (parseError) {
            console.warn('No se pudo parsear el error:', parseError);
          }
          
          return { error: errorMessage, status: response.status };
        }
      } catch (error) {
        console.error('Error en la petición:', error instanceof Error ? error.message : 'Error desconocido');
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
        const headers = getAuthHeaders();
        
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body)
        });

        if (response.ok) {
          // Para respuestas vacías o no JSON
          if (response.status === 204) {
            return { status: response.status }; // No content
          }
          
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return { data, status: response.status };
          } else {
            return { status: response.status };
          }
        } else {
          let errorMessage = 'Error en la petición';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorMessage;
            } else {
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            }
          } catch (parseError) {
            console.warn('No se pudo parsear el error:', parseError);
          }
          
          return { error: errorMessage, status: response.status };
        }
      } catch (error) {
        console.error('Error en la petición:', error instanceof Error ? error.message : 'Error desconocido');
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
        const headers = getAuthHeaders();
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers
        });

        if (response.ok) {
          // Para respuestas vacías o no JSON
          if (response.status === 204) {
            return { status: response.status }; // No content
          }
          
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return { data, status: response.status };
          } else {
            return { status: response.status };
          }
        } else {
          let errorMessage = 'Error en la petición';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorMessage;
            } else {
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            }
          } catch (parseError) {
            console.warn('No se pudo parsear el error:', parseError);
          }
          
          return { error: errorMessage, status: response.status };
        }
      } catch (error) {
        console.error('Error en la petición:', error instanceof Error ? error.message : 'Error desconocido');
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