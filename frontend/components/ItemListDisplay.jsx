import React from 'react';
import { Button, Badge } from './ui';
import { Plus } from 'lucide-react';

const ItemListDisplay = ({ items, onAddItem, formatPrice, badgeVariant }) => {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.nombre}</p>
              <p className="text-sm text-gray-600">
                {formatPrice(item.precio)} | Stock: {item.stock}
              </p>
              <Badge variant={badgeVariant || (item.estado === "bajo" ? "warning" : "success")}>
                {item.tipo}
              </Badge>
            </div>
            <Button 
              size="sm" 
              onClick={() => onAddItem(item)} 
              disabled={item.stock === 0 || (typeof item.stock === 'number' && item.stock <= 0)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">
          No se encontraron items con ese criterio de búsqueda
        </p>
      )}
    </div>
  );
};

export default ItemListDisplay; 