from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pymysql
from database.db import get_db_connection
from api.v1.auth_service.login import get_current_user

# Modelo para un día en la programación de camisetas
class ShirtDay(BaseModel):
    day: str  # monday, tuesday, etc.
    dayName: str  # Lunes, Martes, etc.
    color: str  # Color en formato hexadecimal (#RRGGBB)
    colorName: str  # Nombre del color

# Modelo para actualizar un solo día
class ShirtDayUpdate(BaseModel):
    color: str
    colorName: str

# Modelo para la programación completa de camisetas
class ShirtSchedule(BaseModel):
    schedule: List[ShirtDay]
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None

router_shirt_schedule = APIRouter()

def ensure_shirt_schedule_table():
    """
    Función para asegurar que la tabla shirt_schedule existe con la estructura correcta
    y eliminar duplicados existentes
    """
    try:
        connection = get_db_connection()
        if not connection:
            return False
        
        cursor = None
        try:
            cursor = connection.cursor()
            
            # Crear la tabla con PRIMARY KEY en 'day' para evitar duplicados
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS shirt_schedule (
                    day VARCHAR(20) PRIMARY KEY,
                    day_name VARCHAR(20) NOT NULL,
                    color VARCHAR(20) NOT NULL,
                    color_name VARCHAR(50) NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    updated_by VARCHAR(100) NOT NULL
                )
            """)
            
            # Verificar si hay duplicados existentes y limpiarlos
            cursor.execute("""
                SELECT day, COUNT(*) as count 
                FROM shirt_schedule 
                GROUP BY day 
                HAVING COUNT(*) > 1
            """)
            
            duplicates = cursor.fetchall()
            
            if duplicates:
                print(f"Encontrados {len(duplicates)} días duplicados. Limpiando...")
                
                # Para cada día duplicado, mantener solo el registro más reciente
                for day_tuple in duplicates:
                    day = day_tuple[0]
                    
                    # Eliminar todos los registros excepto el más reciente
                    cursor.execute("""
                        DELETE FROM shirt_schedule 
                        WHERE day = %s AND updated_at != (
                            SELECT max_updated_at FROM (
                                SELECT MAX(updated_at) as max_updated_at 
                                FROM shirt_schedule 
                                WHERE day = %s
                            ) as temp
                        )
                    """, (day, day))
                
                connection.commit()
                print("Duplicados eliminados exitosamente")
            
            return True
                
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    except Exception as e:
        print(f"Error al configurar la tabla shirt_schedule: {str(e)}")
        return False

def get_default_schedule():
    """
    Retorna la programación por defecto
    """
    return [
        {"day": "monday", "dayName": "Lunes", "color": "#ffffff", "colorName": "Blanco"},
        {"day": "tuesday", "dayName": "Martes", "color": "#ec4899", "colorName": "Rosa"},
        {"day": "wednesday", "dayName": "Miércoles", "color": "#8b5cf6", "colorName": "Morado"},
        {"day": "thursday", "dayName": "Jueves", "color": "#6b7280", "colorName": "Gris"},
        {"day": "friday", "dayName": "Viernes", "color": "#dc2626", "colorName": "Rojo Oscuro"},
        {"day": "saturday", "dayName": "Sábado", "color": "#ec4899", "colorName": "Rosa"},
        {"day": "sunday", "dayName": "Domingo", "color": "#8b5cf6", "colorName": "Morado"}
    ]

@router_shirt_schedule.post("/")
async def save_shirt_schedule(schedule_data: ShirtSchedule, current_user: dict = Depends(get_current_user)):
    """
    Guarda la programación de camisetas en la base de datos usando UPSERT para evitar duplicados.
    """
    try:
        # Asegurar que la tabla existe y está limpia
        ensure_shirt_schedule_table()
        
        connection = get_db_connection()
        if not connection:
            raise HTTPException(
                status_code=500,
                detail="No se pudo establecer conexión con la base de datos"
            )
        
        cursor = None
        try:
            cursor = connection.cursor()
            
            # Usar INSERT ... ON DUPLICATE KEY UPDATE para evitar duplicados
            for day in schedule_data.schedule:
                cursor.execute("""
                    INSERT INTO shirt_schedule 
                    (day, day_name, color, color_name, updated_by)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                    day_name = VALUES(day_name),
                    color = VALUES(color),
                    color_name = VALUES(color_name),
                    updated_by = VALUES(updated_by),
                    updated_at = CURRENT_TIMESTAMP
                """, (day.day, day.dayName, day.color, day.colorName, current_user["username"]))
            
            connection.commit()
            
            # Obtener la fecha de actualización más reciente
            cursor.execute("SELECT MAX(updated_at) as last_update FROM shirt_schedule")
            result = cursor.fetchone()
            last_update = result[0] if result else None
            
            return {
                "success": True,
                "message": "Programación de camisetas guardada correctamente",
                "updated_at": last_update.strftime("%Y-%m-%d %H:%M:%S") if last_update else None,
                "updated_by": current_user["username"]
            }
                
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al guardar la programación de camisetas: {str(e)}"
        )

@router_shirt_schedule.patch("/{day}")
async def update_shirt_day(day: str, day_data: ShirtDayUpdate, current_user: dict = Depends(get_current_user)):
    """
    Actualiza el color de un día específico usando UPSERT para evitar duplicados.
    """
    try:
        # Asegurar que la tabla existe y está limpia
        ensure_shirt_schedule_table()
        
        connection = get_db_connection()
        if not connection:
            raise HTTPException(
                status_code=500,
                detail="No se pudo establecer conexión con la base de datos"
            )
        
        cursor = None
        try:
            cursor = connection.cursor()
            
            # Nombres de días en español
            day_names = {
                "monday": "Lunes",
                "tuesday": "Martes",
                "wednesday": "Miércoles",
                "thursday": "Jueves",
                "friday": "Viernes",
                "saturday": "Sábado",
                "sunday": "Domingo"
            }
            
            day_name = day_names.get(day, day.capitalize())
            
            # Usar INSERT ... ON DUPLICATE KEY UPDATE para UPSERT
            cursor.execute("""
                INSERT INTO shirt_schedule 
                (day, day_name, color, color_name, updated_by)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                color = VALUES(color),
                color_name = VALUES(color_name),
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP
            """, (day, day_name, day_data.color, day_data.colorName, current_user["username"]))
            
            connection.commit()
            
            # Obtener la fecha de actualización del registro
            cursor.execute("SELECT updated_at FROM shirt_schedule WHERE day = %s", (day,))
            result = cursor.fetchone()
            last_update = result[0] if result else None
            
            return {
                "success": True,
                "message": f"Color para {day} actualizado correctamente",
                "day": day,
                "color": day_data.color,
                "colorName": day_data.colorName,
                "updated_at": last_update.strftime("%Y-%m-%d %H:%M:%S") if last_update else None,
                "updated_by": current_user["username"]
            }
                
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar el color para {day}: {str(e)}"
        )

@router_shirt_schedule.get("/")
async def get_shirt_schedule():
    """
    Obtiene la programación actual de camisetas desde la base de datos.
    Retorna los días en orden específico y completa con valores por defecto si faltan.
    """
    try:
        # Asegurar que la tabla existe y está limpia
        ensure_shirt_schedule_table()
        
        connection = get_db_connection()
        if not connection:
            raise HTTPException(
                status_code=500,
                detail="No se pudo establecer conexión con la base de datos"
            )
        
        cursor = None
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            
            # Obtener la programación actual
            cursor.execute("""
                SELECT 
                    day, 
                    day_name as dayName, 
                    color, 
                    color_name as colorName 
                FROM shirt_schedule
            """)
            
            db_schedule = cursor.fetchall()
            
            # Crear un diccionario para acceso rápido por día
            schedule_dict = {item['day']: item for item in db_schedule}
            
            # Obtener la programación por defecto y completar con datos de BD
            default_schedule = get_default_schedule()
            final_schedule = []
            
            for default_day in default_schedule:
                if default_day['day'] in schedule_dict:
                    # Usar datos de la base de datos
                    final_schedule.append(schedule_dict[default_day['day']])
                else:
                    # Usar valores por defecto
                    final_schedule.append(default_day)
            
            # Obtener información de la última actualización
            cursor.execute("""
                SELECT 
                    updated_at,
                    updated_by
                FROM shirt_schedule 
                ORDER BY updated_at DESC 
                LIMIT 1
            """)
            
            update_info = cursor.fetchone()
            
            return {
                "success": True,
                "schedule": final_schedule,
                "updated_at": update_info['updated_at'].strftime("%Y-%m-%d %H:%M:%S") if update_info and update_info['updated_at'] else None,
                "updated_by": update_info['updated_by'] if update_info else None
            }
                
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    except Exception as e:
        # En caso de error, devolver la programación por defecto
        print(f"Error al obtener la programación: {str(e)}")
        return {
            "success": True,
            "schedule": get_default_schedule(),
            "updated_at": None,
            "updated_by": None
        }

@router_shirt_schedule.delete("/duplicates")
async def clean_duplicates(current_user: dict = Depends(get_current_user)):
    """
    Endpoint para limpiar duplicados manualmente (útil para mantenimiento)
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
            cursor = connection.cursor()
            
            # Encontrar duplicados
            cursor.execute("""
                SELECT day, COUNT(*) as count 
                FROM shirt_schedule 
                GROUP BY day 
                HAVING COUNT(*) > 1
            """)
            
            duplicates = cursor.fetchall()
            
            if not duplicates:
                return {
                    "success": True,
                    "message": "No se encontraron duplicados",
                    "cleaned_days": []
                }
            
            cleaned_days = []
            
            # Limpiar cada día duplicado
            for day_tuple in duplicates:
                day = day_tuple[0]
                count = day_tuple[1]
                
                # Mantener solo el registro más reciente
                cursor.execute("""
                    DELETE FROM shirt_schedule 
                    WHERE day = %s AND updated_at != (
                        SELECT max_updated_at FROM (
                            SELECT MAX(updated_at) as max_updated_at 
                            FROM shirt_schedule 
                            WHERE day = %s
                        ) as temp
                    )
                """, (day, day))
                
                cleaned_days.append({"day": day, "duplicates_removed": count - 1})
            
            connection.commit()
            
            return {
                "success": True,
                "message": f"Se limpiaron duplicados de {len(cleaned_days)} días",
                "cleaned_days": cleaned_days
            }
                
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al limpiar duplicados: {str(e)}"
        )



# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel
# from typing import List, Optional
# from datetime import datetime
# import pymysql
# from database.db import get_db_connection
# from api.v1.auth_service.login import get_current_user

# # Modelo para un día en la programación de camisetas
# class ShirtDay(BaseModel):
#     day: str  # monday, tuesday, etc.
#     dayName: str  # Lunes, Martes, etc.
#     color: str  # Color en formato hexadecimal (#RRGGBB)
#     colorName: str  # Nombre del color

# # Modelo para actualizar un solo día
# class ShirtDayUpdate(BaseModel):
#     color: str
#     colorName: str

# # Modelo para la programación completa de camisetas
# class ShirtSchedule(BaseModel):
#     schedule: List[ShirtDay]
#     updated_at: Optional[str] = None
#     updated_by: Optional[str] = None

# router_shirt_schedule = APIRouter()

# def fix_shirt_schedule_table():
#     """
#     Función para corregir la estructura de la tabla shirt_schedule y eliminar duplicados
#     """
#     try:
#         connection = get_db_connection()
#         if not connection:
#             return False
        
#         cursor = None
#         try:
#             cursor = connection.cursor()
            
#             # 1. Verificar si la tabla existe
#             cursor.execute("""
#                 SELECT COUNT(*) as count FROM information_schema.tables 
#                 WHERE table_schema = DATABASE() 
#                 AND table_name = 'shirt_schedule'
#             """)
            
