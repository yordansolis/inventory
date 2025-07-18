from fastapi import APIRouter, HTTPException
from datetime import date, datetime, timedelta
from typing import Dict, List, Any, Optional
from .stock_service import StockService
from .purchase_service import PurchaseService

router_dashboard = APIRouter()

class DashboardService:
    """Servicio para proporcionar datos consolidados para el dashboard"""
    
    @staticmethod
    def get_dashboard_summary() -> Dict[str, Any]:
        """
        Obtiene un resumen consolidado para el dashboard principal
        
        Returns:
            Dict con información resumida de ventas, productos, stock y domicilios
        """
        try:
            # 1. Obtener resumen de ventas del día
            sales_summary = PurchaseService.get_sales_summary('today')
            
            # 2. Obtener resumen de stock de productos
            stock_summary = StockService.get_stock_summary()
            
            # 3. Obtener productos con stock bajo
            low_stock = StockService.get_low_stock_products()
            
            # 4. Obtener ventas recientes (últimas 10)
            today = date.today()
            week_ago = today - timedelta(days=7)
            recent_sales = PurchaseService.get_purchases_by_date_range(week_ago, today)
            
            # Limitar a las 10 más recientes y formatear para el dashboard
            recent_sales = recent_sales[:10] if recent_sales else []
            formatted_recent_sales = []
            
            for sale in recent_sales:
                try:
                    # Obtener detalles de la venta para mostrar productos
                    sale_details = PurchaseService.get_purchase_by_invoice(sale['invoice_number'])
                    
                    if sale_details and 'products' in sale_details and sale_details['products']:
                        # Tomar solo el primer producto para la vista resumida
                        first_product = sale_details['products'][0]
                        
                        formatted_sale = {
                            'client_name': sale.get('client_name', 'Cliente'),
                            'product_name': first_product.get('product_name', 'Producto'),
                            'product_variant': first_product.get('product_variant', ''),
                            'total_amount': float(sale['total_amount']) if sale.get('total_amount') is not None else 0.0,
                            'has_delivery': sale.get('has_delivery', False),
                            'delivery_person': sale.get('delivery_person', '') if sale.get('has_delivery') else '',
                            'invoice_date': sale.get('invoice_date', ''),
                            'invoice_time': sale.get('invoice_time', ''),
                            'invoice_number': sale.get('invoice_number', '')
                        }
                        
                        formatted_recent_sales.append(formatted_sale)
                except Exception as e:
                    print(f"Error al procesar venta reciente: {str(e)}")
                    continue
            
            # Manejar posibles valores None en los datos
            summary_data = sales_summary.get('summary', {}) if sales_summary else {}
            
            # Construir respuesta consolidada con manejo seguro de valores None
            dashboard_data = {
                # Ventas del día
                'ventas_hoy': float(summary_data.get('total_revenue', 0) or 0),
                
                # Productos vendibles (con stock disponible)
                'productos_vendibles': stock_summary.get('productos_disponibles', 0) if stock_summary else 0,
                
                # Productos con stock bajo
                'stock_bajo': len(low_stock) if low_stock else 0,
                'productos_stock_bajo': low_stock if low_stock else [],
                
                # Domicilios del día
                'domicilios': summary_data.get('deliveries_count', 0) or 0,
                
                # Ventas recientes
                'ventas_recientes': formatted_recent_sales,
                
                # Información adicional útil
                'total_productos': stock_summary.get('total_productos', 0) if stock_summary else 0,
                'productos_sin_stock': stock_summary.get('productos_sin_stock', 0) if stock_summary else 0,
                'ventas_cantidad': summary_data.get('total_purchases', 0) or 0,
                
                # Métodos de pago
                'metodos_pago': sales_summary.get('payment_methods', []) if sales_summary else [],
                
                # Productos más vendidos
                'productos_top': sales_summary.get('top_products', []) if sales_summary else []
            }
            
            return dashboard_data
            
        except Exception as e:
            # Registrar el error y devolver un diccionario con información de error
            print(f"Error obteniendo resumen del dashboard: {str(e)}")
            return {
                'error': str(e),
                'ventas_hoy': 0,
                'productos_vendibles': 0,
                'stock_bajo': 0,
                'domicilios': 0,
                'ventas_recientes': []
            }

# Endpoint para el dashboard
@router_dashboard.get("/summary")
async def get_dashboard_summary():
    """
    Obtiene un resumen consolidado para el dashboard principal.
    
    Incluye:
    - Ventas del día
    - Productos vendibles
    - Productos con stock bajo
    - Domicilios del día
    - Ventas recientes
    """
    try:
        dashboard_data = DashboardService.get_dashboard_summary()
        return dashboard_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener resumen del dashboard: {str(e)}"
        ) 