"use client"; // This is a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
import { logout, getUsername, getUserRole, fetchCurrentUser } from '../utils/auth';
import { useTheme } from '../utils/ThemeContext';
import { UserPermissions } from '../utils/permissions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState<number>(0);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isFeminine = theme === 'feminine';

  useEffect(() => {
    const initializeUser = async () => {
      setUsername(getUsername());
      setUserRole(getUserRole());
      
      try {
        const userData = await fetchCurrentUser();
        if (userData) {
          setUserPermissions({
            facturar: userData.permissions?.facturar || false,
            verVentas: userData.permissions?.verVentas || false,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    initializeUser();
    
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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('menu-button');
      
      if (sidebar && 
          sidebarOpen && 
          !sidebar.contains(target) && 
          menuButton && 
          !menuButton.contains(target)) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [sidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
  };

  // Función para determinar si mostrar dashboard
  const shouldShowDashboard = () => {
    return userPermissions?.facturar && userPermissions?.verVentas;
  };

  // Definir los elementos del menú con sus requisitos de permisos
  const menuItems = [
    // Dashboard solo se muestra si tiene ambos permisos
    ...(shouldShowDashboard() ? [
      { id: 'dashboard', label: 'Inicio', icon: Home, href: '/dashboard', requiresPermission: null }
    ] : []),
    // Mostrar facturación si tiene permiso
    ...(userPermissions?.facturar ? [
      { id: 'facturar', label: 'Facturar', icon: DollarSign, href: '/dashboard/factura', requiresPermission: 'facturar' }
    ] : []),
    // Mostrar extracto de ventas si tiene permiso
    ...(userPermissions?.verVentas ? [
      { id: 'extracto-ventas', label: 'Extracto Ventas', icon: ShoppingCart, href: '/dashboard/estracto-ventas', requiresPermission: 'verVentas' }
    ] : []),
    // Los siguientes items solo se muestran para roles administrativos (no es 2)
    ...(userRole !== 2 ? [
      { id: 'inventario', label: 'Inventario', icon: Package, href: '/dashboard/inventario', requiresPermission: null },
      { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3, href: '/dashboard/estadisticas', requiresPermission: null },
      { id: 'domicilios', label: 'Domicilios', icon: Truck, href: '/dashboard/domicilios', requiresPermission: null },
      { id: 'programacion-camisetas', label: 'Programación Camisetas', icon: Shirt, href: '/dashboard/programacion-camisetas', requiresPermission: null },
      { id: 'usuarios', label: 'Usuarios', icon: Users, href: '/dashboard/usuarios', requiresPermission: null }
    ] : [])
  ];

  // Filtrar elementos del menú basado en permisos
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiresPermission) return true;
    return userPermissions?.[item.requiresPermission as keyof UserPermissions];
  });

  return (
    <AuthGuard>
      <div className={`min-h-screen ${isFeminine ? 'bg-gradient-to-br from-pink-50 to-white' : 'bg-gray-50'}`}>
        {/* Navigation Bar */}
        <div className={`bg-white ${isFeminine ? 'border-b border-pink-100' : 'border-b border-gray-200'} px-4 sm:px-6 py-3 flex justify-between items-center shadow-sm fixed top-0 left-0 right-0 z-30`}>
          <div className="flex items-center">
            <button
              id="menu-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden mr-2 p-2 cursor-pointer ${isFeminine ? 'rounded-full hover:bg-pink-50 text-pink-600 focus:ring-pink-300' : 'rounded-lg hover:bg-gray-100 text-gray-600 focus:ring-primary-500'} focus:outline-none focus:ring-2`}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center">
              <div className="mr-2 sm:mr-3">
                <div className={`rounded-full overflow-hidden ${isFeminine ? 'border-2 border-white shadow-sm' : ''} bg-white`} style={{width: '32px', height: '32px'}}>
                  <Image 
                    src="/logo.svg" 
                    alt="Logo" 
                    width={32} 
                    height={32} 
                    className="rounded-full"
                  />
                </div>
              </div>
              <span className={`text-lg sm:text-xl font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'} truncate max-w-[120px] sm:max-w-full`}>
                Dulce Vida
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 cursor-pointer ${isFeminine 
                ? 'rounded-full bg-pink-100 hover:bg-pink-200 text-pink-700' 
                : 'rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700'} 
                flex items-center focus:outline-none transition-colors duration-200`}
              title={isFeminine ? "Cambiar a tema original" : "Cambiar a tema femenino"}
              aria-label="Toggle theme"
            >
              <Palette className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`w-8 h-8 ${isFeminine ? 'bg-pink-100 text-pink-700' : 'bg-primary-100 text-primary-700'} rounded-full flex items-center justify-center`}>
                <span className="text-sm font-medium">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <span className={`text-sm font-medium hidden sm:block ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{username || 'Usuario'}</span>
              <button
                onClick={handleLogout}
                className={`p-2 cursor-pointer  ${isFeminine 
                  ? 'rounded-full hover:bg-pink-50 text-rose-600 focus:ring-pink-300' 
                  : 'rounded-lg hover:bg-gray-100 text-red-600 focus:ring-red-500'} 
                  flex items-center focus:outline-none focus:ring-2`}
                title="Cerrar sesión"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:block ml-1 text-sm">Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content with top padding for fixed header */}
        <div className="flex relative pt-[56px] overflow-x-hidden">
          {/* Sidebar for mobile - with overlay */}
          <div 
            id="mobile-sidebar"
            className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:hidden fixed inset-y-0 left-0 z-40
            w-64 bg-white ${isFeminine ? 'border-r border-pink-100' : 'border-r border-gray-200'} transition-all
            duration-300 ease-in-out shadow-md pt-[56px] touch-scroll`}
          >
            <div className="py-6 h-full overflow-y-auto">
              <div className="flex justify-center mb-6">
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
              {filteredMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = (item.href === '/dashboard' && pathname === '/dashboard') || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
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
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar for desktop */}
          <div className="hidden md:block w-64 bg-white border-r border-gray-200 h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto touch-scroll">
            <div className="py-6">
              {filteredMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = (item.href === '/dashboard' && pathname === '/dashboard') || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.id}
                    href={item.href}
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

          {/* Main Content Area */}
          <div className={`flex-1 p-4 sm:px-6 sm:py-6 ${isFeminine ? 'bg-gradient-to-br from-pink-50 to-white' : 'bg-gray-50'} min-h-[calc(100vh-56px)] mobile-safe-padding`}>
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}