"use client"

import React, { useState, useCallback, useMemo } from 'react';
import { ShoppingCart, AlertTriangle, Plus, Edit, Trash2, X } from 'lucide-react';
import { formatPrice } from '../../../utils/format';
import { Button } from '../../../../../components/ui';

interface InventoryProduct {
  id: number;
  categoria: string;
  subcategoriaTipo: string;
  nombreProducto: string;
  unidadMedida: string;
  valorUnitario: number;
  unidades: number | null;
  stockMinimo: number;
  alertaStockBajo: 'Editable' | 'Normal' | 'Bajo';
}

interface ProductFormData {
  categoria: string;
  subcategoriaTipo: string;
  nombreProducto: string;
  unidadMedida: string;
  valorUnitario: string;
  unidades: string;
  stockMinimo: string;
}

export default function InventarioConsumoPage() {
  const [inventarioProductos, setInventarioProductos] = useState<InventoryProduct[]>([
    { id: 1, categoria: 'Vendible', subcategoriaTipo: 'HELADO', nombreProducto: 'BOLA DE HELADO DE VAINILLA', unidadMedida: 'unidad (u)', valorUnitario: 1000, unidades: null, stockMinimo: 10, alertaStockBajo: 'Editable' },
    { id: 2, categoria: 'Vendible', subcategoriaTipo: 'HELADO', nombreProducto: 'BOLA DE HELADO DE FRESA', unidadMedida: 'unidad (u)', valorUnitario: 1500, unidades: null, stockMinimo: 5, alertaStockBajo: 'Normal' },
    { id: 3, categoria: 'Vendible', subcategoriaTipo: 'ESPUMA', nombreProducto: 'BOLA DE ESPUMA', unidadMedida: 'unidad (u)', valorUnitario: 5000, unidades: null, stockMinimo: 10, alertaStockBajo: 'Normal' },
    { id: 4, categoria: 'Vendible', subcategoriaTipo: 'PANCAKES', nombreProducto: 'MINI PANCAKES', unidadMedida: 'unidad (u)', valorUnitario: 1000, unidades: 100, stockMinimo: 10, alertaStockBajo: 'Normal' },
    { id: 5, categoria: 'Vendible', subcategoriaTipo: 'DONAS', nombreProducto: 'MINI DONAS X12', unidadMedida: 'unidad (u)', valorUnitario: 3000, unidades: 300, stockMinimo: 10, alertaStockBajo: 'Normal' },
    { id: 6, categoria: 'Vendible', subcategoriaTipo: 'POSTRE', nombreProducto: 'POSTER CON CREMA YOGUR', unidadMedida: 'unidad (u)', valorUnitario: 4000, unidades: null, stockMinimo: 10, alertaStockBajo: 'Normal' },
    { id: 7, categoria: 'Vendible', subcategoriaTipo: 'POSTRE', nombreProducto: 'POSTER CON CREMA AVENA', unidadMedida: 'kilogramo (kg)', valorUnitario: 1000, unidades: null, stockMinimo: 10, alertaStockBajo: 'Normal' },
    { id: 8, categoria: 'Servicio', subcategoriaTipo: 'Domicilio', nombreProducto: 'ENVÍO ZONA LOCAL', unidadMedida: '', valorUnitario: 3000, unidades: null, stockMinimo: 0, alertaStockBajo: 'Normal' },
  ]);

  const [formData, setFormData] = useState<ProductFormData>({
    categoria: '',
    subcategoriaTipo: '',
    nombreProducto: '',
    unidadMedida: '',
    valorUnitario: '',
    unidades: '',
    stockMinimo: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 5;

  // Función para calcular el estado de alerta basado en stock
  const calculateAlertaStockBajo = useCallback((unidades: number | null, stockMinimo: number): InventoryProduct['alertaStockBajo'] => {
    if (unidades === null) return 'Editable';
    if (unidades <= stockMinimo) return 'Bajo';
    return 'Normal';
  }, []);

  // Manejo de cambios en el formulario
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Función para agregar o actualizar producto
  const handleAddOrUpdateProduct = useCallback(() => {
    const parsedValorUnitario = formData.valorUnitario === '' ? 0 : parseFloat(formData.valorUnitario);
    const parsedUnidades = formData.unidades === '' ? null : parseInt(formData.unidades);
    const parsedStockMinimo = formData.stockMinimo === '' ? 0 : parseInt(formData.stockMinimo);
    
    if (!formData.nombreProducto.trim() || !formData.categoria.trim() || !formData.subcategoriaTipo.trim() || 
        !formData.unidadMedida.trim() || 
        (formData.valorUnitario !== '' && (isNaN(parsedValorUnitario) || parsedValorUnitario < 0)) ||
        (formData.unidades !== '' && (isNaN(parsedUnidades!) || parsedUnidades! < 0)) ||
        (formData.stockMinimo !== '' && (isNaN(parsedStockMinimo) || parsedStockMinimo < 0))) {
      alert('Por favor, complete todos los campos obligatorios y asegúrese de que los valores numéricos sean válidos.');
      return;
    }

    const alertaStockBajo = calculateAlertaStockBajo(parsedUnidades, parsedStockMinimo);

    if (editingId) {
      // Actualizar producto existente
      setInventarioProductos((prev) =>
        prev.map((p) =>
          p.id === editingId ? {
            id: editingId,
            categoria: formData.categoria.trim(),
            subcategoriaTipo: formData.subcategoriaTipo.trim(),
            nombreProducto: formData.nombreProducto.trim(),
            unidadMedida: formData.unidadMedida.trim(),
            valorUnitario: parsedValorUnitario,
            unidades: parsedUnidades,
            stockMinimo: parsedStockMinimo,
            alertaStockBajo
          } : p
        )
      );
      setEditingId(null);
    } else {
      // Agregar nuevo producto
      const newId = inventarioProductos.length > 0 ? Math.max(...inventarioProductos.map(p => p.id)) + 1 : 1;
      setInventarioProductos((prev) => [...prev, {
        id: newId,
        categoria: formData.categoria.trim(),
        subcategoriaTipo: formData.subcategoriaTipo.trim(),
        nombreProducto: formData.nombreProducto.trim(),
        unidadMedida: formData.unidadMedida.trim(),
        valorUnitario: parsedValorUnitario,
        unidades: parsedUnidades,
        stockMinimo: parsedStockMinimo,
        alertaStockBajo
      }]);
    }

    // Limpiar formulario
    setFormData({
      categoria: '',
      subcategoriaTipo: '',
      nombreProducto: '',
      unidadMedida: '',
      valorUnitario: '',
      unidades: '',
      stockMinimo: '',
    });
  }, [formData, editingId, inventarioProductos, calculateAlertaStockBajo]);

  const handleEditProduct = useCallback((product: InventoryProduct) => {
    setFormData({
      categoria: product.categoria,
      subcategoriaTipo: product.subcategoriaTipo,
      nombreProducto: product.nombreProducto,
      unidadMedida: product.unidadMedida,
      valorUnitario: String(product.valorUnitario),
      unidades: product.unidades !== null ? String(product.unidades) : '',
      stockMinimo: String(product.stockMinimo),
    });
    setEditingId(product.id);
  }, []);

  const handleDeleteProduct = useCallback((id: number) => {
    setInventarioProductos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setFormData({
      categoria: '',
      subcategoriaTipo: '',
      nombreProducto: '',
      unidadMedida: '',
      valorUnitario: '',
      unidades: '',
      stockMinimo: '',
    });
    setEditingId(null);
  }, []);

  // Componente Card memoizado
  const Card = useMemo(() => ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  ), []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return inventarioProductos;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return inventarioProductos.filter(product =>
      product.nombreProducto.toLowerCase().includes(lowercasedSearchTerm) ||
      product.categoria.toLowerCase().includes(lowercasedSearchTerm) ||
      product.subcategoriaTipo.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [inventarioProductos, searchTerm]);

  // Calcular productos para la página actual
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = useMemo(() => filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct), [filteredProducts, indexOfFirstProduct, indexOfLastProduct]);

  // Cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Productos en Inventario</h1>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="nombreProducto" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              id="nombreProducto"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.nombreProducto}
              onChange={handleChange}
              placeholder="Nombre del producto"
            />
          </div>
          
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <input
              type="text"
              id="categoria"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.categoria}
              onChange={handleChange}
              placeholder="Ej: Vendible, Servicio"
            />
          </div>
          
          <div>
            <label htmlFor="subcategoriaTipo" className="block text-sm font-medium text-gray-700 mb-1">
              Subcategoría/Tipo *
            </label>
            <input
              type="text"
              id="subcategoriaTipo"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.subcategoriaTipo}
              onChange={handleChange}
              placeholder="Ej: HELADO, DONAS"
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
              placeholder="Ej: unidad (u), kilogramo (kg)"
            />
          </div>
          
          <div>
            <label htmlFor="valorUnitario" className="block text-sm font-medium text-gray-700 mb-1">
              Valor Unitario *
            </label>
            <input
              type="number"
              id="valorUnitario"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.valorUnitario}
              onChange={handleChange}
              placeholder="Ej: 1000"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label htmlFor="unidades" className="block text-sm font-medium text-gray-700 mb-1">
              Unidades (opcional)
            </label>
            <input
              type="number"
              id="unidades"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.unidades}
              onChange={handleChange}
              placeholder="Ej: 100"
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="stockMinimo" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Mínimo *
            </label>
            <input
              type="number"
              id="stockMinimo"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.stockMinimo}
              onChange={handleChange}
              placeholder="Ej: 10"
              min="0"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <Button size="sm" variant="default" onClick={handleCancelEdit}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
          <Button size="sm" variant="success" onClick={handleAddOrUpdateProduct}>
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
          Listado de Productos ({inventarioProductos.length})
        </h2>
        
        <div className="mb-4">
          <label htmlFor="search" className="sr-only">Buscar productos</label>
          <input
            type="text"
            id="search"
            className="mt-4 block w-5/12 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, categoría o subcategoría..."
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay productos registrados. Agrega uno para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategoría/Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad de Medida</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unitario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alerta de Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product.categoria}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product.subcategoriaTipo}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product.nombreProducto}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product.unidadMedida}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(product.valorUnitario)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product.unidades !== null ? product.unidades : 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product.stockMinimo}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {product.alertaStockBajo === 'Bajo' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Bajo
                        </span>
                      ) : product.alertaStockBajo === 'Editable' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Editable
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleEditProduct(product)}
                          title="Editar producto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar ${product.nombreProducto}?`)) {
                              handleDeleteProduct(product.id);
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
          <div className="flex justify-center mt-4">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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