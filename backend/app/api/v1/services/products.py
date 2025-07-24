from fastapi import   APIRouter, HTTPException, Depends, status, Request, APIRouter
from typing import  Optional
from api.v1.auth_service.login import get_current_active_user
from database.db import execute_query
from models.product_service import ProductService
from schemas import schemas
import pymysql
from database.db import get_db_connection

# Crear rutas para productos
router_products = APIRouter()

@router_products.post("/", status_code=status.HTTP_201_CREATED)
async def create_product(
    product: schemas.ProductCreate,
    request: Request,
    current_user: dict = Depends(get_current_active_user)
):
    """Crear un nuevo producto para heladería (bajo demanda)"""
    try:
        # Obtener los datos de la receta del cuerpo de la petición
        body_data = await request.json()
        ingredients = body_data.get("ingredients", [])
        
        # Validar que se proporcionen ingredientes para la receta
        if not ingredients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere al menos un ingrediente para la receta del producto"
            )
        
        # Validar que la categoría existe
        check_category_query = "SELECT id FROM categories WHERE id = %s"
        existing_category = execute_query(check_category_query, (product.categoria_id,), fetch_one=True)
        
        if not existing_category:
            # Listar categorías disponibles
            categories_query = "SELECT id, nombre_categoria FROM categories ORDER BY id"
            available_categories = execute_query(categories_query, fetch_all=True) or []
            
            category_list = [f"ID: {cat['id']}, Nombre: {cat['nombre_categoria']}" for cat in available_categories]
            categories_info = "\n".join(category_list) if category_list else "No hay categorías disponibles."
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La categoría con ID {product.categoria_id} no existe. Categorías disponibles:\n{categories_info}"
            )
        
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
            
            # Establecer stock_quantity en -1 para indicar disponibilidad bajo demanda
            stock_quantity = -1  # -1 indica disponibilidad bajo demanda
            min_stock = 0  # 0 para productos bajo demanda
            
            # Insertar el producto
            product_query = """
            INSERT INTO products (nombre_producto, price, category_id, user_id, variante, is_active, stock_quantity, min_stock)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(product_query, (
                product.nombre_producto, 
                product.precio_cop,
                product.categoria_id,
                product.user_id,
                product.variante,
                product.is_active,
                stock_quantity,
                min_stock
            ))
            
            # Obtener el ID del producto recién creado
            product_id = cursor.lastrowid
            
            if not product_id:
                connection.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al crear el producto: no se pudo obtener el ID"
                )
            
            # Insertar los ingredientes de la receta
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
            
            # Verificar que se insertaron todos los ingredientes
            if inserted_count != len(ingredients):
                connection.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error al crear la receta: solo se insertaron {inserted_count} de {len(ingredients)} ingredientes"
                )
            
            # Confirmar la transacción
            connection.commit()
            
            # Retornar el producto creado con su ID
            return {
                "id": product_id,
                "nombre_producto": product.nombre_producto,
                "message": "Producto creado exitosamente con su receta",
                "ingredients_count": inserted_count
            }
            
        except Exception as e:
            if connection:
                connection.rollback()
            print(f"Error al crear producto con receta: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el producto con su receta: {str(e)}"
            )
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado: {str(e)}"
        )

@router_products.get("/{product_id}")
async def get_product(product_id: int):
    """Obtener un producto por su ID"""
    product = ProductService.get_product_by_id(product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    return product

@router_products.get("/")
async def get_products(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    low_stock_only: bool = False,
    limit: int = 100,
    offset: int = 0
):
    """Obtener lista de productos con filtros"""
    products = ProductService.get_products(
        category_id=category_id,
        search=search,
        low_stock_only=low_stock_only,
        limit=limit,
        offset=offset
    )
    
    return products

@router_products.put("/{product_id}", status_code=status.HTTP_200_OK)
async def update_product(
    product_id: int,
    request: Request,
    current_user: dict = Depends(get_current_active_user)
):
    """Actualizar un producto existente con su receta"""
    try:
        # Obtener los datos del cuerpo de la petición
        body_data = await request.json()
        
        # Extraer datos del producto y la receta
        product_data = {
            "nombre_producto": body_data.get("nombre_producto"),
            "variante": body_data.get("variante"),
            "precio_cop": body_data.get("precio_cop"),
            "categoria_id": body_data.get("categoria_id"),
            "is_active": body_data.get("is_active", True)
        }
        
        ingredients = body_data.get("ingredients", [])
        
        # Validar que se proporcionen ingredientes para la receta
        if not ingredients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere al menos un ingrediente para la receta del producto"
            )
        
        # Verificar que el producto existe
        product = ProductService.get_product_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {product_id} no encontrado"
            )
        
        # Validar que la categoría existe
        check_category_query = "SELECT id FROM categories WHERE id = %s"
        existing_category = execute_query(check_category_query, (product_data["categoria_id"],), fetch_one=True)
        
        if not existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La categoría con ID {product_data['categoria_id']} no existe"
            )
        
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
            
            # Actualizar el producto
            update_query = """
            UPDATE products 
            SET nombre_producto = %s, 
                price = %s, 
                category_id = %s, 
                variante = %s, 
                is_active = %s
            WHERE id = %s
            """
            
            cursor.execute(update_query, (
                product_data["nombre_producto"],
                product_data["precio_cop"],
                product_data["categoria_id"],
                product_data["variante"],
                product_data["is_active"],
                product_id
            ))
            
            # Eliminar receta anterior
            delete_query = "DELETE FROM product_recipes WHERE product_id = %s"
            cursor.execute(delete_query, (product_id,))
            
            # Insertar los nuevos ingredientes de la receta
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
            
            # Verificar que se insertaron todos los ingredientes
            if inserted_count != len(ingredients):
                connection.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error al actualizar la receta: solo se insertaron {inserted_count} de {len(ingredients)} ingredientes"
                )
            
            # Confirmar la transacción
            connection.commit()
            
            # Retornar el producto actualizado
            return {
                "id": product_id,
                "nombre_producto": product_data["nombre_producto"],
                "message": "Producto actualizado exitosamente con su receta",
                "ingredients_count": inserted_count
            }
            
        except Exception as e:
            if connection:
                connection.rollback()
            print(f"Error al actualizar producto con receta: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar el producto con su receta: {str(e)}"
            )
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inesperado al actualizar producto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al actualizar el producto: {str(e)}"
        )

@router_products.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    """Eliminar un producto (soft delete)"""
    # Verificar que el producto existe
    product = ProductService.get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    # Intentar eliminar el producto
    success = ProductService.delete_product(product_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar el producto con ID {product_id}"
        )
    
    return None
