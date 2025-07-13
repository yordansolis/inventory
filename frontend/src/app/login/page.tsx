"use client"
import React, { useState } from 'react';
import { Card, Label, TextInput, Button, Alert, Spinner } from 'flowbite-react';
import { HiEye, HiEyeOff, HiInformationCircle } from 'react-icons/hi';

export default function InventoryLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      // Aquí va tu lógica de autenticación
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      
      // Guardar token y redirigir
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
      
    } catch (err) {
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
            {/* Email Field */}
            <div>
              <div className="mb-2 block">
                <Label 
                  htmlFor="email" 
                  value="Correo electrónico"
                  className="text-gray-900 text-sm font-medium"
                />
              </div>
              <TextInput
                id="email"
                name="email"
                type="email"
                placeholder="admin@inventario.com"
                value={formData.email}
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
                  value="Contraseña"
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