'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Loader2, Search, Menu, X } from 'lucide-react';
import { getAuthHeaders, isAuthenticated } from '../../../utils/auth';
import { useRouter } from 'next/navigation';
import { useApi } from '../../../utils/api';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

interface ConsumableProduct {
  id: number;
  nombre: string;
  unidadMedida: string;
  cantidadUnitaria: number;
  precioPresentacion: number;
  cantidadUtilizada: number;
  cantidadActual?: number;
  cantidadPorProducto: number;
  minimo: number;
  valorUnitario: number;
  valorUtilizado: number;
  sitioReferencia: string;
}

interface ProductFormData {
  nombre: string;
  unidadMedida: string;
  cantidadUnitaria: string;
  precioPresentacion: string;
  cantidadUtilizada: string;
  cantidadPorProducto: string;
  minimo: string;
  sitioReferencia: string;
  valorUnitarioCalculado?: string;
  valorUtilizadoCalculado?: string;
}

interface Category {
  id: number;
  nombre_categoria: string;
}

interface ApiProduct {
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

export default function SuministroPage() {
  const router = useRouter();
  const { withLoading } = useApi();
  
  const [productosConsumibles, setProductosConsumibles] = useState<ConsumableProduct[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    nombre: '',
    unidadMedida: '',
    cantidadUnitaria: '',
    precioPresentacion: '',
    cantidadUtilizada: '',
    cantidadPorProducto: '',
    minimo: '',
    sitioReferencia: '',
    valorUnitarioCalculado: '0',
    valorUtilizadoCalculado: '0'
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const productsPerPage = 5;
  
  // States for API integration
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

  // Custom toast styles
  const showSuccessToast = (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: "top-center",
      style: {
        background: '#10B981',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: 'white',
        secondary: '#10B981',
      },
    });
  };

