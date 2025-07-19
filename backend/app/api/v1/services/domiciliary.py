from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from database.db import execute_query, execute_insert_and_get_id

# Modelo Pydantic para validación de domiciliarios
class DomiciliaryBase(BaseModel):
    nombre: str
    telefono: str
    tarifa: float = Field(gt=0)

class DomiciliaryCreate(DomiciliaryBase):
    pass

class DomiciliaryUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    tarifa: Optional[float] = Field(default=None, gt=0)

class DomiciliaryResponse(DomiciliaryBase):
    id: int

    class Config:
        from_attributes = True

# Router para los endpoints de domiciliarios
router_domiciliary = APIRouter()

# Crear tabla de domiciliarios si no existe
def create_domiciliary_table():
    """
    Crear la tabla de domiciliarios si no existe
    """
    domiciliary_table = """
    CREATE TABLE IF NOT EXISTS domiciliarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        tarifa DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """
    execute_query(domiciliary_table)
    print("Tabla de domiciliarios verificada/creada exitosamente")

# Crear la tabla al importar el módulo
create_domiciliary_table()

@router_domiciliary.post("/", response_model=DomiciliaryResponse)
async def create_domiciliary(domiciliary: DomiciliaryCreate):
    """
    Crea un nuevo domiciliario
    """
    try:
        # Verificar si ya existe un domiciliario con el mismo teléfono
        check_query = "SELECT id FROM domiciliarios WHERE telefono = %s"
        existing = execute_query(check_query, (domiciliary.telefono,), fetch_one=True)
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un domiciliario con el teléfono {domiciliary.telefono}"
            )
        
        # Insertar el nuevo domiciliario
        insert_query = """
        INSERT INTO domiciliarios (nombre, telefono, tarifa)
        VALUES (%s, %s, %s)
        """
        domiciliary_id = execute_insert_and_get_id(
            insert_query, 
            (domiciliary.nombre, domiciliary.telefono, domiciliary.tarifa)
        )
        
        if not domiciliary_id:
            raise HTTPException(
                status_code=500,
                detail="Error al crear el domiciliario"
            )
        
        # Devolver el domiciliario creado
        return {
            "id": domiciliary_id,
            "nombre": domiciliary.nombre,
            "telefono": domiciliary.telefono,
            "tarifa": domiciliary.tarifa
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear el domiciliario: {str(e)}"
        )

@router_domiciliary.get("/", response_model=List[DomiciliaryResponse])
async def get_domiciliaries():
    """
    Obtiene todos los domiciliarios
    """
    try:
        query = "SELECT id, nombre, telefono, tarifa FROM domiciliarios"
        domiciliaries = execute_query(query, fetch_all=True)
        
        if not domiciliaries:
            return []
        
        return domiciliaries
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener los domiciliarios: {str(e)}"
        )

@router_domiciliary.get("/{domiciliary_id}", response_model=DomiciliaryResponse)
async def get_domiciliary(domiciliary_id: int):
    """
    Obtiene un domiciliario por su ID
    """
    try:
        query = "SELECT id, nombre, telefono, tarifa FROM domiciliarios WHERE id = %s"
        domiciliary = execute_query(query, (domiciliary_id,), fetch_one=True)
        
        if not domiciliary:
            raise HTTPException(
                status_code=404,
                detail=f"Domiciliario con ID {domiciliary_id} no encontrado"
            )
        
        return domiciliary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el domiciliario: {str(e)}"
        )

@router_domiciliary.put("/{domiciliary_id}", response_model=DomiciliaryResponse)
async def update_domiciliary(domiciliary_id: int, domiciliary: DomiciliaryUpdate):
    """
    Actualiza un domiciliario existente
    """
    try:
        # Verificar si el domiciliario existe
        check_query = "SELECT id FROM domiciliarios WHERE id = %s"
        existing = execute_query(check_query, (domiciliary_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(
                status_code=404,
                detail=f"Domiciliario con ID {domiciliary_id} no encontrado"
            )
        
        # Construir la consulta de actualización dinámicamente
        update_parts = []
        params = []
        
        if domiciliary.nombre is not None:
            update_parts.append("nombre = %s")
            params.append(domiciliary.nombre)
        
        if domiciliary.telefono is not None:
            # Verificar si el nuevo teléfono ya está en uso por otro domiciliario
            if domiciliary.telefono:
                check_phone_query = "SELECT id FROM domiciliarios WHERE telefono = %s AND id != %s"
                phone_exists = execute_query(check_phone_query, (domiciliary.telefono, domiciliary_id), fetch_one=True)
                
                if phone_exists:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Ya existe otro domiciliario con el teléfono {domiciliary.telefono}"
                    )
            
            update_parts.append("telefono = %s")
            params.append(domiciliary.telefono)
        
        if domiciliary.tarifa is not None:
            update_parts.append("tarifa = %s")
            params.append(domiciliary.tarifa)
        
        # Si no hay nada que actualizar, devolver el domiciliario sin cambios
        if not update_parts:
            query = "SELECT id, nombre, telefono, tarifa FROM domiciliarios WHERE id = %s"
            return execute_query(query, (domiciliary_id,), fetch_one=True)
        
        # Actualizar el domiciliario
        update_query = f"""
        UPDATE domiciliarios
        SET {", ".join(update_parts)}
        WHERE id = %s
        """
        params.append(domiciliary_id)
        
        execute_query(update_query, params)
        
        # Devolver el domiciliario actualizado
        query = "SELECT id, nombre, telefono, tarifa FROM domiciliarios WHERE id = %s"
        updated_domiciliary = execute_query(query, (domiciliary_id,), fetch_one=True)
        
        return updated_domiciliary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar el domiciliario: {str(e)}"
        )

@router_domiciliary.delete("/{domiciliary_id}")
async def delete_domiciliary(domiciliary_id: int):
    """
    Elimina un domiciliario
    """
    try:
        # Verificar si el domiciliario existe
        check_query = "SELECT id FROM domiciliarios WHERE id = %s"
        existing = execute_query(check_query, (domiciliary_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(
                status_code=404,
                detail=f"Domiciliario con ID {domiciliary_id} no encontrado"
            )
        
        # Eliminar el domiciliario
        delete_query = "DELETE FROM domiciliarios WHERE id = %s"
        result = execute_query(delete_query, (domiciliary_id,))
        
        if result is None or result <= 0:
            raise HTTPException(
                status_code=500,
                detail="Error al eliminar el domiciliario"
            )
        
        return {"message": f"Domiciliario con ID {domiciliary_id} eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar el domiciliario: {str(e)}"
        )
