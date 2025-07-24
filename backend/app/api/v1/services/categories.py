from fastapi import APIRouter, HTTPException, Depends, status, Request, APIRouter
from typing import List, Optional
from api.v1.auth_service.login import get_current_active_user
from database.db import  execute_query
# Crear rutas para categorías
router_categories = APIRouter()


@router_categories.post("/", status_code=status.HTTP_201_CREATED)
async def create_category(
    request: Request,
    name: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Crear una nueva categoría"""
    # Intentar obtener datos del cuerpo JSON si están disponibles
    try:
        body = await request.json()
        if name is None and "name" in body:
            name = body["name"]
    except:
        # Si no hay cuerpo JSON o hay un error, usar los parámetros de consulta
        pass
    
    # Validar que el nombre esté presente
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la categoría es obligatorio"
        )
    
    # Verificar si ya existe una categoría con ese nombre
    check_query = "SELECT id FROM categories WHERE nombre_categoria = %s"
    existing_category = execute_query(check_query, (name,), fetch_one=True)
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una categoría con el nombre '{name}'"
        )
    
    query = """
    INSERT INTO categories (nombre_categoria, created_at)
    VALUES (%s, CURRENT_TIMESTAMP)
    """
    
    try:
        result = execute_query(query, (name,))
        
        if result:
            # Obtener el ID de la categoría recién creada
            id_query = "SELECT LAST_INSERT_ID() as id"
            id_result = execute_query(id_query, fetch_one=True)
            category_id = id_result['id'] if id_result else None
            
            return {"id": category_id, "message": "Categoría creada exitosamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear la categoría"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la categoría: {str(e)}"
        )

@router_categories.get("/", response_model=List[dict])
async def get_categories():
    """Obtener todas las categorías"""
    query = """
    SELECT * FROM categories
    ORDER BY nombre_categoria
    """
    
    categories = execute_query(query, fetch_all=True) or []
    return categories

@router_categories.get("/{category_id}", response_model=dict)
async def get_category(category_id: int):
    """Obtener una categoría por su ID"""
    query = "SELECT * FROM categories WHERE id = %s"
    
    category = execute_query(query, (category_id,), fetch_one=True)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría con ID {category_id} no encontrada"
        )
    
    return category

@router_categories.put("/{category_id}", response_model=dict)
async def update_category(
    request: Request,
    category_id: int,
    name: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Actualizar una categoría"""
    # Intentar obtener datos del cuerpo JSON si están disponibles
    try:
        body = await request.json()
        if name is None and "name" in body:
            name = body["name"]
    except:
        # Si no hay cuerpo JSON o hay un error, usar los parámetros de consulta
        pass
    
    # Validar que el nombre esté presente
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la categoría es obligatorio"
        )
    
    # Verificar que la categoría existe
    check_query = "SELECT id FROM categories WHERE id = %s"
    existing_category = execute_query(check_query, (category_id,), fetch_one=True)
    
    if not existing_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría con ID {category_id} no encontrada"
        )
    
    # Verificar si ya existe otra categoría con ese nombre
    check_name_query = "SELECT id FROM categories WHERE nombre_categoria = %s AND id != %s"
    duplicate_category = execute_query(check_name_query, (name, category_id), fetch_one=True)
    
    if duplicate_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe otra categoría con el nombre '{name}'"
        )
    
    # Actualizar la categoría
    update_query = """
    UPDATE categories
    SET nombre_categoria = %s
    WHERE id = %s
    """
    
    try:
        execute_query(update_query, (name, category_id))
        
        # Obtener la categoría actualizada
        get_query = "SELECT * FROM categories WHERE id = %s"
        updated_category = execute_query(get_query, (category_id,), fetch_one=True)
        
        return updated_category
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la categoría: {str(e)}"
        )

@router_categories.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    """Eliminar una categoría"""
    # Verificar que la categoría existe
    check_query = "SELECT id FROM categories WHERE id = %s"
    existing_category = execute_query(check_query, (category_id,), fetch_one=True)
    
    if not existing_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría con ID {category_id} no encontrada"
        )
    
    # Verificar si hay productos usando esta categoría
    check_products_query = "SELECT COUNT(*) as count FROM products WHERE category_id = %s"
    products_count = execute_query(check_products_query, (category_id,), fetch_one=True)
    
    if products_count and products_count['count'] > 0:
        # Si hay productos, actualizar su category_id a NULL
        update_products_query = "UPDATE products SET category_id = NULL WHERE category_id = %s"
        execute_query(update_products_query, (category_id,))
    
    # Eliminar la categoría
    delete_query = "DELETE FROM categories WHERE id = %s"
    
    try:
        execute_query(delete_query, (category_id,))
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar la categoría: {str(e)}"
        )
