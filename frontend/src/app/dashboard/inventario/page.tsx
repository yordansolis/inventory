

"use client"
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Truck, 
  TestTube, 
  Plus,
  Eye,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  Home,
  DollarSign,
  TrendingUp,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
// import { DarkThemeToggle } from 'flowbite-react';

export default function InventoryDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  // Datos de ejemplo basados en tu estructura
  const productosVendibles = [
    { id: 1, nombre: 'BOLA DE HELADO DE VAINILLA', tipo: 'HELADO', precio: 1000, stock: 25, minimo: 10, estado: 'bien' },
    { id: 2, nombre: 'BOLA DE HELADO DE FRESA', tipo: 'HELADO', precio: 1500, stock: 8, minimo: 5, estado: 'bien' },
    { id: 3, nombre: 'BOLA DE ESPUMA', tipo: 'ESPUMA', precio: 5000, stock: 3, minimo: 10, estado: 'bajo' },
    { id: 4, nombre: 'MINI PANCAKES', tipo: 'PANCAKES', precio: 1000, stock: 100, minimo: 10, estado: 'bien' },
    { id: 5, nombre: 'MINI DONAS X12', tipo: 'DONAS', precio: 3000, stock: 300, minimo: 10, estado: 'bien' },
  ];

  const productosConsumibles = [
    { id: 101, nombre: 'VASOS X 16', cantidad: 50, minimo: 10, estado: 'bien' },
    { id: 102, nombre: 'VASOS X 6', cantidad: 100, minimo: 10, estado: 'bien' },
    { id: 103, nombre: 'PAQUETE DE SERVILLETAS X 50', cantidad: 6, minimo: 7, estado: 'bajo' },
    { id: 104, nombre: 'PAQUETES DE FRESAS', cantidad: 2, minimo: 5, estado: 'bajo' },
  ];

  const ventasRecientes = [
    { id: '001', fecha: '11/07/2025', cliente: 'Jhordan', producto: 'Bola de helado', cantidad: 2, total: 17000, domicilio: true, vendedor: 'Brayam' },
    { id: '002', fecha: '11/07/2025', cliente: 'María', producto: 'Mini Pancakes', cantidad: 1, total: 4000, domicilio: false, vendedor: 'Brayam' },
    { id: '003', fecha: '10/07/2025', cliente: 'Carlos', producto: 'Bola de Espuma', cantidad: 1, total: 8000, domicilio: true, vendedor: 'Ana' },
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'facturar', label: 'Facturar', icon: DollarSign },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { id: 'domicilios', label: 'Domicilios', icon: Truck },
    { id: 'ingredientes', label: 'Ingredientes', icon: TestTube },
    { id: 'adicciones', label: 'Adicciones', icon: Plus },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Componente Card personalizado
  const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  );

  // Componente Badge personalizado
  const Badge = ({
    children,
    variant = "default",
    size = "default"
  }: {
    children: React.ReactNode;
    variant?: "default" | "success" | "info" | "warning" | "danger";
    size?: "default" | "lg";
  }) => {
    const variants: Record<"default" | "success" | "info" | "warning" | "danger", string> = {
      default: "bg-gray-100 text-gray-800",
      success: "bg-green-100 text-green-800",
      info: "bg-blue-100 text-blue-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800"
    };
    
    const sizes = {
      default: "px-2 py-1 text-xs",
      lg: "px-3 py-1 text-sm"
    };

    return (
      <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
        {children}
      </span>
    );
  };

  // Componente Button personalizado
  const Button = ({
    children,
    variant = "default",
    size = "default",
    className = "",
    ...props
  }: {
    children: React.ReactNode;
    variant?: "default" | "danger";
    size?: "default" | "sm" | "lg";
    className?: string;
    [key: string]: any; // For ...props
  }) => {
    const variants: Record<"default" | "danger", string> = {
      default: "bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 hover:shadow-lg",
      danger: "bg-red-600 text-white hover:bg-red-700"
    };
    
    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1.5 text-xs",
      lg: "px-5 py-2.5 text-base" // Add this line
    };

    return (
      <button 
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className} cursor-pointer`}
        {...props}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden mr-4 p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="text-2xl font-bold text-gray-900">
            Sistema de Inventario
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* <DarkThemeToggle /> */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-700" />
            )}
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <span className="text-sm font-medium hidden sm:block">Administrador</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex relative">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
          <div className="py-6">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-gray-100 text-gray-900 border-r-2 border-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
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

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          {activeSection === 'dashboard' && (
            <div>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600">
                  Resumen general de tu negocio
                </p>
              </div>

            </div>
          )}

          {activeSection === 'inventario' && (
            <div className="flex flex-col items-center justify-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Organizar Inventario</h2>
              <div className="flex space-x-4">
                <Button variant="default" size="lg" className="min-w-[200px] py-4">
                  <Package className="h-5 w-5 mr-2" />
                  Productos No Consumibles
                </Button>
                <Button variant="default" size="lg" className="min-w-[200px] py-4">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Productos Consumibles
                </Button>
              </div>
            </div>
          )}

          {/* Placeholder for other sections */}
          {activeSection !== 'dashboard' && activeSection !== 'inventario' && (
            <div className="text-center py-12">
              <div className="mb-4">
                {React.createElement(menuItems.find(item => item.id === activeSection)?.icon || Home, {
                  className: "h-12 w-12 text-gray-400 mx-auto mb-4"
                })}
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h2>
              <p className="text-gray-600">
                Esta sección está en desarrollo...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}