"use client"
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '../utils/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname(); // Obtener la ruta actual
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Verificar autenticación
    const authCheck = () => {
      // Si no está autenticado y no está en la página de login
      if (!isAuthenticated() && pathname !== '/login') {
        // Redirigir a login con la ruta de retorno
        router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      } else {
        setAuthorized(true);
      }
    };

    // Ejecutar verificación de autenticación
    authCheck();

    // Escuchar cambios de ruta
    const preventAccess = () => authCheck();

    // Limpiar evento al desmontar
    return () => {
      setAuthorized(false);
    };
  }, [pathname, router]);

  // Mientras verifica la autenticación, mostrar pantalla de carga
  if (!authorized) {
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