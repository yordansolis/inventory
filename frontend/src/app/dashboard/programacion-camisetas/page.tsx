"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Shirt, Palette, Save, RotateCcw, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster

interface DaySchedule {
  day: string;
  dayName: string;
  color: string;
  colorName: string;
}

interface ScheduleResponse {
  success: boolean;
  schedule: DaySchedule[];
  updated_at: string | null;
  updated_by: string | null;
}

interface UpdateResponse {
  success: boolean;
  message: string;
  day: string;
  color: string;
  colorName: string;
  updated_at: string | null;
  updated_by: string | null;
}

const colors = [
  { value: '#ef4444', name: 'Rojo', hex: '#ef4444' },
  { value: '#3b82f6', name: 'Azul', hex: '#3b82f6' },
  { value: '#10b981', name: 'Verde', hex: '#10b981' },
  { value: '#f59e0b', name: 'Amarillo', hex: '#f59e0b' },
  { value: '#8b5cf6', name: 'Morado', hex: '#8b5cf6' },
  { value: '#ec4899', name: 'Rosa', hex: '#ec4899' },
  { value: '#ffffff', name: 'Blanco', hex: '#ffffff' },
  { value: '#1f2937', name: 'Negro', hex: '#1f2937' },
  { value: '#6b7280', name: 'Gris', hex: '#6b7280' },
  { value: '#dc2626', name: 'Rojo Oscuro', hex: '#dc2626' },
  { value: '#1e40af', name: 'Azul Marino', hex: '#1e40af' },
  { value: '#059669', name: 'Verde Oscuro', hex: '#059669' },
];

// Programación por defecto con orden fijo de días
const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: 'monday', dayName: 'Lunes', color: '#ffffff', colorName: 'Blanco' },
  { day: 'tuesday', dayName: 'Martes', color: '#ec4899', colorName: 'Rosa' },
  { day: 'wednesday', dayName: 'Miércoles', color: '#8b5cf6', colorName: 'Morado' },
  { day: 'thursday', dayName: 'Jueves', color: '#6b7280', colorName: 'Gris' },
  { day: 'friday', dayName: 'Viernes', color: '#dc2626', colorName: 'Rojo Oscuro' },
  { day: 'saturday', dayName: 'Sábado', color: '#ec4899', colorName: 'Rosa' },
  { day: 'sunday', dayName: 'Domingo', color: '#8b5cf6', colorName: 'Morado' },
];

