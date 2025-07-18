"use client"; // This is a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Shirt
} from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { logout, getUsername } from '../utils/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');
  const pathname = usePathname(); // Get current pathname for active link styling

  useEffect(() => {
    // Obtener nombre de usuario del localStorage
    setUsername(getUsername());
  }, []);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'facturar', label: 'Facturar', icon: DollarSign, href: '/dashboard/factura' },
    { id: 'inventario', label: 'Inventario', icon: Package, href: '/dashboard/inventario' },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3, href: '/dashboard/estadisticas' },
    { id: 'domicilios', label: 'Domicilios', icon: Truck, href: '/dashboard/domicilios' },
    { id: 'ingredientes', label: 'Ingredientes', icon: TestTube, href: '/dashboard/ingredientes' },
    { id: 'adiciones', label: 'Adiciones', icon: Plus, href: '/dashboard/adiciones' },
    { id: 'usuarios', label: 'Usuarios', icon: Users, href: '/dashboard/usuarios' },
    { id: 'programacion-camisetas', label: 'Programación Camisetas', icon: Shirt, href: '/dashboard/programacion-camisetas' },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <span className="text-2xl font-bold text-gray-900">
              Sistema de Inventario
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:block text-gray-900">{username || 'Usuario'}</span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 text-red-600 flex items-center focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:block ml-1">Salir</span>
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
           w-64 bg-white border-r border-gray-200 transition-all
           duration-300 ease-in-out shadow-md md:shadow-none`}>
            <div className="py-6">
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
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className={`h-5 w-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
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
          <div className="flex-1 p-8 bg-gray-50">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}