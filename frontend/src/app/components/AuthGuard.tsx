"use client"
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, fetchCurrentUser } from '../utils/auth';
import { UserPermissions, hasRouteAccess } from '../utils/permissions';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Función para determinar la página adecuada según los permisos del usuario
const getDefaultPage = (permissions: UserPermissions): string => {
  if (permissions.facturar && permissions.verVentas) {
    return '/dashboard'; // Si tiene ambos permisos, puede ir al dashboard
  } else if (permissions.facturar) {
    return '/dashboard/factura'; // Si solo tiene permiso de facturar
  } else if (permissions.verVentas) {
    return '/dashboard/estracto-ventas'; // Si solo tiene permiso de ver ventas
  } else {
    return '/login?error=nopermissions'; // No tiene permisos
  }
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authCheck = async () => {
      setIsLoading(true);
      
      // Si no está autenticado y no está en la página de login
      if (!isAuthenticated() && pathname !== '/login') {
        router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        setIsLoading(false);
        return;
      }

      // Si está autenticado, verificar permisos y estado activo
      if (pathname !== '/login') {
        try {
          const userData = await fetchCurrentUser();
          
          // Si no se pudo obtener datos del usuario (token inválido o expirado)
          if (!userData) {
            // fetchCurrentUser ya maneja la redirección para usuarios inactivos
            // solo necesitamos manejar otros casos de error aquí
            if (!window.location.href.includes('error=inactive')) {
              router.push('/login?error=auth');
            }
            setIsLoading(false);
            return;
          }
          
          // Verificar si el usuario está activo
          if (!userData?.is_active) {
            // Limpiar token de localStorage para evitar bucle infinito
            localStorage.removeItem('authToken');
            router.push('/login?error=inactive');
            setIsLoading(false);
            return;
          }

          // Verificar permisos para la ruta actual
          const userPermissions: UserPermissions = {
            facturar: userData?.permissions?.facturar || false,
            verVentas: userData?.permissions?.verVentas || false,
          };

          // Si estamos en la raíz del dashboard y no tiene ambos permisos
          if (pathname === '/dashboard' && !(userPermissions.facturar && userPermissions.verVentas)) {
            const defaultPage = getDefaultPage(userPermissions);
            router.push(defaultPage);
            setIsLoading(false);
            return;
          } 
          // Para rutas específicas, verificar si tiene acceso
          else if (!hasRouteAccess(userPermissions, pathname)) {
            const defaultPage = getDefaultPage(userPermissions);
            router.push(defaultPage);
            setIsLoading(false);
            return;
          }

          setAuthorized(true);
        } catch (error) {
          console.error('Error verificando permisos:', error instanceof Error ? error.message : 'Error desconocido');
          router.push('/login?error=auth');
          setIsLoading(false);
          return;
        }
      } else {
        setAuthorized(true);
      }
      
      setIsLoading(false);
    };

    authCheck();
  }, [pathname, router]);

  // Mientras verifica la autenticación, mostrar pantalla de carga
  if (isLoading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostrar el contenido
  return <>{children}</>;
} 