export default function ProgramacionCamisetas() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [updatingDay, setUpdatingDay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);

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

  // Función para normalizar la programación con el orden correcto
  const normalizeSchedule = (apiSchedule: DaySchedule[]): DaySchedule[] => {
    const scheduleMap = new Map<string, DaySchedule>();
    
    // Crear un mapa con los datos de la API
    apiSchedule.forEach(day => {
      scheduleMap.set(day.day, day);
    });
    
    // Retornar en el orden correcto, usando defaults si faltan días
    return DEFAULT_SCHEDULE.map(defaultDay => 
      scheduleMap.get(defaultDay.day) || defaultDay
    );
  };

  // Función para cargar la programación desde la API
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }
      
      const response = await fetch(`${apiUrl}/api/v1/services/shirt-schedule`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al cargar la programación: ${response.status}`);
      }
      
      const data: ScheduleResponse = await response.json();
      
      if (data.success && data.schedule) {
        // Normalizar y ordenar la programación
        const normalizedSchedule = normalizeSchedule(data.schedule);
        setSchedule(normalizedSchedule);
        setLastUpdate(data.updated_at);
        setUpdatedBy(data.updated_by);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('camiseta-schedule', JSON.stringify(normalizedSchedule));
      }
    } catch (error) {
      console.error("Error al cargar la programación:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
      showErrorToast(error instanceof Error ? error.message : "Error al cargar la programación");
      
      // Intentar cargar desde localStorage como fallback
      const savedSchedule = localStorage.getItem('camiseta-schedule');
      if (savedSchedule) {
        try {
          const parsedSchedule = JSON.parse(savedSchedule);
          const normalizedSchedule = normalizeSchedule(parsedSchedule);
          setSchedule(normalizedSchedule);
          showSuccessToast('Se cargó la programación guardada localmente');
        } catch (e) {
          console.error("Error al parsear la programación guardada:", e);
          // Si hay error, usar la programación por defecto
          setSchedule(DEFAULT_SCHEDULE);
          showErrorToast('Error al cargar la programación guardada. Se usarán valores predeterminados');
        }
      } else {
        showErrorToast('No se pudo cargar la programación. Se usarán valores predeterminados');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar un solo día
  const updateSingleDay = async (day: string, color: string, colorName: string) => {
    try {
      setUpdatingDay(day);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }
      
      console.log(`Actualizando color para ${day} a ${color} (${colorName})`);
      
      const response = await fetch(`${apiUrl}/api/v1/services/shirt-schedule/${day}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          color,
          colorName
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Error al actualizar el color: ${response.status}`);
      }
      
      const data: UpdateResponse = await response.json();
      console.log("Respuesta de la API:", data);
      
      if (data.success) {
        // Actualizar información de la última actualización
        setLastUpdate(data.updated_at);
        setUpdatedBy(data.updated_by);
        
        // Actualizar localStorage
        const updatedSchedule = schedule.map(item =>
          item.day === day ? { ...item, color, colorName } : item
        );
        localStorage.setItem('camiseta-schedule', JSON.stringify(updatedSchedule));
        
        // Mostrar mensaje de éxito
        showSuccessToast(`Color de ${getDayName(day)} actualizado a ${colorName}`);
      } else {
        throw new Error("No se pudo actualizar el color");
      }
    } catch (error) {
      console.error(`Error al actualizar el color para ${day}:`, error);
      setError(error instanceof Error ? error.message : "Error desconocido");
      
      // Mostrar mensaje de error
      showErrorToast(`Error al actualizar el color para ${getDayName(day)}`);
      
      // Revertir el cambio en el estado local si hay error
      await fetchSchedule();
    } finally {
      setUpdatingDay(null);
    }
  };
  
  // Función auxiliar para obtener el nombre del día
  const getDayName = (day: string): string => {
    const dayMap: {[key: string]: string} = {
      'monday': 'Lunes',
      'tuesday': 'Martes',
      'wednesday': 'Miércoles',
      'thursday': 'Jueves',
      'friday': 'Viernes',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return dayMap[day] || day;
  };

  // Función para guardar la programación completa en la API
  const saveScheduleToAPI = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }
      
      console.log("Enviando programación completa a la API:", { schedule });
      
      const response = await fetch(`${apiUrl}/api/v1/services/shirt-schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schedule: schedule
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Error al guardar la programación: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Respuesta de la API:", data);
      
      if (data.success) {
        setLastUpdate(data.updated_at);
        setUpdatedBy(data.updated_by);
        
        localStorage.setItem('camiseta-schedule', JSON.stringify(schedule));
        showSuccessToast('¡Programación guardada exitosamente!');
      } else {
        throw new Error("No se pudo guardar la programación");
      }
    } catch (error) {
      console.error("Error al guardar la programación:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
      
      localStorage.setItem('camiseta-schedule', JSON.stringify(schedule));
      showErrorToast('No se pudo guardar en el servidor, pero se guardó localmente.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Obtener el día actual
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    setCurrentDay(dayNames[today.getDay()]);

    // Cargar programación desde la API
    fetchSchedule();
  }, []);

  const updateDayColor = (day: string, color: string, colorName: string) => {
    // Actualizar el estado local inmediatamente para una UI responsiva
    const updatedSchedule = schedule.map(item =>
      item.day === day ? { ...item, color, colorName } : item
    );
    setSchedule(updatedSchedule);
    
    // Enviar la actualización al servidor
    updateSingleDay(day, color, colorName);
  };

  const saveSchedule = () => {
    saveScheduleToAPI();
  };

  const resetSchedule = () => {
    setSchedule([...DEFAULT_SCHEDULE]);
    localStorage.setItem('camiseta-schedule', JSON.stringify(DEFAULT_SCHEDULE));
    showSuccessToast('Programación restablecida a los valores predeterminados');
  };

  const getCurrentDaySchedule = () => {
    return schedule.find(item => item.day === currentDay);
  };

  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return "N/A";
    
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateTimeStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shirt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Programación Uso de Camisetas</h1>
              <p className="text-gray-600">Planifica los colores de camiseta para cada día de la semana</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={resetSchedule}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving || !!updatingDay}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restablecer
            </button>
            <button
              onClick={saveSchedule}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={saving || !!updatingDay}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Todo
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Información de última actualización */}
        {(lastUpdate || loading) && (
          <div className="mt-4 text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {loading ? (
              <span className="flex items-center">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Cargando...
              </span>
            ) : (
              <span>
                Última actualización: {formatDateTime(lastUpdate)}
                {updatedBy && ` por ${updatedBy}`}
              </span>
            )}
          </div>
        )}
        
        {/* Mostrar errores si hay */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
      </div>

      {/* Día Actual */}
      {getCurrentDaySchedule() && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shirt className="h-5 w-5 mr-2 text-green-600" />
            Hoy es {getCurrentDaySchedule()?.dayName}
          </h2>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div 
              className="w-16 h-16 rounded-full border-4 border-gray-300 shadow-lg"
              style={{ backgroundColor: getCurrentDaySchedule()?.color }}
            ></div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Color del día: {getCurrentDaySchedule()?.colorName}
              </p>
              <p className="text-sm text-gray-600">
                Código: {getCurrentDaySchedule()?.color}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Programación Semanal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Palette className="h-5 w-5 mr-2 text-purple-600" />
          Programación Semanal
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {schedule.map((daySchedule) => (
            <div
              key={daySchedule.day} // Key única y estable
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                currentDay === daySchedule.day 
                  ? 'border-green-500 bg-green-50' 
                  : selectedDay === daySchedule.day 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white'
              }`}
              onClick={() => setSelectedDay(selectedDay === daySchedule.day ? null : daySchedule.day)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{daySchedule.dayName}</h3>
                {currentDay === daySchedule.day && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Hoy
                  </span>
                )}
                {updatingDay === daySchedule.day && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Guardando...
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3 mb-3">
                <div 
                  className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: daySchedule.color }}
                ></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{daySchedule.colorName}</p>
                  <p className="text-xs text-gray-500">{daySchedule.color}</p>
                </div>
              </div>

              {selectedDay === daySchedule.day && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Seleccionar color:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          color.value === '#ffffff' ? 'border-gray-300' : 'border-gray-200'
                        } ${daySchedule.color === color.value ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateDayColor(daySchedule.day, color.value, color.name);
                        }}
                        title={color.name}
                        disabled={!!updatingDay}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            💡 <strong>Instrucciones:</strong> Haz clic en cualquier día para seleccionar un color diferente. 
            El día actual aparece destacado en verde. Los cambios se guardan automáticamente al seleccionar un color.
            Usa el botón "Guardar Todo" si necesitas guardar la programación completa.
          </p>
        </div>
      </div>
      
      {/* Add Toaster component for toast notifications */}
      <Toaster />
    </div>
  );
} 