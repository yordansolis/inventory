from database.db import execute_query
from typing import List, Optional, Dict, Any
import logging
import pymysql.err

logger = logging.getLogger(__name__)

class ProductService:
    
    @staticmethod
    def create_product(nombre_producto: str, price: float, category_id: int, 
                      user_id: int, variante: str = None, stock_quantity: int = 0, 
                      min_stock: int = 5) -> Optional[int]:
        """Crear un nuevo producto"""
        # Validar los datos de entrada
        if not nombre_producto:
            logger.error("Nombre de producto no proporcionado")
            return None
        
        if price <= 0:
            logger.error(f"Precio inválido: {price}")
            return None
        
        if category_id <= 0:
            logger.error(f"ID de categoría inválido: {category_id}")
            return None
        
        if user_id <= 0:
            logger.error(f"ID de usuario inválido: {user_id}")
            return None
        
        # Verificar que la categoría existe
        check_category_query = "SELECT id FROM categories WHERE id = %s"
        existing_category = execute_query(check_category_query, (category_id,), fetch_one=True)
        
        if not existing_category:
            logger.error(f"La categoría con ID {category_id} no existe")
            return None
        
        # Verificar que el usuario existe
        check_user_query = "SELECT id FROM users WHERE id = %s"
        existing_user = execute_query(check_user_query, (user_id,), fetch_one=True)
        
        if not existing_user:
            logger.error(f"El usuario con ID {user_id} no existe")
            return None
        
        query = """
        INSERT INTO products (nombre_producto, price, category_id, user_id, variante, stock_quantity, min_stock, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            print(f"Ejecutando consulta SQL: {query}")
            print(f"Parámetros: {(nombre_producto, price, category_id, user_id, variante, True)}")
            
            result = execute_query(
                query, 
                (nombre_producto, price, category_id, user_id, variante, stock_quantity, min_stock, True)
            )
            
            if result:
                # Obtener el ID del producto recién creado
                id_query = "SELECT LAST_INSERT_ID() as id"
                id_result = execute_query(id_query, fetch_one=True)
                return id_result['id'] if id_result else None
            
            return None
            
        except pymysql.err.IntegrityError as e:
            error_code, error_message = e.args
            logger.error(f"Error de integridad al crear producto: [{error_code}] {error_message}")
            print(f"Error de integridad al crear producto: [{error_code}] {error_message}")
            return None
        except pymysql.err.OperationalError as e:
            error_code, error_message = e.args
            logger.error(f"Error operacional al crear producto: [{error_code}] {error_message}")
            print(f"Error operacional al crear producto: [{error_code}] {error_message}")
            return None
        except Exception as e:
            logger.error(f"Error creando producto: {e}")
            print(f"Error detallado al crear producto: {str(e)}")
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
        # Verificar que el producto existe
        check_query = "SELECT id FROM products WHERE id = %s AND is_active = TRUE"
        existing_product = execute_query(check_query, (product_id,), fetch_one=True)
        
        if not existing_product:
            logger.error(f"Producto con ID {product_id} no encontrado o no está activo")
            return False
        
        # Validar datos
        if "price" in update_data and (not isinstance(update_data["price"], (int, float)) or update_data["price"] <= 0):
            logger.error(f"Precio inválido: {update_data['price']}")
            return False
        
        if "category_id" in update_data:
            # Verificar que la categoría existe
            check_category_query = "SELECT id FROM categories WHERE id = %s"
            existing_category = execute_query(check_category_query, (update_data["category_id"],), fetch_one=True)
            
            if not existing_category:
                logger.error(f"La categoría con ID {update_data['category_id']} no existe")
                return False
        
        # Construir la consulta dinámicamente solo con los campos que se van a actualizar
        update_fields = []
        params = []
        
        for field, value in update_data.items():
            if field not in ['id', 'created_at', 'updated_at']:
                update_fields.append(f"{field} = %s")
                params.append(value)
        
        if not update_fields:
            logger.warning("No se proporcionaron campos válidos para actualizar")
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
        except pymysql.err.IntegrityError as e:
            error_code, error_message = e.args
            logger.error(f"Error de integridad al actualizar producto {product_id}: [{error_code}] {error_message}")
            print(f"Error de integridad al actualizar producto {product_id}: [{error_code}] {error_message}")
            return False
        except pymysql.err.OperationalError as e:
            error_code, error_message = e.args
            logger.error(f"Error operacional al actualizar producto {product_id}: [{error_code}] {error_message}")
            print(f"Error operacional al actualizar producto {product_id}: [{error_code}] {error_message}")
            return False
        except Exception as e:
            logger.error(f"Error actualizando producto {product_id}: {e}")
            print(f"Error detallado al actualizar producto {product_id}: {str(e)}")
            return False
    
    @staticmethod
    def delete_product(product_id: int) -> bool:
        """Eliminar un producto (soft delete)"""
        # Verificar que el producto existe y está activo
        check_query = "SELECT id FROM products WHERE id = %s AND is_active = TRUE"
        existing_product = execute_query(check_query, (product_id,), fetch_one=True)
        
        if not existing_product:
            logger.error(f"Producto con ID {product_id} no encontrado o ya está desactivado")
            return False
        
        # Verificar si hay ventas relacionadas con este producto
        check_sales_query = """
        SELECT COUNT(*) as count 
        FROM sale_details 
        WHERE product_id = %s
        """
        sales_count = execute_query(check_sales_query, (product_id,), fetch_one=True)
        
        if sales_count and sales_count['count'] > 0:
            # Si hay ventas, solo hacer soft delete
            logger.info(f"El producto con ID {product_id} tiene {sales_count['count']} ventas asociadas. Se realizará soft delete.")
        
        query = "UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = %s"
        
        try:
            result = execute_query(query, (product_id,))
            if result > 0:
                logger.info(f"Producto con ID {product_id} desactivado exitosamente")
                return True
            else:
                logger.error(f"No se pudo desactivar el producto con ID {product_id}")
                return False
        except pymysql.err.IntegrityError as e:
            error_code, error_message = e.args
            logger.error(f"Error de integridad al eliminar producto {product_id}: [{error_code}] {error_message}")
            print(f"Error de integridad al eliminar producto {product_id}: [{error_code}] {error_message}")
            return False
        except pymysql.err.OperationalError as e:
            error_code, error_message = e.args
            logger.error(f"Error operacional al eliminar producto {product_id}: [{error_code}] {error_message}")
            print(f"Error operacional al eliminar producto {product_id}: [{error_code}] {error_message}")
            return False
        except Exception as e:
            logger.error(f"Error eliminando producto {product_id}: {e}")
            print(f"Error detallado al eliminar producto {product_id}: {str(e)}")
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
            print(f"ProductService.add_product_recipe: Iniciando para producto {product_id}")
            print(f"Ingredientes recibidos: {ingredients}")
            
            # Primero eliminamos cualquier ingrediente existente
            delete_query = "DELETE FROM product_recipes WHERE product_id = %s"
            delete_result = execute_query(delete_query, (product_id,))
            print(f"Ingredientes anteriores eliminados: {delete_result} filas afectadas")
            
            # Ahora insertamos los nuevos ingredientes
            inserted_count = 0
            for ingredient in ingredients:
                insumo_id = ingredient.get('insumo_id')
                cantidad = ingredient.get('cantidad')
                
                if not insumo_id or not cantidad:
                    print(f"Ingrediente inválido: {ingredient}")
                    continue
                
                insert_query = """
                INSERT INTO product_recipes (product_id, insumo_id, cantidad)
                VALUES (%s, %s, %s)
                """
                
                print(f"Insertando ingrediente: product_id={product_id}, insumo_id={insumo_id}, cantidad={cantidad}")
                
                result = execute_query(
                    insert_query, 
                    (product_id, insumo_id, cantidad)
                )
                
                if result and result > 0:
                    inserted_count += 1
                    print(f"Ingrediente insertado exitosamente")
                else:
                    print(f"Error al insertar ingrediente: resultado={result}")
            
            print(f"ProductService.add_product_recipe: {inserted_count} de {len(ingredients)} ingredientes insertados")
            return inserted_count == len(ingredients)
            
        except Exception as e:
            print(f"Error en ProductService.add_product_recipe: {str(e)}")
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