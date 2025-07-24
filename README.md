# inventory

SELECT \* FROM inventory.insumos;

-- 🔁 ¿Y si quiero saber qué productos están por agotarse?
WITH stock_por_producto AS (
SELECT
p.id AS producto_id,
p.nombre_producto,
FLOOR(MIN(i.cantidad_unitaria / pr.cantidad)) AS stock_disponible,
p.min_stock
FROM products p
JOIN product_recipes pr ON p.id = pr.product_id
JOIN insumos i ON pr.insumo_id = i.id
GROUP BY p.id, p.nombre_producto
)
SELECT \*
FROM stock_por_producto
WHERE stock_disponible <= min_stock;

-- ✅ Consulta SQL para calcular stock disponible por producto
-- ✅ Stock disponible por producto (cuántas unidades se pueden hacer con los insumos disponibles).

SELECT
p.id AS producto_id,
p.nombre_producto,
FLOOR(MIN(i.cantidad_unitaria / pr.cantidad)) AS stock_disponible
FROM products p
JOIN product_recipes pr ON p.id = pr.product_id
JOIN insumos i ON pr.insumo_id = i.id
GROUP BY p.id, p.nombre_producto;

#

-- Ejemplo para el producto FRESAS:
-- Requiere:
-- 1 Sticke (hay 1000) → 1000 / 1 = 1000
-- 1 FRESAS CON CREMA (hay 50) → 50 / 1 = 50
-- 3 SAL LIMÓN (hay 1000) → 1000 / 3 ≈ 333
-- El mínimo de esos es 50 → Puedes producir 50 FRESAS CON HELADO.

// import React, { useState, useEffect } from 'react';
// import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
// import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

// // Define interfaces for sales data
// interface SalesItem {
// fecha: string;
// total: number;
// }

// interface SalesData {
// sales_summary: SalesItem[];
// }

// export default function SalesChart() {
// // State to store sales data from API
// const [salesData, setSalesData] = useState<SalesData>({
// "sales_summary": []
// });

// // State for loading and error handling
// const [loading, setLoading] = useState(true);
// const [error, setError] = useState<string | null>(null);

// // Fetch sales data from API
// useEffect(() => {
// const fetchSalesData = async () => {
// try {
// const token = localStorage.getItem('token') || '';
// const response = await fetch('http://127.0.0.1:8053/api/v1/services/statistics/sales-summary-by-date', {
// headers: {
// 'Authorization': `bearer ${token}`
// }
// });

// if (!response.ok) {
// throw new Error('Failed to fetch sales data');
// }

// const data = await response.json();
// setSalesData(data);
// } catch (err) {
// console.error('Error fetching sales data:', err);
// setError(err instanceof Error ? err.message : 'An unknown error occurred');
// } finally {
// setLoading(false);
// }
// };

// fetchSalesData();
// }, []);

// // Función para formatear la fecha
// const formatDate = (dateString: string): string => {
// const date = new Date(dateString);
// const day = date.getDate();
// const month = date.toLocaleDateString('es-ES', { month: 'short' });
// return `${day} ${month}`;
// };

// // Función para formatear números como moneda
// const formatCurrency = (value: number): string => {
// return new Intl.NumberFormat('es-CO', {
// style: 'currency',
// currency: 'COP',
// minimumFractionDigits: 0,
// maximumFractionDigits: 0
// }).format(value);
// };

// // Función para formatear números en miles
// const formatTooltipValue = (value: number): string => {
// if (value >= 1000000) {
// return `$${(value / 1000000).toFixed(1)}M`;
// } else if (value >= 1000) {
// return `$${(value / 1000).toFixed(0)}K`;
// }
// return `$${value}`;
// };

// // Versión del formateador que acepta cualquier tipo de entrada para usar con componentes de recharts
// const formatLabelValue = (value: any): string => {
// if (typeof value === 'number') {
// return formatTooltipValue(value);
// }
// return String(value);
// };

// // Procesar datos para el gráfico
// const chartData = salesData.sales_summary.map((item, index) => ({
// fecha: formatDate(item.fecha),
// fechaCompleta: item.fecha,
// ventas: item.total,
// ventasFormateadas: formatCurrency(item.total),
// dia: index + 1
// }));

// // Calcular estadísticas
// const totalVentas = chartData.reduce((sum, item) => sum + item.ventas, 0);
// const ventaPromedio = chartData.length > 0 ? totalVentas / chartData.length : 0;
// const ultimaVenta = chartData[chartData.length - 1]?.ventas || 0;
// const primeraVenta = chartData[0]?.ventas || 0;
// const variacionTotal = primeraVenta > 0 ? ((ultimaVenta - primeraVenta) / primeraVenta) \* 100 : 0;
// const esPositivo = variacionTotal > 0;

// interface TooltipProps {
// active?: boolean;
// payload?: Array<{
// payload: {
// fechaCompleta: string;
// ventasFormateadas: string;
// }
// }>;
// label?: string;
// }

// // Componente de tooltip personalizado
// const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
// if (active && payload && payload.length) {
// const data = payload[0].payload;
// return (
// <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
// <p className="font-medium text-gray-900">{`Fecha: ${data.fechaCompleta}`}</p>
// <p className="text-blue-600 font-semibold">
// {`Ventas: ${data.ventasFormateadas}`}
// </p>
// </div>
// );
// }
// return null;
// };

