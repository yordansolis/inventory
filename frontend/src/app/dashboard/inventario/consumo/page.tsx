"use client"

import React, { useState, useCallback, useMemo } from 'react';
import {  Plus, Edit, Trash2, X } from 'lucide-react';
import { Button } from '../../../../../components/ui';

interface Insumo {
  id_insumo: number;
  nombre_insumo: string;
  cantidad_utilizada: number;
  unidad: string;
}

interface ProductRecipe {
  id: number;
  nombreProducto: string;
  categoria: string;
  subcategoriaTipo: string;
  unidadMedida: string;
  insumos: Insumo[];
}

interface ProductFormData {
  id: number | null;
  nombreProducto: string;
  categoria: string;
  subcategoriaTipo: string;
  unidadMedida: string;
  insumos: Insumo[];
}

export default function InventarioConsumoPage() {
  const [productRecipes, setProductRecipes] = useState<ProductRecipe[]>([
    {
      id: 1,
      nombreProducto: 'FRESURA CON HELADO',
      categoria: 'Vendible',
      subcategoriaTipo: 'POSTRE',
      unidadMedida: 'unidad (u)',
      insumos: [
        { id_insumo: 1, nombre_insumo: 'Fresas', cantidad_utilizada: 100, unidad: 'g' },
        { id_insumo: 2, nombre_insumo: 'Vasos', cantidad_utilizada: 1, unidad: 'unidad' },
        { id_insumo: 3, nombre_insumo: 'Helado', cantidad_utilizada: 0.1, unidad: 'litros' },
      ],
    },
    {
      id: 2,
      nombreProducto: 'Mini Pancakes Special',
      categoria: 'Vendible',
      subcategoriaTipo: 'PANCAKES',
      unidadMedida: 'unidad (u)',
      insumos: [
        { id_insumo: 4, nombre_insumo: 'Harina', cantidad_utilizada: 50, unidad: 'g' },
        { id_insumo: 5, nombre_insumo: 'Huevos', cantidad_utilizada: 1, unidad: 'unidad' },
      ],
    },
  ]);

  const [formData, setFormData] = useState<ProductFormData>({
    id: null,
    nombreProducto: '',
    categoria: '',
    subcategoriaTipo: '',
    unidadMedida: '',
    insumos: [],
  });

  const [currentInsumo, setCurrentInsumo] = useState<Omit<Insumo, 'id_insumo'>>({
    nombre_insumo: '',
    cantidad_utilizada: 0,
    unidad: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 5;


  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Manejo de cambios en el formulario para insumos
  const handleInsumoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentInsumo((prev) => ({
      ...prev,
      [id]: id === 'cantidad_utilizada' ? parseFloat(value) : value,
    }));
  }, []);

  const handleAddInsumo = useCallback(() => {
    if (!currentInsumo.nombre_insumo.trim() || currentInsumo.cantidad_utilizada <= 0 || !currentInsumo.unidad.trim()) {
      alert('Por favor, complete todos los campos de insumo y asegúrese de que la cantidad utilizada sea válida.');
      return;
    }
    const newInsumoId = formData.insumos.length > 0 ? Math.max(...formData.insumos.map(i => i.id_insumo)) + 1 : 1;
    setFormData((prev) => ({
      ...prev,
      insumos: [...prev.insumos, { ...currentInsumo, id_insumo: newInsumoId }],
    }));
    setCurrentInsumo({
      nombre_insumo: '',
      cantidad_utilizada: 0,
      unidad: '',
    });
  }, [formData.insumos, currentInsumo]);

  const handleRemoveInsumo = useCallback((id_insumo: number) => {
    setFormData((prev) => ({
      ...prev,
      insumos: prev.insumos.filter((insumo) => insumo.id_insumo !== id_insumo),
    }));
  }, []);

  // Función para agregar o actualizar producto/receta
  const handleAddOrUpdateProduct = useCallback(() => {
    
    if (!formData.nombreProducto.trim() || !formData.categoria.trim() || !formData.subcategoriaTipo.trim() || 
        !formData.unidadMedida.trim() || 
        formData.insumos.length === 0) { // Require at least one insumo
      alert('Por favor, complete todos los campos obligatorios del producto y agregue al menos un insumo.');
      return;
    }

    if (formData.id) { // Use formData.id for editing
      // Actualizar producto/receta existente
      setProductRecipes((prev) =>
        prev.map((p) =>
          p.id === formData.id ? { // Use p.id here
            id: formData.id,
            categoria: formData.categoria.trim(),
            subcategoriaTipo: formData.subcategoriaTipo.trim(),
            nombreProducto: formData.nombreProducto.trim(),
            unidadMedida: formData.unidadMedida.trim(),
            insumos: formData.insumos, // Assign insumos directly
          } : p
        )
      );
    } else {
      // Agregar nueva producto/receta
      const newId = productRecipes.length > 0 ? Math.max(...productRecipes.map(p => p.id)) + 1 : 1;
      setProductRecipes((prev) => [...prev, {
        id: newId,
        categoria: formData.categoria.trim(),
        subcategoriaTipo: formData.subcategoriaTipo.trim(),
        nombreProducto: formData.nombreProducto.trim(),
        unidadMedida: formData.unidadMedida.trim(),
        insumos: formData.insumos, // Assign insumos directly
      }]);
    }

    // Limpiar formulario
    setFormData({
      id: null,
      nombreProducto: '',
      categoria: '',
      subcategoriaTipo: '',
      unidadMedida: '',
      insumos: [],
    });
    setCurrentInsumo({
      nombre_insumo: '',
      cantidad_utilizada: 0,
      unidad: '',
    });
  }, [formData, productRecipes]);

  const handleEditProduct = useCallback((recipe: ProductRecipe) => {
    setFormData({
      id: recipe.id,
      categoria: recipe.categoria,
      subcategoriaTipo: recipe.subcategoriaTipo,
      nombreProducto: recipe.nombreProducto,
      unidadMedida: recipe.unidadMedida,
      insumos: recipe.insumos,
    });
    setEditingId(recipe.id);
  }, []);

  const handleDeleteProduct = useCallback((id: number) => {
    setProductRecipes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setFormData({
      id: null,
      categoria: '',
      subcategoriaTipo: '',
      nombreProducto: '',
      unidadMedida: '',
      insumos: [],
    });
    setCurrentInsumo({
      nombre_insumo: '',
      cantidad_utilizada: 0,
      unidad: '',
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
      return productRecipes;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return productRecipes.filter(product =>
      product.nombreProducto.toLowerCase().includes(lowercasedSearchTerm) ||
      product.categoria.toLowerCase().includes(lowercasedSearchTerm) ||
      product.subcategoriaTipo.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [productRecipes, searchTerm]);

  // Calcular productos para la página actual
  // Flatten the product recipes into product-insumo pairs for display
  const flattenedRecipes = useMemo(() => {
    return filteredProducts.flatMap(recipe =>
      recipe.insumos.map(insumo => ({ 
        id_producto: recipe.id, 
        nombre_producto: recipe.nombreProducto, 
        categoria: recipe.categoria, 
        subcategoriaTipo: recipe.subcategoriaTipo, 
        unidadMedidaProducto: recipe.unidadMedida, // Keep product unit for context
        id_insumo: insumo.id_insumo, 
        nombre_insumo: insumo.nombre_insumo, 
        cantidad_utilizada: insumo.cantidad_utilizada, 
        unidad_insumo: insumo.unidad 
      }))
    );
  }, [filteredProducts]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = useMemo(() => flattenedRecipes.slice(indexOfFirstProduct, indexOfLastProduct), [flattenedRecipes, indexOfFirstProduct, indexOfLastProduct]);

  // Cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(flattenedRecipes.length / productsPerPage);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Recetas de Productos</h1>
      
      <Card className="mb-6">


        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Insumos de la Receta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="nombre_insumo" className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
            <input
              type="text"
              id="nombre_insumo"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentInsumo.nombre_insumo}
              onChange={handleInsumoChange}
              placeholder="Nombre del producto"
            />
          </div>

          <div>
            <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
            <input
              type="text"
              id="unidad"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentInsumo.unidad}
              onChange={handleInsumoChange}
              placeholder="Ej: g, unidad, litros"
            />
          </div>

          <div>
            <label htmlFor="cantidad_utilizada" className="block text-sm font-medium text-gray-700 mb-1">Cantidad Utilizada</label>
            <input
              type="number"
              id="cantidad_utilizada"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentInsumo.cantidad_utilizada === 0 ? '' : currentInsumo.cantidad_utilizada}
              onChange={handleInsumoChange}
              placeholder="Ej: 100"
              min="0"
              step="0.01"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <Button size="sm" variant="default" onClick={handleAddInsumo}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Insumo
            </Button>
          </div>
        </div>

        {formData.insumos.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-700 mb-2">Insumos Agregados:</h4>
            <ul className="border border-gray-200 rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
              {formData.insumos.map((insumo) => (
                <li key={insumo.id_insumo} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-800">{insumo.nombre_insumo} - {insumo.cantidad_utilizada} {insumo.unidad}</span>
                  <Button size="sm" variant="danger" onClick={() => handleRemoveInsumo(insumo.id_insumo)}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
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
                Actualizar Receta
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Receta
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Listado de Recetas ({flattenedRecipes.length})
        </h2>
        
        <div className="mb-4">
          <label htmlFor="search" className="sr-only">Buscar recetas</label>
          <input
            type="text"
            id="search"
            className="mt-4 block w-5/12 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, categoría o subcategoría..."
          />
        </div>

        {flattenedRecipes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay recetas registradas. Agrega una para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategoría/Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Insumo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Insumo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Utilizada</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad Insumo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((item, index) => (
                  <tr key={`${item.id_producto}-${item.id_insumo || index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.id_producto}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.nombre_producto}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.categoria}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.subcategoriaTipo}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.id_insumo}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.nombre_insumo}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad_utilizada}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.unidad_insumo}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleEditProduct(productRecipes.find(p => p.id === item.id_producto)!)} // Find original recipe to edit
                          title="Editar receta"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar la receta de ${item.nombre_producto}?`)) {
                              handleDeleteProduct(item.id_producto);
                            }
                          }}
                          title="Eliminar receta"
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

        {flattenedRecipes.length > productsPerPage && (
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
                  variant={currentPage === index + 1 ? "success" : "default"}
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