'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';

interface ConsumableProduct {
  id: number;
  nombre: string;
  tipo: string;
  unidadMedida: string;
  cantidad: number;
  minimo: number;
  estado: 'bien' | 'alerta' | 'critico';
}

interface ProductFormData {
  nombre: string;
  tipo: string;
  unidadMedida: string;
  cantidad: string;
  minimo: string;
}

export default function SuministroPage() {
  const [productosConsumibles, setProductosConsumibles] = useState<ConsumableProduct[]>([
    { id: 1, nombre: 'VASOS X 16', tipo: 'Consumible', unidadMedida: 'unidad (u)', cantidad: 50, minimo: 10, estado: 'bien' },
    { id: 2, nombre: 'VASOS X 6', tipo: 'Consumible', unidadMedida: 'unidad (u)', cantidad: 100, minimo: 10, estado: 'bien' },
    { id: 3, nombre: 'PAQUETE DE SERVILLETAS X 50', tipo: 'Consumible', unidadMedida: 'unidad (u)', cantidad: 10, minimo: 7, estado: 'alerta' },
    { id: 4, nombre: 'PAQUETES DE FRESAS', tipo: 'Consumible', unidadMedida: 'kilogramo (kg)', cantidad: 2, minimo: 5, estado: 'critico' },
  ]);

  const [formData, setFormData] = useState<ProductFormData>({
    nombre: '',
    tipo: '',
    unidadMedida: '',
    cantidad: '',
    minimo: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Función para calcular el estado basado en cantidad y mínimo
  const calculateEstado = useCallback((cantidad: number, minimo: number): ConsumableProduct['estado'] => {
    if (cantidad <= minimo) return 'critico';
    if (cantidad <= minimo * 1.5) return 'alerta';
    return 'bien';
  }, []);

  // Optimización: useCallback para evitar re-renders innecesarios
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  // Optimización: useCallback para las funciones de manejo
  const handleAddOrUpdateProduct = useCallback(() => {
    const parsedCantidad = formData.cantidad === '' ? 0 : parseInt(formData.cantidad);
    const parsedMinimo = formData.minimo === '' ? 0 : parseInt(formData.minimo);
    
    if (!formData.nombre.trim() || !formData.tipo.trim() || !formData.unidadMedida.trim() || 
        (formData.cantidad !== '' && (isNaN(parsedCantidad) || parsedCantidad < 0)) ||
        (formData.minimo !== '' && (isNaN(parsedMinimo) || parsedMinimo < 0))) {
      alert('Por favor, complete todos los campos obligatorios y asegúrese de que las cantidades sean números válidos.');
      return;
    }

    const estado = calculateEstado(parsedCantidad, parsedMinimo);

    if (editingId) {
      // Update logic
      setProductosConsumibles((prev) =>
        prev.map((p) =>
          p.id === editingId ? {
            id: editingId,
            nombre: formData.nombre.trim(),
            tipo: formData.tipo.trim(),
            unidadMedida: formData.unidadMedida.trim(),
            cantidad: parsedCantidad,
            minimo: parsedMinimo,
            estado
          } : p
        )
      );
      setEditingId(null);
    } else {
      // Add logic
      const newId = productosConsumibles.length > 0 ? Math.max(...productosConsumibles.map(p => p.id)) + 1 : 1;
      setProductosConsumibles((prev) => [...prev, {
        id: newId,
        nombre: formData.nombre.trim(),
        tipo: formData.tipo.trim(),
        unidadMedida: formData.unidadMedida.trim(),
        cantidad: parsedCantidad,
        minimo: parsedMinimo,
        estado
      }]);
    }

    // Clear form
    setFormData({ nombre: '', tipo: '', unidadMedida: '', cantidad: '', minimo: '' });
  }, [formData, editingId, productosConsumibles, calculateEstado]);

  const handleEditProduct = useCallback((producto: ConsumableProduct) => {
    setFormData({ 
      nombre: producto.nombre, 
      tipo: producto.tipo, 
      unidadMedida: producto.unidadMedida,
      cantidad: String(producto.cantidad),
      minimo: String(producto.minimo)
    });
    setEditingId(producto.id);
  }, []);

  const handleDeleteProduct = useCallback((id: number) => {
    setProductosConsumibles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setFormData({ nombre: '', tipo: '', unidadMedida: '', cantidad: '', minimo: '' });
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
    ...props 
  }: { 
    children: React.ReactNode; 
    variant?: "default" | "danger" | "secondary"; 
    size?: "default" | "sm"; 
    className?: string; 
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
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
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
        producto.tipo.toLowerCase().includes(lowerCaseSearchTerm) ||
        producto.unidadMedida.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [productosConsumibles, searchTerm]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Suministros</h1>
      
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <input
              type="text"
              id="tipo"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.tipo}
              onChange={handleChange}
              placeholder="Ej: Consumible"
            />
          </div>
          
          <div>
            <label htmlFor="unidadMedida" className="block text-sm font-medium text-gray-700 mb-1">
              Unidad de Medida *
            </label>
            <input
              type="text"
              id="unidadMedida"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.unidadMedida}
              onChange={handleChange}
              placeholder="Ej: unidad (u)"
            />
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
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <Button variant="secondary" onClick={handleCancelEdit}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleAddOrUpdateProduct}>
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

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Listado de Productos ({productosConsumibles.length})
        </h2>
        
        <input
          type="text"
          id="search"
          className="block w-1/3 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar por nombre, categoría o subcategoría..."
        />

        {filteredProducts.length === 0 ? (
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
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {producto.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.tipo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.unidadMedida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.minimo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getStockAlertBadge(producto.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditProduct(producto)}
                          title="Editar producto"
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
      </Card>
    </div>
  );
}