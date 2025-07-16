"use client"
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Card, Button } from '../../../../../components/ui'; // Adjust path as needed

interface Categoria {
  id: number;
  nombre_categoria: string;
}

interface ConsumableItem {
  id: number;
  nombre: string;
  unidadMedida: string;
}

interface ProductRecipeItem {
  consumableId: number;
  quantity: number;
}

interface Producto {
  id: number;
  nombre_producto: string;
  variante: string;
  precio: number;
  id_categoria: number | null;
  creado_en: string; // Representing TIMESTAMP as string for now
  receta: ProductRecipeItem[]; // New field for recipe
}

interface ProductoFormData {
  nombre_producto: string;
  variante: string;
  precio: string; // Use string for input to handle decimal correctly
  id_categoria: string; // Use string for input
}

export default function ProductsPage() {
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, nombre_producto: 'Waffle Tradicional', variante: 'SIN HELADO', precio: 15000.00, id_categoria: 2, creado_en: '2023-01-15T10:00:00Z', receta: [{ consumableId: 4, quantity: 0.1 }] },
    { id: 2, nombre_producto: 'Waffle Especial', variante: 'CON HELADO', precio: 22000.00, id_categoria: 2, creado_en: '2023-01-15T10:30:00Z', receta: [{ consumableId: 4, quantity: 0.2 }, { consumableId: 3, quantity: 1 }] },
    { id: 3, nombre_producto: 'Jugo de Naranja', variante: '', precio: 5000.00, id_categoria: 1, creado_en: '2023-01-16T11:00:00Z', receta: [] },
    { id: 4, nombre_producto: 'Gaseosa Coca-Cola', variante: '', precio: 3000.00, id_categoria: 1, creado_en: '2023-01-16T11:15:00Z', receta: [] },
  ]);

  const [categorias, setCategorias] = useState<Categoria[]>([
    { id: 1, nombre_categoria: 'Bebidas' },
    { id: 2, nombre_categoria: 'Comida Rápida' },
    { id: 3, nombre_categoria: 'Postres' },
  ]);

  const [formData, setFormData] = useState<ProductoFormData>({
    nombre_producto: '',
    variante: '',
    precio: '',
    id_categoria: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [mounted, setMounted] = useState(false); // New state for client-side mounting

  const [availableConsumables, setAvailableConsumables] = useState<ConsumableItem[]>([
    { id: 1, nombre: 'VASOS X 16', unidadMedida: 'unidad (u)' },
    { id: 2, nombre: 'VASOS X 6', unidadMedida: 'unidad (u)' },
    { id: 3, nombre: 'PAQUETE DE SERVILLETAS X 50', unidadMedida: 'unidad (u)' },
    { id: 4, nombre: 'PAQUETES DE FRESAS', unidadMedida: 'kilogramo (kg)' },
  ]);

  const [currentProductRecipe, setCurrentProductRecipe] = useState<ProductRecipeItem[]>([]);
  const [newRecipeItem, setNewRecipeItem] = useState<{ consumableId: string; quantity: string }>({ consumableId: '', quantity: '' });
  const [displayPrice, setDisplayPrice] = useState<string>(''); // New state for formatted price input

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2, // Allow two decimal places
      maximumFractionDigits: 2,
    }).format(price);
  }, []);

  // Initialize form with default category if available
  useEffect(() => {
    if (categorias.length > 0 && formData.id_categoria === '') {
      setFormData(prev => ({ ...prev, id_categoria: String(categorias[0].id) }));
    }
    setMounted(true); // Set mounted to true after client-side hydration
  }, [categorias, formData.id_categoria]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  const handlePriceInputFocus = useCallback(() => {
    const rawValue = formData.precio; // Get the raw numeric string from formData
    setDisplayPrice(rawValue);
  }, [formData.precio]);

  const handlePriceInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayPrice(inputValue); // Display exactly what the user types
  }, []);

  const handlePriceInputBlur = useCallback(() => {
    // Get the raw input from displayPrice to process it
    const rawInputForProcessing = displayPrice;

    // Clean and standardize for internal state
    // Remove any characters that are not digits, commas, or dots
    const cleanedForInternalState = rawInputForProcessing.replace(/[^0-9.,]/g, '');
    // Replace commas with dots for consistent float parsing
    const standardizedValue = cleanedForInternalState.replace(/,/g, '.');

    // Update formData.precio with the standardized value
    setFormData(prev => ({ ...prev, precio: standardizedValue }));

    // Now format for display (only if it's a valid number)
    const numericPrice = parseFloat(standardizedValue);
    if (!isNaN(numericPrice) && standardizedValue.trim() !== '') {
      setDisplayPrice(formatPrice(numericPrice));
    } else {
      setDisplayPrice(''); // Clear display if not a valid number on blur
      setFormData(prev => ({ ...prev, precio: '' })); // Also clear raw data
    }
  }, [displayPrice, formatPrice]);

  const handleNewRecipeItemChange = useCallback((e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewRecipeItem((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

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

  const handleAddOrUpdateProducto = useCallback(() => {
    const parsedPrecio = parseFloat(formData.precio);
    const parsedIdCategoria = formData.id_categoria === '' ? null : parseInt(formData.id_categoria);

    if (!formData.nombre_producto.trim() || isNaN(parsedPrecio) || parsedPrecio <= 0 || (formData.id_categoria !== '' && isNaN(parsedIdCategoria!))) {
      alert('Por favor, complete todos los campos obligatorios y asegúrese de que el precio y la categoría sean válidos.');
      return;
    }

    if (editingId) {
      setProductos((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                nombre_producto: formData.nombre_producto.trim(),
                variante: formData.variante.trim(),
                precio: parsedPrecio,
                id_categoria: parsedIdCategoria,
                receta: currentProductRecipe, // Save the recipe
              }
            : p
        )
      );
      setEditingId(null);
    } else {
      const newId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
      setProductos((prev) => [
        ...prev,
        {
          id: newId,
          nombre_producto: formData.nombre_producto.trim(),
          variante: formData.variante.trim(),
          precio: parsedPrecio,
          id_categoria: parsedIdCategoria,
          creado_en: new Date().toISOString(), // Placeholder for creation timestamp
          receta: currentProductRecipe, // Save the recipe
        },
      ]);
      setShowAddForm(false);
    }
    setFormData({ nombre_producto: '', variante: '', precio: '', id_categoria: String(categorias[0]?.id || '') });
    setCurrentProductRecipe([]); // Clear recipe after add/update
    setDisplayPrice(''); // Clear display price after add/update
  }, [formData, editingId, productos, categorias, currentProductRecipe, displayPrice]);

  const handleEditProducto = useCallback((producto: Producto) => {
    setFormData({
      nombre_producto: producto.nombre_producto,
      variante: producto.variante,
      precio: String(producto.precio), // Convert number to string for formData
      id_categoria: String(producto.id_categoria || ''),
    });
    setDisplayPrice(String(producto.precio)); // Set raw price for display on edit
    setCurrentProductRecipe(producto.receta || []); // Populate recipe for editing
    setEditingId(producto.id);
    setShowAddForm(true); // Show form for editing
  }, []);

  const handleDeleteProducto = useCallback((id: number) => {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      setProductos((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ nombre_producto: '', variante: '', precio: '', id_categoria: String(categorias[0]?.id || '') });
    setCurrentProductRecipe([]); // Clear recipe on cancel
    setDisplayPrice(''); // Clear display price on cancel
  }, [categorias]);

  const getCategoryName = useCallback((id: number | null) => {
    const category = categorias.find(cat => cat.id === id);
    return category ? category.nombre_categoria : 'N/A';
  }, [categorias]);

  const formatDateToDDMMYYYY = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Productos</h1>

      <div className="mb-8 flex justify-start">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Nuevo Producto
        </Button>
      </div>

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
                      {consumable.nombre} ({consumable.unidadMedida})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Requerida
                </label>
                <input
                  type="number"
                  id="quantity"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newRecipeItem.quantity}
                  onChange={handleNewRecipeItemChange}
                  placeholder="Ej: 0.5, 1, 10"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex items-end justify-end">
                <Button onClick={handleAddRecipeItem} className="w-full md:w-auto">
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Listado de Productos ({productos.length})
        </h2>

        {productos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay productos registrados. Agrega uno para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría (ID)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado En
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productos.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {producto.nombre_producto}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producto.variante || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(producto.precio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryName(producto.id_categoria)} ({producto.id_categoria || 'N/A'})
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producto.receta.length > 0 ? (
                        <ul className="space-y-1">
                          {producto.receta.map(item => {
                            const consumable = availableConsumables.find(c => c.id === item.consumableId);
                            return (
                              <li key={item.consumableId}>
                                {consumable?.nombre || 'Insumo Desconocido'} ({item.quantity} {consumable?.unidadMedida || ''})
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mounted ? formatDateToDDMMYYYY(producto.creado_en) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditProducto(producto)}
                          title="Editar producto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteProducto(producto.id)}
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
      </Card>
    </div>
  );
}
