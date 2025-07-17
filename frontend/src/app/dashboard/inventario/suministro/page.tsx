'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { getAuthHeaders, isAuthenticated } from '../../../utils/auth';
import { useRouter } from 'next/navigation';
import { log } from 'console';

interface ConsumableProduct {
  id: number;
  nombre: string;
  tipo: string; // Keeping this to maintain compatibility with existing data structure
  unidadMedida: string;
  cantidad: number;
  minimo: number;
  estado: 'bien' | 'alerta' | 'critico';
  valorUnitario: number;
  valorUnitarioxUnidad: number;
  sitioReferencia: string;
}

interface ProductFormData {
  nombre: string;
  unidadMedida: string;
  cantidad: string;
  minimo: string;
  valorUnitario: string;
  valorUnitarioxUnidad: string;
  sitioReferencia: string;
}

interface Category {
  id: number;
  nombre_categoria: string;
}

interface ApiProduct {
  id: number;
  nombre_insumo: string;
  // price: number;
  // category_id: number;
  unidad: string;
  cantidad_actual: number;
  stock_minimo: number;
  valor_unitario: number;
  valor_unitarioxunidad: number;
  sitio_referencia: string;
}

// Default categories for fallback
// const DEFAULT_CATEGORIES = [
//   { id: 1, name: 'Consumible' },
//   { id: 2, name: 'No consumible' },
//   { id: 3, name: 'Bebidas' },
//   { id: 4, name: 'Alimentos' },
//   { id: 5, name: 'Desechables' }
// ];

