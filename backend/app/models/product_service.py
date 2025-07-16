from database.db import execute_query
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ProductService:
    
    @staticmethod
    def create_product(nombre_producto: str, price: float, category_id: int, 
                      user_id: int, variante: str = None, stock_quantity: int = 0, 
                      min_stock: int = 5) -> Optional[int]:
        """Crear un nuevo producto"""
        query = """
        INSERT INTO products (nombre_producto, price, category_id, user_id, variante, stock_quantity, min_stock)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            result = execute_query(
                query, 
                (nombre_producto, price, category_id, user_id, variante, stock_quantity, min_stock)
            )
            
            if result:
                # Obtener el ID del producto recién creado
                id_query = "SELECT LAST_INSERT_ID() as id"
                id_result = execute_query(id_query, fetch_one=True)
                return id_result['id'] if id_result else None
            
            return None
            
        except Exception as e:
            logger.error(f"Error creando producto: {e}")
            return None
    
    @staticmethod
    def get_product_by_id(product_id: int) -> Optional[dict]:
        """Obtener un producto por su ID"""
        query = """
        SELECT p.*, c.nombre_categoria as categoria_nombre, u.username as creado_por
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = %s AND p.is_active = TRUE
        """
        
        return execute_query(query, (product_id,), fetch_one=True)
    
    @staticmethod
    def get_products(category_id: Optional[int] = None, search: Optional[str] = None, 
                    low_stock_only: bool = False, limit: int = 100, offset: int = 0) -> List[dict]:
        """Obtener lista de productos con filtros"""
        conditions = ["p.is_active = TRUE"]
        params = []
        
        if category_id:
            conditions.append("p.category_id = %s")
            params.append(category_id)
        
        if low_stock_only:
            conditions.append("p.stock_quantity <= p.min_stock")
        
        if search:
            conditions.append("(p.nombre_producto LIKE %s OR p.variante LIKE %s)")
            search_term = f"%{search}%"
            params.extend([search_term, search_term])
        
        where_clause = " AND ".join(conditions)
        
        query = f"""
        SELECT p.*, c.nombre_categoria as categoria_nombre, u.username as creado_por
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN users u ON p.user_id = u.id
        WHERE {where_clause}
        ORDER BY p.nombre_producto
        LIMIT %s OFFSET %s
        """
        
        params.extend([limit, offset])
        return execute_query(query, params, fetch_all=True) or []
    
    @staticmethod
    def update_product(product_id: int, update_data: Dict[str, Any]) -> bool:
        """Actualizar un producto"""
        # Construir la consulta dinámicamente solo con los campos que se van a actualizar
        update_fields = []
        params = []
        
        for field, value in update_data.items():
            if field not in ['id', 'created_at', 'updated_at']:
                update_fields.append(f"{field} = %s")
                params.append(value)
        
        if not update_fields:
            return False
        
        query = f"""
        UPDATE products 
        SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """
        params.append(product_id)
        
        try:
            result = execute_query(query, params)
            return result > 0
        except Exception as e:
            logger.error(f"Error actualizando producto {product_id}: {e}")
            return False
    
    @staticmethod
    def delete_product(product_id: int) -> bool:
        """Eliminar un producto (soft delete)"""
        query = "UPDATE products SET is_active = FALSE WHERE id = %s"
        
        try:
            result = execute_query(query, (product_id,))
            return result > 0
        except Exception as e:
            logger.error(f"Error eliminando producto {product_id}: {e}")
            return False
    
    @staticmethod
    def update_stock(product_id: int, new_stock: int) -> bool:
        """Actualizar el stock de un producto"""
        query = """
        UPDATE products 
        SET stock_quantity = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """
        
        try:
            result = execute_query(query, (new_stock, product_id))
            return result > 0
        except Exception as e:
            logger.error(f"Error actualizando stock del producto {product_id}: {e}")
            return False
    
    @staticmethod
    def get_low_stock_products() -> List[dict]:
        """Obtener productos con stock bajo"""
        query = """
        SELECT p.*, c.nombre_categoria as categoria_nombre, u.username as creado_por
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.stock_quantity <= p.min_stock AND p.is_active = TRUE
        ORDER BY p.stock_quantity ASC
        """
        
        return execute_query(query, fetch_all=True) or []
    
    @staticmethod
    def get_products_by_creator(user_id: int) -> List[dict]:
        """Obtener productos creados por un usuario específico"""
        query = """
        SELECT p.*, c.nombre_categoria as categoria_nombre
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.user_id = %s AND p.is_active = TRUE
        ORDER BY p.nombre_producto
        """
        
        return execute_query(query, (user_id,), fetch_all=True) or []
    
    @staticmethod
    def add_product_recipe(product_id: int, ingredients: List[Dict[str, Any]]) -> bool:
        """
        Añadir receta a un producto
        
        ingredients: Lista de diccionarios con {insumo_id, cantidad}
        """
        try:
            # Primero eliminamos cualquier ingrediente existente
            delete_query = "DELETE FROM product_recipes WHERE product_id = %s"
            execute_query(delete_query, (product_id,))
            
            # Ahora insertamos los nuevos ingredientes
            for ingredient in ingredients:
                insert_query = """
                INSERT INTO product_recipes (product_id, insumo_id, cantidad)
                VALUES (%s, %s, %s)
                """
                execute_query(
                    insert_query, 
                    (product_id, ingredient['insumo_id'], ingredient['cantidad'])
                )
            
            return True
        except Exception as e:
            logger.error(f"Error añadiendo receta al producto {product_id}: {e}")
            return False
    
    @staticmethod
    def get_product_recipe(product_id: int) -> List[dict]:
        """Obtener la receta de un producto"""
        query = """
        SELECT pr.*, i.nombre_insumo, i.unidad
        FROM product_recipes pr
        JOIN insumos i ON pr.insumo_id = i.id
        WHERE pr.product_id = %s
        ORDER BY i.nombre_insumo
        """
        
        return execute_query(query, (product_id,), fetch_all=True) or [] 