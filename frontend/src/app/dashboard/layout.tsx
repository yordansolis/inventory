"use client"; // This is a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation'; // For active link highlighting
import {
  ShoppingCart,
  Package,
  BarChart3,
  Truck,
  TestTube,
  Plus,
  Users,
  Menu,
  X,
  Home,
  DollarSign,
  LogOut,
  Shirt,
  Palette
} from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { logout, getUsername, getUserRole } from '../utils/auth';
import { useTheme } from '../utils/ThemeContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState<number>(0);
  const pathname = usePathname(); // Get current pathname for active link styling
  const { theme, toggleTheme } = useTheme();
  const isFeminine = theme === 'feminine';

  useEffect(() => {
    // Obtener nombre de usuario y rol del localStorage
    setUsername(getUsername());
    setUserRole(getUserRole());
    
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
  }, []);

  const handleLogout = () => {
    logout();
  };

  // Definir los elementos del menú
  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'facturar', label: 'Facturar', icon: DollarSign, href: '/dashboard/factura' },
    { id: 'inventario', label: 'Inventario', icon: Package, href: '/dashboard/inventario' },
    { id: 'extracto-ventas', label: 'Extracto Ventas', icon: ShoppingCart, href: '/dashboard/estracto-ventas' },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3, href: '/dashboard/estadisticas' },
    { id: 'domicilios', label: 'Domicilios', icon: Truck, href: '/dashboard/domicilios' },
    { id: 'adiciones', label: 'Adiciones', icon: Plus, href: '/dashboard/adiciones' },
    { id: 'programacion-camisetas', label: 'Programación Camisetas', icon: Shirt, href: '/dashboard/programacion-camisetas' },
  ];
  
  // Agregar la sección de Usuarios solo si el rol no es 2
  const menuItems = userRole !== 2 
    ? [...baseMenuItems, { id: 'usuarios', label: 'Usuarios', icon: Users, href: '/dashboard/usuarios' }]
    : baseMenuItems;

  return (
    <AuthGuard>
      <div className={`min-h-screen ${isFeminine ? 'bg-gradient-to-br from-pink-50 to-white' : 'bg-gray-50'}`}>
        {/* Navigation Bar */}
        <div className={`bg-white ${isFeminine ? 'border-b border-pink-100' : 'border-b border-gray-200'} px-6 py-3 flex justify-between items-center shadow-sm`}>
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden mr-4 p-2 ${isFeminine ? 'rounded-full hover:bg-pink-50 text-pink-600 focus:ring-pink-300' : 'rounded-lg hover:bg-gray-100 text-gray-600 focus:ring-primary-500'} focus:outline-none focus:ring-2`}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center">
              <div className="hidden md:block mr-3">
                <div className={`rounded-full overflow-hidden ${isFeminine ? 'border-2 border-white shadow-sm' : ''} bg-white`} style={{width: '36px', height: '36px'}}>
                  <Image 
                    src="/logo.svg" 
                    alt="Logo" 
                    width={36} 
                    height={36} 
                    className="rounded-full"
                  />
                </div>
              </div>
              <span className={`text-xl font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                Dulce Vida
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Botón de cambio de tema */}
            <button
              onClick={toggleTheme}
              className={`p-2 ${isFeminine 
                ? 'rounded-full bg-pink-100 hover:bg-pink-200 text-pink-700' 
                : 'rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700'} 
                flex items-center focus:outline-none transition-colors duration-200`}
              title={isFeminine ? "Cambiar a tema original" : "Cambiar a tema femenino"}
            >
              <Palette className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${isFeminine ? 'bg-pink-100 text-pink-700' : 'bg-primary-100 text-primary-700'} rounded-full flex items-center justify-center`}>
                <span className="text-sm font-medium">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <span className={`text-sm font-medium hidden sm:block ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{username || 'Usuario'}</span>
              <button
                onClick={handleLogout}
                className={`p-2 ${isFeminine 
                  ? 'rounded-full hover:bg-pink-50 text-rose-600 focus:ring-pink-300' 
                  : 'rounded-lg hover:bg-gray-100 text-red-600 focus:ring-red-500'} 
                  flex items-center focus:outline-none focus:ring-2`}
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:block ml-1 text-sm">Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex relative">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
           md:translate-x-0 fixed
           md:static inset-y-0 left-0 z-50
           w-64 bg-white ${isFeminine ? 'border-r border-pink-100' : 'border-r border-gray-200'} transition-all
           duration-300 ease-in-out shadow-md md:shadow-none`}>
            <div className="py-6">
              <div className="flex justify-center mb-6 md:hidden">
                <div className={`rounded-full overflow-hidden ${isFeminine ? 'border-2 border-white shadow-sm bg-white p-1' : ''}`} style={{width: '80px', height: '80px'}}>
                  <Image 
                    src="/logo.svg" 
                    alt="Logo" 
                    width={70} 
                    height={70} 
                    className="rounded-full"
                  />
                </div>
              </div>
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = (item.href === '/dashboard' && pathname === '/dashboard') || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)} // Close sidebar on navigation
                    className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? isFeminine 
                          ? 'bg-pink-50 text-pink-700 border-r-2 border-pink-500' 
                          : 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : `text-gray-600 ${isFeminine ? 'hover:bg-pink-50 hover:text-pink-700' : 'hover:bg-gray-50 hover:text-gray-900'}`
                    }`}
                  >
                    <IconComponent className={`h-5 w-5 mr-3 ${isActive 
                      ? isFeminine ? 'text-pink-600' : 'text-primary-600' 
                      : 'text-gray-500'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content Area - where child pages will be rendered */}
          <div className={`flex-1 p-6 ${isFeminine ? 'bg-gradient-to-br from-pink-50 to-white' : 'bg-gray-50'}`}>
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}