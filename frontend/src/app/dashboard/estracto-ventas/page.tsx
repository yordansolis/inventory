"use client"
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../../../components/ui';
import { Download, FileText, Calendar, Filter, RefreshCw, Search, ArrowRight, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { formatPrice } from '../../utils/format';

type ExtractType = 'monthly' | 'daily' | 'range';

export default function EstractoVentasPage() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const [extractType, setExtractType] = useState<ExtractType>('monthly');
    
    // Date states
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [rangeStartDate, setRangeStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [rangeEndDate, setRangeEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const pageSize = 50;

    const [reportData, setReportData] = useState<any>(null);
    const [extractData, setExtractData] = useState<any[]>([]);
    
    // Mobile view state
    const [showMobileView, setShowMobileView] = useState<boolean>(false);
    
    const [years, setYears] = useState<number[]>([]);
    const allMonths = [
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
    ];
    const [availableMonths, setAvailableMonths] = useState(allMonths);
    
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const yearsList = [];
        for (let y = 2020; y <= currentYear; y++) {
            yearsList.push(y);
        }
        setYears(yearsList.sort((a, b) => b - a));
    }, []);
    
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        if (year === currentYear) {
            setAvailableMonths(allMonths.filter(m => m.value <= currentMonth));
            if (month > currentMonth) {
                setMonth(currentMonth);
            }
        } else {
            setAvailableMonths(allMonths);
        }
    }, [year]);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setError(null);
            setReportData(null);
            setExtractData([]);
            setCurrentPage(1); // Resetear paginación

            const token = localStorage.getItem('token') || '';
            const headers = { 'Authorization': `bearer ${token}` };

            let extractUrl = '';
            let startDate: string, endDate: string;

            if (extractType === 'monthly') {
                const firstDay = new Date(year, month - 1, 1);
                const lastDay = new Date(year, month, 0);
                startDate = firstDay.toISOString().split('T')[0];
                endDate = lastDay.toISOString().split('T')[0];
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/monthly/${year}/${month}?page=${currentPage}&page_size=${pageSize}`;
            } else if (extractType === 'daily') {
                startDate = endDate = dailyDate;
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/daily/${dailyDate}?page=${currentPage}&page_size=${pageSize}`;
            } else { // range
                startDate = rangeStartDate;
                endDate = rangeEndDate;
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/range?start_date=${rangeStartDate}&end_date=${rangeEndDate}&page=${currentPage}&page_size=${pageSize}`;
            }

            const extractResponse = await fetch(extractUrl, { headers });
            if (!extractResponse.ok) {
                throw new Error(`Error al obtener el extracto: ${extractResponse.statusText}`);
            }
            const extractJson = await extractResponse.json();
            const detailedData = extractJson.data || [];
            setExtractData(detailedData);
            
            // Actualizar información de paginación
            if (extractJson.pagination) {
                setTotalPages(extractJson.pagination.pages || 1);
                setTotalRecords(extractJson.pagination.total || 0);
            }

            if (detailedData.length === 0) {
                setReportData({
                    total_ventas: 0,
                    cantidad_ventas: 0,
                    ticket_promedio: 0,
                    cantidad_domicilios: 0,
                    metodos_pago: [],
                    productos_top: []
                });
                return;
            }

            // --- Generate Summary ---
            const topProductsResponse = await fetch(
                `http://127.0.0.1:8053/api/v1/services/statistics/productos-top?start_date=${startDate}&end_date=${endDate}`, 
                { headers }
            );
            const topProductsData = topProductsResponse.ok ? await topProductsResponse.json() : { productos_mas_vendidos: [] };

            const deliveryResponse = await fetch(
                `http://127.0.0.1:8053/api/v1/services/statistics/metricas-entrega?start_date=${startDate}&end_date=${endDate}`, 
                { headers }
            );
            const deliveryData = deliveryResponse.ok ? await deliveryResponse.json() : {};
            
            const invoiceTotals: { [key: string]: { total: number; method: string } } = {};
            detailedData.forEach((item: any) => {
                invoiceTotals[item.invoice_number] = {
                    total: item.total_amount,
                    method: item.payment_method
                };
            });

            const paymentMethodSummary: { [key: string]: { count: number; total: number } } = {};
            Object.values(invoiceTotals).forEach(invoice => {
                const method = invoice.method;
                if (!paymentMethodSummary[method]) {
                    paymentMethodSummary[method] = { count: 0, total: 0 };
                }
                paymentMethodSummary[method].count += 1;
                paymentMethodSummary[method].total += invoice.total;
            });
            
            const metodos_pago = Object.entries(paymentMethodSummary).map(([method, data]) => ({
                payment_method: method,
                count: data.count,
                total: data.total
            }));

            const total_ingresos = Object.values(invoiceTotals).reduce((sum, invoice) => sum + invoice.total, 0);
            const total_ventas = Object.keys(invoiceTotals).length;

            const combinedReport = {
                total_ventas: total_ingresos,
                cantidad_ventas: total_ventas,
                ticket_promedio: total_ventas ? (total_ingresos / total_ventas) : 0,
                cantidad_domicilios: deliveryData?.total_domicilios || 0,
                metodos_pago: metodos_pago,
                productos_top: topProductsData?.productos_mas_vendidos || [],
                transferencias_por_cuenta: deliveryData?.transferencias_por_cuenta || []
            };
            
            setReportData(combinedReport);

        } catch (err: any) {
            console.error('Error fetching report:', err);
            setError(err.message || 'Error al cargar los datos del reporte. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const fetchExtractData = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            
            // Get token from localStorage
            const token = localStorage.getItem('token') || '';
            const headers = {
                'Authorization': `bearer ${token}`
            };

            let extractUrl = '';
            
            if (extractType === 'monthly') {
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/monthly/${year}/${month}?page=${page}&page_size=${pageSize}`;
            } else if (extractType === 'daily') {
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/daily/${dailyDate}?page=${page}&page_size=${pageSize}`;
            } else { // range
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/range?start_date=${rangeStartDate}&end_date=${rangeEndDate}&page=${page}&page_size=${pageSize}`;
            }
            
            const response = await fetch(extractUrl, { headers });
            
            if (!response.ok) {
                throw new Error('Error al obtener el extracto de ventas');
            }
            
            const data = await response.json();
            setExtractData(data.data || []);
            
            // Actualizar información de paginación
            if (data.pagination) {
                setTotalPages(data.pagination.pages || 1);
                setTotalRecords(data.pagination.total || 0);
                setCurrentPage(page);
            }
            
        } catch (err) {
            console.error('Error fetching extract:', err);
            setError('Error al cargar el extracto de ventas. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Efecto para cambiar de página
        if (reportData) {
            fetchExtractData(currentPage);
        }
    }, [currentPage]);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleGeneratePDF = async () => {
        if (!reportData) {
            setError("No hay datos para generar el PDF. Genere un reporte primero.");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token') || '';

            // Obtener todos los datos para el PDF (sin paginación)
            let allExtractData: any[] = [];
            let extractUrl = '';
            
            if (extractType === 'monthly') {
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/monthly/${year}/${month}?for_pdf=true`;
            } else if (extractType === 'daily') {
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/daily/${dailyDate}?for_pdf=true`;
            } else { // range
                extractUrl = `http://127.0.0.1:8053/api/v1/services/extracts/range?start_date=${rangeStartDate}&end_date=${rangeEndDate}&for_pdf=true`;
            }

            const fullDataResponse = await fetch(extractUrl, { 
                headers: { 'Authorization': `bearer ${token}` } 
            });
            
            if (!fullDataResponse.ok) {
                throw new Error('Error al obtener datos completos para PDF');
            }
            
            const fullDataJson = await fullDataResponse.json();
            allExtractData = fullDataJson.data || [];

            let period = '';
            if (extractType === 'monthly') {
                const monthName = allMonths.find(m => m.value === month)?.label || '';
                period = `Reporte Mensual: ${monthName} ${year}`;
            } else if (extractType === 'daily') {
                period = `Reporte Diario: ${dailyDate}`;
            } else {
                period = `Reporte de Rango: ${rangeStartDate} a ${rangeEndDate}`;
            }

            const response = await fetch('http://127.0.0.1:8053/api/v1/services/pdf/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `bearer ${token}`,
                },
                body: JSON.stringify({
                    report_data: reportData,
                    extract_data: allExtractData,
                    period: period,
                    use_logo: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al generar PDF' }));
                throw new Error(errorData.detail || 'Error al generar el PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error('Error generating PDF:', err);
            setError(err.message || 'Error al generar el PDF. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                    <div className="text-red-600 text-4xl md:text-5xl mb-4">⚠️</div>
                    <p className="mt-4 text-gray-900 font-medium text-sm md:text-base">{error}</p>
                    <button 
                        onClick={() => {
                            setError(null);
                            handleGenerateReport();
                        }}
                        className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Extracto de Ventas
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                    Genera reportes y extractos de ventas por mes, día o rango de fechas.
                </p>
            </div>

            {/* Filter Controls */}
            <Card className="mb-6 md:mb-8">
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center mb-4 md:mb-0">
                            <Filter className="h-5 w-5 mr-2" />
                            Filtros de Reporte
                        </h2>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
                            <Button 
                                onClick={handleGeneratePDF} 
                                disabled={loading || !reportData}
                                variant="outline"
                                className="flex items-center justify-center text-sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar PDF
                            </Button>
                            <Button 
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className="flex items-center justify-center text-sm"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? "Generando..." : "Generar Reporte"}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 border-b border-gray-200 pb-4 mb-4">
                        <Button 
                            variant={extractType === 'monthly' ? 'default' : 'outline'} 
                            onClick={() => setExtractType('monthly')}
                            className="text-sm"
                        >
                            Mensual
                        </Button>
                        <Button 
                            variant={extractType === 'daily' ? 'default' : 'outline'} 
                            onClick={() => setExtractType('daily')}
                            className="text-sm"
                        >
                            Diario
                        </Button>
                        <Button 
                            variant={extractType === 'range' ? 'default' : 'outline'} 
                            onClick={() => setExtractType('range')}
                            className="text-sm"
                        >
                            Rango
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {extractType === 'monthly' && (
                            <>
                                <div>
                                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                                    <select id="year" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                                    <select id="month" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                        {availableMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        {extractType === 'daily' && (
                            <div className="md:col-span-2">
                                <label htmlFor="dailyDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                <input type="date" id="dailyDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                            </div>
                        )}
                        {extractType === 'range' && (
                            <>
                                <div>
                                    <label htmlFor="rangeStartDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                                    <input type="date" id="rangeStartDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={rangeStartDate} onChange={(e) => setRangeStartDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div>
                                    <label htmlFor="rangeEndDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
                                    <input type="date" id="rangeEndDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={rangeEndDate} onChange={(e) => setRangeEndDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600 text-sm">Cargando datos...</p>
                    </div>
                </div>
            )}

            {/* Initial State / No Data State */}
            {!loading && !reportData && (
                <Card className="text-center py-12">
                     <FileText className="mx-auto h-12 w-12 text-gray-400" />
                     <h3 className="mt-2 text-sm font-medium text-gray-900">No se ha generado ningún reporte</h3>
                     <p className="mt-1 text-sm text-gray-500">
                         Seleccione los filtros y presione "Generar Reporte" para empezar.
                     </p>
                </Card>
            )}

            {/* Report Display */}
            {!loading && reportData && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
                        <Card>
                            <div className="flex items-center justify-between p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Ventas</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{formatPrice(reportData.total_ventas || 0)}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full ml-3">
                                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center justify-between p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Cantidad Ventas</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900">{reportData.cantidad_ventas || 0}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full ml-3">
                                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center justify-between p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Ticket Promedio</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{formatPrice(reportData.ticket_promedio || 0)}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full ml-3">
                                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center justify-between p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Domicilios</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900">{reportData.cantidad_domicilios || 0}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full ml-3">
                                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Detailed Data */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                        <div className="xl:col-span-2 space-y-6">
                             {/* Productos Más Vendidos */}
                            <Card>
                                <div className="p-4 md:p-6">
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                                        Productos Más Vendidos
                                    </h2>
                                    
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variante</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veces</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reportData.productos_top && reportData.productos_top.length > 0 ? (
                                                    reportData.productos_top.map((producto: any, index: number) => (
                                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {producto.producto || producto.product_name}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {producto.variante || producto.product_variant || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {producto.cantidad_vendida || producto.quantity_sold || 0}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {producto.numero_ordenes || 0}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                                {formatPrice(producto.ingresos || producto.revenue || 0)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                                                            No hay datos de productos más vendidos
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-3">
                                        {reportData.productos_top && reportData.productos_top.length > 0 ? (
                                            reportData.productos_top.map((producto: any, index: number) => (
                                                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-medium text-gray-900 text-sm">
                                                            {producto.producto || producto.product_name}
                                                        </h4>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {formatPrice(producto.ingresos || producto.revenue || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                                        <div>
                                                            <span className="block font-medium">Variante</span>
                                                            <span>{producto.variante || producto.product_variant || '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block font-medium">Cantidad</span>
                                                            <span>{producto.cantidad_vendida || producto.quantity_sold || 0}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block font-medium">Veces</span>
                                                            <span>{producto.numero_ordenes || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-sm text-gray-500">
                                                No hay datos de productos más vendidos
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Ventas por Método de Pago */}
                            <Card>
                                <div className="p-4 md:p-6">
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                                        Ventas por Método de Pago
                                    </h2>
                                    
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Ventas</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reportData.metodos_pago && reportData.metodos_pago.length > 0 ? (
                                                    reportData.metodos_pago.map((metodo: any, index: number) => (
                                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {metodo.payment_method}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {metodo.count}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                                {formatPrice(metodo.total)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                                                            No hay datos de métodos de pago
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-3">
                                        {reportData.metodos_pago && reportData.metodos_pago.length > 0 ? (
                                            reportData.metodos_pago.map((metodo: any, index: number) => (
                                                <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-medium text-gray-900 text-sm">
                                                            {metodo.payment_method}
                                                        </h4>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {formatPrice(metodo.total)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        <span className="font-medium">Ventas:</span> {metodo.count}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-sm text-gray-500">
                                                No hay datos de métodos de pago
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Transferencias por Cuenta */}
                            {reportData?.transferencias_por_cuenta && reportData.transferencias_por_cuenta.length > 0 && (
                                <Card>
                                    <div className="p-4 md:p-6">
                                        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                                            Transferencias por Cuenta
                                        </h2>
                                        
                                        {/* Desktop Table */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Trans.</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {reportData.transferencias_por_cuenta.map((cuenta: any, index: number) => (
                                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {cuenta.cuenta_origen}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {cuenta.cantidad_transacciones}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                                {formatPrice(cuenta.valor_total)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Cards */}
                                        <div className="md:hidden space-y-3">
                                            {reportData.transferencias_por_cuenta.map((cuenta: any, index: number) => (
                                                <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-medium text-gray-900 text-sm flex-1 mr-2">
                                                            {cuenta.cuenta_origen}
                                                        </h4>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {formatPrice(cuenta.valor_total)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        <span className="font-medium">Transacciones:</span> {cuenta.cantidad_transacciones}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Extract Table with Pagination */}
                    <Card className="mt-6 md:mt-8">
                        <div className="p-4 md:p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 space-y-2 md:space-y-0">
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    Extracto Detallado
                                </h2>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                    <p className="text-xs md:text-sm text-gray-500">
                                        Vista resumida. Descargue el PDF para ver todos los detalles.
                                    </p>
                                    <Badge variant="outline" className="text-xs">
                                        {totalRecords} registros en total
                                    </Badge>
                                </div>
                            </div>
                            
                            {/* Mobile View Toggle */}
                            <div className="md:hidden mb-4">
                                <button
                                    onClick={() => setShowMobileView(!showMobileView)}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                    {showMobileView ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                    {showMobileView ? 'Vista compacta' : 'Vista detallada'}
                                </button>
                            </div>
                            
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {extractData && extractData.length > 0 ? (
                                            extractData.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.invoice_number}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.invoice_date}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.cliente}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{formatPrice(item.total_amount)}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {item.payment_method}
                                                        {item.payment_source_account && 
                                                         (item.payment_method.toLowerCase().includes('transferencia') || 
                                                          item.payment_method.toLowerCase().includes('transfer') || 
                                                          item.payment_method.toLowerCase().includes('digital')) && (
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                Cuenta: {item.payment_source_account}
                                                            </div>
                                                         )
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {item.payment_reference || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                                                    No hay datos de extracto para el período seleccionado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                {extractData && extractData.length > 0 ? (
                                    extractData.map((item, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 text-sm">#{item.invoice_number}</h4>
                                                    <p className="text-xs text-gray-600">{item.invoice_date}</p>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {formatPrice(item.total_amount)}
                                                </span>
                                            </div>
                                            
                                            {showMobileView && (
                                                <>
                                                    <div className="border-t border-gray-200 pt-2">
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="font-medium text-gray-700">Cliente:</span>
                                                                <p className="text-gray-900">{item.cliente}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-700">Cantidad:</span>
                                                                <p className="text-gray-900">{item.quantity}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="border-t border-gray-200 pt-2">
                                                        <div className="text-xs">
                                                            <span className="font-medium text-gray-700">Producto:</span>
                                                            <p className="text-gray-900 mt-1">{item.product_name}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="border-t border-gray-200 pt-2">
                                                        <div className="text-xs">
                                                            <span className="font-medium text-gray-700">Método de Pago:</span>
                                                            <p className="text-gray-900 mt-1">{item.payment_method}</p>
                                                            {item.payment_source_account && 
                                                             (item.payment_method.toLowerCase().includes('transferencia') || 
                                                              item.payment_method.toLowerCase().includes('transfer') || 
                                                              item.payment_method.toLowerCase().includes('digital')) && (
                                                                <p className="text-gray-500 mt-1">Cuenta: {item.payment_source_account}</p>
                                                             )
                                                            }
                                                            {item.payment_reference && (
                                                                <p className="text-gray-500 mt-1">Ref: {item.payment_reference}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-sm text-gray-500">
                                        No hay datos de extracto para el período seleccionado.
                                    </div>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 px-4 py-3 mt-4 space-y-3 sm:space-y-0">
                                    <div className="text-center sm:text-left">
                                        <p className="text-xs md:text-sm text-gray-700">
                                            Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a <span className="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span> de <span className="font-medium">{totalRecords}</span> resultados
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="flex items-center space-x-2">
                                            <button
                                                onClick={handlePreviousPage}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-3 py-2 rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                <span className="hidden sm:inline ml-1">Anterior</span>
                                            </button>
                                            
                                            <span className="text-xs md:text-sm font-medium text-gray-700 px-2">
                                                {currentPage} / {totalPages}
                                            </span>
                                            
                                            <button
                                                onClick={handleNextPage}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-3 py-2 rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                                            >
                                                <span className="hidden sm:inline mr-1">Siguiente</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}