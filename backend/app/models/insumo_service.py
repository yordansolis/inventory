from database.db import execute_query
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class InsumoService:
    
    @staticmethod
    def create_insumo(nombre_insumo: str, unidad: str, cantidad_unitaria: float, 
                     precio_presentacion: float, cantidad_utilizada: float = 0,
                     stock_minimo: float = 0, stock_actual: float = 0,
                     sitio_referencia: Optional[str] = None) -> Optional[int]:
        """Crear un nuevo insumo"""
        # Verificar si ya existe un insumo con el mismo nombre
        check_query = "SELECT id FROM insumos WHERE nombre_insumo = %s"
        existing_insumo = execute_query(check_query, (nombre_insumo,), fetch_one=True)
        
        if existing_insumo:
            print(f"Ya existe un insumo con el nombre '{nombre_insumo}'")
            raise ValueError(f"Ya existe un insumo con el nombre '{nombre_insumo}'")
            
        query = """
        INSERT INTO insumos (nombre_insumo, unidad, cantidad_unitaria, precio_presentacion,
                           cantidad_utilizada, stock_minimo, stock_actual, sitio_referencia)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            print(f"Intentando crear insumo: {nombre_insumo}, {unidad}, {cantidad_unitaria}, {precio_presentacion}, {cantidad_utilizada}, {stock_minimo}, {stock_actual}, {sitio_referencia}")
            result = execute_query(query, (nombre_insumo, unidad, cantidad_unitaria, precio_presentacion,
                                         cantidad_utilizada, stock_minimo, stock_actual, sitio_referencia))
            print(f"Resultado de execute_query: {result}")
            
            if result is not None:
                # Obtener el ID del insumo recién creado
                id_query = "SELECT LAST_INSERT_ID() as id"
                id_result = execute_query(id_query, fetch_one=True)
                print(f"ID result: {id_result}")
                insumo_id = id_result['id'] if id_result else None
                print(f"Insumo creado con ID: {insumo_id}")
                return insumo_id
            
            print("La ejecución de la consulta no devolvió un resultado válido")
            return None
        except Exception as e:
            print(f"Error detallado al crear insumo: {str(e)}")
            logger.error(f"Error creando insumo: {e}")
            # Re-lanzar la excepción para que pueda ser manejada en el nivel superior
            raise
    
    @staticmethod
    def get_insumo_by_id(insumo_id: int) -> Optional[dict]:
        """Obtener un insumo por su ID"""
        query = "SELECT * FROM insumos WHERE id = %s"
        
        return execute_query(query, (insumo_id,), fetch_one=True)
    
    @staticmethod
    def get_insumos(search: Optional[str] = None, low_stock_only: bool = False) -> List[dict]:
        """Obtener lista de insumos con filtros"""
        conditions = ["1=1"]  # Siempre verdadero para simplificar la construcción de la consulta
        params = []
        
        if search:
            conditions.append("(nombre_insumo LIKE %s)")
            search_term = f"%{search}%"
            params.append(search_term)
        
        # Comentado temporalmente porque cantidad_actual ya no existe en la nueva estructura
        # if low_stock_only:
        #     conditions.append("cantidad_actual <= stock_minimo")
        
        where_clause = " AND ".join(conditions)
        
        query = f"""
        SELECT * FROM insumos
        WHERE {where_clause}
        ORDER BY nombre_insumo
        """
        
        return execute_query(query, params, fetch_all=True) or []
    
    @staticmethod
    def update_insumo(insumo_id: int, update_data: Dict[str, Any]) -> bool:
        """Actualizar un insumo"""
        # Verificar que el insumo existe
        check_query = "SELECT id FROM insumos WHERE id = %s"
        existing_insumo = execute_query(check_query, (insumo_id,), fetch_one=True)
        
        if not existing_insumo:
            logger.error(f"Insumo con ID {insumo_id} no encontrado")
            return False
        
        # Validar datos
        if "stock_minimo" in update_data and not isinstance(update_data["stock_minimo"], (int, float)):
            logger.error(f"Stock mínimo inválido: {update_data['stock_minimo']}")
            return False
        
        if "cantidad_unitaria" in update_data and not isinstance(update_data["cantidad_unitaria"], (int, float)):
            logger.error(f"Cantidad unitaria inválida: {update_data['cantidad_unitaria']}")
            return False
        
        if "precio_presentacion" in update_data and not isinstance(update_data["precio_presentacion"], (int, float)):
            logger.error(f"Precio presentación inválido: {update_data['precio_presentacion']}")
            return False
        
        if "cantidad_utilizada" in update_data and not isinstance(update_data["cantidad_utilizada"], (int, float)):
            logger.error(f"Cantidad utilizada inválida: {update_data['cantidad_utilizada']}")
            return False
        
        # Construir la consulta dinámicamente solo con los campos que se van a actualizar
        update_fields = []
        params = []
        
        # Lista de campos que no se pueden actualizar directamente
        readonly_fields = ['id', 'creado_en', 'valor_unitario', 'valor_total']
        
        for field, value in update_data.items():
            if field not in readonly_fields:
                update_fields.append(f"{field} = %s")
                params.append(value)
        
        if not update_fields:
            logger.warning("No se proporcionaron campos válidos para actualizar")
            return False
        
        query = f"""
        UPDATE insumos
        SET {', '.join(update_fields)}
        WHERE id = %s
        """
        params.append(insumo_id)
        
        try:
            result = execute_query(query, params)
            if result > 0:
                logger.info(f"Insumo con ID {insumo_id} actualizado exitosamente")
                return True
            else:
                logger.error(f"No se pudo actualizar el insumo con ID {insumo_id}")
                return False
        except Exception as e:
            logger.error(f"Error actualizando insumo {insumo_id}: {e}")
            print(f"Error detallado al actualizar insumo {insumo_id}: {str(e)}")
            return False
    
    @staticmethod
    def delete_insumo(insumo_id: int) -> bool:
        """Eliminar un insumo"""
        # Verificar que el insumo existe
        check_insumo_query = "SELECT id FROM insumos WHERE id = %s"
        existing_insumo = execute_query(check_insumo_query, (insumo_id,), fetch_one=True)
        
        if not existing_insumo:
            logger.error(f"Insumo con ID {insumo_id} no encontrado")
            return False
        
        # Verificar si el insumo está en uso en alguna receta
        check_query = "SELECT COUNT(*) as count FROM product_recipes WHERE insumo_id = %s"
        check_result = execute_query(check_query, (insumo_id,), fetch_one=True)
        
        if check_result and check_result['count'] > 0:
            logger.error(f"No se puede eliminar el insumo {insumo_id} porque está en uso en {check_result['count']} recetas")
            return False
        
        # Si no está en uso, procedemos a eliminarlo
        query = "DELETE FROM insumos WHERE id = %s"
        
        try:
            result = execute_query(query, (insumo_id,))
            if result > 0:
                logger.info(f"Insumo con ID {insumo_id} eliminado exitosamente")
                return True
            else:
                logger.error(f"No se pudo eliminar el insumo con ID {insumo_id}")
                return False
        except Exception as e:
            logger.error(f"Error eliminando insumo {insumo_id}: {e}")
            print(f"Error detallado al eliminar insumo {insumo_id}: {str(e)}")
            return False
    
    @staticmethod
    def update_cantidad_utilizada(insumo_id: int, cantidad_a_incrementar: float) -> bool:
        """
        Incrementar la cantidad utilizada de un insumo y reducir el stock actual
        
        Args:
            insumo_id: ID del insumo a actualizar
            cantidad_a_incrementar: Cantidad a incrementar en la cantidad utilizada
            
        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario
        """
        # Verificar que hay suficiente stock
        check_query = "SELECT stock_actual FROM insumos WHERE id = %s"
        check_result = execute_query(check_query, (insumo_id,), fetch_one=True)
        
        if not check_result or check_result['stock_actual'] < cantidad_a_incrementar:
            logger.error(f"Stock insuficiente para el insumo {insumo_id}. Disponible: {check_result['stock_actual'] if check_result else 0}, Necesario: {cantidad_a_incrementar}")
            return False
        
        query = """
        UPDATE insumos
        SET cantidad_utilizada = cantidad_utilizada + %s,
            stock_actual = stock_actual - %s
        WHERE id = %s
        """
        
        try:
            result = execute_query(query, (cantidad_a_incrementar, cantidad_a_incrementar, insumo_id))
            if result > 0:
                logger.info(f"Insumo {insumo_id}: cantidad utilizada +{cantidad_a_incrementar}, stock actual -{cantidad_a_incrementar}")
                return True
            else:
                logger.error(f"No se pudo actualizar el insumo {insumo_id}")
                return False
        except Exception as e:
            logger.error(f"Error actualizando insumo {insumo_id}: {e}")
            print(f"Error detallado al actualizar insumo {insumo_id}: {str(e)}")
            return False
    
    # COMENTADO: Este método ya no funciona porque cantidad_actual no existe en la nueva estructura
    # @staticmethod
    # def update_stock(insumo_id: int, new_quantity: float) -> bool:
    #     """Actualizar la cantidad de un insumo"""
    #     query = """
    #     UPDATE insumos
    #     SET cantidad_actual = %s
    #     WHERE id = %s
    #     """
    #     
    #     try:
    #         result = execute_query(query, (new_quantity, insumo_id))
    #         return result > 0
    #     except Exception as e:
    #         logger.error(f"Error actualizando cantidad del insumo {insumo_id}: {e}")
    #         return False
    
    @staticmethod
    def add_stock(insumo_id: int, cantidad_a_agregar: float) -> bool:
        """
        Incrementar el stock actual de un insumo
        
        Args:
            insumo_id: ID del insumo a actualizar
            cantidad_a_agregar: Cantidad a agregar al stock actual
            
        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario
        """
        query = """
        UPDATE insumos
        SET stock_actual = stock_actual + %s
        WHERE id = %s
        """
        
        try:
            result = execute_query(query, (cantidad_a_agregar, insumo_id))
            if result > 0:
                logger.info(f"Stock actual del insumo {insumo_id} incrementado en {cantidad_a_agregar}")
                return True
            else:
                logger.error(f"No se pudo actualizar el stock del insumo {insumo_id}")
                return False
        except Exception as e:
            logger.error(f"Error actualizando stock del insumo {insumo_id}: {e}")
            print(f"Error detallado al actualizar stock del insumo {insumo_id}: {str(e)}")
            return False
    
    # COMENTADO: Este método ya no funciona porque cantidad_actual no existe en la nueva estructura
    # @staticmethod
    # def subtract_stock(insumo_id: int, quantity_to_subtract: float) -> bool:
    #     """Restar cantidad a un insumo"""
    #     # Primero verificamos que haya suficiente stock
    #     check_query = "SELECT cantidad_actual FROM insumos WHERE id = %s"
    #     check_result = execute_query(check_query, (insumo_id,), fetch_one=True)
    #     
    #     if not check_result or check_result['cantidad_actual'] < quantity_to_subtract:
    #         logger.error(f"No hay suficiente stock del insumo {insumo_id}")
    #         return False
    #     
    #     # Si hay suficiente stock, procedemos a restar
    #     query = """
    #     UPDATE insumos
    #     SET cantidad_actual = cantidad_actual - %s
    #     WHERE id = %s
    #     """
    #     
    #     try:
    #         result = execute_query(query, (quantity_to_subtract, insumo_id))
    #         return result > 0
    #     except Exception as e:
    #         logger.error(f"Error restando cantidad al insumo {insumo_id}: {e}")
    #         return False
    
    # COMENTADO: Este método ya no funciona porque cantidad_actual no existe en la nueva estructura
    # @staticmethod
    # def get_low_stock_insumos() -> List[dict]:
    #     """Obtener insumos con stock bajo"""
    #     query = """
    #     SELECT * FROM insumos
    #     WHERE cantidad_actual <= stock_minimo
    #     ORDER BY nombre_insumo
    #     """
    #     
    #     return execute_query(query, fetch_all=True) or []
    
    @staticmethod
    def search_insumos_by_name(search_term: str) -> List[dict]:
        """Buscar insumos por nombre"""
        query = """
        SELECT * FROM insumos
        WHERE nombre_insumo LIKE %s
        ORDER BY nombre_insumo
        """
        
        return execute_query(query, (f"%{search_term}%",), fetch_all=True) or [] 