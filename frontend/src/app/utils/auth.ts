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
    const headers = getAuthHeaders();
    
    const response = await fetch(`${apiUrl}/api/v1/users/auth/me`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener datos del usuario');
    }
    
    const userData = await response.json();
    
    // Guardar el ID del usuario y el rol en localStorage
    if (userData && userData.id) {
      localStorage.setItem('userId', userData.id.toString());
      
      // Si la API devuelve el rol, guardarlo también
      if (userData.role_id) {
        localStorage.setItem('roleId', userData.role_id.toString());
      }
    }
    
    return userData;
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
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