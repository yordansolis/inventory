from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from database.db import execute_query, execute_insert_and_get_id

# Modelo Pydantic para validación de adiciones
class AdicionBase(BaseModel):
    nombre: str
    tipo: str
    precio: float = Field(gt=0)
    stock: int = Field(ge=0)
    minimo: int = Field(ge=0)
    estado: str = "bien"

class AdicionCreate(AdicionBase):
    pass

class AdicionUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    precio: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    minimo: Optional[int] = Field(default=None, ge=0)
    estado: Optional[str] = None

class AdicionResponse(AdicionBase):
    id: int

    class Config:
        from_attributes = True

# Router para los endpoints de adiciones
router_additions = APIRouter()

# Crear tabla de adiciones si no existe
def create_additions_table():
    """
    Crear la tabla de adiciones si no existe
    """
    additions_table = """
    CREATE TABLE IF NOT EXISTS adiciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        minimo INT NOT NULL DEFAULT 0,
        estado VARCHAR(20) NOT NULL DEFAULT 'bien',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """
    execute_query(additions_table)
    print("Tabla de adiciones verificada/creada exitosamente")

# Crear la tabla al importar el módulo
create_additions_table()

@router_additions.post("/", response_model=AdicionResponse)
async def create_addition(adicion: AdicionCreate):
    """
    Crea una nueva adición
    """
    try:
        # Verificar si ya existe una adición con el mismo nombre
        check_query = "SELECT id FROM adiciones WHERE nombre = %s"
        existing = execute_query(check_query, (adicion.nombre,), fetch_one=True)
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una adición con el nombre {adicion.nombre}"
            )
        
        # Insertar la nueva adición
        insert_query = """
        INSERT INTO adiciones (nombre, tipo, precio, stock, minimo, estado)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        adicion_id = execute_insert_and_get_id(
            insert_query, 
            (adicion.nombre, adicion.tipo, adicion.precio, adicion.stock, adicion.minimo, adicion.estado)
        )
        
        if not adicion_id:
            raise HTTPException(
                status_code=500,
                detail="Error al crear la adición"
            )
        
        # Devolver la adición creada
        return {
            "id": adicion_id,
            "nombre": adicion.nombre,
            "tipo": adicion.tipo,
            "precio": adicion.precio,
            "stock": adicion.stock,
            "minimo": adicion.minimo,
            "estado": adicion.estado
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la adición: {str(e)}"
        )

@router_additions.get("/", response_model=List[AdicionResponse])
async def get_additions():
    """
    Obtiene todas las adiciones
    """
    try:
        query = "SELECT id, nombre, tipo, precio, stock, minimo, estado FROM adiciones"
        additions = execute_query(query, fetch_all=True)
        
        if not additions:
            return []
        
        return additions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener las adiciones: {str(e)}"
        )

@router_additions.get("/{addition_id}", response_model=AdicionResponse)
async def get_addition(addition_id: int):
    """
    Obtiene una adición por su ID
    """
    try:
        query = "SELECT id, nombre, tipo, precio, stock, minimo, estado FROM adiciones WHERE id = %s"
        addition = execute_query(query, (addition_id,), fetch_one=True)
        
        if not addition:
            raise HTTPException(
                status_code=404,
                detail=f"Adición con ID {addition_id} no encontrada"
            )
        
        return addition
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener la adición: {str(e)}"
        )

@router_additions.put("/{addition_id}", response_model=AdicionResponse)
async def update_addition(addition_id: int, adicion: AdicionUpdate):
    """
    Actualiza una adición existente
    """
    try:
        # Verificar si la adición existe
        check_query = "SELECT id FROM adiciones WHERE id = %s"
        existing = execute_query(check_query, (addition_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(
                status_code=404,
                detail=f"Adición con ID {addition_id} no encontrada"
            )
        
        # Construir la consulta de actualización dinámicamente
        update_parts = []
        params = []
        
        if adicion.nombre is not None:
            # Verificar si el nuevo nombre ya está en uso por otra adición
            if adicion.nombre:
                check_name_query = "SELECT id FROM adiciones WHERE nombre = %s AND id != %s"
                name_exists = execute_query(check_name_query, (adicion.nombre, addition_id), fetch_one=True)
                
                if name_exists:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Ya existe otra adición con el nombre {adicion.nombre}"
                    )
            
            update_parts.append("nombre = %s")
            params.append(adicion.nombre)
        
        if adicion.tipo is not None:
            update_parts.append("tipo = %s")
            params.append(adicion.tipo)
        
        if adicion.precio is not None:
            update_parts.append("precio = %s")
            params.append(adicion.precio)
        
        if adicion.stock is not None:
            update_parts.append("stock = %s")
            params.append(adicion.stock)
        
        if adicion.minimo is not None:
            update_parts.append("minimo = %s")
            params.append(adicion.minimo)
        
        if adicion.estado is not None:
            update_parts.append("estado = %s")
            params.append(adicion.estado)
        
        # Si no hay nada que actualizar, devolver la adición sin cambios
        if not update_parts:
            query = "SELECT id, nombre, tipo, precio, stock, minimo, estado FROM adiciones WHERE id = %s"
            return execute_query(query, (addition_id,), fetch_one=True)
        
        # Actualizar la adición
        update_query = f"""
        UPDATE adiciones
        SET {", ".join(update_parts)}
        WHERE id = %s
        """
        params.append(addition_id)
        
        execute_query(update_query, params)
        
        # Devolver la adición actualizada
        query = "SELECT id, nombre, tipo, precio, stock, minimo, estado FROM adiciones WHERE id = %s"
        updated_addition = execute_query(query, (addition_id,), fetch_one=True)
        
        return updated_addition
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar la adición: {str(e)}"
        )

@router_additions.delete("/{addition_id}")
async def delete_addition(addition_id: int):
    """
    Elimina una adición
    """
    try:
        # Verificar si la adición existe
        check_query = "SELECT id FROM adiciones WHERE id = %s"
        existing = execute_query(check_query, (addition_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(
                status_code=404,
                detail=f"Adición con ID {addition_id} no encontrada"
            )
        
        # Eliminar la adición
        delete_query = "DELETE FROM adiciones WHERE id = %s"
        result = execute_query(delete_query, (addition_id,))
        
        if result is None or result <= 0:
            raise HTTPException(
                status_code=500,
                detail="Error al eliminar la adición"
            )
        
        return {"message": f"Adición con ID {addition_id} eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar la adición: {str(e)}"
        )

# Endpoint para insertar datos iniciales
@router_additions.post("/seed")
async def seed_additions():
    """
    Inserta datos iniciales de adiciones para pruebas
    """
    try:
        # Lista de adiciones iniciales
        initial_additions = [
            {"nombre": "CREMA CHANTILLY", "tipo": "TOPPING", "precio": 500, "stock": 50, "minimo": 10, "estado": "bien"},
            {"nombre": "AREQUIPE", "tipo": "TOPPING", "precio": 800, "stock": 30, "minimo": 5, "estado": "bien"},
            {"nombre": "CHISPAS DE CHOCOLATE", "tipo": "TOPPING", "precio": 300, "stock": 100, "minimo": 20, "estado": "bien"},
            {"nombre": "FRESAS NATURALES", "tipo": "FRUTA", "precio": 1000, "stock": 15, "minimo": 5, "estado": "bien"},
            {"nombre": "BANANO", "tipo": "FRUTA", "precio": 700, "stock": 25, "minimo": 10, "estado": "bien"},
            {"nombre": "SALSA DE CHOCOLATE", "tipo": "SALSA", "precio": 600, "stock": 40, "minimo": 10, "estado": "bien"},
            {"nombre": "SALSA DE FRESA", "tipo": "SALSA", "precio": 600, "stock": 35, "minimo": 10, "estado": "bien"},
            {"nombre": "GRANOLA", "tipo": "CEREAL", "precio": 400, "stock": 60, "minimo": 15, "estado": "bien"}
        ]
        
        # Eliminar adiciones existentes para evitar duplicados
        execute_query("DELETE FROM adiciones")
        
        # Insertar las adiciones iniciales
        for adicion in initial_additions:
            insert_query = """
            INSERT INTO adiciones (nombre, tipo, precio, stock, minimo, estado)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            execute_insert_and_get_id(
                insert_query, 
                (adicion["nombre"], adicion["tipo"], adicion["precio"], adicion["stock"], adicion["minimo"], adicion["estado"])
            )
        
        return {"message": "Datos iniciales de adiciones insertados correctamente"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al insertar datos iniciales: {str(e)}"
        )
