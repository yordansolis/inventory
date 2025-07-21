"use client"
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, AlertCircle, RefreshCw, Info, CheckCircle } from 'lucide-react';
import { getAuthHeaders } from '../../../utils/auth';
import EmojiPicker, { EmojiClickData, Categories, EmojiStyle } from 'emoji-picker-react';
import toast from 'react-hot-toast'; // Import react-hot-toast
import { Toaster } from 'react-hot-toast'; // Import Toaster for react-hot-toast

interface Categoria {
  id: number;
  name: string;
  created_at?: string;
}

interface CategoriaFormData {
  name: string;
}

// Interfaz para los posibles formatos de respuesta de la API
interface ApiResponse {
  id?: number;
  name?: string;
  nombre?: string;
  nombre_categoria?: string;
  created_at?: string;
  [key: string]: any;
}

// Removed ICE_CREAM_EMOJIS constant

export default function CategoriesPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // New state for emoji picker visibility

  const [formData, setFormData] = useState<CategoriaFormData>({
    name: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  // Cargar categorías desde la API
  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND}/api/v1/categories`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg += ` - ${JSON.stringify(errorData)}`;
        } catch (e) {
          // Si no se puede parsear como JSON, usar el texto de la respuesta
          const errorText = await response.text();
          errorMsg += ` - ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`;
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      
      // Verificar la estructura de los datos
      if (Array.isArray(data)) {
        // Si es un array, usarlo directamente
        const formattedData = data.map((item: ApiResponse) => {
          // Asegurar que cada item tenga las propiedades necesarias
          return {
            id: item.id || 0,
            name: item.name || item.nombre || item.nombre_categoria || '(Sin nombre)',
            created_at: item.created_at
          };
        });
        setCategorias(formattedData);
      } else if (data && typeof data === 'object') {
        // Si es un objeto, intentar extraer los datos
        let categoriesArray: any[] = [];
        
        // Intentar diferentes propiedades donde podrían estar las categorías
        if (Array.isArray(data.categories)) {
          categoriesArray = data.categories;
        } else if (Array.isArray(data.data)) {
          categoriesArray = data.data;
        } else if (Array.isArray(data.items)) {
          categoriesArray = data.items;
        } else if (Array.isArray(data.results)) {
          categoriesArray = data.results;
        } else {
          // Si no hay arrays en propiedades conocidas, tratar el objeto como una categoría individual
          categoriesArray = [data];
        }
        
        const formattedData = categoriesArray.map((item: ApiResponse) => {
          return {
            id: item.id || 0,
            name: item.name || item.nombre || item.nombre_categoria || '(Sin nombre)',
            created_at: item.created_at
          };
        });
        setCategorias(formattedData);
      } else {
        throw new Error('Formato de respuesta no reconocido');
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Mostrar mensaje de éxito temporalmente
  // useEffect(() => {
  //   if (successMessage) {
  //     const timer = setTimeout(() => {
  //       setSuccessMessage('');
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [successMessage]); // Removed

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  const handleAddOrUpdateCategoria = useCallback(async () => {
    if (!formData.name.trim()) {
      alert('Por favor, ingrese el nombre de la categoría.');
      return;
    }

    setSubmitting(true);
    setError(null);
    // setSuccessMessage(''); // Removed

    try {
      const headers = getAuthHeaders();
      
      if (editingId) {
        // Actualizar categoría existente
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/categories/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name: formData.name.trim() })
        });
        
        if (!response.ok) {
          throw new Error('Error al actualizar la categoría');
        }
        
        toast.success(`Categoría "${formData.name.trim()}" actualizada con éxito`); // Use react-hot-toast
        // setSuccessMessage(''); // Clear local success message // Removed
        
        // Recargar todas las categorías para asegurar datos actualizados
        await fetchCategorias();
      } else {
        // Crear nueva categoría
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/categories`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: formData.name.trim() })
        });
        
        if (!response.ok) {
          throw new Error('Error al crear la categoría');
        }
        
        toast.success(`Categoría "${formData.name.trim()}" creada con éxito`); // Use react-hot-toast
        // setSuccessMessage(''); // Clear local success message // Removed

        // Recargar todas las categorías para asegurar datos actualizados
        await fetchCategorias();
      }
      
      // Limpiar el formulario y el estado de edición
      setFormData({ name: '' });
      setEditingId(null);
      setShowEmojiPicker(false); // Close emoji picker after submission
    } catch (error: any) {
      setError(error.message || 'Error al guardar la categoría');
      toast.error(error.message || 'Error al guardar la categoría'); // Use react-hot-toast
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingId, fetchCategorias]);

  const handleEditCategoria = useCallback((categoria: Categoria) => {
    setFormData({ name: categoria.name });
    setEditingId(categoria.id);
    setShowEmojiPicker(false); // Close emoji picker when editing
  }, []);

  const handleDeleteCategoria = useCallback(async (id: number) => {
    try {
      setSubmitting(true);
      const headers = getAuthHeaders();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la categoría');
      }
      
      toast.success('Categoría eliminada con éxito'); // Use react-hot-toast
      // setSuccessMessage(''); // Clear local success message // Removed

      // Recargar todas las categorías para asegurar datos actualizados
      await fetchCategorias();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la categoría'); // Use react-hot-toast
    } finally {
      setSubmitting(false);
    }
  }, [fetchCategorias]);

  const handleCancelEdit = useCallback(() => {
    setFormData({ name: '' });
    setEditingId(null);
    setShowEmojiPicker(false); // Close emoji picker on cancel
  }, []);

  // Function to handle emoji selection
  const onEmojiClick = useCallback((emojiData: EmojiClickData) => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name + emojiData.emoji,
    }));
    setShowEmojiPicker(false); // Close picker after selecting emoji
  }, []);

  // Manejar recarga manual de categorías
  const handleRefresh = () => {
    fetchCategorias();
  };

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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Categorías</h1>
      
      {/* {successMessage && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )} */}
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Categoría *
            </label>
            <div className="flex items-center"> {/* Flex container for input and emoji button */}
              <input
                type="text"
                id="name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Bebidas, Comida, etc."
                disabled={submitting}
              />
              <Button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                variant="secondary"
                size="sm"
                className="ml-2 mt-1"
                disabled={submitting}
              >
                😀
              </Button>
            </div>
            {showEmojiPicker && (
              <div className="absolute z-10 mt-2"> {/* Position the picker absolutely */}
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  emojiStyle={EmojiStyle.APPLE}
                  width={300}
                  height={400}
                  categories={[
                    { category: Categories.FOOD_DRINK, name: 'Comida y Bebida' },
                    { category: Categories.ACTIVITIES, name: 'Actividades' },
                    { category: Categories.TRAVEL_PLACES, name: 'Viajes y Lugares' },
                    { category: Categories.SMILEYS_PEOPLE, name: 'Caras y Personas' },
                    { category: Categories.ANIMALS_NATURE, name: 'Animales y Naturaleza' },
                    { category: Categories.OBJECTS, name: 'Objetos' },
                    { category: Categories.SYMBOLS, name: 'Símbolos' },
                    { category: Categories.FLAGS, name: 'Banderas' },
                  ]}
                  hiddenEmojis={[
                    // Common food items not typically found in an ice cream shop
                    '1f354', // Hamburger
                    '1f35f', // French Fries
                    '1f355', // Slice of Pizza
                    '1f356', // Meat on Bone
                    '1f357', // Poultry Leg
                    '1f358', // Dango
                    '1f359', // Rice Cracker
                    '1f35a', // Cooked Rice
                    '1f35b', // Curry and Rice
                    '1f35c', // Steaming Bowl
                    '1f35d', // Spaghetti
                    '1f35e', // Bread
                    '1f360', // Roasted Sweet Potato
                    '1f361', // Oden
                    '1f362', // Sushi
                    '1f363', // Fried Shrimp
                    '1f364', // Fish Cake With Swirl
                    '1f371', // Bento Box
                    '1f372', // Pot of Food
                    '1f373', // Cooking
                    '1f374', // Fork and Knife
                    '1f375', // Teacup Without Handle
                    '1f376', // Sake Bottle and Cup
                    '1f377', // Wine Glass
                    '1f378', // Cocktail Glass
                    '1f379', // Tropical Drink
                    '1f37a', // Beer Mug
                    '1f37b', // Clinking Beer Mugs
                    '1f963', // Bowl with Spoon
                    '1f95b', // Glass of Milk (Keeping 🥛 as it can be used for milkshakes)
                    '1f9c0', // Cheese Wedge
                    '1f95e', // Pancake
                    '1f95f', // Dumpling
                    '1f960', // Fortune Cookie
                    '1f961', // Takeout Box
                    '1f969', // Cut of Meat
                    '1f951', // Avocado
                    '1f952', // Cucumber
                    '1f953', // Bacon
                    '1f954', // Potato
                    '1f955', // Carrot
                    '1f956', // Baguette Bread
                    '1f957', // Green Salad
                    '1f958', // Shallow Pan of Food
                    '1f959', // Stuffed Flatbread
                    '1f95a', // Egg
                    '1f967', // Croissant
                    '1f968', // Avocado
                    '1f9c2', // Salt
                    '1f9c3', // Canned Food
                    '1f9c4', // Lobster
                    '1f9c5', // Shrimp
                    '1f9c6', // Squinting Face with Tongue
                    '1f9c7', // Face with Monocle
                    '1f9c8', // Hot Dog
                    '1f9c9', // Taco
                    '1f9ca', // Burrito
                    '1f9cb', // Stuffed Flatbread
                    '1f9cc', // Fried Shrimp
                    '1f9cd', // Seafood
                    '1f9ce', // Lobster
                    '1f9cf', // Bagel
                    '1f9e9', // Soft Ice Cream
                    '1f962', // Salad Bowl
                    '1f96c', // Leafy Green
                    '1f95c', // Peanuts
                    '1f365', // Fish Cake with Swirl (Narutomaki)
                  ]}
                />
              </div>
            )}
          </div>

          
        </div>
        
        
        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <Button 
              variant="secondary" 
              onClick={handleCancelEdit}
              disabled={submitting}
            >
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleAddOrUpdateCategoria}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editingId ? 'Actualizando...' : 'Agregando...'}
              </>
            ) : editingId ? (
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Listado de Categorías ({categorias.length})
          </h2>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={loading}
            title="Recargar categorías"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
            <span className="ml-2 text-gray-500">Cargando categorías...</span>
          </div>
        ) : categorias.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay categorías registradas. Agrega una para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {categoria.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {categoria.name || '(Sin nombre)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditCategoria(categoria)}
                          title="Editar categoría"
                          disabled={submitting}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar la categoría "${categoria.name}"?`)) {
                              handleDeleteCategoria(categoria.id);
                            }
                          }}
                          title="Eliminar categoría"
                          disabled={submitting}
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
      {/* Toaster for react-hot-toast */}
      <Toaster />
    </div>
  );
}