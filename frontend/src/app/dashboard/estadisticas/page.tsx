'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  AlertTriangle
} from 'lucide-react';
import { 

  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import SalesChart from './SalesChart';
import WeeklySalesChart from './WeeklySalesChart';

// Interfaces for API responses
interface GeneralStats {
  total_products: number;
  monthly_sales: {
    count: number;
    revenue: number;
  };
  weekly_sales: WeeklySale[];
  top_products: TopProduct[];
}

interface WeeklySale {
  date: string;
  count: number;
  revenue: number;
  ticket_promedio: number;
}

interface TopProduct {
  product_name: string;
  product_variant: string;
  quantity_sold: number;
  revenue: number;
  numero_ordenes: number;
}

interface DailySales {
  ventas_por_dia: {
    fecha: string;
    total_ventas: number;
    ingresos: number;
    ticket_promedio: number;
  }[];
}

interface MonthlySales {
  ventas_por_mes: {
    año: number;
    mes: number;
    total_ventas: number;
    ingresos: number;
    ingresos_domicilio: number;
  }[];
}

interface WeeklySales {
  ventas_por_semana: {
    semana: number;
    inicio_semana: string;
    fin_semana: string;
    total_ventas: number;
    ingresos: number;
  }[];
}

interface YearlySales {
  ventas_por_año: {
    año: number;
    total_ventas: number;
    ingresos: number;
    ticket_promedio: number;
    ingresos_domicilio: number;
  }[];
}

interface TopProducts {
  productos_mas_vendidos: {
    producto: string;
    variante: string;
    cantidad_vendida: number;
    ingresos: number;
    numero_ordenes: number;
  }[];
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
}

interface DeliveryMetrics {
  domicilios_vs_directa: {
    tipo: string;
    total_ordenes: number;
    ingresos_total: number;
    ticket_promedio: number;
    total_domicilios: number;
  }[];
  metodos_pago: {
    metodo_pago: string;
    cantidad_transacciones: number;
    valor_total: number;
    valor_promedio: number;
  }[];
}

// Time range type
type TimeRange = 'day' | 'week' | 'month' | 'year';

export default function EstadisticasPage() {
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [timeStats, setTimeStats] = useState<DailySales | MonthlySales | WeeklySales | YearlySales | null>(null);
  const [topProducts, setTopProducts] = useState<TopProducts | null>(null);
  const [deliveryMetrics, setDeliveryMetrics] = useState<DeliveryMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token') || '';
        const headers = {
          'Authorization': `bearer ${token}`
        };

        // Fetch general statistics
        const generalResponse = await fetch('http://127.0.0.1:8053/api/v1/services/statistics', {
          headers
        });
        
        if (!generalResponse.ok) {
          throw new Error('Failed to fetch general statistics');
        }
        
        const generalData = await generalResponse.json();
        setGeneralStats(generalData);
        
        // Fetch time-based statistics
        const timeResponse = await fetch(`http://127.0.0.1:8053/api/v1/services/statistics/ventas-por-tiempo/${timeRange}`, {
          headers
        });
        
        if (!timeResponse.ok) {
          throw new Error('Failed to fetch time-based statistics');
        }
        
        const timeData = await timeResponse.json();
        setTimeStats(timeData);
        
        // Fetch top products
        const topProductsResponse = await fetch(
          `http://127.0.0.1:8053/api/v1/services/statistics/productos-top?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`, 
          { headers }
        );
        
        if (!topProductsResponse.ok) {
          throw new Error('Failed to fetch top products');
        }
        
        const topProductsData = await topProductsResponse.json();
        setTopProducts(topProductsData);
        
        // Fetch delivery metrics
        const deliveryResponse = await fetch('http://127.0.0.1:8053/api/v1/services/statistics/metricas-entrega', {
          headers
        });
        
        if (!deliveryResponse.ok) {
          throw new Error('Failed to fetch delivery metrics');
        }
        
        const deliveryData = await deliveryResponse.json();
        setDeliveryMetrics(deliveryData);
        
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Error cargando estadísticas. Por favor intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, dateRange]);

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
  const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "info" | "warning" | "danger" }) => {
    const variants = {
      default: "bg-gray-100 text-gray-800",
      success: "bg-green-100 text-green-800",
      info: "bg-blue-100 text-blue-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800"
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variants[variant]}`}>
        {children}
      </span>
    );
  };

  // Componente Button personalizado
  const Button = ({ children, variant = "default", active = false, onClick }: { 
    children: React.ReactNode; 
    variant?: "default" | "outline"; 
    active?: boolean;
    onClick?: () => void;
  }) => {
    // Always use primary color for active state
    if (active) {
      return (
        <button
          className="px-4 py-2 text-sm font-bold rounded-md transition-all bg-blue-600 text-white shadow-md border-2 border-blue-800 dark:bg-blue-500 dark:border-blue-700"
          onClick={onClick}
        >
          {children}
        </button>
      );
    }
    
    // Use variant styling for inactive state
    if (variant === 'default') {
      return (
        <button
          className="px-4 py-2 text-sm font-medium rounded-md transition-all bg-blue-400 text-white hover:bg-blue-500 shadow-sm dark:bg-blue-700 dark:hover:bg-blue-600"
          onClick={onClick}
        >
          {children}
        </button>
      );
    } else {
      return (
        <button
          className="px-4 py-2 text-sm font-medium rounded-md transition-all bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          onClick={onClick}
        >
          {children}
        </button>
      );
    }
  };

  if (loading && !generalStats) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full py-24">
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

  // Prepare data for charts
  const prepareTimeData = () => {
    if (!timeStats) return [];
    
    if ('ventas_por_dia' in timeStats) {
      return (timeStats as DailySales).ventas_por_dia.map(day => ({
        fecha: day.fecha || 'Sin fecha',
        total_ventas: day.total_ventas || 0,
        ingresos: day.ingresos || 0,
        ticket_promedio: day.ticket_promedio || 0
      }));
    } else if ('ventas_por_semana' in timeStats) {
      return (timeStats as WeeklySales).ventas_por_semana.map(week => ({
        fecha: `${week.inicio_semana || 'Inicio'} - ${week.fin_semana || 'Fin'}`,
        total_ventas: week.total_ventas || 0,
        ingresos: week.ingresos || 0
      }));
    } else if ('ventas_por_mes' in timeStats) {
      return (timeStats as MonthlySales).ventas_por_mes.map(month => ({
        fecha: `${month.mes || '0'}/${month.año || '0'}`,
        total_ventas: month.total_ventas || 0,
        ingresos: month.ingresos || 0,
        ingresos_domicilio: month.ingresos_domicilio || 0
      }));
    } else if ('ventas_por_año' in timeStats) {
      return (timeStats as YearlySales).ventas_por_año.map(year => ({
        fecha: year.año?.toString() || 'Sin año',
        total_ventas: year.total_ventas || 0,
        ingresos: year.ingresos || 0,
        ingresos_domicilio: year.ingresos_domicilio || 0
      }));
    }
    
    return [];
  };

  const prepareDeliveryData = () => {
    if (!deliveryMetrics?.domicilios_vs_directa?.length) return [];
    return deliveryMetrics.domicilios_vs_directa.map(item => ({
      name: item.tipo || 'Sin tipo',
      value: item.ingresos_total || 0
    }));
  };

  const preparePaymentMethodData = () => {
    if (!deliveryMetrics?.metodos_pago?.length) return [];
    return deliveryMetrics.metodos_pago.map(item => ({
      name: item.metodo_pago ? (item.metodo_pago.charAt(0).toUpperCase() + item.metodo_pago.slice(1)) : 'Otro',
      value: item.valor_total || 0
    }));
  };

  const timeData = prepareTimeData();
  const deliveryData = prepareDeliveryData();
  const paymentMethodData = preparePaymentMethodData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Estadísticas
        </h1>
        <p className="text-gray-600">
          Análisis detallado de ventas y rendimiento
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Ventas Mensuales</p>
              <p className="text-2xl font-bold text-gray-900">
                {generalStats ? formatPrice(generalStats.monthly_sales.revenue) : '$0'}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Órdenes Mensuales</p>
              <p className="text-2xl font-bold text-gray-900">
                {generalStats?.monthly_sales.count || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">
                {generalStats?.total_products || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {generalStats && generalStats.monthly_sales.count > 0 
                  ? formatPrice(generalStats.monthly_sales.revenue / generalStats.monthly_sales.count) 
                  : '$0'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Sales Charts */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        <SalesChart />
        <WeeklySalesChart />
      </div>

      {/* Time Range Selector */}
     

      {/* Sales Over Time Chart */}
    
      {/* Top Products and Delivery Charts */}
      

      {/* Payment Methods */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Métodos de Pago
        </h2>
        {deliveryMetrics && deliveryMetrics.metodos_pago.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={false}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-payment-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatPrice(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transacciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveryMetrics.metodos_pago.map((method, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {method.metodo_pago.charAt(0).toUpperCase() + method.metodo_pago.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {method.cantidad_transacciones}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(method.valor_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(method.valor_promedio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">No hay datos disponibles</p>
        )}
      </Card>
    </div>
  );
}