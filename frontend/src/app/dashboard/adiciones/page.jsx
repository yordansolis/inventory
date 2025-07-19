"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, AlertCircle, Loader2 } from 'lucide-react';
import { Card, Badge, Button } from '../../../../components/ui'; // Adjust path as needed
import { getAuthHeaders } from '../../utils/auth';

const API_URL = 'http://127.0.0.1:8053/api/v1/services/adiciones';

const AdicionesManager = () => {
  const [adiciones, setAdiciones] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', tipo: 'TOPPING', precio: 0, stock: 0, minimo: 0, estado: 'bien'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tipos = ['TOPPING', 'FRUTA', 'SALSA', 'CEREAL'];
  const estados = ['bien', 'bajo', 'agotado'];

  // Fetch adiciones from API
  useEffect(() => {
    const fetchAdiciones = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setAdiciones(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching adiciones:", err);
        setError("Error al cargar las adiciones. Por favor, intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdiciones();
  }, []);

  const handleEdit = (adicion) => {
    setEditingId(adicion.id);
    setFormData({ ...adicion });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing adición
        const response = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const updatedAdicion = await response.json();
        setAdiciones(prev => prev.map(item => 
          item.id === editingId ? updatedAdicion : item
        ));
        setEditingId(null);
      } else {
        // Create new adición
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const newAdicion = await response.json();
        setAdiciones(prev => [...prev, newAdicion]);
        setShowAddForm(false);
      }
      setFormData({ nombre: '', tipo: 'TOPPING', precio: 0, stock: 0, minimo: 0, estado: 'bien' });
      setError(null);
    } catch (err) {
      console.error("Error saving adición:", err);
      setError(err.message || "Error al guardar la adición. Por favor, intenta de nuevo.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta adición?')) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        setAdiciones(prev => prev.filter(item => item.id !== id));
        setError(null);
      } catch (err) {
        console.error("Error deleting adición:", err);
        setError("Error al eliminar la adición. Por favor, intenta de nuevo.");
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ nombre: '', tipo: 'TOPPING', precio: 0, stock: 0, minimo: 0, estado: 'bien' });
  };

  const getStatusClass = (stock, minimo) => {
    if (stock === 0) return 'danger'; // Changed to match Badge variant names
    if (stock <= minimo) return 'warning'; // Changed to match Badge variant names
    return 'success'; // Changed to match Badge variant names
  };

  const getStatusText = (stock, minimo) => {
    if (stock === 0) return 'Agotado';
    if (stock <= minimo) return 'Stock Bajo';
    return 'Disponible';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Seed initial data function
  const handleSeedData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/seed`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Fetch the updated list after seeding
      const fetchResponse = await fetch(API_URL, {
        headers: getAuthHeaders()
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`Error ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }
      
      const data = await fetchResponse.json();
      setAdiciones(data);
      setError(null);
    } catch (err) {
      console.error("Error seeding data:", err);
      setError("Error al cargar los datos iniciales. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && adiciones.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg text-gray-600">Cargando adiciones...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Adiciones</h1>
        <p className="text-gray-600">Administra los ingredientes y toppings disponibles</p>
      </div>

      {/* Metrics */}
      <div className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{adiciones.length}</div>
            <div className="text-sm text-gray-600">Total Adiciones</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {adiciones.filter(a => a.stock <= a.minimo && a.stock > 0).length}
            </div>
            <div className="text-sm text-gray-600">Stock Bajo</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatPrice(adiciones.reduce((sum, a) => sum + (a.precio * a.stock), 0))}
            </div>
            <div className="text-sm text-gray-600">Valor Total Stock</div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex justify-between">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Nueva Adición
        </Button>
        
        {adiciones.length === 0 && (
          <Button onClick={handleSeedData} variant="outline">
            Cargar Datos Iniciales
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Nueva Adición</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                id="nombre"
                type="text"
                placeholder="Nombre de la adición"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              >
                {tipos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                id="precio"
                type="text" 
                placeholder="Precio (ej. 1500.50)"
                value={formData.precio === 0 ? '' : formData.precio}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) { 
                    setFormData({...formData, precio: parseFloat(value) || 0});
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                id="stock"
                type="number"
                placeholder="Cantidad en stock"
                value={formData.stock === 0 ? '' : formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label htmlFor="minimo" className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                id="minimo"
                type="number"
                placeholder="Stock mínimo"
                value={formData.minimo === 0 ? '' : formData.minimo}
                onChange={(e) => setFormData({...formData, minimo: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
              >
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
            <Button variant="default" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adiciones.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay adiciones disponibles. Haz clic en "Cargar Datos Iniciales" para comenzar.
                  </td>
                </tr>
              ) : (
                adiciones.map((adicion) => (
                  <tr key={adicion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingId === adicion.id ? (
                        <input
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        />
                      ) : (
                        <span>{adicion.nombre}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === adicion.id ? (
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          value={formData.tipo}
                          onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        >
                          {tipos.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant="default">
                          {adicion.tipo}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {editingId === adicion.id ? (
                        <input
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          type="text" 
                          placeholder="Precio (ej. 1500.50)"
                          value={formData.precio === 0 ? '' : formData.precio}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) { 
                              setFormData({...formData, precio: parseFloat(value) || 0});
                            }
                          }}
                        />
                      ) : (
                        <span>{formatPrice(adicion.precio)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === adicion.id ? (
                        <input
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          type="number"
                          placeholder="Cantidad en stock"
                          value={formData.stock === 0 ? '' : formData.stock}
                          onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                        />
                      ) : (
                        <span>{adicion.stock}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === adicion.id ? (
                        <input
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          type="number"
                          placeholder="Stock mínimo"
                          value={formData.minimo === 0 ? '' : formData.minimo}
                          onChange={(e) => setFormData({...formData, minimo: parseInt(e.target.value) || 0})}
                        />
                      ) : (
                        <span>{adicion.minimo}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === adicion.id ? (
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          value={formData.estado}
                          onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        >
                          {estados.map(estado => (
                            <option key={estado} value={estado}>{estado}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={getStatusClass(adicion.stock, adicion.minimo)}>
                          {getStatusText(adicion.stock, adicion.minimo)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === adicion.id ? (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="danger" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleEdit(adicion)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(adicion.id)} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdicionesManager;