// Funciones de utilidad para la autenticación

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
 * Cierra la sesión del usuario
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  localStorage.removeItem('tokenType');
  localStorage.removeItem('loginTime');
  
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