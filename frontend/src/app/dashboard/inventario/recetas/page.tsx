// "use client"
// import React, { useState, useCallback, useMemo, useEffect } from 'react';
// import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
// import { Card, Button } from '../../../../../components/ui'; // Adjust path as needed

// interface Producto {
//   id: number;
//   nombre_producto: string;
// }

// interface Insumo {
//   id: number;
//   nombre_insumo: string;
//   unidad_medida: string; // e.g., 'gramos', 'ml', 'unidades'
// }

// interface Receta {
//   id: number;
//   id_producto: number;
//   id_insumo: number;
//   cantidad_utilizada: number;
//   unidad: string;
// }

// interface RecetaFormData {
//   id_producto: string;
//   id_insumo: string;
//   cantidad_utilizada: string;
//   unidad: string;
// }

// export default function RecipesPage() {
//   const [recetas, setRecetas] = useState<Receta[]>([
//     { id: 1, id_producto: 1, id_insumo: 101, cantidad_utilizada: 200, unidad: 'gramos' }, // Waffle Clásico -> Harina
//     { id: 2, id_producto: 1, id_insumo: 102, cantidad_utilizada: 2, unidad: 'unidades' },   // Waffle Clásico -> Huevos
//     { id: 3, id_producto: 3, id_insumo: 103, cantidad_utilizada: 150, unidad: 'ml' },    // Jugo de Naranja -> Naranja
//   ]);

//   const [productos, setProductos] = useState<Producto[]>([
//     { id: 1, nombre_producto: 'Waffle Clásico' },
//     { id: 2, nombre_producto: 'Waffle Especial' },
//     { id: 3, nombre_producto: 'Jugo de Naranja' },
//   ]);

//   const [insumos, setInsumos] = useState<Insumo[]>([
//     { id: 101, nombre_insumo: 'Harina', unidad_medida: 'gramos' },
//     { id: 102, nombre_insumo: 'Huevos', unidad_medida: 'unidades' },
//     { id: 103, nombre_insumo: 'Naranja', unidad_medida: 'unidades' },
//     { id: 104, nombre_insumo: 'Azúcar', unidad_medida: 'gramos' },
//     { id: 105, nombre_insumo: 'Leche', unidad_medida: 'ml' },
//   ]);

//   const [formData, setFormData] = useState<RecetaFormData>({
//     id_producto: '',
//     id_insumo: '',
//     cantidad_utilizada: '',
//     unidad: '',
//   });

//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [showAddForm, setShowAddForm] = useState(false);

//   // Initialize form with default values if available
//   useEffect(() => {
//     if (productos.length > 0 && formData.id_producto === '') {
//       setFormData(prev => ({ ...prev, id_producto: String(productos[0].id) }));
//     }
//     if (insumos.length > 0 && formData.id_insumo === '') {
//       setFormData(prev => ({ ...prev, id_insumo: String(insumos[0].id), unidad: insumos[0].unidad_medida }));
//     }
//   }, [productos, insumos, formData.id_producto, formData.id_insumo]);

//   const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
//     const { id, value } = e.target;
//     setFormData((prev) => {
//       const newFormData = { ...prev, [id]: value };
//       if (id === 'id_insumo') {
//         const selectedInsumo = insumos.find(ins => String(ins.id) === value);
//         if (selectedInsumo) {
//           newFormData.unidad = selectedInsumo.unidad_medida;
//         }
//       }
//       return newFormData;
//     });
//   }, [insumos]);

//   const handleAddOrUpdateReceta = useCallback(() => {
//     const parsedIdProducto = parseInt(formData.id_producto);
//     const parsedIdInsumo = parseInt(formData.id_insumo);
//     const parsedCantidad = parseFloat(formData.cantidad_utilizada);

//     if (isNaN(parsedIdProducto) || isNaN(parsedIdInsumo) || isNaN(parsedCantidad) || parsedCantidad <= 0 || !formData.unidad.trim()) {
//       alert('Por favor, complete todos los campos obligatorios y asegúrese de que la cantidad sea un número válido.');
//       return;
//     }

//     if (editingId) {
//       setRecetas((prev) =>
//         prev.map((r) =>
//           r.id === editingId
//             ? {
//                 ...r,
//                 id_producto: parsedIdProducto,
//                 id_insumo: parsedIdInsumo,
//                 cantidad_utilizada: parsedCantidad,
//                 unidad: formData.unidad.trim(),
//               }
//             : r
//         )
//       );
//       setEditingId(null);
//     } else {
//       const newId = recetas.length > 0 ? Math.max(...recetas.map(r => r.id)) + 1 : 1;
//       setRecetas((prev) => [
//         ...prev,
//         {
//           id: newId,
//           id_producto: parsedIdProducto,
//           id_insumo: parsedIdInsumo,
//           cantidad_utilizada: parsedCantidad,
//           unidad: formData.unidad.trim(),
//         },
//       ]);
//       setShowAddForm(false);
//     }
//     setFormData({ 
//       id_producto: String(productos[0]?.id || ''), 
//       id_insumo: String(insumos[0]?.id || ''), 
//       cantidad_utilizada: '', 
//       unidad: insumos[0]?.unidad_medida || ''
//     });
//   }, [formData, editingId, recetas, productos, insumos]);

