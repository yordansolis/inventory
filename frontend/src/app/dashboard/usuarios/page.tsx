"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus,
  Edit,
  Search,
  X,
  Save,
  CheckCircle,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getAuthHeaders } from '../../utils/auth';
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster

interface User {
  id: number;
  username: string;
  email: string;
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
  permisos: {
    facturar: boolean;
    verVentas: boolean;
  };
}

// Switch component
const Switch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`${checked ? 'bg-blue-600' : 'bg-gray-200'} 
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span
        aria-hidden="true"
        className={`${checked ? 'translate-x-5' : 'translate-x-0'}
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out`}
      />
    </button>
  );
};

export default function UsersManagement() {
  // Estado para manejar usuarios
  const [users, setUsers] = useState<User[]>([]);

  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para manejo de modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(''); // Keep fetchError for initial load errors
  const [showPassword, setShowPassword] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Custom toast styles
  const showSuccessToast = useCallback((message: string) => {
    toast.success(message, {
      duration: 3000,
      position: "top-center",
      style: {
        background: '#10B981',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: 'white',
        secondary: '#10B981',
      },
    });
  }, []);

  const showErrorToast = useCallback((message: string) => {
    toast.error(message, {
      duration: 4000,
      position: "top-center",
      style: {
        background: '#EF4444',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: 'white',
        secondary: '#EF4444',
      },
    });
  }, []);

  // Manejar cambio de estado de usuario
  const handleToggleStatus = useCallback(async (id: number) => {
    try {
      const userToToggle = users.find(u => u.id === id);
      if (!userToToggle) return;
      
      const currentStatus = userToToggle.estado;
      const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
      const headers = getAuthHeaders();
      
      let response;
      if (newStatus === 'inactivo') {
        // Desactivar usuario (usar DELETE)
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/admin/users/${id}`, {
          method: 'DELETE',
          headers
        });
      } else {
        // Activar usuario (usar PATCH)
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/admin/users/${id}/activate`, {
          method: 'PATCH',
          headers
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al cambiar estado del usuario');
      }
      
      // Si la operación fue exitosa, actualizar la lista de usuarios
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === id 
          ? { ...user, estado: newStatus } 
          : user
      ));

      showSuccessToast(`Usuario "${userToToggle.username}" ${newStatus === 'activo' ? 'activado' : 'desactivado'} con éxito`);

    } catch (error: any) {
      console.error('Error al cambiar estado del usuario:', error);
      showErrorToast(error.message || 'Error al cambiar estado del usuario');
    }
  }, [users, showSuccessToast, showErrorToast]);

  // Handle status toggle confirmation with custom toast
  const handleToggleStatusConfirmation = useCallback((user: User) => {
    const newStatus = user.estado === 'activo' ? 'inactivo' : 'activo';
    toast((t) => (
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">
          ¿Está seguro de {newStatus === 'inactivo' ? 'desactivar' : 'activar'} a {user.username}?
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              handleToggleStatus(user.id);
              toast.dismiss(t.id);
            }}
            className={`${newStatus === 'inactivo' ? 'bg-red-600' : 'bg-green-600'} text-white px-3 py-1 rounded-md text-xs`}
          >
            {newStatus === 'inactivo' ? 'Desactivar' : 'Activar'}
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-center",
    });
  }, [handleToggleStatus]);

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener usuarios actuales para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  
  // Cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Cargar usuarios desde la API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setFetchError('');
      
      try {
        const headers = getAuthHeaders();
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/admin/users`, {
          method: 'GET',
          headers
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al cargar usuarios');
        }
        
        const data = await response.json();
        
        // Transformar los datos si es necesario para adaptarlos a la interfaz User
        const formattedUsers = data.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          estado: user.is_active ? 'activo' : 'inactivo',
          fechaCreacion: new Date(user.created_at || Date.now()).toLocaleDateString('es-CO'),
          permisos: {
            facturar: user.permissions?.facturar || false,
            verVentas: user.permissions?.verVentas || false
          }
        }));
        // console.log(formattedUsers);
        
        setUsers(formattedUsers);
      } catch (error: any) {
        console.error('Error al cargar usuarios:', error);
        setFetchError(error.message || 'Error al cargar la lista de usuarios');
        showErrorToast(error.message || 'Error al cargar la lista de usuarios');
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Resetear la página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Manejar apertura del modal para crear/editar usuario
  const handleOpenModal = useCallback((user: User | null = null) => {
    if (user) {
      setCurrentUser({
        id: user.id,
        username: user.username,
        email: user.email,
        estado: user.estado,
        permisos: user.permisos || { facturar: false, verVentas: false }
      });
      setIsEditing(true);
    } else {
      setCurrentUser({
        username: '',
        email: '',
        password: '',
        estado: 'activo',
        permisos: {
          facturar: true, // Por defecto activado
          verVentas: false
        }
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
    // Removed setError('') as it's no longer used for modal-specific errors
  }, []);

  // Manejar cierre del modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentUser(null);
    // Removed setError('') as it's no longer used for modal-specific errors
  }, []);

  // Manejar guardado de usuario
  const handleSaveUser = useCallback(async () => {
    if (!currentUser) return;
    
    // Validaciones básicas
    if (!currentUser.username || !currentUser.email || (!isEditing && !currentUser.password)) {
      showErrorToast('Por favor completa todos los campos obligatorios');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditing) {
        // Preparar datos para actualización
        const updateData: any = {
          username: currentUser.username,
          email: currentUser.email,
          permissions: currentUser.permisos
        };
        
        // Solo incluir contraseña si se ha proporcionado una nueva
        if (currentUser.password) {
          updateData.password = currentUser.password;
        }
        
        const headers = getAuthHeaders();
        
        // Llamada a la API para actualizar usuario
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/admin/users/${currentUser.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al actualizar usuario');
        }
        
        // Actualizar la lista de usuarios
        const updatedUser = await response.json();
        setUsers(users.map(user => user.id === currentUser.id ? {
          ...user,
          username: updatedUser.username,
          email: updatedUser.email,
          estado: updatedUser.is_active ? 'activo' : 'inactivo',
          fechaCreacion: new Date().toLocaleDateString('es-CO'), // Update creation date to current for consistency
          permisos: updatedUser.permissions
        } : user));

        showSuccessToast(`Usuario "${updatedUser.username}" actualizado con éxito`);

      } else {
        // Llamada a la API para crear usuario (corregido para usar endpoint de admin)
        const headers = getAuthHeaders(); // Añadir cabeceras de autenticación
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/admin/users`, { // Endpoint corregido
          method: 'POST',
          headers, // Usar las cabeceras de autenticación
          body: JSON.stringify({
            username: currentUser.username,
            email: currentUser.email,
            password: currentUser.password,
            permissions: currentUser.permisos
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al crear usuario');
        }
        
        const newUser = await response.json();
        
        // Añadir el nuevo usuario a la lista
        setUsers([...users, {
          id: newUser.id || users.length + 1,
          username: currentUser.username,
          email: currentUser.email,
          estado: 'activo',
          fechaCreacion: new Date().toLocaleDateString('es-CO'),
          permisos: currentUser.permisos
        }]);

        showSuccessToast(`Usuario "${newUser.username}" creado con éxito`);
      }
      
      handleCloseModal();
    } catch (error: any) {
      showErrorToast(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  }, [currentUser, isEditing, users, handleCloseModal, showSuccessToast, showErrorToast]);

  // Manejar mostrar/ocultar contraseña
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Componente Card personalizado
  const Card = useMemo(() => ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  ), []);

  // Componente Badge personalizado
  const Badge = useMemo(() => ({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: "default" | "success" | "info" | "warning" | "danger"; className?: string }) => {
    const variants = {
      default: "bg-gray-100 text-gray-800",
      success: "bg-green-100 text-green-800",
      info: "bg-blue-100 text-blue-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800"
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${variants[variant]} ${className}`}>
        {children}
      </span>
    );
  }, []);

  // Componente Button personalizado
  const Button = useMemo(() => ({ children, variant = "default", size = "default", className = "", disabled = false, ...props }: { children: React.ReactNode; variant?: "default" | "danger" | "outline"; size?: "default" | "sm"; className?: string; disabled?: boolean; [key: string]: any }) => {
    const variants = {
      default: "bg-gray-900 text-white hover:bg-gray-800",
      danger: "bg-red-600 text-white hover:bg-red-700",
      outline: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
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
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          Administra los usuarios del sistema
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por usuario o email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => handleOpenModal()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        {/* Removed fetchError display as it will be handled by toast */}
        
        {loadingUsers ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500">Cargando usuarios...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">{user.username?.charAt(0) || '?'}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <Badge variant={user.estado === 'activo' ? 'success' : 'danger'}>
                            {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {user.permisos?.facturar && (
                            <Badge variant="info" className="text-xs">
                              Facturación
                            </Badge>
                          )}
                          {user.permisos?.verVentas && (
                            <Badge variant="info" className="text-xs">
                              Ver Ventas
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.fechaCreacion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleToggleStatusConfirmation(user)}
                          >
                            {user.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'No se encontraron usuarios con esa búsqueda' : 'No hay usuarios disponibles'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 px-2">
              <div className="text-sm text-gray-600">
                {filteredUsers.length > 0 ? 
                  `Mostrando ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredUsers.length)} de ${filteredUsers.length} usuarios` :
                  `0 usuarios encontrados`
                }
              </div>
              {filteredUsers.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } p-2 rounded-md`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page numbers - show limited range */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.max(1, Math.min(5, totalPages)) }).map((_, idx) => {
                      // Calculate which page numbers to show
                      let pageNum;
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        // If at start, show first 5
                        pageNum = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // If at end, show last 5
                        pageNum = totalPages - 4 + idx;
                      } else {
                        // Otherwise show current page and 2 on each side
                        pageNum = currentPage - 2 + idx;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md ${
                            currentPage === pageNum
                              ? 'bg-gray-900 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`${
                      currentPage === totalPages || totalPages === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } p-2 rounded-md`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Modal para crear/editar usuario */}
      {isModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {/* Removed old error display */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    id="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentUser.username}
                    onChange={(e) => setCurrentUser({...currentUser, username: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentUser.email}
                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Permisos
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">Permiso para Facturar</span>
                        <span className="text-sm text-gray-500">Permite al usuario crear y gestionar facturas</span>
                      </div>
                      <Switch
                        checked={currentUser.permisos?.facturar || false}
                        onChange={(checked) => setCurrentUser({
                          ...currentUser,
                          permisos: {
                            ...currentUser.permisos,
                            facturar: checked
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">Permiso para Ver Ventas del Día</span>
                        <span className="text-sm text-gray-500">Permite al usuario ver el reporte de ventas diarias</span>
                        {currentUser.role_id !== 1 && (
                          <span className="text-xs text-red-500 mt-1">Solo disponible para administradores</span>
                        )}
                      </div>
                      <Switch
                        checked={currentUser.permisos?.verVentas || false}
                        onChange={(checked) => setCurrentUser({
                          ...currentUser,
                          permisos: {
                            ...currentUser.permisos,
                            verVentas: checked
                          }
                        })}
                        disabled={currentUser.role_id !== 1}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      {isEditing ? 'Nueva Contraseña' : 'Contraseña'}
                    </label>
                    {isEditing && (
                      <span className="text-xs text-gray-500">(opcional)</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentUser.password || ''}
                      onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                      placeholder={isEditing ? "Dejar en blanco para mantener la actual" : ""}
                      required={!isEditing}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    La contraseña debe contener al menos 8 caracteres, incluyendo una mayúscula y un carácter especial.
                  </p>
                </div>
                {isEditing && (
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          name="estado"
                          checked={currentUser.estado === 'activo'}
                          onChange={() => setCurrentUser({...currentUser, estado: 'activo'})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Activo</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          name="estado"
                          checked={currentUser.estado === 'inactivo'}
                          onChange={() => setCurrentUser({...currentUser, estado: 'inactivo'})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Inactivo</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveUser}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </>
  );
}
