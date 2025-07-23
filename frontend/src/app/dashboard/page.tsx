"use client";

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Eye,
  AlertTriangle,
  Truck,
  Plus,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';
import { useApi } from '../utils/api';

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

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { withLoading } = useApi();
  const isFeminine = theme === 'feminine';
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [allSales, setAllSales] = useState<RecentSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await withLoading(async () => {
          // Get token from localStorage with correct key
          const token = localStorage.getItem('authToken') || '';
          const headers = {
            'Authorization': `bearer ${token}`
          };

          const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://127.0.0.1:8053';
          
          try {
            // Fetch dashboard summary
            const dashboardResponse = await fetch(`${apiUrl}/api/v1/services/dashboard/summary`, {
              headers
            });
            
            if (dashboardResponse.ok) {
              const dashboardResult = await dashboardResponse.json();
              setDashboardData(dashboardResult);
              // Store all sales for pagination
              if (dashboardResult.ventas_recientes) {
                setAllSales(dashboardResult.ventas_recientes);
              }
            } else {
              setError('Error al cargar datos del dashboard');
            }
          } catch (dashboardError) {
            setError('Error al cargar datos del dashboard');
          }
          
          try {
            // Fetch stock overview
            const stockResponse = await fetch(`${apiUrl}/api/v1/services/stock/summary/overview`, {
              headers
            });
            
            if (stockResponse.ok) {
              const stockResult = await stockResponse.json();
              setStockSummary(stockResult);
            } else {
              setError('Error al cargar resumen de stock');
            }
          } catch (stockError) {
            setError('Error al cargar resumen de stock');
          }
          
          try {
            // Fetch low stock products
            const lowStockResponse = await fetch(`${apiUrl}/api/v1/services/stock/low`, {
              headers
            });
            
            if (lowStockResponse.ok) {
              const lowStockResult = await lowStockResponse.json();
              setLowStockProducts(lowStockResult.productos || []);
            } else {
              setError('Error al cargar productos con stock bajo');
            }
          } catch (lowStockError) {
            setError('Error al cargar productos con stock bajo');
          }
        });
      } catch (err) {
        setError('Error cargando datos. Por favor intente nuevamente.');
      }
    };
    
    fetchData();
  }, []); // Dependencias vacías para que solo se ejecute una vez

  // Filter sales based on search term
  const filteredSales = allSales.filter(sale => 
    sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current sales for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Componente Card personalizado
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white ${isFeminine 
      ? 'rounded-xl shadow-sm border border-pink-100' 
      : 'rounded-lg shadow-md border border-gray-200'} p-6 ${className}`}>
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
      default: isFeminine 
        ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
        : "bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
      danger: isFeminine
        ? "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        : "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    };

    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1.5 text-xs"
    };

    return (
      <button
        className={`inline-flex cursor-pointer items-center justify-center ${isFeminine ? 'rounded-full' : 'rounded-md'} font-medium ${isFeminine ? 'transition-all duration-200' : 'transition-colors'} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className={`h-12 w-12 ${isFeminine ? 'text-rose-500' : 'text-red-600'} mx-auto`} />
          <p className="mt-4 text-gray-900 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className={`mt-4 px-4  cursor-pointer py-2 ${isFeminine 
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full transition-all duration-200'
              : 'bg-primary-600 text-white rounded-md hover:bg-primary-700'}`}
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
        <h1 className={`text-3xl font-bold ${isFeminine ? 'text-gray-800' : 'text-gray-900'} mb-2`}>
          Dashboard
        </h1>
        <p className={isFeminine ? 'text-pink-600' : 'text-gray-600'}>
          Resumen general de tu negocio
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card key="sales-today">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Ventas Hoy</p>
              <p className={`text-2xl font-bold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{dashboardData ? formatPrice(dashboardData.ventas_hoy) : '$0'}</p>
            </div>
            <div className={`p-3 ${isFeminine ? 'bg-pink-100' : 'bg-green-100'} rounded-full`}>
              <TrendingUp className={`h-6 w-6 ${isFeminine ? 'text-pink-600' : 'text-green-600'}`} />
            </div>
          </div>
        </Card>

        <Card key="sellable-products">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Productos Vendibles</p>
              <p className={`text-2xl font-bold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{stockSummary?.total_productos || 0}</p>
            </div>
            <div className={`p-3 ${isFeminine ? 'bg-pink-100' : 'bg-blue-100'} rounded-full`}>
              <ShoppingCart className={`h-6 w-6 ${isFeminine ? 'text-pink-600' : 'text-blue-600'}`} />
            </div>
          </div>
        </Card>

        <Card key="low-stock">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Stock Bajo</p>
              <p className={`text-2xl font-bold ${isFeminine ? 'text-rose-600' : 'text-red-600'}`}>
                {stockSummary?.productos_stock_bajo || 0}
              </p>
            </div>
            <div className={`p-3 ${isFeminine ? 'bg-rose-100' : 'bg-red-100'} rounded-full`}>
              <AlertTriangle className={`h-6 w-6 ${isFeminine ? 'text-rose-600' : 'text-red-600'}`} />
            </div>
          </div>
        </Card>

        <Card key="deliveries">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Domicilios</p>
              <p className={`text-2xl font-bold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                {dashboardData?.domicilios || 0}
              </p>
            </div>
            <div className={`p-3 ${isFeminine ? 'bg-pink-100' : 'bg-purple-100'} rounded-full`}>
              <Truck className={`h-6 w-6 ${isFeminine ? 'text-pink-600' : 'text-purple-600'}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
            Ventas Recientes
          </h2>
          <Button size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver todas
          </Button>
        </div>
        
        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente, producto o número de factura..."
              className={`pl-10 pr-4 py-2 w-full border ${isFeminine ? 'border-pink-200 focus:ring-pink-500 focus:border-pink-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on new search
              }}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isFeminine ? 'divide-pink-100' : 'divide-gray-200'}`}>
            <thead className={isFeminine ? 'bg-pink-50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>ID</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Cliente</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Producto</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Total</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Domicilio</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Fecha</th>
              </tr>
            </thead>
            <tbody className={`bg-white divide-y ${isFeminine ? 'divide-pink-100' : 'divide-gray-200'}`}>
              {currentSales && currentSales.length > 0 ? (
                currentSales.map((venta) => (
                  <tr key={venta.invoice_number} className={`hover:${isFeminine ? 'bg-pink-50' : 'bg-gray-50'} transition-colors`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>#{venta.invoice_number.substring(venta.invoice_number.length - 4)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{venta.client_name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{venta.product_name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{formatPrice(venta.total_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {venta.has_delivery ? (
                        <Badge variant="info">Sí</Badge>
                      ) : (
                        <Badge variant="default">No</Badge>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{venta.invoice_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No se encontraron ventas con esa búsqueda' : 'No hay ventas recientes'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 px-2">
          <div className="text-sm text-gray-600">
            {filteredSales.length > 0 ? 
              `Mostrando ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredSales.length)} de ${filteredSales.length} ventas` :
              `0 ventas encontradas`
            }
          </div>
          {filteredSales.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed cursor-pointer' 
                    : `${isFeminine ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                } p-2 rounded-md`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Page numbers - show limited range */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.max(1, Math.min(5, totalPages)) }).map((_, idx) => {
                  // Calculate which page numbers to show
                  let pageNum;
                  if (totalPages <= 5) {
                    // If 5 or fewer pages, show all
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    // If at start, show first 5
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // If at end, show last 5
                    pageNum = totalPages - 4 + idx;
                  } else {
                    // Otherwise show current page and 2 on each side
                    pageNum = currentPage - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        currentPage === pageNum
                          ? isFeminine 
                            ? 'bg-pink-500 text-white' 
                            : 'bg-gray-900 text-white'
                          : isFeminine
                            ? 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed cursor-pointer' 
                    : `${isFeminine ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                } p-2 rounded-md`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Low Stock Alert */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
            Alertas de Stock Bajo
          </h2>
          <Badge variant="danger" size="lg">
            {lowStockProducts.length} productos
          </Badge>
        </div>
        {lowStockProducts.length > 0 ? (
          <div className="space-y-3">
            {lowStockProducts.map((producto, index) => (
              <div key={`producto-${producto.id}-${index}`} className={`flex items-center justify-between p-3 ${isFeminine ? 'bg-rose-50 border border-rose-200' : 'bg-red-50 border border-red-200'} rounded-lg`}>
                <div>
                  <p className={`font-medium ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>{producto.nombre}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {producto.cantidad} | Mínimo: {producto.minimo}
                  </p>
                </div>
                <Button 
                  variant="danger" 
                  size="sm"
                >
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