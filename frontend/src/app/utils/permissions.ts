export interface UserPermissions {
  facturar: boolean;
  verVentas: boolean;
}

// Rutas protegidas y sus permisos requeridos
export const PROTECTED_ROUTES = {
  '/dashboard': ['facturarYverVentas'], // Dashboard solo si tiene ambos permisos
  '/dashboard/factura': ['facturar'],
  '/dashboard/estracto-ventas': ['verVentas'],
} as const;

// Función para verificar si un usuario tiene un permiso específico
export const hasPermission = (userPermissions: UserPermissions | null, permission: string): boolean => {
  if (!userPermissions) return false;
  
  // Permiso especial que requiere ambos permisos
  if (permission === 'facturarYverVentas') {
    return userPermissions.facturar && userPermissions.verVentas;
  }
  
  // Permisos normales
  if (permission === 'facturar') return userPermissions.facturar;
  if (permission === 'verVentas') return userPermissions.verVentas;
  
  return false;
};

// Función para verificar si un usuario tiene acceso a una ruta específica
export const hasRouteAccess = (userPermissions: UserPermissions | null, pathname: string): boolean => {
  // Si la ruta no está en las rutas protegidas, permitir acceso
  // (Esto ya no será necesario para dashboard principal, que ahora está protegido)
  const protectedRoutePaths = Object.keys(PROTECTED_ROUTES);
  
  // Buscar la ruta más específica que coincide con el pathname
  let matchingRoute: [string, readonly string[]] | undefined;
  for (const route of protectedRoutePaths) {
    if (pathname === route || (route !== '/dashboard' && pathname.startsWith(route))) {
      // Si es una coincidencia exacta o comienza con la ruta (excepto para /dashboard que debe ser exacto)
      if (!matchingRoute || route.length > matchingRoute[0].length) {
        // Guardar la ruta más larga (más específica)
        matchingRoute = [route, PROTECTED_ROUTES[route as keyof typeof PROTECTED_ROUTES]];
      }
    }
  }
  
  // Si no encontramos ninguna ruta que coincida, permitir acceso (para rutas no protegidas)
  if (!matchingRoute) return true;
  
  // Si no hay permisos, denegar acceso a rutas protegidas
  if (!userPermissions) return false;
  
  // Verificar si el usuario tiene al menos uno de los permisos requeridos
  const requiredPermissions = matchingRoute[1];
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}; 