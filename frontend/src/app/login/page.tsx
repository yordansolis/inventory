"use client"
import React, { useState, useEffect } from 'react';
import { Card, Label, TextInput, Button, Alert, Spinner } from 'flowbite-react';
import { HiEye, HiEyeOff, HiInformationCircle } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function InventoryLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        throw new Error('Credenciales inválidas');
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
      
      // Redirigir usando el router de Next.js
      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        {/* Header con Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="rounded-full overflow-hidden border-4 border-white shadow-lg p-1 bg-white" style={{width: '160px', height: '160px'}}>
              <Image 
                src="/logo.svg" 
                alt="Logo" 
                width={150} 
                height={150} 
                priority
                className="rounded-full"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">
            Sistema de Inventario
          </h1>
          <p className="text-base text-pink-600">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border border-pink-100 shadow-sm rounded-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* username Field */}
            <div>
              <div className="mb-2 block">
                <Label 
                  htmlFor="username" 
                  children="Nombre de usuario"
                  className="text-gray-700 text-base font-medium"
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
                        lg: "p-4 sm:text-base"
                      }
                    }
                  }
                }}
                color="gray"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-2 block">
                <Label 
                  htmlFor="password" 
                  children="Contraseña"
                  className="text-gray-700 text-base font-medium"
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
                          lg: "p-4 sm:text-base"
                        }
                      }
                    }
                  }}
                  color="gray"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-pink-600"
                >
                  {showPassword ? (
                    <HiEyeOff className="h-6 w-6" />
                  ) : (
                    <HiEye className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert color="failure" icon={HiInformationCircle} className="rounded-lg">
                <span className="text-base">{error}</span>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 focus:ring-pink-400 text-white text-base font-medium py-4 rounded-lg transition-all duration-200 shadow-sm"
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

            {/* Forgot Password Link */}
            {/* <div className="text-center mt-4">
              <a 
                href="/forgot-password" 
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div> */}
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-pink-100">
          <p className="text-pink-400 text-sm">
            © 2025 Sistema de Inventario. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}