// // Loading state
// if (loading) {
// return (
// <div className="w-full max-w-4xl mx-auto p-6">
// <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex items-center justify-center">
// <div className="text-center">
// <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
// <p className="mt-4 text-gray-600">Cargando datos de ventas...</p>
// </div>
// </div>
// </div>
// );
// }

// // Error state
// if (error) {
// return (
// <div className="w-full max-w-4xl mx-auto p-6">
// <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
// <div className="text-center">
// <p className="text-xl text-red-600 font-medium">Error al cargar datos</p>
// <p className="mt-2 text-gray-600">{error}</p>
// <button
// onClick={() => window.location.reload()}
// className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
// >
// Reintentar
// </button>
// </div>
// </div>
// </div>
// );
// }

// // Main component
// return (
// <div className="w-full max-w-4xl mx-auto p-6">
// <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
// {/_ Header _/}
// <div className="p-6 border-b border-gray-100">
// <div className="flex items-center justify-between">
// <div>
// <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
// <DollarSign className="h-6 w-6 text-green-600" />
// Ventas Diarias
// </h2>
// <p className="text-gray-600 mt-1">
// {chartData.length > 0 ?
// `${chartData[0]?.fechaCompleta || ''} - ${chartData[chartData.length-1]?.fechaCompleta || ''}` :
// 'Sin datos'} • {chartData.length} días registrados
// </p>
// </div>
// <div className="text-right">
// <div className="text-sm text-gray-500">Total Período</div>
// <div className="text-2xl font-bold text-gray-900">
// {formatCurrency(totalVentas)}
// </div>
// </div>
// </div>
// </div>

// {/_ Chart _/}
// <div className="p-6">
// {chartData.length > 0 ? (
// <div className="h-80 w-full">
// <ResponsiveContainer width="100%" height="100%">
// <LineChart
// data={chartData}
// margin={{
//                     top: 20,
//                     right: 30,
//                     left: 20,
//                     bottom: 5,
//                   }}
// >
// <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
// <XAxis
// dataKey="fecha"
// axisLine={false}
// tickLine={false}
// tick={{ fontSize: 12, fill: '#666' }}
// />
// <YAxis
// axisLine={false}
// tickLine={false}
// tick={{ fontSize: 12, fill: '#666' }}
// tickFormatter={formatLabelValue}
// />
// <Line
// type="monotone"
// dataKey="ventas"
// stroke="#2563eb"
// strokeWidth={3}
// dot={{
//                       fill: "#2563eb",
//                       strokeWidth: 2,
//                       r: 6
//                     }}
// activeDot={{
//                       r: 8,
//                       fill: "#1d4ed8",
//                       stroke: "#fff",
//                       strokeWidth: 2
//                     }}
// >
// <LabelList
// dataKey="ventas"
// position="top"
// formatter={formatLabelValue}
// style={{
//                         fill: '#374151',
//                         fontSize: '12px',
//                         fontWeight: '500'
//                       }}
// />
// </Line>
// <defs>
// <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
// <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
// <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
// </linearGradient>
// </defs>
// </LineChart>
// </ResponsiveContainer>
// </div>
// ) : (
// <div className="h-80 w-full flex items-center justify-center">
// <p className="text-gray-500 text-lg">No hay datos de ventas disponibles</p>
// </div>
// )}
// </div>

// {/_ Footer Statistics _/}
// <div className="p-6 border-t border-gray-100 bg-gray-50">
// <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// <div className="flex items-center gap-3">
// <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
//                 esPositivo 
//                   ? 'bg-green-100 text-green-800' 
//                   : variacionTotal === 0
//                     ? 'bg-gray-100 text-gray-800'
//                     : 'bg-red-100 text-red-800'
//               }`}>
// {esPositivo ? (
// <TrendingUp className="h-4 w-4" />
// ) : variacionTotal === 0 ? (
// <span>—</span>
// ) : (
// <TrendingDown className="h-4 w-4" />
// )}
// {Math.abs(variacionTotal).toFixed(1)}%
// </div>
// <span className="text-gray-600 text-sm">
// {esPositivo ? 'Crecimiento' : variacionTotal === 0 ? 'Sin cambio' : 'Decrecimiento'} total
// </span>
// </div>

// <div className="text-center">
// <div className="text-sm text-gray-500">Venta Promedio</div>
// <div className="text-lg font-semibold text-gray-900">
// {formatCurrency(ventaPromedio)}
// </div>
// </div>

// <div className="text-center">
// <div className="text-sm text-gray-500">Mejor Día</div>
// <div className="text-lg font-semibold text-gray-900">
// {chartData.length > 0 ?
// formatCurrency(Math.max(...chartData.map(d => d.ventas))) :
// formatCurrency(0)
// }
// </div>
// </div>
// </div>

// <div className="mt-4 text-center text-sm text-gray-500">
// Mostrando datos de ventas diarias • Actualizado al {new Date().toLocaleDateString('es-ES')}
// </div>
// </div>
// </div>
// </div>
// );
// }
