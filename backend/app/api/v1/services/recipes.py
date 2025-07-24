from fastapi import HTTPException, Depends, status, Request, APIRouter

from models.product_service import ProductService

import pymysql
from database.db import get_db_connection
from api.v1.auth_service.login import get_current_active_user


# Router para recetas
router_recipes = APIRouter()

@router_recipes.post("/{product_id}/recipe")
async def add_recipe(
    product_id: int,
    request: Request,
    current_user: dict = Depends(get_current_active_user)
):
    """Añadir receta a un producto"""
    print(f"=== INICIANDO CREACIÓN DE RECETA PARA PRODUCTO {product_id} ===")
    
    # Obtener los ingredientes del cuerpo de la petición
    try:
        body = await request.json()
        print(f"Body recibido: {body}")
        ingredients = body.get("ingredients", [])
        print(f"Ingredientes extraídos: {ingredients}")
    except Exception as e:
        print(f"Error al procesar el body: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al procesar el cuerpo de la petición: {str(e)}"
        )
    
    if not ingredients:
        print("No se proporcionaron ingredientes")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron ingredientes para la receta"
        )
    
    # Verificar que el producto existe
    product = ProductService.get_product_by_id(product_id)
    if not product:
        print(f"Producto {product_id} no encontrado")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    print(f"Producto encontrado: {product['nombre_producto']}")
    
    # Validar que todos los insumos existen
    from models.insumo_service import InsumoService
    for ingredient in ingredients:
        insumo_id = ingredient.get('insumo_id')
        if not insumo_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cada ingrediente debe tener un 'insumo_id'"
            )
        
        insumo = InsumoService.get_insumo_by_id(insumo_id)
        if not insumo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El insumo con ID {insumo_id} no existe"
            )
        print(f"Insumo {insumo_id} validado: {insumo['nombre_insumo']}")
    
    # Iniciar conexión para transacción
    connection = get_db_connection()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo establecer conexión con la base de datos"
        )
    
    cursor = None
    try:
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        connection.begin()
        
        # Eliminar receta anterior
        delete_query = "DELETE FROM product_recipes WHERE product_id = %s"
        cursor.execute(delete_query, (product_id,))
        print(f"Receta anterior eliminada para producto {product_id}")
        
        # Insertar los nuevos ingredientes
        inserted_count = 0
        for ingredient in ingredients:
            insumo_id = ingredient.get('insumo_id')
            cantidad = ingredient.get('cantidad')
            
            if not insumo_id or not cantidad:
                continue
            
            recipe_query = """
            INSERT INTO product_recipes (product_id, insumo_id, cantidad)
            VALUES (%s, %s, %s)
            """
            
            cursor.execute(recipe_query, (product_id, insumo_id, cantidad))
            inserted_count += 1
            print(f"Ingrediente {insumo_id} insertado con cantidad {cantidad}")
        
        # Verificar que se insertaron todos los ingredientes
        if inserted_count != len(ingredients):
            connection.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear la receta: solo se insertaron {inserted_count} de {len(ingredients)} ingredientes"
            )
        
        # Confirmar la transacción
        connection.commit()
        print(f"=== RECETA CREADA EXITOSAMENTE PARA PRODUCTO {product_id} ===")
        
        return {
            "message": "Receta añadida exitosamente", 
            "ingredients_count": inserted_count
        }
        
    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Error al crear receta: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la receta: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router_recipes.get("/{product_id}/recipe")
async def get_recipe(
    product_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    """Obtener la receta de un producto"""
    # Verificar que el producto existe
    product = ProductService.get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    # Obtener la receta
    recipe = ProductService.get_product_recipe(product_id)
    
    return {
        "product_id": product_id,
        "product_name": product['nombre_producto'],
        "ingredients": recipe
    }