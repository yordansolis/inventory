"use client"
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../../../components/ui';
import { Download, FileText, Calendar, Filter, RefreshCw, Search } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function EstractoVentasPage() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [reportData, setReportData] = useState<any>(null);
    const [extractData, setExtractData] = useState<any[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [months] = useState<{value: number, label: string}[]>([
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' }
    ]);
    const [showExtractTable, setShowExtractTable] = useState<boolean>(false);

    useEffect(() => {
        // Generate available years (from 2020 to current year)
        const currentYear = new Date().getFullYear();
        const yearsList = [];
        for (let y = 2020; y <= currentYear; y++) {
            yearsList.push(y);
        }
        setYears(yearsList);
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get token from localStorage
            const token = localStorage.getItem('token') || '';
            const headers = {
                'Authorization': `bearer ${token}`
            };
            
            // Get the first and last day of the selected month
            const firstDay = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0);
            
            const startDate = firstDay.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            const endDate = lastDay.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            
            // Fetch general statistics
            const generalResponse = await fetch('http://127.0.0.1:8053/api/v1/services/statistics', {
                headers
            });
            
            if (!generalResponse.ok) {
                throw new Error('Error al obtener estadísticas generales');
            }
            
            const generalData = await generalResponse.json();
            
            // Fetch time-based statistics (monthly)
            const timeResponse = await fetch(`http://127.0.0.1:8053/api/v1/services/statistics/ventas-por-tiempo/month`, {
                headers
            });
            
            if (!timeResponse.ok) {
                throw new Error('Error al obtener estadísticas mensuales');
            }
            
            const timeData = await timeResponse.json();
            
            // Fetch top products for the selected month
            const topProductsResponse = await fetch(
                `http://127.0.0.1:8053/api/v1/services/statistics/productos-top?start_date=${startDate}&end_date=${endDate}`, 
                { headers }
            );
            
            if (!topProductsResponse.ok) {
                throw new Error('Error al obtener productos más vendidos');
            }
            
            const topProductsData = await topProductsResponse.json();
            
            // Fetch delivery metrics
            const deliveryResponse = await fetch('http://127.0.0.1:8053/api/v1/services/statistics/metricas-entrega', {
                headers
            });
            
            if (!deliveryResponse.ok) {
                throw new Error('Error al obtener métricas de entrega');
            }
            
            const deliveryData = await deliveryResponse.json();
            
            // Combine all data into a single report object
            const monthlyData = timeData.ventas_por_mes?.find((m: any) => 
                m.año === year && m.mes === month
            ) || {
                total_ventas: 0,
                ingresos: 0,
                ingresos_domicilio: 0
            };
            
            // Create a combined report object
            const combinedReport = {
                total_ventas: monthlyData.ingresos || 0,
                cantidad_ventas: monthlyData.total_ventas || 0,
                ticket_promedio: monthlyData.total_ventas ? (monthlyData.ingresos / monthlyData.total_ventas) : 0,
                cantidad_domicilios: deliveryData?.total_domicilios || 0,
                metodos_pago: deliveryData?.metodos_pago || [],
                productos_top: topProductsData?.productos_mas_vendidos || []
            };
            
            setReportData(combinedReport);
        } catch (err) {
            console.error('Error fetching report:', err);
            setError('Error al cargar los datos del reporte. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const fetchExtract = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get token from localStorage
            const token = localStorage.getItem('token') || '';
            const headers = {
                'Authorization': `bearer ${token}`
            };
            
            // Fetch monthly extract data using our new API
            const response = await fetch(`http://127.0.0.1:8053/api/v1/services/extracts/monthly/${year}/${month}`, {
                headers
            });
            
            if (!response.ok) {
                throw new Error('Error al obtener el extracto de ventas');
            }
            
            const data = await response.json();
            setExtractData(data.data || []);
            setShowExtractTable(true);
            
        } catch (err) {
            console.error('Error fetching extract:', err);
            setError('Error al cargar el extracto de ventas. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        setShowExtractTable(false); // Reset extract table visibility when changing month/year
    }, [year, month]);

    const handleGeneratePDF = async () => {
        try {
            setLoading(true);
            
            // Get token from localStorage
            const token = localStorage.getItem('token') || '';
            
            // Since there's no direct PDF endpoint in the API documentation,
            // we would need to implement this on the backend or use a client-side PDF generation library.
            // For now, we'll just show an alert
            alert('Funcionalidad de generación de PDF no implementada en el backend. Por favor, implemente esta característica en el backend primero.');
            
            // Example of how it would work if the endpoint existed:
            /*
            const response = await fetch(`http://127.0.0.1:8053/api/v1/services/statistics/generate-pdf-report?year=${year}&month=${month}`, {
                headers: {
                    'Authorization': `bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al generar el PDF');
            }
            
            // Get the PDF blob
            const blob = await response.blob();
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a link element
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-ventas-${year}-${month}.pdf`;
            
            // Append the link to the body
            document.body.appendChild(a);
            
            // Click the link to trigger the download
            a.click();
            
            // Remove the link
            document.body.removeChild(a);
            */
            
        } catch (err) {
            console.error('Error generating PDF:', err);
            setError('Error al generar el PDF. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-red-600 text-5xl mb-4">⚠️</div>
                    <p className="mt-4 text-gray-900 font-medium">{error}</p>
                    <button 
                        onClick={() => fetchReport()}
                        className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
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
                    Extracto de Ventas
                </h1>
                <p className="text-gray-600">
                    Genera reportes y extractos de ventas por mes y año
                </p>
            </div>

            {/* Filter Controls */}
            <Card className="mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4 md:mb-0">
                        <Filter className="h-5 w-5 mr-2" />
                        Filtros de Reporte
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <Button 
                            onClick={fetchExtract} 
                            disabled={loading}
                            className="flex items-center"
                            variant="outline"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Ver Extracto Detallado
                        </Button>
                        <Button 
                            onClick={handleGeneratePDF} 
                            disabled={loading || !reportData}
                            className="flex items-center"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar PDF
                        </Button>
                        <Button 
                            variant="default" 
                            onClick={fetchReport}
                            disabled={loading}
                            className="flex items-center"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                            Año
                        </label>
                        <select
                            id="year"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                            Mes
                        </label>
                        <select
                            id="month"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Cargando datos...</p>
                    </div>
                </div>
            )}

            {/* Extract Table */}
            {!loading && showExtractTable && (
                <Card className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Extracto Detallado - {months.find(m => m.value === month)?.label} {year}
                        </h2>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowExtractTable(false)}
                            className="flex items-center"
                        >
                            Volver al Resumen
                        </Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variante</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {extractData && extractData.length > 0 ? (
                                    extractData.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.invoice_number}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.invoice_date}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.invoice_time}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.cliente}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.vendedor}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.product_variant || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatPrice(item.unit_price)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatPrice(item.subtotal)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{formatPrice(item.total_amount)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.payment_method}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-4 text-center text-sm text-gray-500">
                                            No hay datos disponibles para el período seleccionado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Report Summary - Only show when extract table is not visible */}
            {!loading && !showExtractTable && reportData && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Card>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Ventas</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatPrice(reportData.total_ventas || 0)}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <FileText className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Cantidad Ventas</p>
                                    <p className="text-2xl font-bold text-gray-900">{reportData.cantidad_ventas || 0}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Ticket Promedio</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatPrice(reportData.ticket_promedio || 0)}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <FileText className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Domicilios</p>
                                    <p className="text-2xl font-bold text-gray-900">{reportData.cantidad_domicilios || 0}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <FileText className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Ventas por Método de Pago */}
                    <Card className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Ventas por Método de Pago
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.metodos_pago && reportData.metodos_pago.length > 0 ? (
                                        reportData.metodos_pago.map((metodo: any, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {metodo.payment_method}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {metodo.count}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    {formatPrice(metodo.total)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {((metodo.total / reportData.total_ventas) * 100).toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No hay datos disponibles
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Productos Más Vendidos */}
                    <Card className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Productos Más Vendidos
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variante</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veces Vendido</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingreso Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.productos_top && reportData.productos_top.length > 0 ? (
                                        reportData.productos_top.map((producto: any, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {producto.producto || producto.product_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {producto.variante || producto.product_variant || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {producto.cantidad_vendida || producto.total_quantity || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {producto.numero_ordenes || producto.times_sold || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    {formatPrice(producto.ingresos || producto.total_revenue || 0)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No hay datos disponibles
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {/* No Data State */}
            {!loading && !showExtractTable && !reportData && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-gray-600">No hay datos disponibles para el período seleccionado</p>
                    </div>
                </div>
            )}
        </>
    );
}