//   const handleEditReceta = useCallback((receta: Receta) => {
//     setFormData({
//       id_producto: String(receta.id_producto),
//       id_insumo: String(receta.id_insumo),
//       cantidad_utilizada: String(receta.cantidad_utilizada),
//       unidad: receta.unidad,
//     });
//     setEditingId(receta.id);
//     setShowAddForm(true); // Show form for editing
//   }, []);

//   const handleDeleteReceta = useCallback((id: number) => {
//     if (confirm('¿Está seguro de eliminar esta receta?')) {
//       setRecetas((prev) => prev.filter((r) => r.id !== id));
//     }
//   }, []);

//   const handleCancel = useCallback(() => {
//     setEditingId(null);
//     setShowAddForm(false);
//     setFormData({ 
//       id_producto: String(productos[0]?.id || ''), 
//       id_insumo: String(insumos[0]?.id || ''), 
//       cantidad_utilizada: '', 
//       unidad: insumos[0]?.unidad_medida || ''
//     });
//   }, [productos, insumos]);

//   const getProductName = useCallback((id: number) => {
//     const product = productos.find(p => p.id === id);
//     return product ? product.nombre_producto : 'N/A';
//   }, [productos]);

//   const getInsumoName = useCallback((id: number) => {
//     const insumo = insumos.find(i => i.id === id);
//     return insumo ? insumo.nombre_insumo : 'N/A';
//   }, [insumos]);

//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Recetas</h1>

//       <div className="mb-8 flex justify-start">
//         <Button onClick={() => setShowAddForm(true)}>
//           <Plus className="h-4 w-4 mr-2" />
//           Agregar Nueva Receta
//         </Button>
//       </div>

//       {showAddForm && (
//         <Card className="mb-6">
//           <h2 className="text-xl font-semibold text-gray-900 mb-4">
//             {editingId ? 'Editar Receta' : 'Agregar Nueva Receta'}
//           </h2>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label htmlFor="id_producto" className="block text-sm font-medium text-gray-700 mb-1">
//                 Producto *
//               </label>
//               <select
//                 id="id_producto"
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={formData.id_producto}
//                 onChange={handleChange}
//               >
//                 <option value="">Seleccione un producto</option>
//                 {productos.map(prod => (
//                   <option key={prod.id} value={prod.id}>{prod.nombre_producto}</option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label htmlFor="id_insumo" className="block text-sm font-medium text-gray-700 mb-1">
//                 Insumo *
//               </label>
//               <select
//                 id="id_insumo"
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={formData.id_insumo}
//                 onChange={handleChange}
//               >
//                 <option value="">Seleccione un insumo</option>
//                 {insumos.map(ins => (
//                   <option key={ins.id} value={ins.id}>{ins.nombre_insumo} ({ins.unidad_medida})</option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label htmlFor="cantidad_utilizada" className="block text-sm font-medium text-gray-700 mb-1">
//                 Cantidad Utilizada *
//               </label>
//               <input
//                 type="number"
//                 id="cantidad_utilizada"
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={formData.cantidad_utilizada}
//                 onChange={handleChange}
//                 placeholder="Ej: 200, 2.5"
//                 min="0"
//                 step="0.01"
//               />
//             </div>
//             <div>
//               <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 mb-1">
//                 Unidad
//               </label>
//               <input
//                 type="text"
//                 id="unidad"
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={formData.unidad}
//                 onChange={handleChange}
//                 placeholder="Ej: gramos, ml, unidades"
//                 readOnly // Unit is derived from insumo selection
//               />
//             </div>
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             {editingId && (
//               <Button variant="secondary" onClick={handleCancel}>
//                 <X className="h-4 w-4 mr-2" />
//                 Cancelar
//               </Button>
//             )}
//             <Button onClick={handleAddOrUpdateReceta}>
//               {editingId ? (
//                 <>
//                   <Save className="h-4 w-4 mr-2" />
//                   Actualizar Receta
//                 </>
//               ) : (
//                 <>
//                   <Plus className="h-4 w-4 mr-2" />
//                   Agregar Receta
//                 </>
//               )}
//             </Button>
//           </div>
//         </Card>
//       )}

//       <Card>
//         <h2 className="text-xl font-semibold text-gray-900 mb-4">
//           Listado de Recetas ({recetas.length})
//         </h2>

//         {recetas.length === 0 ? (
//           <div className="text-center py-8 text-gray-500">
//             No hay recetas registradas. Agrega una para comenzar.
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Producto
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Insumo
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Cantidad Utilizada
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Unidad
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Acciones
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {recetas.map((receta) => (
//                   <tr key={receta.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                       {getProductName(receta.id_producto)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {getInsumoName(receta.id_insumo)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {receta.cantidad_utilizada}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {receta.unidad}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       <div className="flex space-x-2">
//                         <Button
//                           size="sm"
//                           onClick={() => handleEditReceta(receta)}
//                           title="Editar receta"
//                         >
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button
//                           variant="danger"
//                           size="sm"
//                           onClick={() => handleDeleteReceta(receta.id)}
//                           title="Eliminar receta"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// } 