export default function SuministroPage() {
  const router = useRouter();
  
  const [productosConsumibles, setProductosConsumibles] = useState<ConsumableProduct[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    nombre: '',
    unidadMedida: '',
    cantidad: '',
    minimo: '',
    valorUnitario: '',
    valorUnitarioxUnidad: '',
    sitioReferencia: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 5;
  
  // States for API integration
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

  // Función para calcular el estado basado en cantidad y mínimo
  const calculateEstado = useCallback((cantidad: number, minimo: number): ConsumableProduct['estado'] => {
    if (cantidad <= minimo) return 'critico';
    if (cantidad <= minimo * 1.5) return 'alerta';
    return 'bien';
  }, []);

  // Extract fetch functions outside useEffect for reuse
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const headers = getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND;
      
      if (!apiUrl) {
        console.error('NEXT_PUBLIC_BACKEND environment variable is not defined');
        throw new Error('Error de configuración: URL del backend no definida');
      }
      
      console.log('Fetching categories from:', `${apiUrl}/api/v1/categories`);
      
      const response = await fetch(`${apiUrl}/api/v1/categories`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Categories fetched:', data); // Debug log
      
      // Check if data is an array or has a specific property containing categories
      let categoriesData = data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // If data is an object, try to find an array property
        const possibleArrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (possibleArrayProps.length > 0) {
          categoriesData = data[possibleArrayProps[0]];
          console.log('Found categories in property:', possibleArrayProps[0]);
        }
      }
      
      if (!Array.isArray(categoriesData) || categoriesData.length === 0) {
        console.error('Categories data is not an array or is empty:', categoriesData);
        console.log('No categories found in API response');
        categoriesData = [];
      }
      
      // Normalize category objects to ensure they have id and nombre_categoria properties
      const normalizedCategories = categoriesData.map((cat: any) => {
        return {
          id: cat.id || cat.category_id || cat.categoryId || 0,
          nombre_categoria: cat.nombre_categoria || cat.name || cat.category_name || cat.categoryName || cat.nombre || 'Categoría sin nombre'
        };
      });
      
      console.log('Normalized categories:', normalizedCategories);
      setCategories(normalizedCategories);
      
      // Create a map of category id to name for easy lookup
      const catMap: Record<number, string> = {};
      normalizedCategories.forEach((cat: Category) => {
        catMap[cat.id] = cat.nombre_categoria;
      });
      console.log('Category map created:', catMap); // Debug log
      setCategoryMap(catMap);
      return catMap; // Return the map for use in fetchProducts
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Error al cargar categorías');
      
      // Create empty map in case of error
      setCategories([]);
      setCategoryMap({});
      return {};
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchProducts = useCallback(async (categoryMapping: Record<number, string>) => {
    setLoadingProducts(true);
    
    try {
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
      
      // Transform API products to our ConsumableProduct format
      const transformedProducts: ConsumableProduct[] = data.map((product: ApiProduct) => {
        const estado = calculateEstado(product.cantidad_actual, product.stock_minimo);
        return {
          id: product.id,
          nombre: product.nombre_insumo,
          // tipo: categoryMapping[product.category_id] || `Categoría ${product.category_id}`,
          unidadMedida: product.unidad || 'unidad (u)',
          cantidad: product.cantidad_actual,
          minimo: product.stock_minimo,
          estado,
          valorUnitario: product.valor_unitario || 0,
          valorUnitarioxUnidad: product.valor_unitarioxunidad || 0,
          sitioReferencia: product.sitio_referencia || ''
        };
      });
      
      setProductosConsumibles(transformedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(prev => prev || err.message || 'Error al cargar productos');
    } finally {
      setLoadingProducts(false);
    }
  }, [calculateEstado]);

  // Fetch categories and products on component mount
  useEffect(() => {
    fetchCategories().then(catMap => fetchProducts(catMap));
  }, [fetchCategories, fetchProducts]);
  
  // Handler to manually refresh categories
  const handleRefreshCategories = async () => {
    await fetchCategories();
  };

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [router]);

  // Add a function to format currency values
  const formatCurrency = useCallback((value: string): string => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (!numericValue) return '';
    
    // Convert to number and format with thousands separators
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('es-CO');
  }, []);

  // Add a function to format currency without unnecessary trailing zeros
  const formatCurrencyWithoutTrailingZeros = useCallback((value: number): string => {
    if (value === 0) return '0';
    
    // Format with thousands separators
    const formatted = value.toLocaleString('es-CO');
    
    // For integers, keep the format as is (with thousands separators)
    // Only remove trailing zeros after decimal point if they exist
    if (formatted.includes(',')) {
      // If there's a decimal part
      return formatted.replace(/,0+$/, ''); // Only remove trailing zeros after decimal
    }
    
    // For integers, just return the formatted number
    return formatted;
  }, []);

  // Add a function to parse formatted currency back to number string
  const parseCurrency = useCallback((formattedValue: string): string => {
    // Remove all non-numeric characters
    return formattedValue.replace(/[^0-9]/g, '');
  }, []);

  // Modify handleChange to handle currency formatting
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    
    if (id === 'valorUnitario') {
      // Format the currency value
      const formattedValue = formatCurrency(value);
      const numericValue = parseCurrency(value);
      
      setFormData((prev) => ({
        ...prev,
        [id]: formattedValue,
        // Store the numeric value for calculations
        [`${id}Numeric`]: numericValue
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    }
  }, [formatCurrency, parseCurrency]);

  // Update the useEffect to use numeric values for calculation
  useEffect(() => {
    // Only calculate if both fields have values
    if (formData.cantidad && formData.valorUnitario) {
      const cantidad = parseFloat(formData.cantidad);
      const valorUnitario = parseFloat(parseCurrency(formData.valorUnitario));
      
      if (!isNaN(cantidad) && !isNaN(valorUnitario)) {
        const total = cantidad * valorUnitario;
        
        // Format the total for display without trailing zeros
        setFormData(prev => ({
          ...prev,
          valorUnitarioxUnidad: formatCurrencyWithoutTrailingZeros(total)
        }));
      }
    }
  }, [formData.cantidad, formData.valorUnitario, parseCurrency, formatCurrencyWithoutTrailingZeros]);

  // Optimización: useCallback para evitar re-renders innecesarios
  const handleAddOrUpdateProduct = useCallback(async () => {
    const parsedCantidad = formData.cantidad === '' ? 0 : parseInt(formData.cantidad);
    const parsedMinimo = formData.minimo === '' ? 0 : parseInt(formData.minimo);
    const parsedValorUnitario = formData.valorUnitario === '' ? 0 : parseInt(parseCurrency(formData.valorUnitario));
    const parsedValorUnitarioxUnidad = formData.valorUnitarioxUnidad === '' ? 0 : parseInt(parseCurrency(formData.valorUnitarioxUnidad));
    
    if (!formData.nombre.trim() || !formData.unidadMedida.trim() || 
        (formData.cantidad !== '' && (isNaN(parsedCantidad) || parsedCantidad < 0)) ||
        (formData.minimo !== '' && (isNaN(parsedMinimo) || parsedMinimo < 0)) ||
        (formData.valorUnitario !== '' && (isNaN(parsedValorUnitario) || parsedValorUnitario < 0))) {
      alert('Por favor, complete todos los campos obligatorios y asegúrese de que las cantidades sean números válidos.');
      return;
    }

    setLoading(true);
    
    try {
      const headers = getAuthHeaders();
      
      const productData = {
        nombre_insumo: formData.nombre.trim(),
        unidad: formData.unidadMedida.trim(),
        cantidad_actual: parsedCantidad,
        stock_minimo: parsedMinimo,
        valor_unitario: parsedValorUnitario,
        valor_unitarioxunidad: parsedValorUnitarioxUnidad,
        sitio_referencia: formData.sitioReferencia.trim()
      };
      
      let response;
      console.log(productData);
      
      if (editingId) {
        // Update existing product
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/insumos/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
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
      console.log('API response for product creation/update:', savedProduct);
      
      if (!savedProduct || typeof savedProduct !== 'object') {
        throw new Error(`Error al ${editingId ? 'actualizar' : 'crear'} producto. Respuesta inválida del servidor.`);
      }
      
      if (!savedProduct.id) {
        throw new Error(`Error al ${editingId ? 'actualizar' : 'crear'} producto. No se pudo obtener el ID del producto.`);
      }
      
      const estado = calculateEstado(parsedCantidad, parsedMinimo);
      
      if (editingId) {
        // Update product in state
        setProductosConsumibles(prev => 
          prev.map(p => p.id === editingId ? {
            id: savedProduct.id,
            nombre: formData.nombre.trim(),
            tipo: '', // Set empty as we removed the field
            unidadMedida: formData.unidadMedida.trim(),
            cantidad: parsedCantidad,
            minimo: parsedMinimo,
            estado,
            valorUnitario: parsedValorUnitario,
            valorUnitarioxUnidad: parsedValorUnitarioxUnidad,
            sitioReferencia: formData.sitioReferencia.trim()
          } : p)
        );
      } else {
        // Add new product to state
        setProductosConsumibles(prev => [...prev, {
          id: savedProduct.id,
          nombre: formData.nombre.trim(),
          tipo: '', // Set empty as we removed the field
          unidadMedida: formData.unidadMedida.trim(),
          cantidad: parsedCantidad,
          minimo: parsedMinimo,
          estado,
          valorUnitario: parsedValorUnitario,
          valorUnitarioxUnidad: parsedValorUnitarioxUnidad,
          sitioReferencia: formData.sitioReferencia.trim()
        }]);
      }
      
      // Clear form and editing state
      setFormData({ nombre: '', unidadMedida: '', cantidad: '', minimo: '', valorUnitario: '', valorUnitarioxUnidad: '', sitioReferencia: '' });
      setEditingId(null);
      
      // Refresh the products list from the server to ensure we have the latest data
      const catMap = await fetchCategories();
      await fetchProducts(catMap);
      
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || `Error al ${editingId ? 'actualizar' : 'crear'} producto`);
      
      // Show alert for better visibility of the error
      alert(`Error: ${err.message || `Error al ${editingId ? 'actualizar' : 'crear'} producto`}`);
    } finally {
      setLoading(false);
    }
  }, [formData, editingId, categories, calculateEstado, parseCurrency]);

  const handleEditProduct = useCallback((producto: ConsumableProduct) => {
    setFormData({ 
      nombre: producto.nombre,
      unidadMedida: producto.unidadMedida,
      cantidad: String(producto.cantidad),
      minimo: String(producto.minimo),
      valorUnitario: formatCurrencyWithoutTrailingZeros(producto.valorUnitario),
      valorUnitarioxUnidad: formatCurrencyWithoutTrailingZeros(producto.valorUnitarioxUnidad),
      sitioReferencia: producto.sitioReferencia
    });
    setEditingId(producto.id);
  }, [formatCurrencyWithoutTrailingZeros]);

  const handleDeleteProduct = useCallback(async (id: number) => {
    try {
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
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Error al eliminar producto');
    }
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setFormData({ nombre: '', unidadMedida: '', cantidad: '', minimo: '', valorUnitario: '', valorUnitarioxUnidad: '', sitioReferencia: '' });
    setEditingId(null);
  }, []);

  // Optimización: Memoizar componentes para evitar re-renders
  const Card = useMemo(() => ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
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

  const Badge = useMemo(() => ({ children, variant = "default", size = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "info" | "warning" | "danger"; size?: "default" | "lg" }) => {
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
  }, []);

  const getStockAlertBadge = useMemo(() => (estado: ConsumableProduct['estado']) => {
    switch (estado) {
      case 'bien':
        return <Badge variant="success">Stock OK</Badge>;
      case 'alerta':
        return <Badge variant="warning">Alerta</Badge>;
      case 'critico':
        return <Badge variant="danger">Crítico</Badge>;
      default:
        return null;
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

  // Calcular productos para la página actual
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = useMemo(() => filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct), [filteredProducts, indexOfFirstProduct, indexOfLastProduct]);

  // Cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Suministros</h1>
      
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
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad *
            </label>
            <input
              type="number"
              id="cantidad"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.cantidad}
              onChange={handleChange}
              placeholder="Ej: 50"
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="minimo" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Mínimo *
            </label>
            <input
              type="number"
              id="minimo"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.minimo}
              onChange={handleChange}
              placeholder="Ej: 10"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="valorUnitario" className="block text-sm font-medium text-gray-700 mb-1">
              Valor Unitario
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 text-base">$</span>
              </div>
              <input
                type="text"
                id="valorUnitario"
                className="block w-full rounded-md border-gray-300 pl-7 pr-16 py-3 text-base focus:border-blue-500 focus:ring-blue-500"
                value={formData.valorUnitario}
                onChange={handleChange}
                placeholder="0"
                aria-describedby="price-currency"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 text-base" id="price-currency">COP</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="valorUnitarioxUnidad" className="block text-sm font-medium text-gray-700 mb-1">
              Valor Total
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 text-base">$</span>
              </div>
              <input
                type="text"
                id="valorUnitarioxUnidad"
                className="block w-full rounded-md border-gray-300 pl-7 pr-16 py-3 bg-gray-50 text-base focus:border-blue-500 focus:ring-blue-500"
                value={formData.valorUnitarioxUnidad}
                placeholder="Calculado automáticamente"
                readOnly
                aria-describedby="total-currency"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 text-base" id="total-currency">COP</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="sitioReferencia" className="block text-sm font-medium text-gray-700 mb-1">
              Sitio de Referencia
            </label>
            <input
              type="text"
              id="sitioReferencia"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.sitioReferencia}
              onChange={handleChange}
              placeholder="Ej: Proveedor ABC"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <Button variant="secondary" onClick={handleCancelEdit}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleAddOrUpdateProduct} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editingId ? 'Actualizando...' : 'Agregando...'}
              </>
            ) : editingId ? (
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

      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Listado de Productos ({productosConsumibles.length})
          </h2>

          <input
            type="text"
            id="search"
            className="block w-full md:w-1/3 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre..."
          />
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
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Nombre
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Unidad
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Cantidad
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Mínimo
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Estado
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Valor Unitario
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Valor Total
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Proveedor
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((producto, index) => (
                  <tr key={producto.id} className={`border-t border-gray-200 ${index % 2 !== 0 ? 'bg-gray-50' : ''}`}>
                    <td className="p-4 font-medium text-gray-900">
                      {producto.nombre}
                    </td>
                    <td className="p-4 text-gray-700">
                      {producto.unidadMedida}
                    </td>
                    <td className="p-4 text-gray-700">
                      {producto.cantidad}
                    </td>
                    <td className="p-4 text-gray-700">
                      {producto.minimo}
                    </td>
                    <td className="p-4">
                      {getStockAlertBadge(producto.estado)}
                    </td>
                    <td className="p-4 text-gray-700">
                      ${formatCurrencyWithoutTrailingZeros(producto.valorUnitario)}
                    </td>
                    <td className="p-4 text-gray-700">
                      ${formatCurrencyWithoutTrailingZeros(producto.valorUnitarioxUnidad)}
                    </td>
                    <td className="p-4 text-gray-700">
                      {producto.sitioReferencia}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditProduct(producto)}
                          title="Editar producto"
                          variant="secondary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar ${producto.nombre}?`)) {
                              handleDeleteProduct(producto.id);
                            }
                          }}
                          title="Eliminar producto"
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
        )}

        {filteredProducts.length > productsPerPage && (
          <div className="p-4 border-t border-gray-200 flex justify-center">
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                variant="default"
                size="sm"
                className="rounded-l-md"
              >
                Anterior
              </Button>
              {[...Array(totalPages)].map((_, index) => (
                <Button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  variant={currentPage === index + 1 ? "default" : "default"}
                  size="sm"
                  className="-ml-px"
                >
                  {index + 1}
                </Button>
              ))}
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="default"
                size="sm"
                className="rounded-r-md"
              >
                Siguiente
              </Button>
            </nav>
          </div>
        )}
      </Card>
    </div>
  );
}