  const showErrorToast = (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: "top-center",
      style: {
        background: '#EF4444',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: 'white',
        secondary: '#EF4444',
      },
    });
  };
  
  // Handle delete confirmation with custom toast
  const handleDeleteConfirmation = (producto: ConsumableProduct) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">
          ¿Está seguro de eliminar {producto.nombre}?
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              handleDeleteProduct(producto.id);
              toast.dismiss(t.id);
            }}
            className="bg-red-600 text-white px-3 py-1 rounded-md text-xs"
          >
            Eliminar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-center",
    });
  };

  // Extract fetch functions outside useEffect for reuse
  const fetchCategories = useCallback(async () => {
    try {
      return await withLoading(async () => {
        const headers = getAuthHeaders();
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND;
        
        if (!apiUrl) {
          throw new Error('Error de configuración: URL del backend no definida');
        }
        
        const response = await fetch(`${apiUrl}/api/v1/categories`, {
          method: 'GET',
          headers
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        let categoriesData = data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const possibleArrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
          if (possibleArrayProps.length > 0) {
            categoriesData = data[possibleArrayProps[0]];
          }
        }
        
        if (!Array.isArray(categoriesData)) {
          categoriesData = [];
        }
        
        const normalizedCategories = categoriesData.map((cat: any) => {
          return {
            id: cat.id || cat.category_id || cat.categoryId || 0,
            nombre_categoria: cat.nombre_categoria || cat.name || cat.category_name || cat.categoryName || cat.nombre || 'Categoría sin nombre'
          };
        });
        
        setCategories(normalizedCategories);
        
        const catMap: Record<number, string> = {};
        normalizedCategories.forEach((cat: Category) => {
          catMap[cat.id] = cat.nombre_categoria;
        });
        setCategoryMap(catMap);
        return catMap;
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar categorías');
      setCategories([]);
      setCategoryMap({});
      return {};
    }
  }, []);
  
  const fetchProducts = useCallback(async (categoryMapping: Record<number, string>) => {
    try {
      await withLoading(async () => {
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const transformedProducts: ConsumableProduct[] = data.map((product: ApiProduct) => {
          return {
            id: product.id,
            nombre: product.nombre_insumo,
            unidadMedida: product.unidad || 'unidad (u)',
            cantidadUnitaria: product.cantidad_unitaria || 0,
            precioPresentacion: product.precio_presentacion || 0,
            cantidadUtilizada: product.cantidad_utilizada || 0,
            cantidadActual: product.cantidad_utilizada || 0,
            cantidadPorProducto: product.cantidad_por_producto || 0,
            minimo: product.stock_minimo,
            valorUnitario: product.valor_unitario || 0,
            valorUtilizado: product.valor_utilizado || 0,
            sitioReferencia: product.sitio_referencia || ''
          };
        });
        
        setProductosConsumibles(transformedProducts);
      });
    } catch (err: any) {
      setError(prev => prev || err.message || 'Error al cargar productos');
    }
  }, []);

  // Fetch categories and products on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      const catMap = await fetchCategories();
      await fetchProducts(catMap);
    };
    
    loadInitialData();
  }, []);
  
  // Handler to manually refresh categories
  const handleRefreshCategories = async () => {
    await fetchCategories();
  };

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Add a function to format currency values (Colombian format)
  const formatCurrency = useCallback((value: string): string => {
    const cleanValue = value.replace(/[^0-9,]/g, '');
    
    if (!cleanValue) return '';
    
    const parts = cleanValue.split(',');
    
    if (parts[0]) {
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      if (parts.length > 1) {
        const decimalPart = parts[1].substring(0, 2);
        return `${integerPart},${decimalPart}`;
      }
      
      return integerPart;
    }
    
    return '';
  }, []);

  // Add a function to format currency without unnecessary trailing zeros
  const formatCurrencyWithoutTrailingZeros = useCallback((value: number): string => {
    if (value === 0) return '0';
    
    const formatted = value.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return formatted;
  }, []);

  // Add a function to format decimal numbers (Colombian format)
  const formatDecimalNumber = useCallback((value: string): string => {
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    
    if (!cleanValue) return '';
    
    let processedValue = cleanValue;
    if (cleanValue.includes('.') && !cleanValue.includes(',')) {
      processedValue = cleanValue.replace('.', ',');
    }
    
    const parts = processedValue.split(',');
    
    if (parts[0]) {
      const integerPart = parts[0].replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      if (parts.length > 1) {
        const decimalPart = parts[1].substring(0, 4);
        return `${integerPart},${decimalPart}`;
      }
      
      return integerPart;
    }
    
    return '';
  }, []);

  // Add a function to parse formatted currency back to number string
  const parseCurrency = useCallback((formattedValue: string): string => {
    return formattedValue
      .replace(/\./g, '')
      .replace(',', '.');
  }, []);

  // Modify handleChange to handle currency and decimal formatting
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    
    if (id === 'precioPresentacion') {
      const formattedValue = formatCurrency(value);
      
      setFormData((prev) => ({
        ...prev,
        [id]: formattedValue
      }));
    } else if (id === 'cantidadUnitaria' || id === 'cantidadUtilizada' || id === 'cantidadPorProducto') {
      const formattedValue = formatDecimalNumber(value);
      
      setFormData((prev) => ({
        ...prev,
        [id]: formattedValue
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    }
  }, [formatCurrency, formatDecimalNumber]);

  // Calculate valor unitario automatically
  useEffect(() => {
    if (formData.cantidadUnitaria && formData.precioPresentacion) {
      const cantidadUnitaria = parseFloat(parseCurrency(formData.cantidadUnitaria));
      const precioPresentacion = parseFloat(parseCurrency(formData.precioPresentacion));
      
      if (!isNaN(cantidadUnitaria) && !isNaN(precioPresentacion) && cantidadUnitaria > 0) {
        const valorUnitario = precioPresentacion / cantidadUnitaria;
        
        setFormData(prev => ({
          ...prev,
          valorUnitarioCalculado: formatCurrencyWithoutTrailingZeros(valorUnitario)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          valorUnitarioCalculado: '0'
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        valorUnitarioCalculado: '0'
      }));
    }
  }, [formData.cantidadUnitaria, formData.precioPresentacion, parseCurrency, formatCurrencyWithoutTrailingZeros]);

  // Calculate valor utilizado automatically
  useEffect(() => {
    if (formData.valorUnitarioCalculado && formData.cantidadUtilizada) {
      const valorUnitario = parseFloat(parseCurrency(formData.valorUnitarioCalculado));
      const cantidadUtilizada = parseFloat(parseCurrency(formData.cantidadUtilizada));
      
      if (!isNaN(valorUnitario) && !isNaN(cantidadUtilizada)) {
        const valorUtilizado = valorUnitario * cantidadUtilizada;
        setFormData(prev => ({
          ...prev,
          valorUtilizadoCalculado: formatCurrencyWithoutTrailingZeros(valorUtilizado)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          valorUtilizadoCalculado: '0'
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        valorUtilizadoCalculado: '0'
      }));
    }
  }, [formData.valorUnitarioCalculado, formData.cantidadUtilizada, parseCurrency, formatCurrencyWithoutTrailingZeros]);

  // Edit product handler
  const handleEditProduct = useCallback((producto: ConsumableProduct) => {
    const valorUnitarioCalc = producto.cantidadUnitaria > 0 
      ? formatCurrencyWithoutTrailingZeros(producto.precioPresentacion / producto.cantidadUnitaria)
      : '0';
    const valorUtilizadoCalc = producto.cantidadUtilizada > 0 && producto.cantidadUnitaria > 0
      ? formatCurrencyWithoutTrailingZeros((producto.precioPresentacion / producto.cantidadUnitaria) * producto.cantidadUtilizada)
      : '0';
    
    const cantidadUnitariaFormatted = producto.cantidadUnitaria.toString().replace('.', ',');
    const cantidadUtilizadaFormatted = producto.cantidadUtilizada.toString().replace('.', ',');
    const cantidadPorProductoFormatted = producto.cantidadPorProducto.toString().replace('.', ',');
    
    setFormData({ 
      nombre: producto.nombre,
      unidadMedida: producto.unidadMedida,
      cantidadUnitaria: formatDecimalNumber(cantidadUnitariaFormatted),
      precioPresentacion: formatCurrencyWithoutTrailingZeros(producto.precioPresentacion),
      cantidadUtilizada: formatDecimalNumber(cantidadUtilizadaFormatted),
      cantidadPorProducto: formatDecimalNumber(cantidadPorProductoFormatted),
      minimo: String(producto.minimo),
      sitioReferencia: producto.sitioReferencia,
      valorUnitarioCalculado: valorUnitarioCalc,
      valorUtilizadoCalculado: valorUtilizadoCalc
    });
    setEditingId(producto.id);
    setShowForm(true);
  }, [formatCurrencyWithoutTrailingZeros, formatDecimalNumber]);

  const handleDeleteProduct = useCallback(async (id: number) => {
    try {
      await withLoading(async () => {
        const headers = getAuthHeaders();
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/insumos/${id}`, {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al eliminar producto');
        }
        
        setProductosConsumibles((prev) => prev.filter((p) => p.id !== id));
        
        toast.success('Producto eliminado con éxito', {
          duration: 3000,
          position: "top-center",
          style: {
            background: '#10B981',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10B981',
          },
        });
      });
    } catch (err: any) {
      setError(err.message || 'Error al eliminar producto');
      
      toast.error(err.message || 'Error al eliminar producto', {
        duration: 4000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#EF4444',
        },
      });
    }
  }, [withLoading]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleCancelEdit = useCallback(() => {
    setFormData({ 
      nombre: '', 
      unidadMedida: '', 
      cantidadUnitaria: '', 
      precioPresentacion: '', 
      cantidadUtilizada: '', 
      cantidadPorProducto: '',
      minimo: '', 
      sitioReferencia: '',
      valorUnitarioCalculado: '0',
      valorUtilizadoCalculado: '0'
    });
    setEditingId(null);
    setShowForm(false);
  }, []);

  // Components for responsive design
  const Card = useMemo(() => ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  ), []);

  const Button = useMemo(() => ({ 
    children, 
    variant = "default", 
    size = "default", 
    className = "", 
    disabled = false,
    ...props 
  }: { 
    children: React.ReactNode; 
    variant?: "default" | "danger" | "secondary"; 
    size?: "default" | "sm"; 
    className?: string;
    disabled?: boolean;
    [key: string]: any 
  }) => {
    const variants = {
      default: "bg-gray-900 text-white hover:bg-gray-800",
      danger: "bg-red-600 text-white hover:bg-red-700",
      secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300"
    };
    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1.5 text-xs"
    };
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }, []);

  const Badge = useMemo(() => ({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger"; className?: string }) => {
    const variants = {
      default: "bg-gray-100 text-gray-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800"
    };
    return (
      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
        {children}
      </span>
    );
  }, []);

  const getStockAlertBadge = useCallback((producto: ConsumableProduct) => {
    const stockTotal = producto.cantidadUnitaria;
    const cantidadUsada = producto.cantidadUtilizada;
    const stockActual = stockTotal - cantidadUsada;
    const stockMinimo = producto.minimo;
    const unidad = producto.unidadMedida;

    if (stockMinimo <= 0) {
      return <Badge variant="success">Stock OK ({stockActual} {unidad})</Badge>;
    }

    const stockPercentage = (stockActual / stockMinimo) * 100;
    const formattedPercentage = Math.round(stockPercentage);
    
    const criticalThreshold = 50;
    
    if (stockActual <= 0) {
      return <Badge variant="danger">Sin Stock (0 {unidad})</Badge>;
    } else if (stockPercentage <= criticalThreshold) {
      return <Badge variant="danger">Stock Crítico ({stockActual} {unidad} - {formattedPercentage}% del mínimo)</Badge>;
    } else if (stockActual <= stockMinimo) {
      return <Badge variant="warning">Stock Bajo ({stockActual}/{stockMinimo} {unidad} - {formattedPercentage}%)</Badge>;
    } else {
      return <Badge variant="success">Stock OK ({stockActual}/{stockMinimo} {unidad})</Badge>;
    }
  }, [Badge]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return productosConsumibles;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return productosConsumibles.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
        producto.unidadMedida.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [productosConsumibles, searchTerm]);

  // Calculate number of products with low stock
  const lowStockCount = useMemo(() => {
    return productosConsumibles.filter(producto => 
      producto.minimo > 0 && (producto.cantidadUnitaria - producto.cantidadUtilizada) <= producto.minimo
    ).length;
  }, [productosConsumibles]);

  // Calculate products for current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = useMemo(() => filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct), [filteredProducts, indexOfFirstProduct, indexOfLastProduct]);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Save product handler
  const handleSaveProduct = async () => {
    const parsedMinimo = formData.minimo === '' ? 0 : parseInt(formData.minimo);
    const parsedCantidadUnitaria = formData.cantidadUnitaria === '' ? 0 : parseFloat(parseCurrency(formData.cantidadUnitaria));
    const parsedPrecioPresentacion = formData.precioPresentacion === '' ? 0 : parseFloat(parseCurrency(formData.precioPresentacion));
    const parsedCantidadUtilizada = formData.cantidadUtilizada === '' ? 0 : parseFloat(parseCurrency(formData.cantidadUtilizada));
    const parsedCantidadPorProducto = formData.cantidadPorProducto === '' ? 0 : parseFloat(parseCurrency(formData.cantidadPorProducto));
    
    if (!formData.nombre.trim() || !formData.unidadMedida.trim() || 
        (formData.minimo !== '' && (isNaN(parsedMinimo) || parsedMinimo < 0)) ||
        (formData.cantidadUnitaria !== '' && (isNaN(parsedCantidadUnitaria) || parsedCantidadUnitaria <= 0)) ||
        (formData.precioPresentacion !== '' && (isNaN(parsedPrecioPresentacion) || parsedPrecioPresentacion < 0))) {
      toast.error('Por favor, complete todos los campos obligatorios y asegúrese de que las cantidades sean números válidos.', {
        duration: 4000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#EF4444',
        },
      });
      return;
    }

    try {
      await withLoading(async () => {
        const headers = getAuthHeaders();
        
        const productData = {
          nombre_insumo: formData.nombre.trim(),
          unidad: formData.unidadMedida.trim(),
          cantidad_unitaria: parsedCantidadUnitaria,
          precio_presentacion: parsedPrecioPresentacion,
          cantidad_utilizada: parsedCantidadUtilizada,
          cantidad_por_producto: parsedCantidadPorProducto,
          stock_minimo: parsedMinimo,
          sitio_referencia: formData.sitioReferencia.trim()
        };
        
        let response;
        
        if (editingId) {
          response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/insumos/${editingId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(productData)
          });
        } else {
          response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/insumos`, {
            method: 'POST',
            headers,
            body: JSON.stringify(productData)
          });
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Error al ${editingId ? 'actualizar' : 'crear'} producto`);
        }
        
        const savedProduct = await response.json();
        
        if (!savedProduct || typeof savedProduct !== 'object' || !savedProduct.id) {
          throw new Error(`Error al ${editingId ? 'actualizar' : 'crear'} producto. Respuesta inválida del servidor.`);
        }
        
        toast.success(`Producto "${formData.nombre.trim()}" ${editingId ? 'actualizado' : 'creado'} con éxito`, {
          duration: 3000,
          position: "top-center",
          style: {
            background: '#10B981',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10B981',
          },
        });
        
        if (editingId) {
          setProductosConsumibles(prev => 
            prev.map(p => p.id === editingId ? {
              id: savedProduct.id,
              nombre: formData.nombre.trim(),
              unidadMedida: formData.unidadMedida.trim(),
              cantidadUnitaria: parsedCantidadUnitaria,
              precioPresentacion: parsedPrecioPresentacion,
              cantidadUtilizada: parsedCantidadUtilizada,
              cantidadActual: parsedCantidadUtilizada,
              cantidadPorProducto: parsedCantidadPorProducto,
              minimo: parsedMinimo,
              valorUnitario: savedProduct.valor_unitario || (parsedCantidadUnitaria > 0 ? parsedPrecioPresentacion / parsedCantidadUnitaria : 0),
              valorUtilizado: savedProduct.valor_utilizado || 0,
              sitioReferencia: formData.sitioReferencia.trim()
            } : p)
          );
        } else {
          setProductosConsumibles(prev => [...prev, {
            id: savedProduct.id,
            nombre: formData.nombre.trim(),
            unidadMedida: formData.unidadMedida.trim(),
            cantidadUnitaria: parsedCantidadUnitaria,
            precioPresentacion: parsedPrecioPresentacion,
            cantidadUtilizada: parsedCantidadUtilizada,
            cantidadActual: parsedCantidadUtilizada,
            cantidadPorProducto: parsedCantidadPorProducto,
            minimo: parsedMinimo,
            valorUnitario: savedProduct.valor_unitario || (parsedCantidadUnitaria > 0 ? parsedPrecioPresentacion / parsedCantidadUnitaria : 0),
            valorUtilizado: savedProduct.valor_utilizado || 0,
            sitioReferencia: formData.sitioReferencia.trim()
          }]);
        }
        
        // Clear form and editing state
        setFormData({ 
          nombre: '', 
          unidadMedida: '', 
          cantidadUnitaria: '', 
          precioPresentacion: '', 
          cantidadUtilizada: '', 
          cantidadPorProducto: '',
          minimo: '', 
          sitioReferencia: '',
          valorUnitarioCalculado: '0',
          valorUtilizadoCalculado: '0'
        });
        setEditingId(null);
        setShowForm(false);
        
        // Refresh the products list from the server
        const loadInitialData = async () => {
          const catMap = await fetchCategories();
          await fetchProducts(catMap);
        };
        
        await loadInitialData();
      });
    } catch (err: any) {
      setError(err.message || `Error al ${editingId ? 'actualizar' : 'crear'} producto`);
      
      toast.error(err.message || `Error al ${editingId ? 'actualizar' : 'crear'} producto`, {
        duration: 4000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#EF4444',
        },
      });
    }
  };

  // Product Card Component for mobile view
  const ProductCard = ({ producto }: { producto: ConsumableProduct }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-900 text-lg">{producto.nombre}</h3>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            onClick={() => handleEditProduct(producto)}
            title="Editar producto"
            variant="secondary"
            className="!p-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => handleDeleteConfirmation(producto)}
            title="Eliminar producto"
            className="!p-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Unidad:</span>
          <div className="font-medium">{producto.unidadMedida}</div>
        </div>
        <div>
          <span className="text-gray-500">Presentación:</span>
          <div className="font-medium">{producto.cantidadUnitaria} {producto.unidadMedida}</div>
        </div>
        <div>
          <span className="text-gray-500">Precio:</span>
          <div className="font-medium">${formatCurrencyWithoutTrailingZeros(producto.precioPresentacion)}</div>
        </div>
        <div>
          <span className="text-gray-500">Stock Disponible:</span>
          <div className={`font-medium ${(producto.cantidadUnitaria - producto.cantidadUtilizada) <= producto.minimo ? 'text-amber-700' : ''}`}>
            {producto.cantidadUnitaria - producto.cantidadUtilizada} {producto.unidadMedida}
          </div>
        </div>
        <div>
          <span className="text-gray-500">Valor Unitario:</span>
          <div className="font-medium">${formatCurrencyWithoutTrailingZeros(producto.valorUnitario)}</div>
        </div>
        <div>
          <span className="text-gray-500">Cant. por Producto:</span>
          <div className="font-medium">{producto.cantidadPorProducto} {producto.unidadMedida}</div>
        </div>
      </div>
      
      <div className="pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-500 text-sm">Estado:</span>
            <div className="mt-1">{getStockAlertBadge(producto)}</div>
          </div>
          {producto.sitioReferencia && (
            <div className="text-right">
              <span className="text-gray-500 text-sm">Proveedor:</span>
              <div className="text-sm font-medium">{producto.sitioReferencia}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Suministros</h1>
          
          {/* Mobile Add Button */}
          <div className="sm:hidden">
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="w-full flex items-center justify-center"
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cerrar Formulario
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Stock Alert */}
        {lowStockCount > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Alerta de Stock</h3>
              <p className="text-sm text-amber-700 mt-1">
                {lowStockCount === 1 
                  ? 'Hay 1 producto por debajo del nivel mínimo de stock.' 
                  : `Hay ${lowStockCount} productos por debajo del nivel mínimo de stock.`}
              </p>
            </div>
          </div>
        )}
        
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-2">
                <Button 
                  size="sm" 
                  onClick={handleRefreshCategories}
                  className="!bg-red-600 hover:!bg-red-700"
                >
                  Reintentar cargar categorías
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Form Card - Show on desktop or when showForm is true on mobile */}
        <div className={`${showForm ? 'block' : 'hidden sm:block'} mb-6`}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <div className="hidden sm:block">
                {editingId && (
                  <Button variant="secondary" onClick={handleCancelEdit} size="sm">
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="nombre"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre del producto"
                />
              </div>
              
              <div>
                <label htmlFor="unidadMedida" className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad de Medida *
                </label>
                <select
                  id="unidadMedida"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.unidadMedida}
                  onChange={handleChange}
                >
                  <option value="">Seleccione una unidad</option>
                  <option value="Litros (L)">Litros (L)</option>
                  <option value="Kilogramos (kg)">Kilogramos (kg)</option>
                  <option value="Gramos (g)">Gramos (g)</option>
                  <option value="Unidad (u)">Unidad (u)</option>
                  <option value="Mililitros (ml)">Mililitros (ml)</option>
                </select>
              </div>

              <div>
                <label htmlFor="cantidadUnitaria" className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Disponible *
                </label>
                <input
                  type="text"
                  id="cantidadUnitaria"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cantidadUnitaria}
                  onChange={handleChange}
                  placeholder="Ej: 1000 o 0,5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad de unidades en la presentación que compras
                </p>
              </div>

              <div>
                <label htmlFor="minimo" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo *
                </label>
                <input
                  type="number"
                  id="minimo"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.minimo}
                  onChange={handleChange}
                  placeholder="Ej: 500"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="precioPresentacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio de Presentación *
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="precioPresentacion"
                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.precioPresentacion}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-xs">COP</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="valorUnitarioCalculado" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Unitario (Calculado)
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="valorUnitarioCalculado"
                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 py-2 bg-gray-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.valorUnitarioCalculado || '0'}
                    readOnly
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-xs">COP</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="cantidadUtilizada" className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Utilizada
                </label>
                <input
                  type="text"
                  id="cantidadUtilizada"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cantidadUtilizada}
                  onChange={handleChange}
                  placeholder="Ej: 50 o 0,5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad actual disponible en stock.
                </p>
              </div>

              <div>
                <label htmlFor="cantidadPorProducto" className="block text-sm font-medium text-gray-700 mb-1">
                  Cant. Utilizada por Producto
                </label>
                <input
                  type="text"
                  id="cantidadPorProducto"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cantidadPorProducto}
                  onChange={handleChange}
                  placeholder="Ej: 1 o 0,5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad que se utilizará en las recetas.
                </p>
              </div>

              <div>
                <label htmlFor="valorUtilizadoCalculado" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Utilizado (Calculado)
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="valorUtilizadoCalculado"
                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 py-2 bg-gray-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.valorUtilizadoCalculado || '0'}
                    readOnly
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-xs">COP</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="sitioReferencia" className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio de Referencia
                </label>
                <input
                  type="text"
                  id="sitioReferencia"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.sitioReferencia}
                  onChange={handleChange}
                  placeholder="Ej: Proveedor ABC"
                />
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              {editingId && (
                <Button variant="secondary" onClick={handleCancelEdit} className="w-full sm:w-auto">
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSaveProduct} className="w-full sm:w-auto">
                {editingId ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Actualizar Producto
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Products List */}
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-0">
                Listado de Productos ({productosConsumibles.length})
              </h2>
              
              {/* View toggle for larger screens */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  Tabla
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  Tarjetas
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar por nombre..."
              />
            </div>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-gray-500 mb-4 animate-spin" />
                <p className="text-gray-500">Cargando productos...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 p-6">
              No hay productos registrados. Agrega uno para comenzar.
            </div>
          ) : (
            <>
              {/* Mobile/Tablet Card View */}
              <div className="block md:hidden p-4 space-y-4">
                {currentProducts.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className={`hidden md:block ${viewMode === 'cards' ? 'md:hidden' : ''} overflow-x-auto`}>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-600">Nombre</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Unidad</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Presentación</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Precio</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Stock Disponible</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Valor Unitario</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Cant./Producto</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Stock Mínimo</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Estado</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Proveedor</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((producto, index) => (
                      <tr key={producto.id} className={`border-t border-gray-200 ${index % 2 !== 0 ? 'bg-gray-50' : ''}`}>
                        <td className="p-3 font-medium text-gray-900">{producto.nombre}</td>
                        <td className="p-3 text-gray-700">{producto.unidadMedida}</td>
                        <td className="p-3 text-gray-700">{producto.cantidadUnitaria} {producto.unidadMedida}</td>
                        <td className="p-3 text-gray-700">${formatCurrencyWithoutTrailingZeros(producto.precioPresentacion)}</td>
                        <td className={`p-3 ${(producto.cantidadUnitaria - producto.cantidadUtilizada) <= producto.minimo ? 'font-medium text-amber-700' : 'text-gray-700'}`}>
                          {producto.cantidadUnitaria - producto.cantidadUtilizada} {producto.unidadMedida}
                        </td>
                        <td className="p-3 text-gray-700">${formatCurrencyWithoutTrailingZeros(producto.valorUnitario)}</td>
                        <td className="p-3 text-gray-700">{producto.cantidadPorProducto} {producto.unidadMedida}</td>
                        <td className="p-3 text-gray-700">{producto.minimo} {producto.unidadMedida}</td>
                        <td className="p-3 text-gray-700">{getStockAlertBadge(producto)}</td>
                        <td className="p-3 text-gray-700">{producto.sitioReferencia}</td>
                        <td className="p-3">
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              onClick={() => handleEditProduct(producto)}
                              title="Editar producto"
                              variant="secondary"
                              className="!p-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm" 
                              onClick={() => handleDeleteConfirmation(producto)}
                              title="Eliminar producto"
                              className="!p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Desktop Card View */}
              <div className={`${viewMode === 'cards' ? 'block' : 'hidden'} hidden md:block p-4`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {currentProducts.map((producto) => (
                    <ProductCard key={producto.id} producto={producto} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Pagination */}
          {filteredProducts.length > productsPerPage && (
            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Mostrando {indexOfFirstProduct + 1} a {Math.min(indexOfLastProduct, filteredProducts.length)} de {filteredProducts.length} productos
              </div>
              
              <nav className="flex items-center gap-1" aria-label="Pagination">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="secondary"
                  size="sm"
                  className="px-3 py-1"
                >
                  Anterior
                </Button>
                
                {/* Page Numbers - Show limited on mobile */}
                <div className="hidden sm:flex gap-1">
                  {[...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index}
                      onClick={() => paginate(index + 1)}
                      variant={currentPage === index + 1 ? "default" : "secondary"}
                      size="sm"
                      className="px-3 py-1"
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
                
                {/* Mobile page indicator */}
                <div className="sm:hidden px-3 py-1 text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </div>
                
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  size="sm"
                  className="px-3 py-1"
                >
                  Siguiente
                </Button>
              </nav>
            </div>
          )}
        </Card>
        
        {/* Toaster component */}
        <Toaster />
      </div>
    </div>
  );
}

// 'use client';

// import React, { useState, useCallback, useMemo, useEffect } from 'react';
// import { Plus, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
// import { getAuthHeaders, isAuthenticated } from '../../../utils/auth';
// import { useRouter } from 'next/navigation';
// import { useApi } from '../../../utils/api';
// import toast from 'react-hot-toast'; // Import toast from react-hot-toast
// import { Toaster } from 'react-hot-toast'; // Import Toaster component

// interface ConsumableProduct {
//   id: number;
//   nombre: string;
//   unidadMedida: string;
//   cantidadUnitaria: number; // Changed from presentacionCantidad
//   precioPresentacion: number;
//   cantidadUtilizada: number; // Representa el stock actual disponible
//   cantidadActual?: number; // Nueva: Para control de stock
//   cantidadPorProducto: number; // Nueva: Cantidad utilizada por producto en recetas
//   minimo: number;
//   valorUnitario: number; // Calculated field
//   valorUtilizado: number; // Calculated field
//   sitioReferencia: string;
// }

// interface ProductFormData {
//   nombre: string;
//   unidadMedida: string;
//   cantidadUnitaria: string; // Changed from presentacionCantidad
//   precioPresentacion: string;
//   cantidadUtilizada: string; // Para control de stock
//   cantidadPorProducto: string; // Nueva: Cantidad utilizada por producto en recetas
//   minimo: string;
//   sitioReferencia: string;
//   valorUnitarioCalculado?: string;
//   valorUtilizadoCalculado?: string;
// }

// interface Category {
//   id: number;
//   nombre_categoria: string;
// }

// interface ApiProduct {
//   id: number;
//   nombre_insumo: string;
//   unidad: string;
//   cantidad_unitaria: number; // Changed from presentacion_cantidad
//   precio_presentacion: number;
//   valor_unitario: number; // Calculated by backend
//   cantidad_utilizada: number; // Para control de stock
//   cantidad_por_producto: number; // Nueva: Cantidad utilizada por producto en recetas
//   valor_utilizado: number; // Calculated by backend
//   stock_minimo: number; // Changed from cantidad_actual and stock_minimo
//   sitio_referencia: string;
// }

// export default function SuministroPage() {
//   const router = useRouter();
//   const { withLoading } = useApi();
  
//   const [productosConsumibles, setProductosConsumibles] = useState<ConsumableProduct[]>([]);

//   const [formData, setFormData] = useState<ProductFormData>({
//     nombre: '',
//     unidadMedida: '',
//     cantidadUnitaria: '',
//     precioPresentacion: '',
//     cantidadUtilizada: '',
//     cantidadPorProducto: '',
//     minimo: '',
//     sitioReferencia: '',
//     valorUnitarioCalculado: '0',
//     valorUtilizadoCalculado: '0'
//   });

//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [searchTerm, setSearchTerm] = useState<string>('');
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const productsPerPage = 5;
  
//   // States for API integration
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
//   const [error, setError] = useState<string>('');
//   const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

//   // Custom toast styles
//   const showSuccessToast = (message: string) => {
//     toast.success(message, {
//       duration: 3000,
//       position: "top-center",
//       style: {
//         background: '#10B981',
//         color: 'white',
//         padding: '16px',
//         borderRadius: '8px',
//       },
//       iconTheme: {
//         primary: 'white',
//         secondary: '#10B981',
//       },
//     });
//   };

//   const showErrorToast = (message: string) => {
//     toast.error(message, {
//       duration: 4000,
//       position: "top-center",
//       style: {
//         background: '#EF4444',
//         color: 'white',
//         padding: '16px',
//         borderRadius: '8px',
//       },
//       iconTheme: {
//         primary: 'white',
//         secondary: '#EF4444',
//       },
//     });
//   };
  
//   // Handle delete confirmation with custom toast
//   const handleDeleteConfirmation = (producto: ConsumableProduct) => {
//     toast((t) => (
//       <div className="flex flex-col gap-2">
//         <div className="text-sm font-medium">
//           ¿Está seguro de eliminar {producto.nombre}?
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={() => {
//               handleDeleteProduct(producto.id);
//               toast.dismiss(t.id);
//             }}
//             className="bg-red-600 text-white px-3 py-1 rounded-md text-xs"
//           >
//             Eliminar
//           </button>
//           <button
//             onClick={() => toast.dismiss(t.id)}
//             className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs"
//           >
//             Cancelar
//           </button>
//         </div>
//       </div>
//     ), {
//       duration: 6000,
//       position: "top-center",
//     });
//   };

//   // Extract fetch functions outside useEffect for reuse
//   const fetchCategories = useCallback(async () => {
//     try {
//       return await withLoading(async () => {
//         const headers = getAuthHeaders();
//         const apiUrl = process.env.NEXT_PUBLIC_BACKEND;
        
//         if (!apiUrl) {
//           throw new Error('Error de configuración: URL del backend no definida');
//         }
        
//         const response = await fetch(`${apiUrl}/api/v1/categories`, {
//           method: 'GET',
//           headers
//         });
        
//         if (!response.ok) {
//           const errorData = await response.json().catch(() => ({}));
//           throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
//         }
        
//         const data = await response.json();
        
//         // Check if data is an array or has a specific property containing categories
//         let categoriesData = data;
//         if (data && typeof data === 'object' && !Array.isArray(data)) {
//           // If data is an object, try to find an array property
//           const possibleArrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
//           if (possibleArrayProps.length > 0) {
//             categoriesData = data[possibleArrayProps[0]];
//           }
//         }
        
//         if (!Array.isArray(categoriesData)) {
//           // Initialize as empty array instead of throwing error
//           categoriesData = [];
//         }
        
//         // Normalize category objects to ensure they have id and nombre_categoria properties
//         const normalizedCategories = categoriesData.map((cat: any) => {
//           return {
//             id: cat.id || cat.category_id || cat.categoryId || 0,
//             nombre_categoria: cat.nombre_categoria || cat.name || cat.category_name || cat.categoryName || cat.nombre || 'Categoría sin nombre'
//           };
//         });
        
//         setCategories(normalizedCategories);
        
//         // Create a map of category id to name for easy lookup
//         const catMap: Record<number, string> = {};
//         normalizedCategories.forEach((cat: Category) => {
//           catMap[cat.id] = cat.nombre_categoria;
//         });
//         setCategoryMap(catMap);
//         return catMap; // Return the map for use in fetchProducts
//       });
//     } catch (err: any) {
//       setError(err.message || 'Error al cargar categorías');
      
//       // Create empty map in case of error
//       setCategories([]);
//       setCategoryMap({});
//       return {};
//     }
//   // Eliminar withLoading como dependencia para evitar ciclos infinitos
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
  
//   const fetchProducts = useCallback(async (categoryMapping: Record<number, string>) => {
//     try {
//       await withLoading(async () => {
//         const headers = getAuthHeaders();
//         const apiUrl = process.env.NEXT_PUBLIC_BACKEND;
        
//         if (!apiUrl) {
//           throw new Error('Error de configuración: URL del backend no definida');
//         }
        
//         const response = await fetch(`${apiUrl}/api/v1/insumos`, {
//           method: 'GET',
//           headers
//         });
        
//         if (!response.ok) {
//           const errorData = await response.json().catch(() => ({}));
//           throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
//         }
        
//         const data = await response.json();
        
//         // Transform API products to our ConsumableProduct format
//         const transformedProducts: ConsumableProduct[] = data.map((product: ApiProduct) => {
//           return {
//             id: product.id,
//             nombre: product.nombre_insumo,
//             unidadMedida: product.unidad || 'unidad (u)',
//             cantidadUnitaria: product.cantidad_unitaria || 0,
//             precioPresentacion: product.precio_presentacion || 0,
//             cantidadUtilizada: product.cantidad_utilizada || 0,
//             cantidadActual: product.cantidad_utilizada || 0, // cantidadUtilizada es lo que queda en stock
//             cantidadPorProducto: product.cantidad_por_producto || 0,
//             minimo: product.stock_minimo,
//             valorUnitario: product.valor_unitario || 0,
//             valorUtilizado: product.valor_utilizado || 0,
//             sitioReferencia: product.sitio_referencia || ''
//           };
//         });
        
//         setProductosConsumibles(transformedProducts);
//       });
//     } catch (err: any) {
//       setError(prev => prev || err.message || 'Error al cargar productos');
//     }
//   // Eliminar withLoading como dependencia para evitar ciclos infinitos
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Fetch categories and products on component mount
//   useEffect(() => {
//     const loadInitialData = async () => {
//       const catMap = await fetchCategories();
//       await fetchProducts(catMap);
//     };
    
//     loadInitialData();
//     // No incluir fetchCategories o fetchProducts como dependencias
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
  
//   // Handler to manually refresh categories
//   const handleRefreshCategories = async () => {
//     await fetchCategories();
//   };

//   // Check authentication on component mount
//   useEffect(() => {
//     if (!isAuthenticated()) {
//       router.push('/login');
//     }
//   }, [router]);

//   // Add a function to format currency values (Colombian format)
//   const formatCurrency = useCallback((value: string): string => {
//     // Remove all characters except numbers and comma
//     const cleanValue = value.replace(/[^0-9,]/g, '');
    
//     if (!cleanValue) return '';
    
//     // Split by comma to handle decimals
//     const parts = cleanValue.split(',');
    
//     // Format the integer part with dots as thousand separators
//     if (parts[0]) {
//       const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
//       // If there's a decimal part, add it back with comma
//       if (parts.length > 1) {
//         // Limit decimal places to 2
//         const decimalPart = parts[1].substring(0, 2);
//         return `${integerPart},${decimalPart}`;
//       }
      
//       return integerPart;
//     }
    
//     return '';
//   }, []);

//   // Add a function to format currency without unnecessary trailing zeros
//   const formatCurrencyWithoutTrailingZeros = useCallback((value: number): string => {
//     if (value === 0) return '0';
    
//     // Format with thousands separators using Colombian locale
//     const formatted = value.toLocaleString('es-CO', {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 2
//     });
    
//     return formatted;
//   }, []);

//   // Add a function to format decimal numbers (Colombian format)
//   const formatDecimalNumber = useCallback((value: string): string => {
//     // Remove all characters except numbers, comma and dot
//     const cleanValue = value.replace(/[^0-9.,]/g, '');
    
//     if (!cleanValue) return '';
    
//     // Replace dots with commas if they appear to be decimal separators
//     let processedValue = cleanValue;
//     if (cleanValue.includes('.') && !cleanValue.includes(',')) {
//       processedValue = cleanValue.replace('.', ',');
//     }
    
//     // Split by comma to handle decimals
//     const parts = processedValue.split(',');
    
//     // Format the integer part with dots as thousand separators
//     if (parts[0]) {
//       const integerPart = parts[0].replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
//       // If there's a decimal part, add it back with comma
//       if (parts.length > 1) {
//         // Allow more decimal places for quantities
//         const decimalPart = parts[1].substring(0, 4);
//         return `${integerPart},${decimalPart}`;
//       }
      
//       return integerPart;
//     }
    
//     return '';
//   }, []);

//   // Add a function to parse formatted currency back to number string
//   const parseCurrency = useCallback((formattedValue: string): string => {
//     // Replace comma with dot for decimal separator and remove thousand separators (dots)
//     return formattedValue
//       .replace(/\./g, '') // Remove thousand separators (dots)
//       .replace(',', '.'); // Replace comma with dot for decimal
//   }, []);

//   // Modify handleChange to handle currency and decimal formatting
//   const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { id, value } = e.target;
    
//     if (id === 'precioPresentacion') {
//       // Format the currency value
//       const formattedValue = formatCurrency(value);
      
//       setFormData((prev) => ({
//         ...prev,
//         [id]: formattedValue
//       }));
//     } else if (id === 'cantidadUnitaria' || id === 'cantidadUtilizada' || id === 'cantidadPorProducto') {
//       // Format decimal numbers
//       const formattedValue = formatDecimalNumber(value);
      
//       setFormData((prev) => ({
//         ...prev,
//         [id]: formattedValue
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [id]: value,
//       }));
//     }
//   }, [formatCurrency, formatDecimalNumber]);

//   // Calculate valor unitario automatically
//   useEffect(() => {
    
//     if (formData.cantidadUnitaria && formData.precioPresentacion) {
//       const cantidadUnitaria = parseFloat(parseCurrency(formData.cantidadUnitaria));
//       const precioPresentacion = parseFloat(parseCurrency(formData.precioPresentacion));
      
//       if (!isNaN(cantidadUnitaria) && !isNaN(precioPresentacion) && cantidadUnitaria > 0) {
//         const valorUnitario = precioPresentacion / cantidadUnitaria;
        
//         setFormData(prev => ({
//           ...prev,
//           valorUnitarioCalculado: formatCurrencyWithoutTrailingZeros(valorUnitario)
//         }));
//       } else {
//         setFormData(prev => ({
//           ...prev,
//           valorUnitarioCalculado: '0'
//         }));
//       }
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         valorUnitarioCalculado: '0'
//       }));
//     }
//   }, [formData.cantidadUnitaria, formData.precioPresentacion, parseCurrency, formatCurrencyWithoutTrailingZeros]);

//   // Calculate valor utilizado automatically
//   useEffect(() => {
//     if (formData.valorUnitarioCalculado && formData.cantidadUtilizada) {
//       const valorUnitario = parseFloat(parseCurrency(formData.valorUnitarioCalculado));
//       const cantidadUtilizada = parseFloat(parseCurrency(formData.cantidadUtilizada));
      
//       if (!isNaN(valorUnitario) && !isNaN(cantidadUtilizada)) {
//         const valorUtilizado = valorUnitario * cantidadUtilizada;
//         setFormData(prev => ({
//           ...prev,
//           valorUtilizadoCalculado: formatCurrencyWithoutTrailingZeros(valorUtilizado)
//         }));
//       } else {
//         setFormData(prev => ({
//           ...prev,
//           valorUtilizadoCalculado: '0'
//         }));
//       }
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         valorUtilizadoCalculado: '0'
//       }));
//     }
//   }, [formData.valorUnitarioCalculado, formData.cantidadUtilizada, parseCurrency, formatCurrencyWithoutTrailingZeros]);

//   // Optimización: useCallback para evitar re-renders innecesarios
//   const handleEditProduct = useCallback((producto: ConsumableProduct) => {
//     // Calculate values for display
//     const valorUnitarioCalc = producto.cantidadUnitaria > 0 
//       ? formatCurrencyWithoutTrailingZeros(producto.precioPresentacion / producto.cantidadUnitaria)
//       : '0';
//     const valorUtilizadoCalc = producto.cantidadUtilizada > 0 && producto.cantidadUnitaria > 0
//       ? formatCurrencyWithoutTrailingZeros((producto.precioPresentacion / producto.cantidadUnitaria) * producto.cantidadUtilizada)
//       : '0';
    
//     // Format decimal values for display with Colombian format
//     const cantidadUnitariaFormatted = producto.cantidadUnitaria.toString().replace('.', ',');
//     const cantidadUtilizadaFormatted = producto.cantidadUtilizada.toString().replace('.', ',');
//     const cantidadPorProductoFormatted = producto.cantidadPorProducto.toString().replace('.', ',');
    
//     setFormData({ 
//       nombre: producto.nombre,
//       unidadMedida: producto.unidadMedida,
//       cantidadUnitaria: formatDecimalNumber(cantidadUnitariaFormatted),
//       precioPresentacion: formatCurrencyWithoutTrailingZeros(producto.precioPresentacion),
//       cantidadUtilizada: formatDecimalNumber(cantidadUtilizadaFormatted),
//       cantidadPorProducto: formatDecimalNumber(cantidadPorProductoFormatted),
//       minimo: String(producto.minimo),
//       sitioReferencia: producto.sitioReferencia,
//       valorUnitarioCalculado: valorUnitarioCalc,
//       valorUtilizadoCalculado: valorUtilizadoCalc
//     });
//     setEditingId(producto.id);
//   }, [formatCurrencyWithoutTrailingZeros, formatDecimalNumber]);

//   const handleDeleteProduct = useCallback(async (id: number) => {
//     try {
//       await withLoading(async () => {
//         const headers = getAuthHeaders();
        
//         const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/insumos/${id}`, {
//           method: 'DELETE',
//           headers
//         });
        
//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.detail || 'Error al eliminar producto');
//         }
        
//         setProductosConsumibles((prev) => prev.filter((p) => p.id !== id));
        
//         // Show success toast notification with custom style
//         toast.success('Producto eliminado con éxito', {
//           duration: 3000,
//           position: "top-center",
//           style: {
//             background: '#10B981',
//             color: 'white',
//             padding: '16px',
//             borderRadius: '8px',
//           },
//           iconTheme: {
//             primary: 'white',
//             secondary: '#10B981',
//           },
//         });
//       });
//     } catch (err: any) {
//       setError(err.message || 'Error al eliminar producto');
      
//       // Show error toast notification with custom style
//       toast.error(err.message || 'Error al eliminar producto', {
//         duration: 4000,
//         position: "top-center",
//         style: {
//           background: '#EF4444',
//           color: 'white',
//           padding: '16px',
//           borderRadius: '8px',
//         },
//         iconTheme: {
//           primary: 'white',
//           secondary: '#EF4444',
//         },
//       });
//     }
//   }, [withLoading]);

//   const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(e.target.value);
//   }, []);

//   const handleCancelEdit = useCallback(() => {
//     setFormData({ 
//       nombre: '', 
//       unidadMedida: '', 
//       cantidadUnitaria: '', 
//       precioPresentacion: '', 
//       cantidadUtilizada: '', 
//       cantidadPorProducto: '',
//       minimo: '', 
//       sitioReferencia: '',
//       valorUnitarioCalculado: '0',
//       valorUtilizadoCalculado: '0'
//     });
//     setEditingId(null);
//   }, []);

//   // Optimización: Memoizar componentes para evitar re-renders
//   const Card = useMemo(() => ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
//     <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
//       {children}
//     </div>
//   ), []);

//   const Button = useMemo(() => ({ 
//     children, 
//     variant = "default", 
//     size = "default", 
//     className = "", 
//     disabled = false,
//     ...props 
//   }: { 
//     children: React.ReactNode; 
//     variant?: "default" | "danger" | "secondary"; 
//     size?: "default" | "sm"; 
//     className?: string;
//     disabled?: boolean;
//     [key: string]: any 
//   }) => {
//     const variants = {
//       default: "bg-gray-900 text-white hover:bg-gray-800",
//       danger: "bg-red-600 text-white hover:bg-red-700",
//       secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300"
//     };
//     const sizes = {
//       default: "px-4 py-2 text-sm",
//       sm: "px-3 py-1.5 text-xs"
//     };
//     return (
//       <button
//         className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
//         disabled={disabled}
//         {...props}
//       >
//         {children}
//       </button>
//     );
//   }, []);

//   const Badge = useMemo(() => ({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger"; className?: string }) => {
//     const variants = {
//       default: "bg-gray-100 text-gray-800",
//       success: "bg-green-100 text-green-800",
//       warning: "bg-yellow-100 text-yellow-800",
//       danger: "bg-red-100 text-red-800"
//     };
//     return (
//       <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
//         {children}
//       </span>
//     );
//   }, []);

//   const getStockAlertBadge = useCallback((producto: ConsumableProduct) => {
//     // cantidad_unitaria is the total quantity purchased
//     // cantidad_utilizada is how much has been used so far
//     // So remaining stock = cantidad_unitaria - cantidad_utilizada
//     const stockTotal = producto.cantidadUnitaria;
//     const cantidadUsada = producto.cantidadUtilizada;
//     const stockActual = stockTotal - cantidadUsada;
//     const stockMinimo = producto.minimo;
//     const unidad = producto.unidadMedida;

//     if (stockMinimo <= 0) {
//       // If no minimum stock is set, we can't determine the status properly.
//       return <Badge variant="success">Stock OK ({stockActual} {unidad})</Badge>;
//     }

//     // Calculate percentage of remaining stock compared to minimum
//     const stockPercentage = (stockActual / stockMinimo) * 100;
//     const formattedPercentage = Math.round(stockPercentage); // Round to whole number
    
//     // Define thresholds for alerts
//     const criticalThreshold = 50; // 50% of minimum stock or less is critical
    
//     if (stockActual <= 0) {
//       // No stock available
//       return <Badge variant="danger">Sin Stock (0 {unidad})</Badge>;
//     } else if (stockPercentage <= criticalThreshold) {
//       // Stock is critically low (50% or less of the minimum)
//       return <Badge variant="danger">Stock Crítico ({stockActual} {unidad} - {formattedPercentage}% del mínimo)</Badge>;
//     } else if (stockActual <= stockMinimo) {
//       // Stock is below or equal to minimum, but not critical
//       return <Badge variant="warning">Stock Bajo ({stockActual}/{stockMinimo} {unidad} - {formattedPercentage}%)</Badge>;
//     } else {
//       // Stock is above minimum (OK)
//       return <Badge variant="success">Stock OK ({stockActual}/{stockMinimo} {unidad})</Badge>;
//     }
//   }, [Badge]);

//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) {
//       return productosConsumibles;
//     }
//     const lowerCaseSearchTerm = searchTerm.toLowerCase();
//     return productosConsumibles.filter(
//       (producto) =>
//         producto.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
//         producto.unidadMedida.toLowerCase().includes(lowerCaseSearchTerm)
//     );
//   }, [productosConsumibles, searchTerm]);

//   // Calculate number of products with low stock
//   const lowStockCount = useMemo(() => {
//     return productosConsumibles.filter(producto => 
//       producto.minimo > 0 && (producto.cantidadUnitaria - producto.cantidadUtilizada) <= producto.minimo
//     ).length;
//   }, [productosConsumibles]);

//   // Calcular productos para la página actual
//   const indexOfLastProduct = currentPage * productsPerPage;
//   const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
//   const currentProducts = useMemo(() => filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct), [filteredProducts, indexOfFirstProduct, indexOfLastProduct]);

//   // Cambiar de página
//   const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

//   const totalPages = Math.ceil(filteredProducts.length / productsPerPage);



//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Suministros</h1>
      
//       {lowStockCount > 0 && (
//         <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
//           <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
//           <div>
//             <h3 className="text-sm font-medium text-amber-800">Alerta de Stock</h3>
//             <p className="text-sm text-amber-700 mt-1">
//               {lowStockCount === 1 
//                 ? 'Hay 1 producto por debajo del nivel mínimo de stock.' 
//                 : `Hay ${lowStockCount} productos por debajo del nivel mínimo de stock.`}
//             </p>
//           </div>
//         </div>
//       )}
      
//       {error && (
//         <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
//           <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
//           <div className="flex-1">
//             <h3 className="text-sm font-medium text-red-800">Error</h3>
//             <p className="text-sm text-red-700 mt-1">{error}</p>
//             <div className="mt-2">
//               <Button 
//                 size="sm" 
//                 onClick={handleRefreshCategories}
//                 className="!bg-red-600 hover:!bg-red-700"
//               >
//                 Reintentar cargar categorías
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
      
//       <Card className="mb-6">
//         <h2 className="text-xl font-semibold text-gray-900 mb-4">
//           {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
//         </h2>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <div>
//             <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
//               Nombre *
//             </label>
//             <input
//               type="text"
//               id="nombre"
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={formData.nombre}
//               onChange={handleChange}
//               placeholder="Nombre del producto"
//             />
//           </div>
          
//           <div>
//             <label htmlFor="unidadMedida" className="block text-sm font-medium text-gray-700 mb-1">
//               Unidad de Medida *
//             </label>
//             <select
//               id="unidadMedida"
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={formData.unidadMedida}
//               onChange={handleChange}
//             >
//               <option value="">Seleccione una unidad</option>
//               <option value="Litros (L)">Litros (L)</option>
//               <option value="Kilogramos (kg)">Kilogramos (kg)</option>
//               <option value="Gramos (g)">Gramos (g)</option>
//               <option value="Unidad (u)">Unidad (u)</option>
//               <option value="Mililitros (ml)">Mililitros (ml)</option>
//             </select>
//           </div>
          


//           <div>
//             <label htmlFor="cantidadUnitaria" className="block text-sm font-medium text-gray-700 mb-1">
//               Cantidad de Disponible *
//             </label>
//             <input
//               type="text"
//               id="cantidadUnitaria"
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={formData.cantidadUnitaria}
//               onChange={handleChange}
//               placeholder="Ej: 1000 o 0,5"
//             />
//             <p className="text-xs text-gray-500 mt-1">
//               Cantidad de unidades en la presentación que compras
//             </p>
//           </div>

//           <div>
//             <label htmlFor="minimo" className="block text-sm font-medium text-gray-700 mb-1">
//               Stock Mínimo *
//             </label>
//             <input
//               type="number"
//               id="minimo"
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={formData.minimo}
//               onChange={handleChange}
//               placeholder="Ej: 500"
//               min="0"
//             />
//           </div>


//           <div>
//             <label htmlFor="precioPresentacion" className="block text-sm font-medium text-gray-700 mb-1">
//               Precio de Presentación *
//             </label>
//             <div className="relative mt-1 rounded-md shadow-sm">
//               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//                 <span className="text-gray-500 text-base">$</span>
//               </div>
//               <input
//                 type="text"
//                 id="precioPresentacion"
//                 className="block w-full rounded-md border-gray-300 pl-7 pr-16 py-3 focus:border-blue-500 focus:ring-blue-500"
//                 value={formData.precioPresentacion}
//                 onChange={handleChange}
//                 placeholder="0"
//                 aria-describedby="price-currency"
//               />
//               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
//                 <span className="text-gray-500 text-base" id="price-currency">COP</span>
//               </div>
//             </div>
//           </div>

//           {/* <div>
//             <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
//               Cantidad Actual *
//             </label>
//             <input
//               type="number"
//               id="cantidad"
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={formData.cantidad}
//               onChange={handleChange}
//               placeholder="Ej: 1000"
//               min="0"
//             />
//           </div>
//            */}
      
//           <div>
//             <label htmlFor="valorUnitarioCalculado" className="block text-sm font-medium text-gray-700 mb-1">
//               Valor Unitario (Calculado)
//             </label>
//             <div className="relative mt-1 rounded-md shadow-sm">
//               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//                 <span className="text-gray-500 text-base">$</span>
//               </div>
//               <input
//                 type="text"
//                 id="valorUnitarioCalculado"
//                 className="block w-full rounded-md border-gray-300 pl-7 pr-16 py-3 bg-gray-50 text-base focus:border-blue-500 focus:ring-blue-500"
//                 value={formData.valorUnitarioCalculado || '0'}
//                 readOnly
//                 aria-describedby="unit-price-currency"
//               />
//               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
//                 <span className="text-gray-500 text-base" id="unit-price-currency">COP</span>
//               </div>
//             </div>
//           </div>

//           <div>
//             <label htmlFor="cantidadUtilizada" className="block text-sm font-medium text-gray-700 mb-1">
//               Cantidad Utilizada
//             </label>
//             <input
//               type="text"
//               id="cantidadUtilizada"
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={formData.cantidadUtilizada}
//               onChange={handleChange}
//               placeholder="Ej: 50 o 0,5"
//             />
//             <p className="text-xs text-gray-500 mt-1">
//               Este campo representa la cantidad actual disponible en stock.
//             </p>
//           </div>

//           <div>
//             <label htmlFor="cantidadPorProducto" className="block text-sm font-medium text-gray-700 mb-1">
//               Cantidad Utilizada por Producto
//             </label>
//             <input
//               type="text"
//               id="cantidadPorProducto"
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={formData.cantidadPorProducto}
//               onChange={handleChange}
//               placeholder="Ej: 1 o 0,5"
//             />
//             <p className="text-xs text-gray-500 mt-1">
//               Cantidad que se utilizará en las recetas de productos.
//             </p>
//           </div>

//           <div>
//             <label htmlFor="valorUtilizadoCalculado" className="block text-sm font-medium text-gray-700 mb-1">
//               Valor Utilizado (Calculado)
//             </label>
//             <div className="relative mt-1 rounded-md shadow-sm">
//               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//                 <span className="text-gray-500 text-base">$</span>
//               </div>
//               <input
//                 type="text"
//                 id="valorUtilizadoCalculado"
//                 className="block w-full rounded-md border-gray-300 pl-7 pr-16 py-3 bg-gray-50 text-base focus:border-blue-500 focus:ring-blue-500"
//                 value={formData.valorUtilizadoCalculado || '0'}
//                 readOnly
//                 aria-describedby="used-value-currency"
//               />
//               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
//                 <span className="text-gray-500 text-base" id="used-value-currency">COP</span>
//               </div>
//             </div>
//           </div>

//           <div>
//             <label htmlFor="sitioReferencia" className="block text-sm font-medium text-gray-700 mb-1">
//               Sitio de Referencia
//             </label>
//             <input
//               type="text"
//               id="sitioReferencia"
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={formData.sitioReferencia}
//               onChange={handleChange}
//               placeholder="Ej: Proveedor ABC"
//             />
//           </div>
//         </div>
        
//         <div className="mt-4 flex justify-end gap-2">
//           {editingId && (
//             <Button variant="secondary" onClick={handleCancelEdit}>
//               Cancelar
//             </Button>
//           )}
//           <Button onClick={() => {
//             const parsedMinimo = formData.minimo === '' ? 0 : parseInt(formData.minimo);
//             const parsedCantidadUnitaria = formData.cantidadUnitaria === '' ? 0 : parseFloat(parseCurrency(formData.cantidadUnitaria));
//             const parsedPrecioPresentacion = formData.precioPresentacion === '' ? 0 : parseFloat(parseCurrency(formData.precioPresentacion));
//             const parsedCantidadUtilizada = formData.cantidadUtilizada === '' ? 0 : parseFloat(parseCurrency(formData.cantidadUtilizada));
//             const parsedCantidadPorProducto = formData.cantidadPorProducto === '' ? 0 : parseFloat(parseCurrency(formData.cantidadPorProducto));
            
//             if (!formData.nombre.trim() || !formData.unidadMedida.trim() || 
//                 (formData.minimo !== '' && (isNaN(parsedMinimo) || parsedMinimo < 0)) ||
//                 (formData.cantidadUnitaria !== '' && (isNaN(parsedCantidadUnitaria) || parsedCantidadUnitaria <= 0)) ||
//                 (formData.precioPresentacion !== '' && (isNaN(parsedPrecioPresentacion) || parsedPrecioPresentacion < 0))) {
//               toast.error('Por favor, complete todos los campos obligatorios y asegúrese de que las cantidades sean números válidos.', {
//                 duration: 4000,
//                 position: "top-center",
//                 style: {
//                   background: '#EF4444',
//                   color: 'white',
//                   padding: '16px',
//                   borderRadius: '8px',
//                 },
//                 iconTheme: {
//                   primary: 'white',
//                   secondary: '#EF4444',
//                 },
//               });
//               return;
//             }

//             (async () => {
//               try {
//                 await withLoading(async () => {
//                   const headers = getAuthHeaders();
                  
//                   const productData = {
//                     nombre_insumo: formData.nombre.trim(),
//                     unidad: formData.unidadMedida.trim(),
//                     cantidad_unitaria: parsedCantidadUnitaria,
//                     precio_presentacion: parsedPrecioPresentacion,
//                     cantidad_utilizada: parsedCantidadUtilizada,
//                     cantidad_por_producto: parsedCantidadPorProducto,
//                     stock_minimo: parsedMinimo,
//                     sitio_referencia: formData.sitioReferencia.trim()
//                   };
                  
//                   let response;
                  
//                   if (editingId) {
//                     // Update existing product
//                     response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/insumos/${editingId}`, {
//                       method: 'PUT',
//                       headers,
//                       body: JSON.stringify(productData)
//                     });
//                   } else {
//                     // Create new product
//                     response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/insumos`, {
//                       method: 'POST',
//                       headers,
//                       body: JSON.stringify(productData)
//                     });
//                   }
                  
//                   if (!response.ok) {
//                     const errorData = await response.json();
//                     throw new Error(errorData.detail || `Error al ${editingId ? 'actualizar' : 'crear'} producto`);
//                   }
                  
//                   const savedProduct = await response.json();
                  
//                   if (!savedProduct || typeof savedProduct !== 'object') {
//                     throw new Error(`Error al ${editingId ? 'actualizar' : 'crear'} producto. Respuesta inválida del servidor.`);
//                   }
                  
//                   if (!savedProduct.id) {
//                     throw new Error(`Error al ${editingId ? 'actualizar' : 'crear'} producto. No se pudo obtener el ID del producto.`);
//                   }
                  
//                   // Show success toast notification with custom style
//                   toast.success(`Producto "${formData.nombre.trim()}" ${editingId ? 'actualizado' : 'creado'} con éxito`, {
//                     duration: 3000,
//                     position: "top-center",
//                     style: {
//                       background: '#10B981',
//                       color: 'white',
//                       padding: '16px',
//                       borderRadius: '8px',
//                     },
//                     iconTheme: {
//                       primary: 'white',
//                       secondary: '#10B981',
//                     },
//                   });
                  
//                   if (editingId) {
//                     // Update product in state
//                     setProductosConsumibles(prev => 
//                       prev.map(p => p.id === editingId ? {
//                         id: savedProduct.id,
//                         nombre: formData.nombre.trim(),
//                         unidadMedida: formData.unidadMedida.trim(),
//                         cantidadUnitaria: parsedCantidadUnitaria,
//                         precioPresentacion: parsedPrecioPresentacion,
//                         cantidadUtilizada: parsedCantidadUtilizada,
//                         cantidadActual: parsedCantidadUtilizada, // cantidadUtilizada es lo que queda en stock
//                         cantidadPorProducto: parsedCantidadPorProducto,
//                         minimo: parsedMinimo,
//                         valorUnitario: savedProduct.valor_unitario || (parsedCantidadUnitaria > 0 ? parsedPrecioPresentacion / parsedCantidadUnitaria : 0),
//                         valorUtilizado: savedProduct.valor_utilizado || 0,
//                         sitioReferencia: formData.sitioReferencia.trim()
//                       } : p)
//                     );
//                   } else {
//                     // Add new product to state
//                     setProductosConsumibles(prev => [...prev, {
//                       id: savedProduct.id,
//                       nombre: formData.nombre.trim(),
//                       unidadMedida: formData.unidadMedida.trim(),
//                       cantidadUnitaria: parsedCantidadUnitaria,
//                       precioPresentacion: parsedPrecioPresentacion,
//                       cantidadUtilizada: parsedCantidadUtilizada,
//                       cantidadActual: parsedCantidadUtilizada, // cantidadUtilizada es lo que queda en stock
//                       cantidadPorProducto: parsedCantidadPorProducto,
//                       minimo: parsedMinimo,
//                       valorUnitario: savedProduct.valor_unitario || (parsedCantidadUnitaria > 0 ? parsedPrecioPresentacion / parsedCantidadUnitaria : 0),
//                       valorUtilizado: savedProduct.valor_utilizado || 0,
//                       sitioReferencia: formData.sitioReferencia.trim()
//                     }]);
//                   }
                  
//                   // Clear form and editing state
//                   setFormData({ 
//                     nombre: '', 
//                     unidadMedida: '', 
//                     cantidadUnitaria: '', 
//                     precioPresentacion: '', 
//                     cantidadUtilizada: '', 
//                     cantidadPorProducto: '',
//                     minimo: '', 
//                     sitioReferencia: '',
//                     valorUnitarioCalculado: '0',
//                     valorUtilizadoCalculado: '0'
//                   });
//                   setEditingId(null);
                  
//                   // Refresh the products list from the server to ensure we have the latest data
//                   const loadInitialData = async () => {
//                     const catMap = await fetchCategories();
//                     await fetchProducts(catMap);
//                   };
                  
//                   await loadInitialData();
//                 });
//               } catch (err: any) {
//                 setError(err.message || `Error al ${editingId ? 'actualizar' : 'crear'} producto`);
                
//                 // Show error toast notification with custom style
//                 toast.error(err.message || `Error al ${editingId ? 'actualizar' : 'crear'} producto`, {
//                   duration: 4000,
//                   position: "top-center",
//                   style: {
//                     background: '#EF4444',
//                     color: 'white',
//                     padding: '16px',
//                     borderRadius: '8px',
//                   },
//                   iconTheme: {
//                     primary: 'white',
//                     secondary: '#EF4444',
//                   },
//                 });
//               }
//             })();
//           }}>
//             {editingId ? (
//               <>
//                 <Edit className="h-4 w-4 mr-2" />
//                 Actualizar Producto
//               </>
//             ) : (
//               <>
//                 <Plus className="h-4 w-4 mr-2" />
//                 Agregar Producto
//               </>
//             )}
//           </Button>
//         </div>
//       </Card>

//       <Card className="overflow-hidden">
//         <div className="p-6">
//           <h2 className="text-xl font-semibold text-gray-900 mb-4">
//             Listado de Productos ({productosConsumibles.length})
//           </h2>

//           <input
//             type="text"
//             id="search"
//             className="block w-full md:w-1/3 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             value={searchTerm}
//             onChange={handleSearchChange}
//             placeholder="Buscar por nombre..."
//           />
//         </div>

//         {loadingProducts ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="flex flex-col items-center">
//               <Loader2 className="h-8 w-8 text-gray-500 mb-4 animate-spin" />
//               <p className="text-gray-500">Cargando productos...</p>
//             </div>
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <div className="text-center py-8 text-gray-500 p-6">
//             No hay productos registrados. Agrega uno para comenzar.
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Nombre
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Unidad
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Presentación
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Precio Presentación
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Stock Disponible
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Valor Unitario
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Cant. por Producto
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Stock Mínimo
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Estado de Stock
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Proveedor
//                   </th>
//                   <th className="p-4 text-left font-semibold text-gray-600">
//                     Acciones
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentProducts.map((producto, index) => (
//                   <tr key={producto.id} className={`border-t border-gray-200 ${index % 2 !== 0 ? 'bg-gray-50' : ''}`}>
//                     <td className="p-4 font-medium text-gray-900">
//                       {producto.nombre}
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       {producto.unidadMedida}
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       {producto.cantidadUnitaria} {producto.unidadMedida}
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       ${formatCurrencyWithoutTrailingZeros(producto.precioPresentacion)}
//                     </td>
//                     <td className={`p-4 ${(producto.cantidadUnitaria - producto.cantidadUtilizada) <= producto.minimo ? 'font-medium text-amber-700' : 'text-gray-700'}`}>
//                       {producto.cantidadUnitaria - producto.cantidadUtilizada} {producto.unidadMedida}
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       ${formatCurrencyWithoutTrailingZeros(producto.valorUnitario)}
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       {producto.cantidadPorProducto} {producto.unidadMedida}
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       {producto.minimo} {producto.unidadMedida}
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       <div className="group relative cursor-help">
//                         {getStockAlertBadge(producto)}
//                         {(producto.cantidadUnitaria - producto.cantidadUtilizada) <= producto.minimo && (
//                           <div className="absolute z-10 hidden group-hover:block mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded shadow-lg">
//                             <p className="font-medium">Alerta de Stock</p>
//                             <p className="mt-1">El stock actual ({producto.cantidadUnitaria - producto.cantidadUtilizada} {producto.unidadMedida}) está por debajo del mínimo recomendado ({producto.minimo} {producto.unidadMedida}).</p>
//                             <p className="mt-1">Se recomienda reabastecer este producto.</p>
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       {producto.sitioReferencia}
//                     </td>
//                     <td className="p-4">
//                       <div className="flex space-x-2">
//                         <Button 
//                           size="sm" 
//                           onClick={() => handleEditProduct(producto)}
//                           title="Editar producto"
//                           variant="secondary"
//                         >
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button 
//                           variant="danger" 
//                           size="sm" 
//                           onClick={() => {
//             toast((t) => (
//               <div className="flex flex-col gap-2">
//                 <div className="text-sm font-medium">
//                   ¿Está seguro de eliminar {producto.nombre}?
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => {
//                               handleDeleteProduct(producto.id);
//                       toast.dismiss(t.id);
//                     }}
//                     className="bg-red-600 text-white px-3 py-1 rounded-md text-xs"
//                   >
//                     Eliminar
//                   </button>
//                   <button
//                     onClick={() => toast.dismiss(t.id)}
//                     className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs"
//                   >
//                     Cancelar
//                   </button>
//                 </div>
//               </div>
//             ), {
//               duration: 6000,
//               position: "top-center",
//             });
//                           }}
//                           title="Eliminar producto"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {filteredProducts.length > productsPerPage && (
//           <div className="p-4 border-t border-gray-200 flex justify-center">
//             <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
//               <Button
//                 onClick={() => paginate(currentPage - 1)}
//                 disabled={currentPage === 1}
//                 variant="default"
//                 size="sm"
//                 className="rounded-l-md"
//               >
//                 Anterior
//               </Button>
//               {[...Array(totalPages)].map((_, index) => (
//                 <Button
//                   key={index}
//                   onClick={() => paginate(index + 1)}
//                   variant={currentPage === index + 1 ? "default" : "default"}
//                   size="sm"
//                   className="-ml-px"
//                 >
//                   {index + 1}
//                 </Button>
//               ))}
//               <Button
//                 onClick={() => paginate(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//                 variant="default"
//                 size="sm"
//                 className="rounded-r-md"
//               >
//                 Siguiente
//               </Button>
//             </nav>
//           </div>
//         )}
//       </Card>
      
//       {/* Add Toaster component for toast notifications */}
//       <Toaster />
//     </div>
//   );
// }