import React from 'react';
import { Button, Badge } from './ui';
import { Plus } from 'lucide-react';

const ItemListDisplay = ({ items, onAddItem, formatPrice, badgeVariant }) => {
  // Log items received by the component
  React.useEffect(() => {
    console.log("Items received in ItemListDisplay:", items);
  }, [items]);

  const handleAddItem = (item) => {
    console.log("Add button clicked for item:", item);
    onAddItem(item);
  };

  const getStockDisplay = (item) => {
    // Verificar si el stock es un número
    const stockNum = Number(item.stock);
    
    if (isNaN(stockNum)) {
      return item.stock; // Si no es un número, mostrar como está
    } else if (stockNum === 0) {
      return "Agotado";
    } else if (stockNum < 0) {
      return "Bajo demanda";
    } else {
      return stockNum; // Si es un número válido, mostrar el número
    }
  };

  const getStockColor = (item) => {
    const stockNum = Number(item.stock);
    
    if (isNaN(stockNum) || stockNum < 0) {
      return "text-blue-600"; // Bajo demanda
    } else if (stockNum === 0) {
      return "text-red-600 font-bold"; // Agotado
    } else if (stockNum <= 5) {
      return "text-yellow-600"; // Bajo
    } else {
      return "text-green-600"; // Bien
    }
  };

  return (
    <div className="space-y-3 max-h-[calc(100vh-250px)] sm:max-h-96 overflow-y-auto touch-scroll">
      {items && items.length > 0 ? (
        items.map((item) => {
          // Corregido: Permitir agregar productos con stock "Bajo demanda"
          const stockNum = Number(item.stock);
          const isDisabled = !isNaN(stockNum) && stockNum === 0;
          
          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                isDisabled ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex-1 mb-2 sm:mb-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">{item.nombre}</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {formatPrice(item.precio)} | Stock: <span className={getStockColor(item)}>{getStockDisplay(item)}</span>
                </p>
                <div className="mt-1">
                  <Badge variant={badgeVariant || (item.estado === "bajo" ? "warning" : item.estado === "agotado" ? "destructive" : "success")}>
                    {item.tipo}
                  </Badge>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleAddItem(item)} 
                disabled={isDisabled}
                variant={isDisabled ? "outline" : "default"}
                className="cursor-pointer w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-1" />
                {isDisabled ? "Agotado" : "Agregar"}
              </Button>
            </div>
          );
        })
      ) : (
        <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
          No se encontraron items con ese criterio de búsqueda
        </p>
      )}
    </div>
  );
};

export default ItemListDisplay; 