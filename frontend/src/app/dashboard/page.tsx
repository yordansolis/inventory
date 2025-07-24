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
  ChevronRight,
  RefreshCw
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

interface InsumoProduct {
  id: number;
  nombre_insumo: string;
  unidad: string;
  cantidad_unitaria: number;
  precio_presentacion: number;
  valor_unitario: number;
  cantidad_utilizada: number;
  cantidad_por_producto: number;
  valor_utilizado: number;
  stock_minimo: number;
  sitio_referencia: string;
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
            // Cargar datos de stock desde la API de insumos
            const insumosResponse = await fetch(`${apiUrl}/api/v1/insumos`, {
              headers
            });
            
            if (insumosResponse.ok) {
              const insumosData = await insumosResponse.json();
              
              if (Array.isArray(insumosData)) {
                // Calcular métricas de stock basadas en los insumos
                const totalProductos = insumosData.length;
                const stockBajo = insumosData.filter(item => {
                  const stockDisponible = item.cantidad_unitaria - item.cantidad_utilizada;
                  return stockDisponible <= item.stock_minimo && item.stock_minimo > 0;
                }).length;
                
                const sinStock = insumosData.filter(item => 
                  (item.cantidad_unitaria - item.cantidad_utilizada) <= 0
                ).length;
                
                const disponibles = totalProductos - stockBajo - sinStock;
                
                // Crear resumen de stock
                const stockSummaryData: StockSummary = {
                  total_productos: totalProductos,
                  productos_sin_stock: sinStock,
                  productos_stock_bajo: stockBajo,
                  productos_disponibles: disponibles,
                  fecha_actualizacion: new Date().toISOString(),
                  porcentaje_sin_stock: (sinStock / totalProductos) * 100,
                  porcentaje_stock_bajo: (stockBajo / totalProductos) * 100,
                  porcentaje_disponibles: (disponibles / totalProductos) * 100
                };
                
                setStockSummary(stockSummaryData);
                
                // Crear lista de productos con stock bajo
                const productosConStockBajo = insumosData
                  .map((insumo: InsumoProduct) => {
                    const stockDisponible = insumo.cantidad_unitaria - insumo.cantidad_utilizada;
                    if (stockDisponible <= insumo.stock_minimo && insumo.stock_minimo > 0) {
                      return {
                        id: insumo.id,
                        nombre: insumo.nombre_insumo,
                        cantidad: stockDisponible,
                        minimo: insumo.stock_minimo,
                        estado: stockDisponible <= (insumo.stock_minimo * 0.5) ? 'critical' : 'warning'
                      };
                    }
                    return null;
                  })
                  .filter((item): item is LowStockProduct => item !== null)
                  // Ordenar por criticidad: primero los críticos y luego por porcentaje más bajo de stock
                  .sort((a, b) => {
                    if (a.estado === 'critical' && b.estado !== 'critical') return -1;
                    if (a.estado !== 'critical' && b.estado === 'critical') return 1;
                    
                    const pctA = a.cantidad / a.minimo;
                    const pctB = b.cantidad / b.minimo;
                    return pctA - pctB;
                  });
                
                setLowStockProducts(productosConStockBajo);
              }
            } else {
              throw new Error('Error al cargar insumos');
            }
          } catch (stockError) {
            console.error('Error al procesar datos de stock:', stockError);
            setError('Error al cargar resumen de stock');
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
      : 'rounded-lg shadow-md border border-gray-200'} p-4 sm:p-6 ${className}`}>
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
      lg: "px-2 sm:px-3 py-1 text-xs sm:text-sm"
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
      default: "px-3 sm:px-4 py-2 text-xs sm:text-sm",
      sm: "px-2 sm:px-3 py-1 sm:py-1.5 text-xs"
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

  const refreshStockData = async () => {
    try {
      await withLoading(async () => {
        const token = localStorage.getItem('authToken') || '';
        const headers = {
          'Authorization': `bearer ${token}`
        };
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://127.0.0.1:8053';
        
        // Cargar datos de stock desde la API de insumos
        const insumosResponse = await fetch(`${apiUrl}/api/v1/insumos`, {
          headers
        });
        
        if (insumosResponse.ok) {
          const insumosData = await insumosResponse.json();
          
          if (Array.isArray(insumosData)) {
            // Calcular métricas de stock basadas en los insumos
            const totalProductos = insumosData.length;
            const stockBajo = insumosData.filter(item => {
              const stockDisponible = item.cantidad_unitaria - item.cantidad_utilizada;
              return stockDisponible <= item.stock_minimo && item.stock_minimo > 0;
            }).length;
            
            const sinStock = insumosData.filter(item => 
              (item.cantidad_unitaria - item.cantidad_utilizada) <= 0
            ).length;
            
            const disponibles = totalProductos - stockBajo - sinStock;
            
            // Crear resumen de stock
            const stockSummaryData: StockSummary = {
              total_productos: totalProductos,
              productos_sin_stock: sinStock,
              productos_stock_bajo: stockBajo,
              productos_disponibles: disponibles,
              fecha_actualizacion: new Date().toISOString(),
              porcentaje_sin_stock: (sinStock / totalProductos) * 100,
              porcentaje_stock_bajo: (stockBajo / totalProductos) * 100,
              porcentaje_disponibles: (disponibles / totalProductos) * 100
            };
            
            setStockSummary(stockSummaryData);
            
            // Crear lista de productos con stock bajo
            const productosConStockBajo = insumosData
              .map((insumo: InsumoProduct) => {
                const stockDisponible = insumo.cantidad_unitaria - insumo.cantidad_utilizada;
                if (stockDisponible <= insumo.stock_minimo && insumo.stock_minimo > 0) {
                  return {
                    id: insumo.id,
                    nombre: insumo.nombre_insumo,
                    cantidad: stockDisponible,
                    minimo: insumo.stock_minimo,
                    estado: stockDisponible <= (insumo.stock_minimo * 0.5) ? 'critical' : 'warning'
                  };
                }
                return null;
              })
              .filter((item): item is LowStockProduct => item !== null)
              // Ordenar por criticidad: primero los críticos y luego por porcentaje más bajo de stock
              .sort((a, b) => {
                if (a.estado === 'critical' && b.estado !== 'critical') return -1;
                if (a.estado !== 'critical' && b.estado === 'critical') return 1;
                
                const pctA = a.cantidad / a.minimo;
                const pctB = b.cantidad / b.minimo;
                return pctA - pctB;
              });
            
            setLowStockProducts(productosConStockBajo);
          }
        } else {
          throw new Error('Error al cargar insumos');
        }
      });
    } catch (err) {
      setError('Error actualizando datos de inventario. Por favor intente nuevamente.');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center max-w-md mx-auto">
          <AlertTriangle className={`h-12 w-12 ${isFeminine ? 'text-rose-500' : 'text-red-600'} mx-auto`} />
          <p className="mt-4 text-gray-900 font-medium text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className={`mt-4 px-4 cursor-pointer py-2 text-sm ${isFeminine 
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold ${isFeminine ? 'text-gray-800' : 'text-gray-900'} mb-2`}>
          Dashboard
        </h1>
        <p className={`text-sm sm:text-base ${isFeminine ? 'text-pink-600' : 'text-gray-600'}`}>
          Resumen general de tu negocio
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card key="sales-today">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Ventas Hoy</p>
              <p className={`text-lg sm:text-2xl font-bold ${isFeminine ? 'text-gray-800' : 'text-gray-900'} break-words`}>
                {dashboardData ? formatPrice(dashboardData.ventas_hoy) : '$0'}
              </p>
            </div>
            <div className={`p-2 sm:p-3 ${isFeminine ? 'bg-pink-100' : 'bg-green-100'} rounded-full self-end sm:self-auto`}>
              <TrendingUp className={`h-4 w-4 sm:h-6 sm:w-6 ${isFeminine ? 'text-pink-600' : 'text-green-600'}`} />
            </div>
          </div>
        </Card>

        <Card key="sellable-products">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Productos Vendibles</p>
              <p className={`text-lg sm:text-2xl font-bold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                {stockSummary?.total_productos || 0}
              </p>
            </div>
            <div className={`p-2 sm:p-3 ${isFeminine ? 'bg-pink-100' : 'bg-blue-100'} rounded-full self-end sm:self-auto`}>
              <ShoppingCart className={`h-4 w-4 sm:h-6 sm:w-6 ${isFeminine ? 'text-pink-600' : 'text-blue-600'}`} />
            </div>
          </div>
        </Card>

        <Card key="low-stock">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Stock Bajo</p>
              <p className={`text-lg sm:text-2xl font-bold ${isFeminine ? 'text-rose-600' : 'text-red-600'}`}>
                {stockSummary?.productos_stock_bajo || 0}
              </p>
            </div>
            <div className={`p-2 sm:p-3 ${isFeminine ? 'bg-rose-100' : 'bg-red-100'} rounded-full self-end sm:self-auto`}>
              <AlertTriangle className={`h-4 w-4 sm:h-6 sm:w-6 ${isFeminine ? 'text-rose-600' : 'text-red-600'}`} />
            </div>
          </div>
        </Card>

        <Card key="deliveries">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Domicilios</p>
              <p className={`text-lg sm:text-2xl font-bold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                {dashboardData?.domicilios || 0}
              </p>
            </div>
            <div className={`p-2 sm:p-3 ${isFeminine ? 'bg-pink-100' : 'bg-purple-100'} rounded-full self-end sm:self-auto`}>
              <Truck className={`h-4 w-4 sm:h-6 sm:w-6 ${isFeminine ? 'text-pink-600' : 'text-purple-600'}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h2 className={`text-lg sm:text-xl font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
            Ventas Recientes
          </h2>
          <Button size="sm">
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Ver todas</span>
            <span className="sm:hidden">Ver</span>
          </Button>
        </div>
        
        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente, producto o factura..."
              className={`pl-8 sm:pl-10 pr-4 py-2 w-full border text-sm ${isFeminine ? 'border-pink-200 focus:ring-pink-500 focus:border-pink-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on new search
              }}
            />
          </div>
        </div>
        
        {/* Mobile Cards View */}
        <div className="block sm:hidden space-y-3">
          {currentSales && currentSales.length > 0 ? (
            currentSales.map((venta) => (
              <div key={venta.invoice_number} className={`p-4 border ${isFeminine ? 'border-pink-100 bg-pink-50' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={`font-medium text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                      #{venta.invoice_number.substring(venta.invoice_number.length - 4)}
                    </p>
                    <p className={`text-xs ${isFeminine ? 'text-gray-600' : 'text-gray-500'}`}>{venta.invoice_date}</p>
                  </div>
                  <p className={`text-sm font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                    {formatPrice(venta.total_amount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className={`text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                    <span className="font-medium">Cliente:</span> {venta.client_name}
                  </p>
                  <p className={`text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                    <span className="font-medium">Producto:</span> {venta.product_name}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Domicilio:</span>
                      {venta.has_delivery ? (
                        <Badge variant="info">Sí</Badge>
                      ) : (
                        <Badge variant="default">No</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {searchTerm ? 'No se encontraron ventas con esa búsqueda' : 'No hay ventas recientes'}
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className={`min-w-full divide-y ${isFeminine ? 'divide-pink-100' : 'divide-gray-200'}`}>
            <thead className={isFeminine ? 'bg-pink-50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>ID</th>
                <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Cliente</th>
                <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider hidden lg:table-cell`}>Producto</th>
                <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Total</th>
                <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider hidden md:table-cell`}>Domicilio</th>
                <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Fecha</th>
              </tr>
            </thead>
            <tbody className={`bg-white divide-y ${isFeminine ? 'divide-pink-100' : 'divide-gray-200'}`}>
              {currentSales && currentSales.length > 0 ? (
                currentSales.map((venta) => (
                  <tr key={venta.invoice_number} className={`hover:${isFeminine ? 'bg-pink-50' : 'bg-gray-50'} transition-colors`}>
                    <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                      {formatPrice(venta.total_amount)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      {venta.has_delivery ? (
                        <Badge variant="info">Sí</Badge>
                      ) : (
                        <Badge variant="default">No</Badge>
                      )}
                    </td>
                    <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                      {venta.invoice_date}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No se encontraron ventas con esa búsqueda' : 'No hay ventas recientes'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredSales.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 px-2 space-y-2 sm:space-y-0">
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSales.length)} de {filteredSales.length} ventas
            </div>
            <div className="flex space-x-1 sm:space-x-2 order-1 sm:order-2">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : `${isFeminine ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                } p-1.5 sm:p-2 rounded-md`}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              {/* Page numbers - show limited range */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.max(1, Math.min(3, totalPages)) }).map((_, idx) => {
                  // Calculate which page numbers to show (show fewer on mobile)
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 2) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + idx;
                  } else {
                    pageNum = currentPage - 1 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md text-xs sm:text-sm ${
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
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : `${isFeminine ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                } p-1.5 sm:p-2 rounded-md`}
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Low Stock Alert */}
      <Card className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="flex items-center">
            <h2 className={`text-lg sm:text-xl font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
              Estado del Inventario
            </h2>
            <button 
              onClick={refreshStockData} 
              className={`ml-2 p-1.5 ${isFeminine ? 'hover:bg-pink-100 text-pink-600' : 'hover:bg-gray-100 text-gray-600'} rounded-full transition-colors`}
              title="Actualizar datos de inventario"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
          <Badge variant={lowStockProducts.length > 0 ? "danger" : "success"} size="lg">
            {lowStockProducts.length > 0 
              ? `${lowStockProducts.length} productos con stock bajo`
              : "Inventario OK"
            }
          </Badge>
        </div>
        
        {stockSummary && (
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 mb-4 sm:mb-6 ${isFeminine ? 'bg-pink-50' : 'bg-gray-50'} rounded-lg`}>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Stock Disponible</p>
              <p className={`text-lg sm:text-xl font-bold ${isFeminine ? 'text-green-600' : 'text-green-700'}`}>
                {stockSummary.productos_disponibles || 0}
              </p>
              <p className="text-xs text-gray-500">
                {stockSummary.porcentaje_disponibles ? `${Math.round(stockSummary.porcentaje_disponibles)}%` : '0%'}
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-1.5 sm:h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500" 
                  style={{ width: `${stockSummary.porcentaje_disponibles || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Stock Bajo</p>
              <p className={`text-lg sm:text-xl font-bold ${isFeminine ? 'text-amber-600' : 'text-amber-700'}`}>
                {stockSummary.productos_stock_bajo || 0}
              </p>
              <p className="text-xs text-gray-500">
                {stockSummary.porcentaje_stock_bajo ? `${Math.round(stockSummary.porcentaje_stock_bajo)}%` : '0%'}
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-1.5 sm:h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  style={{ width: `${stockSummary.porcentaje_stock_bajo || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Sin Stock</p>
              <p className={`text-lg sm:text-xl font-bold ${isFeminine ? 'text-rose-600' : 'text-red-700'}`}>
                {stockSummary.productos_sin_stock || 0}
              </p>
              <p className="text-xs text-gray-500">
                {stockSummary.porcentaje_sin_stock ? `${Math.round(stockSummary.porcentaje_sin_stock)}%` : '0%'}
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-1.5 sm:h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${stockSummary.porcentaje_sin_stock || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Combined visual representation of stock */}
        {stockSummary && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 border border-gray-100 rounded-lg">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-3">Distribución del inventario</p>
            <div className="flex h-4 sm:h-6 w-full rounded-lg overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-500 ease-in-out" 
                style={{ width: `${stockSummary.porcentaje_disponibles || 0}%` }}
                title={`Stock disponible: ${stockSummary.productos_disponibles || 0} productos (${Math.round(stockSummary.porcentaje_disponibles || 0)}%)`}
              ></div>
              <div 
                className="bg-amber-500 h-full transition-all duration-500 ease-in-out" 
                style={{ width: `${stockSummary.porcentaje_stock_bajo || 0}%` }}
                title={`Stock bajo: ${stockSummary.productos_stock_bajo || 0} productos (${Math.round(stockSummary.porcentaje_stock_bajo || 0)}%)`}
              ></div>
              <div 
                className="bg-red-500 h-full transition-all duration-500 ease-in-out" 
                style={{ width: `${stockSummary.porcentaje_sin_stock || 0}%` }}
                title={`Sin stock: ${stockSummary.productos_sin_stock || 0} productos (${Math.round(stockSummary.porcentaje_sin_stock || 0)}%)`}
              ></div>
            </div>
            <div className="flex flex-wrap justify-between mt-2 text-xs text-gray-500 gap-2">
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 mr-1 rounded-sm"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-500 mr-1 rounded-sm"></div>
                <span>Stock bajo</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 mr-1 rounded-sm"></div>
                <span>Sin stock</span>
              </div>
            </div>
            {stockSummary.fecha_actualizacion && (
              <p className="text-xs text-gray-400 mt-3 text-right">
                Actualizado: {new Date(stockSummary.fecha_actualizacion).toLocaleString()}
              </p>
            )}
          </div>
        )}
        
        {lowStockProducts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-medium text-gray-700 mb-2 flex items-center">
              <AlertTriangle className={`h-3 w-3 sm:h-4 sm:w-4 mr-1.5 ${isFeminine ? 'text-rose-500' : 'text-red-500'}`} />
              Productos que requieren reabastecimiento
            </h3>
            {lowStockProducts.slice(0, 5).map((producto, index) => (
              <div key={`producto-${producto.id}-${index}`} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 space-y-2 sm:space-y-0 ${
                producto.estado === 'critical' 
                  ? isFeminine ? 'bg-rose-50 border border-rose-200' : 'bg-red-50 border border-red-200'
                  : isFeminine ? 'bg-amber-50 border border-amber-200' : 'bg-yellow-50 border border-yellow-200'
              } rounded-lg`}>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'} mb-2`}>
                    {producto.nombre}
                  </p>
                  <div className="flex items-center">
                    <div className="w-full max-w-[80px] sm:max-w-[100px] bg-gray-200 h-1.5 sm:h-2 rounded-full overflow-hidden mr-3">
                      <div 
                        className={`h-full transition-all duration-300 ${producto.cantidad <= producto.minimo * 0.5 ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, Math.round((producto.cantidad / producto.minimo) * 100))}%` }}
                      ></div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                      <span className={producto.cantidad <= producto.minimo * 0.5 ? 'font-medium text-red-600' : ''}>
                        {producto.cantidad}
                      </span>
                      <span className="mx-1">/</span>
                      <span>{producto.minimo}</span>
                      <span className="ml-2 text-xs">
                        ({Math.round((producto.cantidad / producto.minimo) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-end sm:ml-4">
                  <Badge 
                    variant={producto.cantidad <= producto.minimo * 0.5 ? "danger" : "warning"} 
                    size="default"
                  >
                    {producto.cantidad <= producto.minimo * 0.5 ? 'Crítico' : 'Bajo'}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                {lowStockProducts.length > 5 ? `Mostrando 5 de ${lowStockProducts.length} productos con stock bajo` : ''}
              </p>
              <Button
                onClick={() => window.location.href = '/dashboard/inventario/suministro'}
                className={`flex items-center ${isFeminine ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <span className="hidden sm:inline">Ir a gestión de suministros</span>
                <span className="sm:hidden">Gestión suministros</span>
                <Eye className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8">
            <div className={`p-2 sm:p-3 ${isFeminine ? 'bg-green-100' : 'bg-green-100'} rounded-full mb-3`}>
              <ShoppingCart className={`h-5 w-5 sm:h-6 sm:w-6 ${isFeminine ? 'text-green-600' : 'text-green-600'}`} />
            </div>
            <p className="text-center text-gray-600 mb-2 text-sm sm:text-base">¡Todo bajo control! No hay productos con stock bajo</p>
            <Button
              size="sm"
              onClick={() => window.location.href = '/dashboard/inventario/suministro'}
              className={`mt-2 ${isFeminine ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
            >
              <span className="hidden sm:inline">Ir a Inventario</span>
              <span className="sm:hidden">Inventario</span>
              <Eye className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Payment Methods */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h2 className={`text-lg sm:text-xl font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
            Métodos de Pago
          </h2>
          <Badge variant="info" size="lg">
            {dashboardData?.metodos_pago?.length || 0} métodos
          </Badge>
        </div>
        {dashboardData?.metodos_pago && dashboardData.metodos_pago.length > 0 ? (
          <>
            {/* Mobile Cards View */}
            <div className="block sm:hidden space-y-3">
              {dashboardData.metodos_pago.map((metodo, index) => (
                <div key={index} className={`p-4 border ${isFeminine ? 'border-pink-100 bg-pink-50' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`font-medium text-sm ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                      {metodo.payment_method}
                    </p>
                    <p className={`text-sm font-semibold ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                      {formatPrice(metodo.total)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Ventas:</span> {metodo.count}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className={`min-w-full divide-y ${isFeminine ? 'divide-pink-100' : 'divide-gray-200'}`}>
                <thead className={isFeminine ? 'bg-pink-50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Método</th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Ventas</th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${isFeminine ? 'text-pink-700' : 'text-gray-500'} uppercase tracking-wider`}>Total</th>
                  </tr>
                </thead>
                <tbody className={`bg-white divide-y ${isFeminine ? 'divide-pink-100' : 'divide-gray-200'}`}>
                  {dashboardData.metodos_pago.map((metodo, index) => (
                    <tr key={index} className={`hover:${isFeminine ? 'bg-pink-50' : 'bg-gray-50'} transition-colors`}>
                      <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium ${isFeminine ? 'text-gray-800' : 'text-gray-900'}`}>
                        {metodo.payment_method}
                      </td>
                      <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm`}>
                        {metodo.count}
                      </td>
                      <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold`}>
                        {formatPrice(metodo.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8">
            <div className={`p-2 sm:p-3 ${isFeminine ? 'bg-green-100' : 'bg-green-100'} rounded-full mb-3`}>
              <ShoppingCart className={`h-5 w-5 sm:h-6 sm:w-6 ${isFeminine ? 'text-green-600' : 'text-green-600'}`} />
            </div>
            <p className="text-center text-gray-600 mb-2 text-sm sm:text-base">No hay métodos de pago registrados</p>
          </div>
        )}
      </Card>
    </div>
  );
}