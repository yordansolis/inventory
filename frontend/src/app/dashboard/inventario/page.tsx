"use client"
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  ArrowRight,
  Tag,
  Box,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Card, Button } from '../../../../components/ui';
import Link from 'next/link';
import { getAuthHeaders } from '../../utils/auth';
// import { useApi } from '../../utils/api';

interface InventoryStats {
  totalProductos: number;
  enStock: number;
  bajoStock: number;
}

interface InsumoConBajoStock {
  id: number;
  nombre_insumo: string;
  stock_disponible: number;
  stock_minimo: number;
  unidad: string;
}

export default function InventoryDashboard() {
  const [stats, setStats] = useState<InventoryStats>({
    totalProductos: 0,
    enStock: 0,
    bajoStock: 0
  });
  const [insumosBajoStock, setInsumosBajoStock] = useState<InsumoConBajoStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const { withLoading } = useApi();

  useEffect(() => {
    // Cargar estadísticas de inventario al montar el componente
    loadInventoryStats();
    loadInsumosConBajoStock();
  }, []);

  const loadInventoryStats = async () => {
    try {
      // Implementación pendiente
    } catch (error) {
      setError('Error al cargar estadísticas de inventario');
    }
  };

  const loadInsumosConBajoStock = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND;
      
      if (!apiUrl) {
        throw new Error('Error de configuración: URL del backend no definida');
      }
      
      const response = await fetch(`${apiUrl}/api/v1/insumos`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filtrar insumos con bajo stock (stock_disponible <= stock_minimo)
      const insumosFiltrados = data
        .map((insumo: any) => ({
          id: insumo.id,
          nombre_insumo: insumo.nombre_insumo,
          stock_disponible: insumo.cantidad_unitaria - insumo.cantidad_utilizada,
          stock_minimo: insumo.stock_minimo,
          unidad: insumo.unidad
        }))
        .filter((insumo: InsumoConBajoStock) => 
          insumo.stock_minimo > 0 && insumo.stock_disponible <= insumo.stock_minimo
        )
        // Ordenar por criticidad (porcentaje de stock restante)
        .sort((a: InsumoConBajoStock, b: InsumoConBajoStock) => {
          const pctA = a.stock_disponible / a.stock_minimo;
          const pctB = b.stock_disponible / b.stock_minimo;
          return pctA - pctB;
        })
        // Limitar a los 5 más críticos para la vista rápida
        .slice(0, 5);
      
      setInsumosBajoStock(insumosFiltrados);
      
      // Actualizar estadística de productos con bajo stock
      setStats(prev => ({
        ...prev,
        bajoStock: insumosFiltrados.length
      }));
      
    } catch (error: any) {
      setError(error.message || 'Error al cargar insumos con bajo stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Organizar Inventario
          </h1>
          <p className="text-lg text-gray-600">
            Gestiona tus productos de manera eficiente
          </p>
        </div>

        {/* Stock Alert Section */}
        {insumosBajoStock.length > 0 && (
          <Card className="mb-12 border-amber-200 bg-amber-50 overflow-hidden">
            <div className="p-6 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-amber-800">
                  Alertas de Stock Bajo ({insumosBajoStock.length})
                </h2>
              </div>
              <p className="text-amber-700 text-sm mt-2">
                Los siguientes productos necesitan ser reabastecidos pronto:
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-100/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-amber-800">Producto</th>
                    <th className="text-left p-3 text-sm font-medium text-amber-800">Stock Disponible</th>
                    <th className="text-left p-3 text-sm font-medium text-amber-800">Stock Mínimo</th>
                    <th className="text-left p-3 text-sm font-medium text-amber-800">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200/70">
                  {insumosBajoStock.map(insumo => {
                    // Calcular porcentaje para mostrar nivel de criticidad
                    const stockPct = (insumo.stock_disponible / insumo.stock_minimo) * 100;
                    const isCritical = stockPct <= 50;
                    
                    return (
                      <tr key={insumo.id} className="hover:bg-amber-100/30">
                        <td className="p-3 text-sm font-medium text-amber-900">{insumo.nombre_insumo}</td>
                        <td className="p-3 text-sm text-amber-800">
                          {insumo.stock_disponible} {insumo.unidad}
                        </td>
                        <td className="p-3 text-sm text-amber-800">
                          {insumo.stock_minimo} {insumo.unidad}
                        </td>
                        <td className="p-3">
                          <div className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
                            isCritical ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isCritical ? 'Crítico' : 'Bajo'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-amber-100/30 border-t border-amber-200 flex justify-end">
              <Link href="/dashboard/inventario/suministro">
                <Button 
                  variant="default" 
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Ir a Suministros
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Cards Container */}
        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {/* Gestión de Categorías */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6 mx-auto group-hover:bg-slate-200 transition-colors">
                <Tag className="h-8 w-8 text-slate-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Gestión de Categorías
              </h3>
              
              <p className="text-gray-600 text-center mb-6 flex-grow">
                Organiza tus productos por categorías
              </p>
              
              <Link href="/dashboard/inventario/categorias" className="block mt-auto">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 group-hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                >
                 
                  Gestionar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Gestionar Insumos */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6 mx-auto group-hover:bg-slate-200 transition-colors">
                <ShoppingCart className="h-8 w-8 text-slate-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Gestionar Insumos
              </h3>
              
              <p className="text-gray-600 text-center mb-6 flex-grow">
                Suministros, materiales y artículos de uso único
              </p>
              
              <Link href="/dashboard/inventario/suministro" className="block mt-auto">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 group-hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Gestionar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Gestión de Productos */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6 mx-auto group-hover:bg-slate-200 transition-colors">
                <Box className="h-8 w-8 text-slate-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Gestión de Productos
              </h3>
              
              <p className="text-gray-600 text-center mb-6 flex-grow">
                Administra el catálogo de productos a la venta
              </p>
              
              <Link href="/dashboard/inventario/productos" className="block mt-auto">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 group-hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Gestionar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}