#             if cursor.fetchone()[0] == 0:
#                 # La tabla no existe, crearla con la restricción UNIQUE
#                 cursor.execute("""
#                     CREATE TABLE shirt_schedule (
#                         id INT AUTO_INCREMENT PRIMARY KEY,
#                         day VARCHAR(20) NOT NULL,
#                         day_name VARCHAR(20) NOT NULL,
#                         color VARCHAR(20) NOT NULL,
#                         color_name VARCHAR(50) NOT NULL,
#                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
#                         updated_by VARCHAR(100) NOT NULL,
#                         UNIQUE KEY unique_day (day)
#                     )
#                 """)
#                 connection.commit()
#                 return True
            
#             # 2. Verificar si la restricción UNIQUE ya existe
#             cursor.execute("""
#                 SELECT COUNT(*) as count 
#                 FROM information_schema.table_constraints 
#                 WHERE table_schema = DATABASE() 
#                 AND table_name = 'shirt_schedule' 
#                 AND constraint_name = 'unique_day'
#             """)
            
#             has_unique_constraint = cursor.fetchone()[0] > 0
            
#             # 3. Si no hay restricción UNIQUE, eliminar duplicados y agregar la restricción
#             if not has_unique_constraint:
#                 # Crear tabla temporal con la estructura correcta
#                 cursor.execute("""
#                     CREATE TABLE temp_shirt_schedule (
#                         id INT AUTO_INCREMENT PRIMARY KEY,
#                         day VARCHAR(20) NOT NULL,
#                         day_name VARCHAR(20) NOT NULL,
#                         color VARCHAR(20) NOT NULL,
#                         color_name VARCHAR(50) NOT NULL,
#                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
#                         updated_by VARCHAR(100) NOT NULL,
#                         UNIQUE KEY unique_day (day)
#                     )
#                 """)
                
