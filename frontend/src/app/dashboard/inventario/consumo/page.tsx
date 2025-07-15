"use client"
// ... existing code ...
import React, { useState } from 'react';
import { ShoppingCart, AlertTriangle, Plus, X } from 'lucide-react'; // Added X for close button
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);

  const handleDeleteProduct = (id: number) => {
    setInventarioProductos(prevProducts => prevProducts.filter(product => product.id !== id));
  };

  const handleAddProduct = (newProduct: Omit<InventoryProduct, 'id' | 'alertaStockBajo'>) => {
    const newId = inventarioProductos.length > 0 ? Math.max(...inventarioProductos.map(p => p.id)) + 1 : 1;
    // Determine alertaStockBajo based on stockMinimo and unidades (if applicable)
    const alertaStockBajo: InventoryProduct['alertaStockBajo'] =
      newProduct.unidades !== null && newProduct.unidades <= newProduct.stockMinimo ? 'Bajo' : 'Normal';

    setInventarioProductos(prevProducts => [...prevProducts, { ...newProduct, id: newId, alertaStockBajo }]);
    setIsModalOpen(false);
  };

  const handleUpdateProduct = (updatedProduct: InventoryProduct) => {
    setInventarioProductos(prevProducts =>
      prevProducts.map(product => (product.id === updatedProduct.id ? updatedProduct : product))
    );
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: InventoryProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Productos en Inventario
        </h2>
        <Button size="sm" variant="success" onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir Producto
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
            {inventarioProductos.map((product) => (
              <tr key={product.id}>
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
                    <Button variant="default" size="sm" className="mr-2" onClick={() => openEditModal(product)}>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const productData: Omit<InventoryProduct, 'id' | 'alertaStockBajo'> = {
                categoria: formData.get('categoria') as string,
                subcategoriaTipo: formData.get('subcategoriaTipo') as string,
                nombreProducto: formData.get('nombreProducto') as string,
                unidadMedida: formData.get('unidadMedida') as string,
                valorUnitario: parseFloat(formData.get('valorUnitario') as string),
                unidades: formData.get('unidades') ? parseInt(formData.get('unidades') as string) : null,
                stockMinimo: parseInt(formData.get('stockMinimo') as string),
              };

              if (editingProduct) {
                // For editing, we need the original ID and re-evaluate alertaStockBajo
                const updatedAlertaStockBajo: InventoryProduct['alertaStockBajo'] =
                  productData.unidades !== null && productData.unidades <= productData.stockMinimo ? 'Bajo' : 'Normal';
                handleUpdateProduct({ ...editingProduct, ...productData, alertaStockBajo: updatedAlertaStockBajo });
              } else {
                handleAddProduct(productData);
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="nombreProducto" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                  <input
                    type="text"
                    id="nombreProducto"
                    name="nombreProducto"
                    defaultValue={editingProduct?.nombreProducto || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    id="categoria"
                    name="categoria"
                    defaultValue={editingProduct?.categoria || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="subcategoriaTipo" className="block text-sm font-medium text-gray-700 mb-1">Subcategoría / Tipo</label>
                  <input
                    type="text"
                    id="subcategoriaTipo"
                    name="subcategoriaTipo"
                    defaultValue={editingProduct?.subcategoriaTipo || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="unidadMedida" className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    id="unidadMedida"
                    name="unidadMedida"
                    defaultValue={editingProduct?.unidadMedida || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="valorUnitario" className="block text-sm font-medium text-gray-700 mb-1">Valor Unitario</label>
                  <input
                    type="number"
                    id="valorUnitario"
                    name="valorUnitario"
                    defaultValue={editingProduct?.valorUnitario || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="unidades" className="block text-sm font-medium text-gray-700 mb-1">Unidades (opcional)</label>
                  <input
                    type="number"
                    id="unidades"
                    name="unidades"
                    defaultValue={editingProduct?.unidades !== null ? editingProduct?.unidades : ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="stockMinimo" className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    id="stockMinimo"
                    name="stockMinimo"
                    defaultValue={editingProduct?.stockMinimo || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="default" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" variant="success">
                  {editingProduct ? 'Guardar Cambios' : 'Añadir Producto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}