"use client"
import React from 'react';
import {
  ShoppingCart,
  Eye,
  AlertTriangle,
  Truck,
  Plus,
  TrendingUp
} from 'lucide-react';

interface VendibleProduct {
  id: number;
  nombre: string;
  tipo: string;
  precio: number;
  stock: number;
  minimo: number;
  estado: string;
}

interface ConsumableProduct {
  id: number;
  nombre: string;
  cantidad: number;
  minimo: number;
  estado: string;
}

export default function InventoryDashboard() {

  // Datos de ejemplo basados en tu estructura
  const productosVendibles: VendibleProduct[] = [
    { id: 1, nombre: 'BOLA DE HELADO DE VAINILLA', tipo: 'HELADO', precio: 1000, stock: 25, minimo: 10, estado: 'bien' },
    { id: 2, nombre: 'BOLA DE HELADO DE FRESA', tipo: 'HELADO', precio: 1500, stock: 8, minimo: 5, estado: 'bien' },
    { id: 3, nombre: 'BOLA DE ESPUMA', tipo: 'ESPUMA', precio: 5000, stock: 3, minimo: 10, estado: 'bajo' },
    { id: 4, nombre: 'MINI PANCAKES', tipo: 'PANCAKES', precio: 1000, stock: 100, minimo: 10, estado: 'bien' },
    { id: 5, nombre: 'MINI DONAS X12', tipo: 'DONAS', precio: 3000, stock: 300, minimo: 10, estado: 'bien' },
  ];

  const productosConsumibles: ConsumableProduct[] = [
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

  const isVendibleProduct = (product: VendibleProduct | ConsumableProduct): product is VendibleProduct => {
    return 'tipo' in product;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Componente Card personalizado
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  );

  // Componente Badge personalizado
  const Badge = ({ children, variant = "default", size = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "info" | "warning" | "danger"; size?: "default" | "lg" }) => {
    const variants = {
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
  const Button = ({ children, variant = "default", size = "default", className = "", ...props }: { children: React.ReactNode; variant?: "default" | "danger"; size?: "default" | "sm"; className?: string; [key: string]: any }) => {
    const variants = {
      default: "bg-gray-900 text-white hover:bg-gray-800",
      danger: "bg-red-600 text-white hover:bg-red-700"
    };

    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1.5 text-xs"
    };

    return (
      <button
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Resumen general de tu negocio
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">$29,000</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Productos Vendibles</p>
              <p className="text-2xl font-bold text-gray-900">{productosVendibles.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600">
                {[...productosVendibles, ...productosConsumibles].filter((p: any) => p.estado === 'bajo').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Domicilios</p>
              <p className="text-2xl font-bold text-gray-900">
                {ventasRecientes.filter(v => v.domicilio).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Ventas Recientes
          </h2>
          <Button size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver todas
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domicilio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventasRecientes.map((venta) => (
                <tr key={venta.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{venta.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.producto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatPrice(venta.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {venta.domicilio ? (
                      <Badge variant="info">Sí</Badge>
                    ) : (
                      <Badge variant="default">No</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.vendedor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Low Stock Alert */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Alertas de Stock Bajo
          </h2>
          <Badge variant="danger" size="lg">
            {[...productosVendibles, ...productosConsumibles].filter(p => p.estado === 'bajo').length} productos
          </Badge>
        </div>
        <div className="space-y-3">
          {productosVendibles
            .filter(p => p.estado === 'bajo')
            .map((producto) => (
              <div key={producto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{producto.nombre}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {producto.stock} | Mínimo: {producto.minimo}
                  </p>
                </div>
                <Button variant="danger" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Reabastecer
                </Button>
              </div>
            ))}
          {productosConsumibles
            .filter(p => p.estado === 'bajo')
            .map((producto) => (
              <div key={producto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{producto.nombre}</p>
                  <p className="text-sm text-gray-600">
                    Cantidad: {producto.cantidad} | Mínimo: {producto.minimo}
                  </p>
                </div>
                <Button variant="danger" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Reabastecer
                </Button>
              </div>
            ))}
        </div>
      </Card>
    </>
  );
}