#                 # Insertar datos únicos en la tabla temporal
#                 cursor.execute("""
#                     INSERT INTO temp_shirt_schedule (day, day_name, color, color_name, updated_by)
#                     SELECT day, day_name, color, color_name, updated_by
#                     FROM (
#                         SELECT day, day_name, color, color_name, updated_by
#                         FROM shirt_schedule
#                         ORDER BY id DESC
#                     ) as latest_entries
#                     GROUP BY day
#                 """)
                
#                 # Eliminar la tabla original
#                 cursor.execute("DROP TABLE shirt_schedule")
                
#                 # Renombrar la tabla temporal
#                 cursor.execute("RENAME TABLE temp_shirt_schedule TO shirt_schedule")
                
#                 connection.commit()
#                 return True
            
#             return True
                
#         finally:
#             if cursor:
#                 cursor.close()
#             if connection:
#                 connection.close()
                
#     except Exception as e:
#         print(f"Error al corregir la tabla shirt_schedule: {str(e)}")
#         return False

# @router_shirt_schedule.post("/")
# async def save_shirt_schedule(schedule_data: ShirtSchedule, current_user: dict = Depends(get_current_user)):
#     """
#     Guarda la programación de camisetas en la base de datos.
    
#     Args:
#         schedule_data: La programación completa de camisetas
#         current_user: Usuario autenticado que realiza la acción
#     """
#     try:
#         # Primero corregir la estructura de la tabla
#         fix_shirt_schedule_table()
        
#         connection = get_db_connection()
#         if not connection:
#             raise HTTPException(
#                 status_code=500,
#                 detail="No se pudo establecer conexión con la base de datos"
#             )
        
#         cursor = None
#         try:
#             cursor = connection.cursor()
            
#             # Insertar o actualizar la programación usando REPLACE INTO
#             for day in schedule_data.schedule:
#                 cursor.execute("""
#                     INSERT INTO shirt_schedule (day, day_name, color, color_name, updated_by)
#                     VALUES (%s, %s, %s, %s, %s)
#                     ON DUPLICATE KEY UPDATE 
#                         color = VALUES(color),
#                         color_name = VALUES(color_name),
#                         updated_by = VALUES(updated_by),
#                         updated_at = CURRENT_TIMESTAMP
#                 """, (day.day, day.dayName, day.color, day.colorName, current_user["username"]))

            
#             connection.commit()
            
#             # Obtener la fecha de actualización
#             cursor.execute("SELECT MAX(updated_at) as last_update FROM shirt_schedule")
#             last_update = cursor.fetchone()[0]
            
#             return {
#                 "success": True,
#                 "message": "Programación de camisetas guardada correctamente",
#                 "updated_at": last_update.strftime("%Y-%m-%d %H:%M:%S") if last_update else None,
#                 "updated_by": current_user["username"]
#             }
                
#         finally:
#             if cursor:
#                 cursor.close()
#             if connection:
#                 connection.close()
                
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error al guardar la programación de camisetas: {str(e)}"
#         )

# @router_shirt_schedule.patch("/{day}")
# async def update_shirt_day(day: str, day_data: ShirtDayUpdate, current_user: dict = Depends(get_current_user)):
#     """
#     Actualiza el color de un día específico en la programación de camisetas.
    
#     Args:
#         day: El día a actualizar (monday, tuesday, etc.)
#         day_data: Los nuevos datos de color para el día
#         current_user: Usuario autenticado que realiza la acción
#     """
#     try:
#         # Primero corregir la estructura de la tabla
#         fix_shirt_schedule_table()
        
#         connection = get_db_connection()
#         if not connection:
#             raise HTTPException(
#                 status_code=500,
#                 detail="No se pudo establecer conexión con la base de datos"
#             )
        
#         cursor = None
#         try:
#             cursor = connection.cursor()
            
#             # Verificar si el día existe
#             cursor.execute("SELECT day_name FROM shirt_schedule WHERE day = %s", (day,))
#             result = cursor.fetchone()
            
#             if not result:
#                 # Si el día no existe, obtener el nombre del día en español
#                 day_names = {
#                     "monday": "Lunes",
#                     "tuesday": "Martes",
#                     "wednesday": "Miércoles",
#                     "thursday": "Jueves",
#                     "friday": "Viernes",
#                     "saturday": "Sábado",
#                     "sunday": "Domingo"
#                 }
                
