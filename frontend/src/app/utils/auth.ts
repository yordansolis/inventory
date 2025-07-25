// Funciones de utilidad para la autenticación
import { useState, useEffect, useCallback } from 'react';

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('authToken');
  return !!token;
};

/**
 * Obtiene el token de autenticación
 */
export const getAuthToken = (): string => {
  if (typeof window === 'undefined') return '';
  
  return localStorage.getItem('authToken') || '';
};

/**
 * Obtiene el nombre de usuario actual
 */
export const getUsername = (): string => {
  if (typeof window === 'undefined') return '';
  
  return localStorage.getItem('username') || '';
};

/**
 * Obtiene el rol del usuario actual
 */
export const getUserRole = (): number => {
  if (typeof window === 'undefined') return 0;
  
  const roleId = localStorage.getItem('roleId');
  return roleId ? parseInt(roleId, 10) : 0;
};

/**
 * Cierra la sesión del usuario
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  localStorage.removeItem('tokenType');
  localStorage.removeItem('loginTime');
  localStorage.removeItem('userId');
  localStorage.removeItem('roleId');
  
  // Redirigir a la página de login
  window.location.href = '/login';
};

/**
 * Obtiene los headers de autenticación para las peticiones
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  
  if (!token) return { 'Content-Type': 'application/json' };
  
  return {
    'Authorization': `bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Obtiene el ID del usuario actual desde localStorage
 * Si no existe, devuelve 1 como valor por defecto
 */
export const getUserId = (): number => {
  if (typeof window === 'undefined') return 1;
  
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId, 10) : 1;
};

/**
 * Obtiene los datos del usuario actual desde la API
 * y los guarda en localStorage
 */
export const fetchCurrentUser = async (): Promise<any> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://127.0.0.1:8052';
    const token = localStorage.getItem('authToken');
    
    console.log('Fetching current user with:', {
      apiUrl,
      tokenPresent: !!token,
      tokenLength: token ? token.length : 0
    });

    if (!token) {
      console.warn('No authentication token found');
      logout();
      return null;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(`${apiUrl}/api/v1/users/auth/me`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      // Handle inactive user specifically
      if (response.status === 400) {
        try {
          const errorData = await response.json();
          if (errorData.detail === "Inactive user") {
            console.warn('Inactive user account detected');
            // Instead of logging out immediately, just clear the token
            localStorage.removeItem('authToken');
            window.location.href = '/login?error=inactive';
            return null;
          }
        } catch (parseError) {
          // Fall through to general error handling if we can't parse the response
        }
      }
      
      // Log the full response for debugging but handle potential errors
      try {
        const errorText = await response.text();
        // Only log error details if we have meaningful text
        if (errorText && errorText.trim() !== '') {
          console.error('User fetch error details:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500), // Limit text size in case it's very large
            headers: Object.fromEntries([...response.headers].filter(([key]) => key !== 'set-cookie')) // Filter out sensitive headers
          });
        } else {
          console.error('User fetch failed with status:', response.status, response.statusText);
        }
      } catch (parseError) {
        // If there's an error parsing the error response, just log the status
        console.error('User fetch failed with status:', response.status, response.statusText);
      }
      
      // For other errors, throw a generic error
      throw new Error(`Error al obtener datos del usuario: ${response.status} ${response.statusText}`);
    }
    
    const userData = await response.json();
    
    console.log('User data fetched successfully:', userData);
    
    // Guardar el ID del usuario y el rol en localStorage
    if (userData && userData.id) {
      localStorage.setItem('userId', userData.id.toString());
      
      // Si la API devuelve el rol, guardarlo también
      if (userData.role_id) {
        localStorage.setItem('roleId', userData.role_id.toString());
      }
    }
    
    return userData;
  } catch (error: unknown) {
    console.error('Error al obtener datos del usuario:', error instanceof Error ? error.message : 'Error desconocido');
    
    // If the error is a network error or authentication problem, log out the user
    if (error instanceof TypeError || 
        (error instanceof Error && 
         (error.message.includes('401') || error.message.includes('403')))) {
      console.warn('Authentication error detected, logging out');
      logout();
    }
    
    return null;
  }
};

/**
 * Hook de autenticación para usar en componentes
 */
export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [isAuth, setIsAuth] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);

      if (authenticated) {
        try {
          const userData = await fetchCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Error al obtener usuario:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const getToken = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const token = getAuthToken();
      resolve(token);
    });
  }, []);

  return {
    isLoading,
    isAuthenticated: isAuth,
    user,
    logout,
    getToken,
    getAuthHeaders
  };
}; 