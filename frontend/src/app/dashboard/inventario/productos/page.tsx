"use client"
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Card, Button } from '../../../../../components/ui'; // Adjust path as needed
import { getAuthHeaders } from '../../../utils/auth';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table';

interface Categoria {
  id: number;
  nombre_categoria: string;
}

interface ConsumableItem {
  id: number;
  nombre: string;
  unidadMedida: string;
  cantidad_utilizada?: number;
}

interface ProductRecipeItem {
  consumableId: number;
  quantity: number;
}

interface Producto {
  id: number;
  nombre_producto: string;
  variante: string | null;
  price: number;
  category_id: number | null;
  created_at: string;
  receta: ProductRecipeItem[];
  categoria_nombre?: string;
  stock_quantity?: number;
}

interface ProductoFormData {
  nombre_producto: string;
  variante: string;
  precio: string;
  id_categoria: string;
}

const columnHelper = createColumnHelper<Producto>();

export default function ProductsPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formData, setFormData] = useState<ProductoFormData>({
    nombre_producto: '',
    variante: '',
    precio: '',
    id_categoria: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableConsumables, setAvailableConsumables] = useState<ConsumableItem[]>([]);
  const [currentProductRecipe, setCurrentProductRecipe] = useState<ProductRecipeItem[]>([]);
  const [newRecipeItem, setNewRecipeItem] = useState<{ consumableId: string; quantity: string }>({ consumableId: '', quantity: '' });
  const [displayPrice, setDisplayPrice] = useState<string>('');

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState('');

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }, []);

  const formatDateToDDMMYYYY = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const getCategoryName = useCallback((id: number | null) => {
    const category = categorias.find(cat => cat.id === id);
    return category ? category.nombre_categoria : 'N/A';
  }, [categorias]);

  // Define columns
  const columns = useMemo(() => [
    columnHelper.accessor('nombre_producto', {
      header: 'Nombre',
      cell: info => info.getValue(),
      enableSorting: true,
    }),
    columnHelper.accessor('variante', {
      header: 'Variante',
      cell: info => info.getValue() || 'N/A',
      enableSorting: true,
    }),
    columnHelper.accessor('price', {
      header: 'Precio',
      cell: info => formatPrice(info.getValue()),
      enableSorting: true,
    }),
    columnHelper.accessor('categoria_nombre', {
      header: 'Categoría',
      cell: info => info.getValue() || getCategoryName(info.row.original.category_id),
      enableSorting: true,
    }),
    columnHelper.accessor('stock_quantity', {
      header: 'Stock',
      cell: info => info.getValue() !== undefined ? info.getValue() : 'N/A',
      enableSorting: true,
    }),
    columnHelper.accessor('created_at', {
      header: 'Creado En',
      cell: info => mounted && info.getValue() ? formatDateToDDMMYYYY(info.getValue()) : 'N/A',
      enableSorting: true,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => handleEditProducto(row.original)}
            title="Editar producto"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteProducto(row.original.id)}
            title="Eliminar producto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }),
  ], [formatPrice, getCategoryName, mounted, formatDateToDDMMYYYY]);

  // Create table instance
  const table = useReactTable({
    data: productos,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false,
  });

  // Fetch functions (keeping existing logic)
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://127.0.0.1:8052';
      
      const response = await fetch(`${apiUrl}/api/v1/categories`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCategorias(data);
      
      if (data.length > 0 && formData.id_categoria === '') {
        setFormData(prev => ({ ...prev, id_categoria: String(data[0].id) }));
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(`Error al cargar categorías: ${err.message}`);
    }
  }, [formData.id_categoria]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://127.0.0.1:8052';
      
      const response = await fetch(`${apiUrl}/api/v1/products`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProductos(data.map((product: any) => ({
        id: product.id,
        nombre_producto: product.nombre_producto,
        variante: product.variante || '',
        price: product.price,
        category_id: product.category_id,
        created_at: product.created_at,
        categoria_nombre: product.categoria_nombre,
        stock_quantity: product.stock_quantity,
        receta: []
      })));
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(`Error al cargar productos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConsumables = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://127.0.0.1:8052';
      
      const response = await fetch(`${apiUrl}/api/v1/insumos`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAvailableConsumables(data.map((item: any) => ({
        id: item.id,
        nombre: item.nombre_insumo,
        unidadMedida: item.unidad || 'unidad (u)',
        cantidad_utilizada: item.cantidad_utilizada || 0
      })));
    } catch (err: any) {
      console.error('Error fetching consumables:', err);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCategories();
        await fetchProducts();
        await fetchConsumables();
      } finally {
        setMounted(true);
      }
    };
    
    loadData();
  }, [fetchCategories, fetchProducts, fetchConsumables]);

  // Form handlers (keeping existing logic)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  const handlePriceInputFocus = useCallback(() => {
    const rawValue = formData.precio;
    setDisplayPrice(rawValue);
  }, [formData.precio]);

  const handlePriceInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayPrice(inputValue);
  }, []);

  const handlePriceInputBlur = useCallback(() => {
    const rawInputForProcessing = displayPrice;
    const cleanedForInternalState = rawInputForProcessing.replace(/[^0-9.,]/g, '');
    const standardizedValue = cleanedForInternalState.replace(/,/g, '.');

    setFormData(prev => ({ ...prev, precio: standardizedValue }));

    const numericPrice = parseFloat(standardizedValue);
    if (!isNaN(numericPrice) && standardizedValue.trim() !== '') {
      setDisplayPrice(formatPrice(numericPrice));
    } else {
      setDisplayPrice('');
      setFormData(prev => ({ ...prev, precio: '' }));
    }
  }, [displayPrice, formatPrice]);

  const handleNewRecipeItemChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    
    // Auto-complete quantity when consumable is selected
    const selectedConsumable = availableConsumables.find(c => c.id === parseInt(value));
    setNewRecipeItem((prev) => ({
      ...prev,
      consumableId: value,
      quantity: selectedConsumable ? String(selectedConsumable.cantidad_utilizada || '') : '',
    }));
  }, [availableConsumables]);

  const handleAddRecipeItem = useCallback(() => {
    const parsedConsumableId = parseInt(newRecipeItem.consumableId);
    const parsedQuantity = parseFloat(newRecipeItem.quantity);

    if (isNaN(parsedConsumableId) || parsedConsumableId <= 0 || isNaN(parsedQuantity) || parsedQuantity <= 0) {
      alert('Por favor, seleccione un insumo y especifique una cantidad válida.');
      return;
    }

    const existingItem = currentProductRecipe.find(item => item.consumableId === parsedConsumableId);
    if (existingItem) {
      alert('Este insumo ya ha sido agregado a la receta.');
      return;
    }

    setCurrentProductRecipe((prev) => [...prev, { consumableId: parsedConsumableId, quantity: parsedQuantity }]);
    setNewRecipeItem({ consumableId: '', quantity: '' });
  }, [newRecipeItem, currentProductRecipe]);

  const handleRemoveRecipeItem = useCallback((consumableIdToRemove: number) => {
    setCurrentProductRecipe((prev) => prev.filter(item => item.consumableId !== consumableIdToRemove));
  }, []);

  const handleAddOrUpdateProducto = useCallback(async () => {
    const parsedPrecio = parseFloat(formData.precio);
    const parsedIdCategoria = formData.id_categoria === '' ? null : parseInt(formData.id_categoria);

    if (!formData.nombre_producto.trim() || isNaN(parsedPrecio) || parsedPrecio <= 0 || (formData.id_categoria !== '' && isNaN(parsedIdCategoria!))) {
      alert('Por favor, complete todos los campos obligatorios y asegúrese de que el precio y la categoría sean válidos.');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://127.0.0.1:8052';
      const headers = getAuthHeaders();
      
      const productData = {
        nombre_producto: formData.nombre_producto.trim(),
        variante: formData.variante.trim() || null,
        price: parsedPrecio,
        category_id: parsedIdCategoria,
        stock_quantity: 0,
        min_stock: 5
      };
      
      if (editingId) {
        const response = await fetch(`${apiUrl}/api/v1/products/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
        
        if (currentProductRecipe.length > 0) {
          const recipeResponse = await fetch(`${apiUrl}/api/v1/recipes/${editingId}/recipe`, {
            method: 'POST',
            headers,
            body: JSON.stringify(currentProductRecipe.map(item => ({
              insumo_id: item.consumableId,
              cantidad: item.quantity
            })))
          });
          
          if (!recipeResponse.ok) {
            console.error('Error adding recipe to product');
          }
        }
        
        alert('Producto actualizado exitosamente');
      } else {
        const response = await fetch(`${apiUrl}/api/v1/products`, {
          method: 'POST',
          headers,
          body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const newProductId = result.id;
        
        if (newProductId && currentProductRecipe.length > 0) {
          const recipeResponse = await fetch(`${apiUrl}/api/v1/recipes/${newProductId}/recipe`, {
            method: 'POST',
            headers,
            body: JSON.stringify(currentProductRecipe.map(item => ({
              insumo_id: item.consumableId,
              cantidad: item.quantity
            })))
          });
          
          if (!recipeResponse.ok) {
            console.error('Error adding recipe to product');
          }
        }
        
        alert('Producto creado exitosamente');
      }
      
      setEditingId(null);
      setShowAddForm(false);
      setFormData({ nombre_producto: '', variante: '', precio: '', id_categoria: String(categorias[0]?.id || '') });
      setCurrentProductRecipe([]);
      setDisplayPrice('');
      
      await fetchProducts();
      
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert(`Error al guardar el producto: ${err.message}`);
    }
  }, [formData, editingId, currentProductRecipe, categorias, fetchProducts]);

  const handleEditProducto = useCallback((producto: Producto) => {
    setFormData({
      nombre_producto: producto.nombre_producto,
      variante: producto.variante || '',
      precio: String(producto.price),
      id_categoria: String(producto.category_id || ''),
    });
    setDisplayPrice(formatPrice(producto.price));
    setCurrentProductRecipe(producto.receta || []);
    setEditingId(producto.id);
    setShowAddForm(true);
  }, [formatPrice]);

  const handleDeleteProducto = useCallback(async (id: number) => {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://127.0.0.1:8052';
        const headers = getAuthHeaders();
        
        const response = await fetch(`${apiUrl}/api/v1/products/${id}`, {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
        
        setProductos((prev) => prev.filter((p) => p.id !== id));
        alert('Producto eliminado exitosamente');
      } catch (err: any) {
        console.error('Error deleting product:', err);
        alert(`Error al eliminar el producto: ${err.message}`);
      }
    }
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ nombre_producto: '', variante: '', precio: '', id_categoria: String(categorias[0]?.id || '') });
    setCurrentProductRecipe([]);
    setDisplayPrice('');
  }, [categorias]);

  const handleRefresh = useCallback(async () => {
    setError(null);
    try {
      await fetchProducts();
      await fetchCategories();
      await fetchConsumables();
    } catch (err: any) {
      setError(`Error al actualizar datos: ${err.message}`);
    }
  }, [fetchProducts, fetchCategories, fetchConsumables]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Productos</h1>

      <div className="mb-8 flex justify-between">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Nuevo Producto
        </Button>
        
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {showAddForm && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="nombre_producto" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre_producto"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.nombre_producto}
                onChange={handleChange}
                placeholder="Ej: Waffle, Jugo, etc."
              />
            </div>
            <div>
              <label htmlFor="variante" className="block text-sm font-medium text-gray-700 mb-1">
                Variante
              </label>
              <input
                type="text"
                id="variante"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.variante}
                onChange={handleChange}
                placeholder="Ej: CON HELADO, SIN HELADO"
              />
            </div>
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">
                Precio (COP) *
              </label>
              <input
                type="text"
                id="precio"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={displayPrice}
                onChange={handlePriceInputChange}
                onBlur={handlePriceInputBlur}
                onFocus={handlePriceInputFocus}
                placeholder="Ej: $ 22.000,00"
              />
            </div>
            <div>
              <label htmlFor="id_categoria" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría (ID) *
              </label>
              <select
                id="id_categoria"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.id_categoria}
                onChange={handleChange}
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map(cat => (
                  console.log(" #ID DEL PRODUCTO: ", cat.id),
                  <option key={cat.id} value={cat.id}>{cat.nombre_categoria}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Insumos Necesarios (Receta)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="consumableId" className="block text-sm font-medium text-gray-700 mb-1">
                  Insumo
                </label>
                <select
                  id="consumableId"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newRecipeItem.consumableId}
                  onChange={handleNewRecipeItemChange}
                >
                  <option value="">Seleccione un insumo</option>
                  {availableConsumables.map(consumable => (
                    <option key={consumable.id} value={consumable.id}>
                      {consumable.nombre} - ({consumable.unidadMedida}) - #️⃣{consumable.cantidad_utilizada}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad (Predefinida)
                </label>
                <input
                  type="number"
                  id="quantity"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                  value={newRecipeItem.quantity}
                  placeholder={newRecipeItem.consumableId ? "Cantidad automática del insumo" : "Seleccione primero un insumo"}
                  readOnly
                  disabled={!newRecipeItem.consumableId}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newRecipeItem.consumableId ? "Cantidad predefinida del insumo. No se puede modificar." : "La cantidad se completará automáticamente al seleccionar un insumo"}
                </p>
              </div>

              <div className="flex items-end justify-end">
                <Button 
                  onClick={handleAddRecipeItem} 
                  className="w-full md:w-auto"
                  disabled={!newRecipeItem.consumableId || !newRecipeItem.quantity || parseFloat(newRecipeItem.quantity) <= 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Insumo
                </Button>
              </div>
            </div>

            {currentProductRecipe.length > 0 && (
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="text-md font-medium text-gray-800 mb-2">Insumos Agregados:</h4>
                <ul className="space-y-2">
                  {currentProductRecipe.map(item => {
                    const consumable = availableConsumables.find(c => c.id === item.consumableId);
                    return (
                      <li key={item.consumableId} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                        <span>
                          {consumable?.nombre || 'Insumo Desconocido'} ({item.quantity} {consumable?.unidadMedida || ''})
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveRecipeItem(item.consumableId)}
                          title="Eliminar insumo de la receta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            {editingId && (
              <Button variant="secondary" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
            <Button onClick={handleAddOrUpdateProducto}>
              {editingId ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
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
      )}

      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Listado de Productos ({productos.length})
            </h2>
            
            {/* Global Search */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay productos registrados. Agrega uno para comenzar.
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            className="sticky top-0 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none bg-gray-50"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center space-x-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {({ asc: '🔼', desc: '🔽' }[header.column.getIsSorted() as string] ?? null)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50">
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {cell.getValue() as string}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginación de la tabla */}
              <div className="flex items-center justify-between py-2">
                <div className="text-sm text-gray-700">
                  Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
                <select
                  className="border rounded p-1 text-sm"
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize} por página
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
