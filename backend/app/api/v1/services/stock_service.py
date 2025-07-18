from database.db  import execute_query
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class StockService:
    """Servicio para calcular y gestionar el stock de productos basado en insumos disponibles"""
    
    @staticmethod
    def calculate_product_stock() -> List[Dict[str, Any]]:
        """
        Calcula cuántas unidades de cada producto se pueden hacer con los insumos disponibles.
        
        Retorna una lista de diccionarios con:
        - producto_id
        - nombre_producto
        - stock_disponible (cantidad que se puede producir)
        - categoria_nombre
        - precio
        """
        query = """
        SELECT
            p.id AS producto_id,
            p.nombre_producto,
            p.variante,
            p.price AS precio,
            c.nombre_categoria AS categoria_nombre,
            COALESCE(FLOOR(MIN((i.cantidad_unitaria - i.cantidad_utilizada) / pr.cantidad)), 0) AS stock_disponible
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_recipes pr ON p.id = pr.product_id
        LEFT JOIN insumos i ON pr.insumo_id = i.id
        WHERE p.is_active = TRUE
        GROUP BY p.id, p.nombre_producto, p.variante, p.price, c.nombre_categoria
        ORDER BY p.nombre_producto
        """
        
        try:
            results = execute_query(query, fetch_all=True)
            
            # Transformar resultados para incluir información adicional
            stock_data = []
            for row in results:
                stock_info = {
                    'producto_id': row['producto_id'],
                    'nombre_producto': row['nombre_producto'],
                    'variante': row['variante'] or '',
                    'precio': float(row['precio']),
                    'categoria_nombre': row['categoria_nombre'] or 'Sin categoría',
                    'stock_disponible': int(row['stock_disponible']) if row['stock_disponible'] is not None else 0,
                    'tipo': 'producto'
                }
                stock_data.append(stock_info)
            
            return stock_data
            
        except Exception as e:
            logger.error(f"Error calculando stock de productos: {e}")
            return []
    
    @staticmethod
    def get_low_stock_products(min_stock_threshold: int = 5) -> List[Dict[str, Any]]:
        """
        Obtiene productos que están por agotarse basándose en el stock calculado.
        
        Args:
            min_stock_threshold: Umbral mínimo de stock para considerar un producto como "por agotarse"
        
        Retorna productos con stock_disponible <= min_stock_threshold
        """
        query = """
        WITH stock_por_producto AS (
            SELECT
                p.id AS producto_id,
                p.nombre_producto,
                p.variante,
                p.price AS precio,
                c.nombre_categoria AS categoria_nombre,
                p.min_stock,
                COALESCE(FLOOR(MIN((i.cantidad_unitaria - i.cantidad_utilizada) / pr.cantidad)), 0) AS stock_disponible
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_recipes pr ON p.id = pr.product_id
            LEFT JOIN insumos i ON pr.insumo_id = i.id
            WHERE p.is_active = TRUE
            GROUP BY p.id, p.nombre_producto, p.variante, p.price, c.nombre_categoria, p.min_stock
        )
        SELECT *
        FROM stock_por_producto
        WHERE stock_disponible <= %s
        ORDER BY stock_disponible ASC, nombre_producto
        """
        
        try:
            results = execute_query(query, (min_stock_threshold,), fetch_all=True)
            
            low_stock_products = []
            for row in results:
                product_info = {
                    'producto_id': row['producto_id'],
                    'nombre_producto': row['nombre_producto'],
                    'variante': row['variante'] or '',
                    'precio': float(row['precio']),
                    'categoria_nombre': row['categoria_nombre'] or 'Sin categoría',
                    'stock_disponible': int(row['stock_disponible']),
                    'min_stock': int(row['min_stock']),
                    'estado': 'crítico' if row['stock_disponible'] == 0 else 'bajo'
                }
                low_stock_products.append(product_info)
            
            return low_stock_products
            
        except Exception as e:
            logger.error(f"Error obteniendo productos con stock bajo: {e}")
            return []
    
    @staticmethod
    def get_product_stock_details(product_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene detalles del stock de un producto específico, incluyendo
        el detalle de cada insumo y cuánto limita la producción.
        """
        # Primero obtener info del producto
        product_query = """
        SELECT 
            p.id, 
            p.nombre_producto,
            p.variante,
            p.price,
            c.nombre_categoria
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = %s AND p.is_active = TRUE
        """
        
        product = execute_query(product_query, (product_id,), fetch_one=True)
        if not product:
            return None
        
        # Obtener detalles de cada insumo
        insumos_query = """
        SELECT 
            i.id AS insumo_id,
            i.nombre_insumo,
            i.unidad,
            (i.cantidad_unitaria - i.cantidad_utilizada) AS cantidad_disponible,
            pr.cantidad AS cantidad_requerida,
            FLOOR((i.cantidad_unitaria - i.cantidad_utilizada) / pr.cantidad) AS unidades_posibles
        FROM product_recipes pr
        JOIN insumos i ON pr.insumo_id = i.id
        WHERE pr.product_id = %s
        ORDER BY unidades_posibles ASC
        """
        
        insumos_details = execute_query(insumos_query, (product_id,), fetch_all=True)
        
        # Calcular stock disponible (el mínimo de unidades posibles)
        stock_disponible = 0
        if insumos_details:
            stock_disponible = min([row['unidades_posibles'] for row in insumos_details])
        
        # Preparar respuesta
        result = {
            'producto_id': product['id'],
            'nombre_producto': product['nombre_producto'],
            'variante': product['variante'] or '',
            'precio': float(product['price']),
            'categoria_nombre': product['nombre_categoria'] or 'Sin categoría',
            'stock_disponible': int(stock_disponible),
            'insumos_detalle': []
        }
        
        # Agregar detalles de cada insumo
        for insumo in insumos_details:
            insumo_info = {
                'insumo_id': insumo['insumo_id'],
                'nombre_insumo': insumo['nombre_insumo'],
                'unidad': insumo['unidad'],
                'cantidad_disponible': float(insumo['cantidad_disponible']),
                'cantidad_requerida': float(insumo['cantidad_requerida']),
                'unidades_posibles': int(insumo['unidades_posibles']),
                'es_limitante': int(insumo['unidades_posibles']) == stock_disponible
            }
            result['insumos_detalle'].append(insumo_info)
        
        return result
    
    @staticmethod
    def get_stock_summary() -> Dict[str, Any]:
        """
        Obtiene un resumen general del estado del stock.
        
        Retorna:
        - total_productos: Total de productos activos
        - productos_sin_stock: Productos con stock 0
        - productos_stock_bajo: Productos con stock <= min_stock
        - productos_disponibles: Productos con stock > min_stock
        """
        summary_query = """
        WITH stock_calculado AS (
            SELECT
                p.id AS producto_id,
                p.min_stock,
                COALESCE(FLOOR(MIN((i.cantidad_unitaria - i.cantidad_utilizada) / pr.cantidad)), 0) AS stock_disponible
            FROM products p
            LEFT JOIN product_recipes pr ON p.id = pr.product_id
            LEFT JOIN insumos i ON pr.insumo_id = i.id
            WHERE p.is_active = TRUE
            GROUP BY p.id, p.min_stock
        )
        SELECT
            COUNT(*) AS total_productos,
            SUM(CASE WHEN stock_disponible = 0 THEN 1 ELSE 0 END) AS productos_sin_stock,
            SUM(CASE WHEN stock_disponible > 0 AND stock_disponible <= 5 THEN 1 ELSE 0 END) AS productos_stock_bajo,
            SUM(CASE WHEN stock_disponible > 5 THEN 1 ELSE 0 END) AS productos_disponibles
        FROM stock_calculado
        """
        
        try:
            result = execute_query(summary_query, fetch_one=True)
            
            return {
                'total_productos': int(result['total_productos'] or 0),
                'productos_sin_stock': int(result['productos_sin_stock'] or 0),
                'productos_stock_bajo': int(result['productos_stock_bajo'] or 0),
                'productos_disponibles': int(result['productos_disponibles'] or 0),
                'fecha_actualizacion': None  # Podríamos agregar timestamp si es necesario
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo resumen de stock: {e}")
            return {
                'total_productos': 0,
                'productos_sin_stock': 0,
                'productos_stock_bajo': 0,
                'productos_disponibles': 0,
                'error': str(e)
            } 