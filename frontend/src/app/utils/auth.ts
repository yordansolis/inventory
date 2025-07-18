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
  localStorage.removeItem('userId');
  
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
    
    // Guardar el ID del usuario en localStorage
    if (userData && userData.id) {
      localStorage.setItem('userId', userData.id.toString());
    }
    
    return userData;
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return null;
  }
}; 