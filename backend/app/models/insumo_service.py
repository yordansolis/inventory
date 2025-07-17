from database.db import execute_query
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class InsumoService:
    
    @staticmethod
    def create_insumo(nombre_insumo: str, unidad: str, cantidad_actual: float = 0, 
                     stock_minimo: float = 0) -> Optional[int]:
        """Crear un nuevo insumo"""
        query = """
        INSERT INTO insumos (nombre_insumo, unidad, cantidad_actual, stock_minimo)
        VALUES (%s, %s, %s, %s)
        """
        
        try:
            result = execute_query(query, (nombre_insumo, unidad, cantidad_actual, stock_minimo))
            
            if result:
                # Obtener el ID del insumo recién creado
                id_query = "SELECT LAST_INSERT_ID() as id"
                id_result = execute_query(id_query, fetch_one=True)
                return id_result['id'] if id_result else None
            
            return None
        except Exception as e:
            logger.error(f"Error creando insumo: {e}")
            return None
    
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
        
        if low_stock_only:
            conditions.append("cantidad_actual <= stock_minimo")
        
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
        if "cantidad_actual" in update_data and not isinstance(update_data["cantidad_actual"], (int, float)):
            logger.error(f"Cantidad actual inválida: {update_data['cantidad_actual']}")
            return False
        
        if "stock_minimo" in update_data and not isinstance(update_data["stock_minimo"], (int, float)):
            logger.error(f"Stock mínimo inválido: {update_data['stock_minimo']}")
            return False
        
        # Construir la consulta dinámicamente solo con los campos que se van a actualizar
        update_fields = []
        params = []
        
        for field, value in update_data.items():
            if field not in ['id', 'creado_en']:
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
    def update_stock(insumo_id: int, new_quantity: float) -> bool:
        """Actualizar la cantidad de un insumo"""
        query = """
        UPDATE insumos
        SET cantidad_actual = %s
        WHERE id = %s
        """
        
        try:
            result = execute_query(query, (new_quantity, insumo_id))
            return result > 0
        except Exception as e:
            logger.error(f"Error actualizando cantidad del insumo {insumo_id}: {e}")
            return False
    
    @staticmethod
    def add_stock(insumo_id: int, quantity_to_add: float) -> bool:
        """Añadir cantidad a un insumo"""
        query = """
        UPDATE insumos
        SET cantidad_actual = cantidad_actual + %s
        WHERE id = %s
        """
        
        try:
            result = execute_query(query, (quantity_to_add, insumo_id))
            return result > 0
        except Exception as e:
            logger.error(f"Error añadiendo cantidad al insumo {insumo_id}: {e}")
            return False
    
    @staticmethod
    def subtract_stock(insumo_id: int, quantity_to_subtract: float) -> bool:
        """Restar cantidad a un insumo"""
        # Primero verificamos que haya suficiente stock
        check_query = "SELECT cantidad_actual FROM insumos WHERE id = %s"
        check_result = execute_query(check_query, (insumo_id,), fetch_one=True)
        
        if not check_result or check_result['cantidad_actual'] < quantity_to_subtract:
            logger.error(f"No hay suficiente stock del insumo {insumo_id}")
            return False
        
        # Si hay suficiente stock, procedemos a restar
        query = """
        UPDATE insumos
        SET cantidad_actual = cantidad_actual - %s
        WHERE id = %s
        """
        
        try:
            result = execute_query(query, (quantity_to_subtract, insumo_id))
            return result > 0
        except Exception as e:
            logger.error(f"Error restando cantidad al insumo {insumo_id}: {e}")
            return False
    
    @staticmethod
    def get_low_stock_insumos() -> List[dict]:
        """Obtener insumos con stock bajo"""
        query = """
        SELECT * FROM insumos
        WHERE cantidad_actual <= stock_minimo
        ORDER BY nombre_insumo
        """
        
        return execute_query(query, fetch_all=True) or []
    
    @staticmethod
    def search_insumos_by_name(search_term: str) -> List[dict]:
        """Buscar insumos por nombre"""
        query = """
        SELECT * FROM insumos
        WHERE nombre_insumo LIKE %s
        ORDER BY nombre_insumo
        """
        
        return execute_query(query, (f"%{search_term}%",), fetch_all=True) or [] 