from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from .stock_service import StockService

router_services = APIRouter()

@router_services.get("/")
async def get_services():
    return {"message": " desde services"}

# Endpoints para gestión de stock
@router_services.get("/stock")
async def get_product_stock():
    """
    Obtiene el stock disponible de todos los productos basándose en los insumos disponibles.
    
    Calcula cuántas unidades de cada producto se pueden producir con los insumos actuales.
    """
    try:
        stock_data = StockService.calculate_product_stock()
        
        return {
            "total_productos": len(stock_data),
            "productos": stock_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al calcular el stock: {str(e)}"
        )

@router_services.get("/stock/low")
async def get_low_stock_products(
    min_stock: Optional[int] = Query(5, description="Umbral mínimo de stock")
):
    """
    Obtiene productos que están por agotarse.
    
    Args:
        min_stock: Umbral para considerar un producto con stock bajo (default: 5)
    """
    try:
        low_stock_products = StockService.get_low_stock_products(min_stock)
        
        return {
            "min_stock_threshold": min_stock,
            "total_productos_bajo_stock": len(low_stock_products),
            "productos": low_stock_products
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener productos con stock bajo: {str(e)}"
        )

@router_services.get("/stock/{product_id}")
async def get_product_stock_details(product_id: int):
    """
    Obtiene detalles del stock de un producto específico, incluyendo
    información sobre cada insumo y cuál limita la producción.
    """
    try:
        stock_details = StockService.get_product_stock_details(product_id)
        
        if not stock_details:
            raise HTTPException(
                status_code=404,
                detail=f"Producto con ID {product_id} no encontrado o no está activo"
            )
        
        return stock_details
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener detalles del stock: {str(e)}"
        )

@router_services.get("/stock/summary/overview")
async def get_stock_summary():
    """
    Obtiene un resumen general del estado del stock de todos los productos.
    
    Incluye:
    - Total de productos activos
    - Productos sin stock
    - Productos con stock bajo
    - Productos disponibles
    """
    try:
        summary = StockService.get_stock_summary()
        
        # Calcular porcentajes
        total = summary['total_productos']
        if total > 0:
            summary['porcentaje_sin_stock'] = round((summary['productos_sin_stock'] / total) * 100, 1)
            summary['porcentaje_stock_bajo'] = round((summary['productos_stock_bajo'] / total) * 100, 1)
            summary['porcentaje_disponibles'] = round((summary['productos_disponibles'] / total) * 100, 1)
        else:
            summary['porcentaje_sin_stock'] = 0
            summary['porcentaje_stock_bajo'] = 0
            summary['porcentaje_disponibles'] = 0
        
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener resumen del stock: {str(e)}"
        )