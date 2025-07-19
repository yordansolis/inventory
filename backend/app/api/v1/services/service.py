from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from .stock_service import StockService
from .purchase_service import PurchaseService
from .dashboard_service import router_dashboard
from .statistics_service import router_statistics
from .extract_service import router_extracts
from pydantic import BaseModel
from typing import List, Dict
from datetime import date
import pymysql
from database.db import get_db_connection

# Modelos Pydantic para validación
class ProductDetail(BaseModel):
    product_name: str
    product_variant: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float

class PurchaseCreate(BaseModel):
    invoice_number: str
    invoice_date: str  # Formato: dd/mm/yyyy
    invoice_time: str  # Formato: hh:mm:ss a.m./p.m.
    client_name: str
    seller_username: str
    client_phone: Optional[str] = None
    has_delivery: bool = False
    delivery_address: Optional[str] = None
    delivery_person: Optional[str] = None
    delivery_fee: float = 0.0
    subtotal_products: float
    total_amount: float
    amount_paid: float
    change_returned: float
    payment_method: str
    payment_reference: Optional[str] = None
    products: List[ProductDetail]

router_services = APIRouter()

# Incluir el router de dashboard
router_services.include_router(router_dashboard, prefix="/dashboard", tags=["dashboard"])

# Incluir el router de estadísticas
router_services.include_router(router_statistics, prefix="/statistics", tags=["statistics"])

# Incluir el router de extractos
router_services.include_router(router_extracts, prefix="/extracts", tags=["extracts"])

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

# Endpoints para gestión de compras/facturas
@router_services.post("/purchases/validate")
async def validate_purchase(purchase_data: PurchaseCreate):
    """
    Valida si hay suficientes insumos para crear una compra/factura.
    
    NO crea la compra, solo verifica la disponibilidad.
    """
    try:
        connection = get_db_connection()
        if not connection:
            raise HTTPException(
                status_code=500,
                detail="No se pudo establecer conexión con la base de datos"
            )
        
        cursor = None
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            
            validation_result = PurchaseService._validate_insumos_availability(
                cursor, 
                purchase_data.products
            )
            
            if validation_result['is_valid']:
                return {
                    'is_valid': True,
                    'message': 'Todos los insumos están disponibles'
                }
            else:
                return {
                    'is_valid': False,
                    'message': 'No hay suficientes insumos',
                    'errors': validation_result['errors']
                }
                
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al validar la compra: {str(e)}"
        )

@router_services.post("/purchases")
async def create_purchase(purchase_data: PurchaseCreate):
    """
    Crea una nueva compra/factura con todos sus detalles.
    
    Incluye información del cliente, vendedor, productos, domicilio (si aplica) y pago.
    """
    try:
        print(f"Recibida solicitud para crear compra/factura: {purchase_data.invoice_number}")
        print(f"Productos en la solicitud: {len(purchase_data.products)}")
        
        result = PurchaseService.create_purchase(purchase_data.dict())
        print(f"Compra creada exitosamente: {result}")
        return result
    except ValueError as ve:
        print(f"Error de validación en compra: {str(ve)}")
        raise HTTPException(
            status_code=400,
            detail=str(ve)
        )
    except Exception as e:
        print(f"Error inesperado al crear compra: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la compra: {str(e)}"
        )

@router_services.get("/purchases/{invoice_number}")
async def get_purchase(invoice_number: str):
    """
    Obtiene los detalles completos de una compra por su número de factura.
    """
    try:
        purchase = PurchaseService.get_purchase_by_invoice(invoice_number)
        
        if not purchase:
            raise HTTPException(
                status_code=404,
                detail=f"Factura {invoice_number} no encontrada"
            )
        
        return purchase
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener la compra: {str(e)}"
        )

@router_services.get("/purchases")
async def get_purchases_by_date(
    start_date: date = Query(..., description="Fecha inicial (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Fecha final (YYYY-MM-DD)")
):
    """
    Obtiene todas las compras realizadas en un rango de fechas.
    """
    try:
        purchases = PurchaseService.get_purchases_by_date_range(start_date, end_date)
        
        return {
            "start_date": start_date.strftime('%d/%m/%Y'),
            "end_date": end_date.strftime('%d/%m/%Y'),
            "total_purchases": len(purchases),
            "purchases": purchases
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener las compras: {str(e)}"
        )

@router_services.get("/purchases/summary/{period}")
async def get_sales_summary(period: str):
    """
    Obtiene un resumen de ventas para el período especificado.
    
    Args:
        period: 'today', 'week', 'month' o 'year'
    """
    try:
        # Validar el período
        valid_periods = ["today", "week", "month", "year"]
        if period not in valid_periods:
            raise HTTPException(
                status_code=400,
                detail=f"Período inválido. Debe ser uno de: {', '.join(valid_periods)}"
            )
        
        summary = PurchaseService.get_sales_summary(period)
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el resumen de ventas: {str(e)}"
        )

@router_services.delete("/purchases/{invoice_number}")
async def cancel_purchase(
    invoice_number: str,
    reason: str = Query(..., description="Razón de la cancelación")
):
    """
    Cancela una compra y restaura el stock de los productos.
    
    La compra no se elimina, solo se marca como cancelada en las notas.
    """
    try:
        result = PurchaseService.cancel_purchase(invoice_number, reason)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=404,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al cancelar la compra: {str(e)}"
        )

# Nuevos endpoints para análisis de inventario y ventas
@router_services.get("/inventory/status")
async def get_inventory_status():
    """
    Obtiene el estado actual del inventario de insumos.
    
    Incluye:
    - Insumos con bajo stock
    - Valor total del inventario
    - Estado de cada insumo
    """
    try:
        inventory_status = PurchaseService.get_inventory_status()
        return inventory_status
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el estado del inventario: {str(e)}"
        )

@router_services.get("/sales/by-product")
async def get_sales_by_product(
    start_date: date = Query(..., description="Fecha inicial (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Fecha final (YYYY-MM-DD)")
):
    """
    Obtiene las ventas agrupadas por producto en un rango de fechas.
    
    Útil para identificar los productos más vendidos y sus ingresos.
    """
    try:
        sales_report = PurchaseService.get_sales_by_product(start_date, end_date)
        
        return {
            "start_date": start_date.strftime('%d/%m/%Y'),
            "end_date": end_date.strftime('%d/%m/%Y'),
            "total_products": len(sales_report),
            "products": sales_report
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el reporte de ventas: {str(e)}"
        )

@router_services.get("/inventory/consumption-report")
async def get_insumos_consumption_report(
    start_date: Optional[date] = Query(None, description="Fecha inicial (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Fecha final (YYYY-MM-DD)")
):
    """
    Obtiene un reporte del consumo de insumos.
    
    Muestra qué insumos se han consumido más y su valor total.
    """
    try:
        # Si no se especifican fechas, usar todo el histórico
        if not start_date:
            start_date = date(2020, 1, 1)
        if not end_date:
            end_date = date.today()
            
        consumption_report = PurchaseService.get_insumos_consumption_report(start_date, end_date)
        
        return {
            "start_date": start_date.strftime('%d/%m/%Y'),
            "end_date": end_date.strftime('%d/%m/%Y'),
            "total_insumos": len(consumption_report),
            "insumos": consumption_report
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el reporte de consumo: {str(e)}"
        )