'use client';

import React, { useState, useEffect } from 'react';


// Define interfaces for weekly sales data
interface WeeklySaleItem {
  semana: number;
  inicio_semana: string;
  fin_semana: string;
  total_ventas: number;
  ingresos: number;
}

interface WeeklySalesData {
  ventas_por_semana: WeeklySaleItem[];
}

export default function WeeklySalesChart() {
  // State to store sales data from API
  const [salesData, setSalesData] = useState<WeeklySalesData>({
    ventas_por_semana: []
  });
  
  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch weekly sales data from API
  useEffect(() => {
    const fetchWeeklySales = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch('http://127.0.0.1:8053/api/v1/services/statistics/ventas-por-tiempo/week', {
          headers: {
            'Authorization': `bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch weekly sales data');
        }
        
        const data = await response.json();
        setSalesData(data);
      } catch (err) {
        console.error('Error fetching weekly sales data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeeklySales();
  }, []);

  // Function to format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Function to format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Function to format numbers for display (K for thousands, M for millions)
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Process data for the chart
  const chartData = salesData.ventas_por_semana ? salesData.ventas_por_semana.map(week => ({
    semana: `S${week.semana}`,
    periodo: `${formatDate(week.inicio_semana)} - ${formatDate(week.fin_semana)}`,
    inicio: week.inicio_semana,
    fin: week.fin_semana,
    ventas: week.total_ventas || 0,
    ingresos: week.ingresos || 0,
    ingresosFormateados: formatCurrency(week.ingresos || 0)
  })) : [];

  // Calculate statistics
  const totalIngresos = chartData.reduce((sum, item) => sum + item.ingresos, 0);
  const totalVentas = chartData.reduce((sum, item) => sum + item.ventas, 0);
  const promedioSemanal = chartData.length > 0 ? totalIngresos / chartData.length : 0;
  const ultimaSemana = chartData[chartData.length - 1]?.ingresos || 0;
  const primeraSemana = chartData[0]?.ingresos || 0;
  const variacion = primeraSemana > 0 ? ((ultimaSemana - primeraSemana) / primeraSemana) * 100 : 0;
  const esPositivo = variacion > 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">Semana {data.semana}</p>
          <p className="text-gray-600 text-xs mb-2">{data.periodo}</p>
          <p className="text-blue-600 font-semibold">
            Ingresos: {data.ingresosFormateados}
          </p>
          <p className="text-gray-700">
            Ventas: {data.ventas} órdenes
          </p>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos semanales...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="text-center">
            <p className="text-xl text-red-600 font-medium">Error al cargar datos</p>
            <p className="mt-2 text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    </>
  );
} 