"use client"
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Categoria {
  id: number;
  nombre_categoria: string;
}

interface CategoriaFormData {
  nombre_categoria: string;
}

export default function CategoriesPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([
    { id: 1, nombre_categoria: 'Bebidas' },
    { id: 2, nombre_categoria: 'Comida Rápida' },
    { id: 3, nombre_categoria: 'Postres' },
  ]);

  const [formData, setFormData] = useState<CategoriaFormData>({
    nombre_categoria: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  const handleAddOrUpdateCategoria = useCallback(() => {
    if (!formData.nombre_categoria.trim()) {
      alert('Por favor, ingrese el nombre de la categoría.');
      return;
    }

    if (editingId) {
      setCategorias((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, nombre_categoria: formData.nombre_categoria.trim() } : c
        )
      );
      setEditingId(null);
    } else {
      const newId = categorias.length > 0 ? Math.max(...categorias.map(c => c.id)) + 1 : 1;
      setCategorias((prev) => [...prev, { id: newId, nombre_categoria: formData.nombre_categoria.trim() }]);
    }
    setFormData({ nombre_categoria: '' });
  }, [formData, editingId, categorias]);

  const handleEditCategoria = useCallback((categoria: Categoria) => {
    setFormData({ nombre_categoria: categoria.nombre_categoria });
    setEditingId(categoria.id);
  }, []);

  const handleDeleteCategoria = useCallback((id: number) => {
    setCategorias((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setFormData({ nombre_categoria: '' });
    setEditingId(null);
  }, []);

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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Categorías</h1>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="nombre_categoria" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Categoría *
            </label>
            <input
              type="text"
              id="nombre_categoria"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.nombre_categoria}
              onChange={handleChange}
              placeholder="Ej: Bebidas, Comida, etc."
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <Button variant="secondary" onClick={handleCancelEdit}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleAddOrUpdateCategoria}>
            {editingId ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Actualizar Categoría
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Categoría
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Listado de Categorías ({categorias.length})
        </h2>
        
        {categorias.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay categorías registradas. Agrega una para comenzar.
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
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categorias.map((categoria) => (
                  <tr key={categoria.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {categoria.nombre_categoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditCategoria(categoria)}
                          title="Editar categoría"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar la categoría "${categoria.nombre_categoria}"?`)) {
                              handleDeleteCategoria(categoria.id);
                            }
                          }}
                          title="Eliminar categoría"
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
