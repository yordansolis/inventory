"use client"
import React, { useState, useEffect } from 'react';
import { Card, Label, TextInput, Button, Alert, Spinner } from 'flowbite-react';
import { HiEye, HiEyeOff, HiInformationCircle } from 'react-icons/hi';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function InventoryLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si hay errores en los parámetros de la URL
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    
    if (errorParam) {
      switch(errorParam) {
        case 'inactive':
          setError('Tu cuenta ha sido desactivada. Por favor contacta al administrador.');
          break;
        case 'auth':
          setError('Sesión expirada. Por favor inicia sesión nuevamente.');
          break;
        case 'nopermissions':
          setError('No tienes permisos para acceder al sistema. Por favor contacta al administrador.');
          break;
        default:
          setError('Error de autenticación. Por favor inicia sesión nuevamente.');
      }
    }
  }, [searchParams]);

  // Verificar si ya hay una sesión activa
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      router.push('/dashboard');
    }
    
    // Asegurarse de que el favicon se cargue correctamente
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = '/icon.ico';
      document.head.appendChild(newLink);
    } else {
      link.href = '/icon.ico';
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (!formData.username || !formData.password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      // Crear FormData para enviar como application/x-www-form-urlencoded
      const formBody = new URLSearchParams();
      formBody.append('username', formData.username);
      formBody.append('password', formData.password);

      // Petición usando application/x-www-form-urlencoded como en el ejemplo curl
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/users/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });
      
      if (!response.ok) {
        // Intentar obtener el mensaje de error detallado
        let errorMessage = 'Credenciales inválidas';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            
            // Verificar si es un error de cuenta inactiva
            if (response.status === 403 && errorData.detail === "User account is inactive") {
              errorMessage = 'Esta cuenta ha sido desactivada. Por favor contacte al administrador.';
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            }
          }
        } catch (parseError) {
          console.warn('Error al parsear respuesta de error:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Guardar token y información del usuario
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('username', formData.username);
      localStorage.setItem('tokenType', data.token_type);
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // Si la respuesta incluye información del usuario y su rol, guardarla
      if (data.user) {
        if (data.user.id) {
          localStorage.setItem('userId', data.user.id.toString());
        }
        if (data.user.role_id) {
          localStorage.setItem('roleId', data.user.role_id.toString());
        }
      }
      
      // Verificar permisos del usuario para determinar a dónde redirigir
      let redirectPath = '/dashboard';
      
      if (data.user?.permissions) {
        const permissions = data.user.permissions;
        
        // Si tiene un solo permiso, redirigir directo a la página correspondiente
        if (permissions.facturar && !permissions.verVentas) {
          redirectPath = '/dashboard/factura';
        } else if (!permissions.facturar && permissions.verVentas) {
          redirectPath = '/dashboard/estracto-ventas';
        }
      }
      
      // Redirigir según los permisos
      router.push(redirectPath);
      
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4 sm:p-5 mobile-safe-padding">
      <div className="w-full max-w-md">
        {/* Header con Logo */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="rounded-full overflow-hidden border-4 border-white shadow-lg p-1 bg-white" style={{width: '120px', height: '120px'}}>
              <Image 
                src="/logo.svg" 
                alt="Logo" 
                width={110} 
                height={110} 
                priority
                className="rounded-full"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 tracking-tight">
            Dulce Vida
          </h1>
          <p className="text-sm sm:text-base text-pink-600">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border border-pink-100 shadow-sm rounded-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
            {/* username Field */}
            <div>
              <div className="mb-1 sm:mb-2 block">
                <Label 
                  htmlFor="username" 
                  children="Nombre de usuario"
                  className="text-gray-700 text-sm sm:text-base font-medium"
                />
              </div>
              <TextInput
                id="username"
                name="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={formData.username}
                onChange={handleInputChange}
                required
                sizing="lg"
                className="text-base"
                theme={{
                  field: {
                    input: {
                      base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 rounded-lg",
                      colors: {
                        gray: "bg-white border-pink-200 text-gray-900 focus:border-pink-400 focus:ring-pink-300"
                      },
                      sizes: {
                        lg: "p-3 sm:p-4 sm:text-base"
                      }
                    }
                  }
                }}
                color="gray"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1 sm:mb-2 block">
                <Label 
                  htmlFor="password" 
                  children="Contraseña"
                  className="text-gray-700 text-sm sm:text-base font-medium"
                />
              </div>
              <div className="relative">
                <TextInput
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  sizing="lg"
                  className="text-base pr-10"
                  theme={{
                    field: {
                      input: {
                        base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 rounded-lg",
                        colors: {
                          gray: "bg-white border-pink-200 text-gray-900 focus:border-pink-400 focus:ring-pink-300"
                        },
                        sizes: {
                          lg: "p-3 sm:p-4 sm:text-base"
                        }
                      }
                    }
                  }}
                  color="gray"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-pink-600 cursor-pointer"
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert color="failure" icon={HiInformationCircle} className="rounded-lg">
                <span className="text-sm sm:text-base">{error}</span>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 focus:ring-pink-400 text-white text-sm sm:text-base font-medium py-3 sm:py-4 rounded-lg transition-all duration-200 shadow-sm cursor-pointer"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner size="sm" light={true} className="mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-pink-100">
          <p className="text-pink-400 text-xs sm:text-sm">
            © 2025 Dulce Vida. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}