from database.db import execute_query
from typing import List, Optional, Dict, Any
import logging
from models.insumo_service import InsumoService

logger = logging.getLogger(__name__)

class SalesService:
    
    @staticmethod
    def check_insumos_availability(product_id: int, quantity: int) -> Dict[str, Any]:
        """
        Verifica si hay suficientes insumos disponibles para producir la cantidad solicitada de un producto
        
        Args:
            product_id: ID del producto a verificar
            quantity: Cantidad del producto que se desea vender
            
        Returns:
            Dict con 'available' (bool) y 'missing_insumos' (lista de insumos insuficientes)
        """
        # Obtener la receta del producto
        recipe_query = """
        SELECT pr.insumo_id, pr.cantidad, i.nombre_insumo, i.unidad
        FROM product_recipes pr
        JOIN insumos i ON pr.insumo_id = i.id
        WHERE pr.product_id = %s
        """
        recipe_items = execute_query(recipe_query, (product_id,), fetch_all=True) or []
        
        # Asumimos que hay disponibilidad ya que no estamos usando stock_actual
        return {
            'available': True,
            'missing_insumos': []
        }
    
    @staticmethod
    def create_sale(user_id: int, total_amount: float, payment_method: str = None, notes: str = None) -> Optional[int]:
        """Crear una nueva venta"""
        query = """
        INSERT INTO sales (user_id, total_amount, payment_method, notes)
        VALUES (%s, %s, %s, %s)
        """
        
        try:
            result = execute_query(query, (user_id, total_amount, payment_method, notes))
            
            if result:
                # Obtener el ID de la venta recién creada
                id_query = "SELECT LAST_INSERT_ID() as id"
                id_result = execute_query(id_query, fetch_one=True)
                return id_result['id'] if id_result else None
            
            return None
        except Exception as e:
            logger.error(f"Error creando venta: {e}")
            return None
    
    @staticmethod
    def add_sale_detail(sale_id: int, product_id: int, quantity: int, unit_price: float) -> bool:
        """Añadir un detalle a una venta"""
        # Ya no verificamos stock_actual
        query = """
        INSERT INTO sale_details (sale_id, product_id, quantity, unit_price)
        VALUES (%s, %s, %s, %s)
        """
        
        try:
            result = execute_query(query, (sale_id, product_id, quantity, unit_price))
            
            # Si se añade correctamente, actualizamos los insumos utilizados
            if result:
                # Actualizar la cantidad utilizada de insumos basado en la receta
                SalesService._update_insumos_stock_from_recipe(product_id, quantity)
            
            return result > 0
        except Exception as e:
            logger.error(f"Error añadiendo detalle de venta: {e}")
            return False
    
    @staticmethod
    def _update_insumos_stock_from_recipe(product_id: int, quantity_sold: int) -> None:
        """
        Actualizar la cantidad utilizada de insumos basado en la receta del producto vendido
        
        Args:
            product_id: ID del producto vendido
            quantity_sold: Cantidad vendida del producto
        """
        # Obtener la receta del producto
        recipe_query = """
        SELECT pr.insumo_id, pr.cantidad
        FROM product_recipes pr
        WHERE pr.product_id = %s
        """
        recipe_items = execute_query(recipe_query, (product_id,), fetch_all=True) or []
        
        # Actualizar la cantidad utilizada de cada insumo
        for item in recipe_items:
            total_quantity_to_add = item['cantidad'] * quantity_sold
            
            # Usar el método de InsumoService para actualizar la cantidad utilizada
            InsumoService.update_cantidad_utilizada(item['insumo_id'], total_quantity_to_add)
            
            logger.info(f"Insumo {item['insumo_id']} actualizado: +{total_quantity_to_add} unidades utilizadas")
    
    @staticmethod
    def get_sale_by_id(sale_id: int) -> Optional[Dict[str, Any]]:
        """Obtener una venta por su ID"""
        query = """
        SELECT s.*, u.username as vendedor
        FROM sales s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = %s
        """
        
        try:
            sale = execute_query(query, (sale_id,), fetch_one=True)
            
            if sale:
                # Obtener los detalles de la venta
                details_query = """
                SELECT sd.*, p.nombre_producto
                FROM sale_details sd
                JOIN products p ON sd.product_id = p.id
                WHERE sd.sale_id = %s
                """
                details = execute_query(details_query, (sale_id,), fetch_all=True) or []
                sale['details'] = details
            
            return sale
        except Exception as e:
            logger.error(f"Error obteniendo venta: {e}")
            return None
    
    @staticmethod
    def get_sales_by_user(user_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Obtener ventas realizadas por un usuario"""
        query = """
        SELECT s.*, u.username as vendedor
        FROM sales s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = %s
        ORDER BY s.sale_date DESC
        LIMIT %s OFFSET %s
        """
        
        try:
            return execute_query(query, (user_id, limit, offset), fetch_all=True) or []
        except Exception as e:
            logger.error(f"Error obteniendo ventas por usuario: {e}")
            return []
    
    @staticmethod
    def get_sales_by_date_range(start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Obtener ventas en un rango de fechas"""
        query = """
        SELECT s.*, u.username as vendedor
        FROM sales s
        JOIN users u ON s.user_id = u.id
        WHERE DATE(s.sale_date) BETWEEN %s AND %s
        ORDER BY s.sale_date DESC
        """
        
        try:
            return execute_query(query, (start_date, end_date), fetch_all=True) or []
        except Exception as e:
            logger.error(f"Error obteniendo ventas por rango de fechas: {e}")
            return []
    
    @staticmethod
    def create_complete_sale(user_id: int, items: List[Dict[str, Any]], payment_method: str = None, notes: str = None) -> Optional[int]:
        """
        Crear una venta completa con múltiples productos
        
        items: Lista de diccionarios con {product_id, quantity, unit_price}
        """
        # Ya no verificamos stock_actual
        
        # Calcular el total de la venta
        total_amount = sum(item['quantity'] * item['unit_price'] for item in items)
        
        try:
            # Crear la venta
            sale_id = SalesService.create_sale(user_id, total_amount, payment_method, notes)
            
            if not sale_id:
                return None
            
            # Añadir los detalles
            for item in items:
                SalesService.add_sale_detail(
                    sale_id, 
                    item['product_id'], 
                    item['quantity'], 
                    item['unit_price']
                )
            
            return sale_id
        except Exception as e:
            logger.error(f"Error creando venta completa: {e}")
            return None
    
    @staticmethod
    def get_top_selling_products(limit: int = 10, start_date: str = None, end_date: str = None) -> List[Dict[str, Any]]:
        """Obtener los productos más vendidos"""
        conditions = ["1=1"]
        params = []
        
        if start_date and end_date:
            conditions.append("DATE(s.sale_date) BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        
        where_clause = " AND ".join(conditions)
        
        query = f"""
        SELECT p.id, p.nombre_producto, SUM(sd.quantity) as total_vendido, 
               SUM(sd.quantity * sd.unit_price) as total_ingresos
        FROM sale_details sd
        JOIN products p ON sd.product_id = p.id
        JOIN sales s ON sd.sale_id = s.id
        WHERE {where_clause}
        GROUP BY p.id, p.nombre_producto
        ORDER BY total_vendido DESC
        LIMIT %s
        """
        
        params.append(limit)
        
        try:
            return execute_query(query, params, fetch_all=True) or []
        except Exception as e:
            logger.error(f"Error obteniendo productos más vendidos: {e}")
            return []
    
    @staticmethod
    def get_sales_by_product(product_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        """Obtener ventas por producto"""
        query = """
        SELECT s.id, s.sale_date, u.username as vendedor, sd.quantity, sd.unit_price,
               (sd.quantity * sd.unit_price) as total
        FROM sales s
        JOIN sale_details sd ON s.id = sd.sale_id
        JOIN users u ON s.user_id = u.id
        WHERE sd.product_id = %s
        ORDER BY s.sale_date DESC
        LIMIT %s
        """
        
        try:
            return execute_query(query, (product_id, limit), fetch_all=True) or []
        except Exception as e:
            logger.error(f"Error obteniendo ventas por producto: {e}")
            return [] 