"use client"
import React, { useState, useEffect } from 'react';
import { Card, Label, TextInput, Button, Alert, Spinner } from 'flowbite-react';
import { HiEye, HiEyeOff, HiInformationCircle } from 'react-icons/hi';
import { useRouter } from 'next/navigation';

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
      
      // Redirigir usando el router de Next.js
      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">
            Inventario
          </h1>
          <p className="text-lg text-gray-600">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border border-gray-200 shadow-none">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* username Field */}
            <div>
              <div className="mb-2 block">
                <Label 
                  htmlFor="username" 
                  children="Nombre de usuario"
                  className="text-gray-900 text-sm font-medium"
                />
              </div>
              <TextInput
                id="username"
                name="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="text-sm"
                theme={{
                  field: {
                    input: {
                      base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
                      colors: {
                        gray: "bg-white border-gray-300 text-gray-900 focus:border-black focus:ring-black"
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
                  className="text-gray-900 text-sm font-medium"
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
                  className="text-sm pr-10"
                  theme={{
                    field: {
                      input: {
                        base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
                        colors: {
                          gray: "bg-white border-gray-300 text-gray-900 focus:border-black focus:ring-black"
                      }
                    }
                  }
                }}
                color="gray"
              />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
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
              <Alert color="failure" icon={HiInformationCircle}>
                <span className="text-sm">{error}</span>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 focus:ring-black text-sm font-medium py-3"
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
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            © 2025 Sistema de Inventario. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}