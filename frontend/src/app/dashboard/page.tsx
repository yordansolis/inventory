"use client"
import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Eye,
  AlertTriangle,
  Truck,
  Plus,
  TrendingUp
} from 'lucide-react';

interface DashboardSummary {
  ventas_hoy: number;
  productos_vendibles: number;
  stock_bajo: number;
  productos_stock_bajo: any[];
  domicilios: number;
  ventas_recientes: RecentSale[];
  total_productos: number;
  productos_sin_stock: number;
  ventas_cantidad: number;
  metodos_pago: PaymentMethod[];
  productos_top: TopProduct[];
}

interface RecentSale {
  client_name: string;
  product_name: string;
  product_variant: string;
  total_amount: number;
  has_delivery: number;
  delivery_person: string;
  invoice_date: string;
  invoice_time: string;
  invoice_number: string;
}

interface PaymentMethod {
  payment_method: string;
  count: number;
  total: number;
}

interface TopProduct {
  product_name: string;
  product_variant: string;
  total_quantity: number;
  total_revenue: number;
  times_sold: number;
}

interface StockSummary {
  total_productos: number;
  productos_sin_stock: number;
  productos_stock_bajo: number;
  productos_disponibles: number;
  fecha_actualizacion: string | null;
  porcentaje_sin_stock: number;
  porcentaje_stock_bajo: number;
  porcentaje_disponibles: number;
}

interface LowStockData {
  min_stock_threshold: number;
  total_productos_bajo_stock: number;
  productos: LowStockProduct[];
}

interface LowStockProduct {
  id: number;
  nombre: string;
  cantidad: number;
  minimo: number;
  estado: string;
}

export default function InventoryDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage or your auth context
        const token = localStorage.getItem('token') || '';
        const headers = {
          'Authorization': `bearer ${token}`
        };

        // Fetch dashboard summary
        const dashboardResponse = await fetch('http://127.0.0.1:8053/api/v1/services/dashboard/summary', {
          headers
        });
        
        if (!dashboardResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult);
        
        // Fetch stock overview
        const stockResponse = await fetch('http://127.0.0.1:8053/api/v1/services/stock/summary/overview', {
          headers
        });
        
        if (!stockResponse.ok) {
          throw new Error('Failed to fetch stock summary');
        }
        
        const stockResult = await stockResponse.json();
        setStockSummary(stockResult);
        
        // Fetch low stock products
        const lowStockResponse = await fetch('http://127.0.0.1:8053/api/v1/services/stock/low', {
          headers
        });
        
        if (!lowStockResponse.ok) {
          throw new Error('Failed to fetch low stock products');
        }
        
        const lowStockResult = await lowStockResponse.json();
        setLowStockProducts(lowStockResult.productos || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error cargando datos. Por favor intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Componente Card personalizado
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
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
      default: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
          <p className="mt-4 text-gray-900 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

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
              <p className="text-2xl font-bold text-gray-900">{dashboardData ? formatPrice(dashboardData.ventas_hoy) : '$0'}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stockSummary?.total_productos || 0}</p>
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
                {stockSummary?.productos_stock_bajo || 0}
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
                {dashboardData?.domicilios || 0}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData?.ventas_recientes && dashboardData.ventas_recientes.length > 0 ? (
                dashboardData.ventas_recientes.map((venta, index) => (
                  <tr key={venta.invoice_number} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{venta.invoice_number.substring(venta.invoice_number.length - 4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatPrice(venta.total_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {venta.has_delivery ? (
                        <Badge variant="info">Sí</Badge>
                      ) : (
                        <Badge variant="default">No</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.invoice_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay ventas recientes
                  </td>
                </tr>
              )}
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
            {lowStockProducts.length} productos
          </Badge>
        </div>
        {lowStockProducts.length > 0 ? (
          <div className="space-y-3">
            {lowStockProducts.map((producto) => (
              <div key={producto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{producto.nombre}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {producto.cantidad} | Mínimo: {producto.minimo}
                  </p>
                </div>
                <Button variant="danger" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Reabastecer
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No hay productos con stock bajo</p>
        )}
      </Card>
    </>
  );
}