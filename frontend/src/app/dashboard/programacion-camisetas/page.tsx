"use client";

import React, { useState, useEffect } from 'react';
import { Shirt, Palette, Save, RotateCcw } from 'lucide-react';

interface DaySchedule {
  day: string;
  dayName: string;
  color: string;
  colorName: string;
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

export default function ProgramacionCamisetas() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 'monday', dayName: 'Lunes', color: '#ffffff', colorName: 'Blanco' },
    { day: 'tuesday', dayName: 'Martes', color: '#ec4899', colorName: 'Rosa' },
    { day: 'wednesday', dayName: 'Miércoles', color: '#8b5cf6', colorName: 'Morado' },
    { day: 'thursday', dayName: 'Jueves', color: '#6b7280', colorName: 'Gris' },
    { day: 'friday', dayName: 'Viernes', color: '#dc2626', colorName: 'Rojo Oscuro' },
    { day: 'saturday', dayName: 'Sábado', color: '#ec4899', colorName: 'Rosa' },
    { day: 'sunday', dayName: 'Domingo', color: '#8b5cf6', colorName: 'Morado' },
  ]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<string>('');

  useEffect(() => {
    // Obtener el día actual
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    setCurrentDay(dayNames[today.getDay()]);

    // Cargar programación guardada del localStorage
    const savedSchedule = localStorage.getItem('camiseta-schedule');
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
  }, []);

  const updateDayColor = (day: string, color: string, colorName: string) => {
    const updatedSchedule = schedule.map(item =>
      item.day === day ? { ...item, color, colorName } : item
    );
    setSchedule(updatedSchedule);
  };

  const saveSchedule = () => {
    localStorage.setItem('camiseta-schedule', JSON.stringify(schedule));
    alert('Programación guardada exitosamente!');
  };

  const resetSchedule = () => {
    const defaultSchedule = [
      { day: 'monday', dayName: 'Lunes', color: '#ffffff', colorName: 'Blanco' },
      { day: 'tuesday', dayName: 'Martes', color: '#ec4899', colorName: 'Rosa' },
      { day: 'wednesday', dayName: 'Miércoles', color: '#8b5cf6', colorName: 'Morado' },
      { day: 'thursday', dayName: 'Jueves', color: '#6b7280', colorName: 'Gris' },
      { day: 'friday', dayName: 'Viernes', color: '#dc2626', colorName: 'Rojo Oscuro' },
      { day: 'saturday', dayName: 'Sábado', color: '#ec4899', colorName: 'Rosa' },
      { day: 'sunday', dayName: 'Domingo', color: '#8b5cf6', colorName: 'Morado' },
    ];
    setSchedule(defaultSchedule);
    localStorage.setItem('camiseta-schedule', JSON.stringify(defaultSchedule));
  };

  const getCurrentDaySchedule = () => {
    return schedule.find(item => item.day === currentDay);
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
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restablecer
            </button>
            <button
              onClick={saveSchedule}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </button>
          </div>
        </div>
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
              key={daySchedule.day}
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
            El día actual aparece destacado en verde. Guarda tus cambios para mantener la programación.
          </p>
        </div>
      </div>
    </div>
  );
} 