#                 day_name = day_names.get(day, day.capitalize())
                
#                 # Insertar el día
#                 cursor.execute("""
#                     INSERT INTO shirt_schedule 
#                     (day, day_name, color, color_name, updated_by)
#                     VALUES (%s, %s, %s, %s, %s)
#                 """, (day, day_name, day_data.color, day_data.colorName, current_user["username"]))
#             else:
#                 # Actualizar el día existente
#                 cursor.execute("""
#                     UPDATE shirt_schedule 
#                     SET color = %s, color_name = %s, updated_by = %s
#                     WHERE day = %s
#                 """, (day_data.color, day_data.colorName, current_user["username"], day))
            
#             connection.commit()
            
#             # Obtener la fecha de actualización
#             cursor.execute("SELECT updated_at FROM shirt_schedule WHERE day = %s", (day,))
#             last_update = cursor.fetchone()[0]
            
#             return {
#                 "success": True,
#                 "message": f"Color para {day} actualizado correctamente",
#                 "day": day,
#                 "color": day_data.color,
#                 "colorName": day_data.colorName,
#                 "updated_at": last_update.strftime("%Y-%m-%d %H:%M:%S") if last_update else None,
#                 "updated_by": current_user["username"]
#             }
                
#         finally:
#             if cursor:
#                 cursor.close()
#             if connection:
#                 connection.close()
                
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error al actualizar el color para {day}: {str(e)}"
#         )

# @router_shirt_schedule.get("/")
# async def get_shirt_schedule():
#     """
#     Obtiene la programación actual de camisetas desde la base de datos.
#     """
#     try:
#         # Primero corregir la estructura de la tabla
#         fix_shirt_schedule_table()
        
#         connection = get_db_connection()
#         if not connection:
#             raise HTTPException(
#                 status_code=500,
#                 detail="No se pudo establecer conexión con la base de datos"
#             )
        
#         cursor = None
#         try:
#             cursor = connection.cursor(pymysql.cursors.DictCursor)
            
#             # Verificar si existe la tabla
#             cursor.execute("""
#                 SELECT COUNT(*) as count FROM information_schema.tables 
#                 WHERE table_schema = DATABASE() 
#                 AND table_name = 'shirt_schedule'
#             """)
            
#             if cursor.fetchone()['count'] == 0:
#                 # La tabla no existe, devolver una programación por defecto
#                 return {
#                     "success": True,
#                     "schedule": [
#                         {"day": "monday", "dayName": "Lunes", "color": "#ffffff", "colorName": "Blanco"},
#                         {"day": "tuesday", "dayName": "Martes", "color": "#ec4899", "colorName": "Rosa"},
#                         {"day": "wednesday", "dayName": "Miércoles", "color": "#8b5cf6", "colorName": "Morado"},
#                         {"day": "thursday", "dayName": "Jueves", "color": "#6b7280", "colorName": "Gris"},
#                         {"day": "friday", "dayName": "Viernes", "color": "#dc2626", "colorName": "Rojo Oscuro"},
#                         {"day": "saturday", "dayName": "Sábado", "color": "#ec4899", "colorName": "Rosa"},
#                         {"day": "sunday", "dayName": "Domingo", "color": "#8b5cf6", "colorName": "Morado"}
#                     ],
#                     "updated_at": None,
#                     "updated_by": None
#                 }
            
#             # Obtener la programación
#             cursor.execute("""
#                 SELECT 
#                     day, 
#                     day_name as dayName, 
#                     color, 
#                     color_name as colorName 
#                 FROM shirt_schedule
#                 ORDER BY FIELD(day, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
#             """)
            
#             schedule = cursor.fetchall()
            
#             # Obtener información de la última actualización en una consulta separada
#             cursor.execute("""
#                 SELECT 
#                     updated_at,
#                     updated_by
#                 FROM shirt_schedule 
#                 ORDER BY updated_at DESC 
#                 LIMIT 1
#             """)
            
#             update_info = cursor.fetchone() or {'updated_at': None, 'updated_by': None}
            
#             return {
#                 "success": True,
#                 "schedule": schedule,
#                 "updated_at": update_info['updated_at'].strftime("%Y-%m-%d %H:%M:%S") if update_info['updated_at'] else None,
#                 "updated_by": update_info['updated_by']
#             }
                
#         finally:
#             if cursor:
#                 cursor.close()
#             if connection:
#                 connection.close()
                
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error al obtener la programación de camisetas: {str(e)}"
#         ) 