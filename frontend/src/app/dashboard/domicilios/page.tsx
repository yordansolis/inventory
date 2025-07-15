"use client"
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Domiciliario {
  id: number;
  nombre: string;
  telefono: string;
  tarifa: number | null;
}

interface DomiciliarioFormData {
  nombre: string;
  telefono: string;
  tarifa: string;
}

export default function DomiciliosPage() {
  const [domiciliarios, setDomiciliarios] = useState<Domiciliario[]>([
    { id: 1, nombre: 'Juan Pérez', telefono: '3001234567', tarifa: 5000 },
    { id: 2, nombre: 'Ana García', telefono: '3109876543', tarifa: 6000 },
    { id: 3, nombre: 'Pedro López', telefono: '3205551234', tarifa: 4500 },
  ]);

  const [formData, setFormData] = useState<DomiciliarioFormData>({
    nombre: '',
    telefono: '',
    tarifa: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  // Optimización: useCallback para evitar re-renders innecesarios
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  // Optimización: useCallback para las funciones de manejo
  const handleAddOrUpdateDomiciliario = useCallback(() => {
    const parsedTarifa = formData.tarifa === '' ? null : parseFloat(formData.tarifa);
    
    if (!formData.nombre.trim() || !formData.telefono.trim() || 
        (formData.tarifa !== '' && (parsedTarifa === null || isNaN(parsedTarifa)))) {
      alert('Por favor, complete todos los campos obligatorios y asegúrese de que la tarifa sea un número válido.');
      return;
    }

    if (editingId) {
      // Update logic
      setDomiciliarios((prev) =>
        prev.map((d) =>
          d.id === editingId ? {
            id: editingId,
            nombre: formData.nombre.trim(),
            telefono: formData.telefono.trim(),
            tarifa: parsedTarifa
          } : d
        )
      );
      setEditingId(null);
    } else {
      // Add logic
      const newId = domiciliarios.length > 0 ? Math.max(...domiciliarios.map(d => d.id)) + 1 : 1;
      setDomiciliarios((prev) => [...prev, {
        id: newId,
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        tarifa: parsedTarifa
      }]);
    }

    // Clear form
    setFormData({ nombre: '', telefono: '', tarifa: '' });
  }, [formData, editingId, domiciliarios]);

  const handleEditDomiciliario = useCallback((domiciliario: Domiciliario) => {
    setFormData({ 
      nombre: domiciliario.nombre, 
      telefono: domiciliario.telefono, 
      tarifa: domiciliario.tarifa === null ? '' : String(domiciliario.tarifa) 
    });
    setEditingId(domiciliario.id);
  }, []);

  const handleDeleteDomiciliario = useCallback((id: number) => {
    setDomiciliarios((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setFormData({ nombre: '', telefono: '', tarifa: '' });
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

  const formatPrice = useMemo(() => (price: number | null) => {
    if (price === null || price === undefined) {
      return '---';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Domiciliarios</h1>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? 'Editar Domiciliario' : 'Agregar Nuevo Domiciliario'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              placeholder="Ingrese el nombre completo"
            />
          </div>
          
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="text"
              id="telefono"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 3001234567"
            />
          </div>
          
          <div>
            <label htmlFor="tarifa" className="block text-sm font-medium text-gray-700 mb-1">
              Tarifa (COP)
            </label>
            <input
              type="number"
              id="tarifa"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.tarifa}
              onChange={handleChange}
              placeholder="Ej: 5000"
              min="0"
              step="100"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <Button variant="secondary" onClick={handleCancelEdit}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleAddOrUpdateDomiciliario}>
            {editingId ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Actualizar Domiciliario
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Domiciliario
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Listado de Domiciliarios ({domiciliarios.length})
        </h2>
        
        {domiciliarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay domiciliarios registrados. Agrega uno para comenzar.
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
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarifa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {domiciliarios.map((domiciliario) => (
                  <tr key={domiciliario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {domiciliario.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {domiciliario.telefono}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(domiciliario.tarifa)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditDomiciliario(domiciliario)}
                          title="Editar domiciliario"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar a ${domiciliario.nombre}?`)) {
                              handleDeleteDomiciliario(domiciliario.id);
                            }
                          }}
                          title="Eliminar domiciliario"
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