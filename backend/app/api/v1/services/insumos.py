from fastapi import APIRouter, HTTPException, Depends, status, Request, APIRouter
from fastapi.responses import JSONResponse
from typing import  Optional
from api.v1.auth_service.login import get_current_active_user
from models.insumo_service import InsumoService



# Router para insumos
router_insumos = APIRouter()

@router_insumos.post("/", status_code=status.HTTP_201_CREATED)
async def create_insumo(
    request: Request,
    nombre_insumo: Optional[str] = None,
    unidad: Optional[str] = None,
    cantidad_unitaria: Optional[float] = None,
    precio_presentacion: Optional[float] = None,
    cantidad_utilizada: Optional[float] = None,
    cantidad_por_producto: Optional[float] = None,
    stock_minimo: Optional[float] = None,
    sitio_referencia: Optional[str] = None
):
    """Crear un nuevo insumo"""
    # Intentar obtener datos del cuerpo JSON si están disponibles
    try:
        body = await request.json()
        if nombre_insumo is None and "nombre_insumo" in body:
            nombre_insumo = body["nombre_insumo"]
        if unidad is None and "unidad" in body:
            unidad = body["unidad"]
        if cantidad_unitaria is None and "cantidad_unitaria" in body:
            cantidad_unitaria = body["cantidad_unitaria"]
        if precio_presentacion is None and "precio_presentacion" in body:
            precio_presentacion = body["precio_presentacion"]
        if cantidad_utilizada is None and "cantidad_utilizada" in body:
            cantidad_utilizada = body["cantidad_utilizada"]
        if cantidad_por_producto is None and "cantidad_por_producto" in body:
            cantidad_por_producto = body["cantidad_por_producto"]
        if stock_minimo is None and "stock_minimo" in body:
            stock_minimo = body["stock_minimo"]
        if sitio_referencia is None and "sitio_referencia" in body:
            sitio_referencia = body["sitio_referencia"]
    except Exception as e:
        print(f"Error al procesar el cuerpo JSON: {str(e)}")
        # Si no hay cuerpo JSON o hay un error, usar los parámetros de consulta
        pass
    
    print(f"Datos recibidos: nombre={nombre_insumo}, unidad={unidad}, cantidad_unitaria={cantidad_unitaria}, precio_presentacion={precio_presentacion}, cantidad_utilizada={cantidad_utilizada}, cantidad_por_producto={cantidad_por_producto}, min={stock_minimo}, sitio_referencia={sitio_referencia}")
    
    # Validar que los campos obligatorios estén presentes
    if nombre_insumo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del insumo es obligatorio"
        )
    if unidad is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La unidad del insumo es obligatoria"
        )
    if cantidad_unitaria is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cantidad unitaria es obligatoria"
        )
    if precio_presentacion is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El precio de presentación es obligatorio"
        )
    
    # Valores por defecto
    if cantidad_utilizada is None:
        cantidad_utilizada = 0
    if cantidad_por_producto is None:
        cantidad_por_producto = 0
    if stock_minimo is None:
        stock_minimo = 0
    
    try:
        # Verificar si ya existe un insumo con el mismo nombre
        check_query = "SELECT id FROM insumos WHERE nombre_insumo = %s"
        from database.db import execute_query
        existing_insumo = execute_query(check_query, (nombre_insumo,), fetch_one=True)
        
        if existing_insumo:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": f"Ya existe un insumo con el nombre '{nombre_insumo}'"}
            )
            
        insumo_id = InsumoService.create_insumo(
            nombre_insumo=nombre_insumo,
            unidad=unidad,
            cantidad_unitaria=cantidad_unitaria,
            precio_presentacion=precio_presentacion,
            cantidad_utilizada=cantidad_utilizada,
            cantidad_por_producto=cantidad_por_producto,
            stock_minimo=stock_minimo,
            sitio_referencia=sitio_referencia
        )
        
        print(f"ID del insumo creado: {insumo_id}")
        
        if not insumo_id:
            # Intentar verificar si el insumo se creó de todas formas
            check_query = "SELECT id FROM insumos WHERE nombre_insumo = %s ORDER BY id DESC LIMIT 1"
            check_result = execute_query(check_query, (nombre_insumo,), fetch_one=True)
            
            if check_result:
                insumo_id = check_result["id"]
                print(f"Insumo encontrado con ID: {insumo_id}")
                return {"id": insumo_id, "message": "Insumo creado exitosamente (recuperado)"}
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el insumo"
            )
        
        return {"id": insumo_id, "message": "Insumo creado exitosamente"}
    except ValueError as e:
        print(f"Error de validación al crear insumo: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(e)}
        )
    except Exception as e:
        print(f"Error inesperado al crear insumo: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Error al crear el insumo: {str(e)}"}
        )

@router_insumos.get("/{insumo_id}")
async def get_insumo(insumo_id: int):
    """Obtener un insumo por su ID"""
    insumo = InsumoService.get_insumo_by_id(insumo_id)
    
    if not insumo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insumo con ID {insumo_id} no encontrado"
        )
    
    return insumo



@router_insumos.get("/")
async def get_insumos(
    search: Optional[str] = None,
    low_stock_only: bool = False
):
    """Obtener lista de insumos con filtros"""
    insumos = InsumoService.get_insumos(
        search=search,
        low_stock_only=low_stock_only
    )
    
    return insumos

@router_insumos.put("/{insumo_id}")
async def update_insumo(
    insumo_id: int,
    request: Request,
    current_user: dict = Depends(get_current_active_user)
):
    """Actualizar un insumo existente"""
    # Verificar que el insumo existe
    insumo = InsumoService.get_insumo_by_id(insumo_id)
    if not insumo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insumo con ID {insumo_id} no encontrado"
        )
    
    # Obtener datos de actualización
    try:
        update_data = await request.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al procesar el cuerpo JSON: {str(e)}"
        )
    
    # Validar datos
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron datos para actualizar"
        )
    
    # Validar tipos de datos
    if "stock_minimo" in update_data and not isinstance(update_data["stock_minimo"], (int, float)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El stock mínimo debe ser un número"
        )
        
    if "cantidad_unitaria" in update_data and not isinstance(update_data["cantidad_unitaria"], (int, float)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cantidad unitaria debe ser un número"
        )
    
    if "precio_presentacion" in update_data and not isinstance(update_data["precio_presentacion"], (int, float)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El precio de presentación debe ser un número"
        )
    
    if "cantidad_utilizada" in update_data and not isinstance(update_data["cantidad_utilizada"], (int, float)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cantidad utilizada debe ser un número"
        )
    
    # Intentar actualizar el insumo
    success = InsumoService.update_insumo(insumo_id, update_data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el insumo"
        )
    
    # Obtener el insumo actualizado
    updated_insumo = InsumoService.get_insumo_by_id(insumo_id)
    return updated_insumo

