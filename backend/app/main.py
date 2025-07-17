from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.v1.router import router_user
from database.db import create_tables
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status, Request
from models.product_service import ProductService
from models.insumo_service import InsumoService
from typing import List, Dict, Any, Optional
from api.v1.auth_service.login import get_current_active_user
from models.sales_service import SalesService
from database.db import execute_query

# Cargar variables de entorno
load_dotenv('.env.dev')

# Crear la aplicación FastAPI
app = FastAPI(
    title="Inventory API",
    description="API para el sistema de inventario de heladería",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar la base de datos al iniciar la aplicación
@app.on_event("startup")
async def startup_db_client():
    # Crear las tablas si no existen
    create_tables()
    print("Base de datos inicializada correctamente")

@app.get("/")
def read_root():
    return {"message": "¡Bienvenido a la API de Inventario de Heladería!"}

# Incluir las rutas de la API
app.include_router(router_user, prefix="/api/v1/users", tags=["usuarios"])

# Incluir rutas de gestión de usuarios y roles
from api.v1.crud_users.router_users import router_crud_users
from api.v1.router_roles.router_roles import router_roles

app.include_router(router_crud_users, prefix="/api/v1/admin/users", tags=["admin-usuarios"])
app.include_router(router_roles, prefix="/api/v1/admin/roles", tags=["admin-roles"])

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

# Incluir las rutas de categorías
app.include_router(router_categories, prefix="/api/v1/categories", tags=["categorías"])

# Crear rutas para productos
router_products = APIRouter()

@router_products.post("/", status_code=status.HTTP_201_CREATED)
async def create_product(
    request: Request,
    nombre_producto: Optional[str] = None,
    price: Optional[float] = None,
    category_id: Optional[int] = None,
    variante: Optional[str] = None,
    stock_quantity: Optional[int] = None,
    min_stock: Optional[int] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Crear un nuevo producto"""
    try:
        # Intentar obtener datos del cuerpo JSON si están disponibles
        body = {}
        try:
            body = await request.json()
            if nombre_producto is None and "nombre_producto" in body:
                nombre_producto = body["nombre_producto"]
            if price is None and "price" in body:
                price = body["price"]
            if category_id is None and "category_id" in body:
                category_id = body["category_id"]
            if variante is None and "variante" in body:
                variante = body["variante"]
            if stock_quantity is None and "stock_quantity" in body:
                stock_quantity = body["stock_quantity"]
            if min_stock is None and "min_stock" in body:
                min_stock = body["min_stock"]
        except Exception as e:
            # Si hay un error al procesar el JSON, proporcionar un mensaje claro
            print(f"Error al procesar el cuerpo JSON: {str(e)}")
            if request.headers.get("content-type") == "application/json":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error al procesar el cuerpo JSON: {str(e)}"
                )
            # Si no hay cuerpo JSON o hay un error, usar los parámetros de consulta
            pass
        
        # Validar que los campos obligatorios estén presentes
        if nombre_producto is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre del producto es obligatorio"
            )
        if price is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El precio del producto es obligatorio"
            )
        if category_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La categoría del producto es obligatoria"
            )
        
        # Validar tipos de datos
        try:
            if price is not None:
                price = float(price)
            if category_id is not None:
                category_id = int(category_id)
            if stock_quantity is not None:
                stock_quantity = int(stock_quantity)
            if min_stock is not None:
                min_stock = int(min_stock)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error en el formato de los datos: price debe ser un número, category_id, stock_quantity y min_stock deben ser enteros"
            )
        
        # Verificar que la categoría existe
        check_category_query = "SELECT id FROM categories WHERE id = %s"
        existing_category = execute_query(check_category_query, (category_id,), fetch_one=True)
        
        if not existing_category:
            # Listar categorías disponibles
            categories_query = "SELECT id, nombre_categoria FROM categories ORDER BY id"
            available_categories = execute_query(categories_query, fetch_all=True) or []
            
            category_list = [f"ID: {cat['id']}, Nombre: {cat['nombre_categoria']}" for cat in available_categories]
            categories_info = "\n".join(category_list) if category_list else "No hay categorías disponibles."
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La categoría con ID {category_id} no existe. Categorías disponibles:\n{categories_info}"
            )
        
        # Valores por defecto
        if stock_quantity is None:
            stock_quantity = 0
        if min_stock is None:
            min_stock = 5
        
        # Intentar crear el producto
        product_id = ProductService.create_product(
            nombre_producto=nombre_producto,
            price=price,
            category_id=category_id,
            user_id=current_user["id"],
            variante=variante,
            stock_quantity=stock_quantity,
            min_stock=min_stock
        )
        
        # Si no se pudo obtener el ID del producto, intentar obtenerlo directamente
        if not product_id:
            # Verificar si el producto se creó correctamente
            check_query = """
            SELECT id FROM products 
            WHERE nombre_producto = %s 
            AND price = %s 
            AND category_id = %s 
            AND user_id = %s 
            ORDER BY created_at DESC 
            LIMIT 1
            """
            check_result = execute_query(
                check_query, 
                (nombre_producto, price, category_id, current_user["id"]), 
                fetch_one=True
            )
            
            if check_result:
                product_id = check_result["id"]
                return {"id": product_id, "message": "Producto creado exitosamente"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al crear el producto. No se pudo obtener el ID del producto creado."
                )
        
        return {"id": product_id, "message": "Producto creado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inesperado al crear producto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al crear el producto: {str(e)}"
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

@router_products.put("/{product_id}")
async def update_product(
    product_id: int,
    request: Request,
    current_user: dict = Depends(get_current_active_user)
):
    """Actualizar un producto existente"""
    # Verificar que el producto existe
    product = ProductService.get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
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
    
    # Si se actualiza la categoría, verificar que existe
    if "category_id" in update_data:
        category_id = update_data["category_id"]
        check_category_query = "SELECT id FROM categories WHERE id = %s"
        existing_category = execute_query(check_category_query, (category_id,), fetch_one=True)
        
        if not existing_category:
            # Listar categorías disponibles
            categories_query = "SELECT id, nombre_categoria FROM categories ORDER BY id"
            available_categories = execute_query(categories_query, fetch_all=True) or []
            
            category_list = [f"ID: {cat['id']}, Nombre: {cat['nombre_categoria']}" for cat in available_categories]
            categories_info = "\n".join(category_list) if category_list else "No hay categorías disponibles."
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La categoría con ID {category_id} no existe. Categorías disponibles:\n{categories_info}"
            )
    
    # Intentar actualizar el producto
    success = ProductService.update_product(product_id, update_data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el producto"
        )
    
    # Obtener el producto actualizado
    updated_product = ProductService.get_product_by_id(product_id)
    return updated_product

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
        if stock_minimo is None and "stock_minimo" in body:
            stock_minimo = body["stock_minimo"]
        if sitio_referencia is None and "sitio_referencia" in body:
            sitio_referencia = body["sitio_referencia"]
    except Exception as e:
        print(f"Error al procesar el cuerpo JSON: {str(e)}")
        # Si no hay cuerpo JSON o hay un error, usar los parámetros de consulta
        pass
    
    print(f"Datos recibidos: nombre={nombre_insumo}, unidad={unidad}, cantidad_unitaria={cantidad_unitaria}, precio_presentacion={precio_presentacion}, cantidad_utilizada={cantidad_utilizada}, min={stock_minimo}, sitio_referencia={sitio_referencia}")
    
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

@router_insumos.delete("/{insumo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insumo(
    insumo_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    """Eliminar un insumo"""
    # Verificar que el insumo existe
    insumo = InsumoService.get_insumo_by_id(insumo_id)
    if not insumo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insumo con ID {insumo_id} no encontrado"
        )
    
    # Intentar eliminar el insumo
    success = InsumoService.delete_insumo(insumo_id)
    
    if not success:
        # Verificar si el insumo está en uso en recetas
        check_query = "SELECT COUNT(*) as count FROM product_recipes WHERE insumo_id = %s"
        check_result = execute_query(check_query, (insumo_id,), fetch_one=True)
        
        if check_result and check_result['count'] > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede eliminar el insumo porque está siendo utilizado en {check_result['count']} recetas"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar el insumo con ID {insumo_id}"
            )
    
    return None

# Incluir las rutas de productos e insumos
app.include_router(router_products, prefix="/api/v1/products", tags=["productos"])
app.include_router(router_insumos, prefix="/api/v1/insumos", tags=["insumos"])

# Router para recetas
router_recipes = APIRouter()

@router_recipes.post("/{product_id}/recipe")
async def add_recipe(
    product_id: int,
    ingredients: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_active_user)
):
    """Añadir receta a un producto"""
    # Verificar que el producto existe
    product = ProductService.get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    # Añadir la receta
    success = ProductService.add_product_recipe(product_id, ingredients)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al añadir la receta"
        )
    
    return {"message": "Receta añadida exitosamente"}

@router_recipes.get("/{product_id}/recipe")
async def get_recipe(product_id: int):
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
    
    return recipe

# Incluir las rutas de recetas
app.include_router(router_recipes, prefix="/api/v1/products", tags=["recetas"])

# Router para ventas
router_sales = APIRouter()

@router_sales.post("/", status_code=status.HTTP_201_CREATED)
async def create_sale(
    items: List[Dict[str, Any]],
    payment_method: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Crear una nueva venta"""
    sale_id = SalesService.create_complete_sale(
        user_id=current_user["id"],
        items=items,
        payment_method=payment_method,
        notes=notes
    )
    
    if not sale_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la venta"
        )
    
    return {"id": sale_id, "message": "Venta creada exitosamente"}

@router_sales.get("/{sale_id}")
async def get_sale(sale_id: int):
    """Obtener una venta por su ID"""
    sale = SalesService.get_sale_by_id(sale_id)
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con ID {sale_id} no encontrada"
        )
    
    return sale

@router_sales.get("/")
async def get_sales_by_user(
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_active_user)
):
    """Obtener ventas realizadas por el usuario actual"""
    sales = SalesService.get_sales_by_user(
        user_id=current_user["id"],
        limit=limit,
        offset=offset
    )
    
    return sales

# Incluir las rutas de ventas
app.include_router(router_sales, prefix="/api/v1/sales", tags=["ventas"])

@app.post("/debug-create-product", status_code=status.HTTP_200_OK)
async def debug_create_product(
    request: Request
):
    """Depurar la creación de productos"""
    from database.db import execute_query
    
    try:
        # Obtener datos del cuerpo JSON
        body = await request.json()
        
        # Extraer datos
        nombre_producto = body.get("nombre_producto")
        price = body.get("price")
        category_id = body.get("category_id")
        variante = body.get("variante")
        stock_quantity = body.get("stock_quantity", 0)
        min_stock = body.get("min_stock", 5)
        user_id = body.get("user_id", 1)  # Default to admin user
        
        # Validar datos obligatorios
        if not nombre_producto or not price or not category_id:
            return {
                "status": "error",
                "message": "Faltan datos obligatorios (nombre_producto, price, category_id)"
            }
        
        # Verificar que la categoría existe
        check_category_query = "SELECT id FROM categories WHERE id = %s"
        existing_category = execute_query(check_category_query, (category_id,), fetch_one=True)
        
        if not existing_category:
            # Listar categorías disponibles
            categories_query = "SELECT id, nombre_categoria FROM categories ORDER BY id"
            available_categories = execute_query(categories_query, fetch_all=True) or []
            
            return {
                "status": "error",
                "message": f"La categoría con ID {category_id} no existe",
                "available_categories": available_categories
            }
        
        # Verificar que el usuario existe
        check_user_query = "SELECT id FROM users WHERE id = %s"
        existing_user = execute_query(check_user_query, (user_id,), fetch_one=True)
        
        if not existing_user:
            # Listar usuarios disponibles
            users_query = "SELECT id, username FROM users ORDER BY id"
            available_users = execute_query(users_query, fetch_all=True) or []
            
            return {
                "status": "error",
                "message": f"El usuario con ID {user_id} no existe",
                "available_users": available_users
            }
        
        # Intentar insertar directamente en la base de datos
        insert_query = """
        INSERT INTO products (nombre_producto, price, category_id, user_id, variante, stock_quantity, min_stock)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            result = execute_query(
                insert_query, 
                (nombre_producto, price, category_id, user_id, variante, stock_quantity, min_stock)
            )
            
            if result:
                # Obtener el ID del producto recién creado
                id_query = "SELECT LAST_INSERT_ID() as id"
                id_result = execute_query(id_query, fetch_one=True)
                product_id = id_result['id'] if id_result else None
                
                # Obtener el producto creado
                get_query = "SELECT * FROM products WHERE id = %s"
                product = execute_query(get_query, (product_id,), fetch_one=True)
                
                return {
                    "status": "success",
                    "message": "Producto creado exitosamente",
                    "product_id": product_id,
                    "product_details": product
                }
            else:
                return {
                    "status": "error",
                    "message": "Error al crear el producto (no se devolvió ID)"
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error al crear el producto: {str(e)}",
                "error_type": type(e).__name__
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error general: {str(e)}",
            "error_type": type(e).__name__
        }

@app.post("/simple-create-product", status_code=status.HTTP_201_CREATED)
async def simple_create_product(
    request: Request,
    current_user: dict = Depends(get_current_active_user)
):
    """Crear un producto de forma simplificada"""
    from database.db import execute_query
    
    try:
        # Obtener datos del cuerpo JSON
        body = await request.json()
        
        # Extraer datos obligatorios
        nombre_producto = body.get("nombre_producto")
        price = body.get("price")
        category_id = body.get("category_id")
        
        # Extraer datos opcionales
        variante = body.get("variante")
        stock_quantity = body.get("stock_quantity", 0)
        min_stock = body.get("min_stock", 5)
        
        # Validar datos obligatorios
        if not nombre_producto or not price or not category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faltan datos obligatorios (nombre_producto, price, category_id)"
            )
        
        # Verificar que la categoría existe
        check_category_query = "SELECT id FROM categories WHERE id = %s"
        existing_category = execute_query(check_category_query, (category_id,), fetch_one=True)
        
        if not existing_category:
            # Listar categorías disponibles
            categories_query = "SELECT id, nombre_categoria FROM categories ORDER BY id"
            available_categories = execute_query(categories_query, fetch_all=True) or []
            
            category_list = [f"ID: {cat['id']}, Nombre: {cat['nombre_categoria']}" for cat in available_categories]
            categories_info = "\n".join(category_list) if category_list else "No hay categorías disponibles."
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La categoría con ID {category_id} no existe. Categorías disponibles:\n{categories_info}"
            )
        
        # Insertar directamente en la base de datos
        insert_query = """
        INSERT INTO products (nombre_producto, price, category_id, user_id, variante, stock_quantity, min_stock)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        # Usar el ID del usuario actual
        user_id = current_user["id"]
        
        try:
            result = execute_query(
                insert_query, 
                (nombre_producto, price, category_id, user_id, variante, stock_quantity, min_stock)
            )
            
            if result:
                # Obtener el ID del producto recién creado
                id_query = "SELECT LAST_INSERT_ID() as id"
                id_result = execute_query(id_query, fetch_one=True)
                product_id = id_result['id'] if id_result else None
                
                return {"id": product_id, "message": "Producto creado exitosamente"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al crear el producto (no se devolvió ID)"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el producto: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error general: {str(e)}"
        )

@app.get("/list-users", status_code=status.HTTP_200_OK)
async def list_users():
    """Listar usuarios disponibles"""
    from database.db import execute_query
    
    try:
        # Listar usuarios disponibles
        users_query = "SELECT id, username, email, role_id, is_active FROM users ORDER BY id"
        users = execute_query(users_query, fetch_all=True) or []
        
        return {
            "status": "success",
            "users": users
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error al listar usuarios: {str(e)}",
            "error_type": type(e).__name__
        }

@app.post("/assign-role", status_code=status.HTTP_200_OK)
async def assign_role(
    user_id: int,
    role_id: int
):
    """Asignar un rol a un usuario"""
    from database.db import execute_query
    
    try:
        # Verificar que el usuario existe
        check_user_query = "SELECT id FROM users WHERE id = %s"
        existing_user = execute_query(check_user_query, (user_id,), fetch_one=True)
        
        if not existing_user:
            return {
                "status": "error",
                "message": f"El usuario con ID {user_id} no existe"
            }
        
        # Verificar que el rol existe
        check_role_query = "SELECT id FROM roles WHERE id = %s"
        existing_role = execute_query(check_role_query, (role_id,), fetch_one=True)
        
        if not existing_role:
            # Listar roles disponibles
            roles_query = "SELECT id, name FROM roles ORDER BY id"
            available_roles = execute_query(roles_query, fetch_all=True) or []
            
            return {
                "status": "error",
                "message": f"El rol con ID {role_id} no existe",
                "available_roles": available_roles
            }
        
        # Asignar el rol al usuario
        update_query = "UPDATE users SET role_id = %s WHERE id = %s"
        result = execute_query(update_query, (role_id, user_id))
        
        if result:
            # Obtener el usuario actualizado
            get_query = """
            SELECT u.*, r.name as role_name 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = %s
            """
            updated_user = execute_query(get_query, (user_id,), fetch_one=True)
            
            return {
                "status": "success",
                "message": f"Rol asignado exitosamente al usuario {user_id}",
                "user": updated_user
            }
        else:
            return {
                "status": "error",
                "message": "Error al asignar el rol al usuario"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error al asignar rol: {str(e)}",
            "error_type": type(e).__name__
        }

@app.post("/repair-database", status_code=status.HTTP_200_OK)
async def repair_database():
    """Verificar y reparar la base de datos"""
    from database.db import execute_query
    
    try:
        repairs = []
        
        # 1. Verificar y reparar roles
        roles_query = "SELECT * FROM roles"
        roles = execute_query(roles_query, fetch_all=True) or []
        
        if not roles:
            # Crear roles predefinidos
            roles_to_create = [
                (1, "superuser", "Administrador con acceso total al sistema"),
                (2, "staff", "Usuario con acceso limitado al sistema"),
                (3, "viewer", "Usuario con acceso de solo lectura")
            ]
            
            for role_id, name, description in roles_to_create:
                insert_query = "INSERT INTO roles (id, name, description) VALUES (%s, %s, %s)"
                execute_query(insert_query, (role_id, name, description))
                repairs.append(f"Rol '{name}' creado")
        
        # 2. Verificar y reparar usuarios sin rol
        users_without_role_query = "SELECT id, username FROM users WHERE role_id IS NULL"
        users_without_role = execute_query(users_without_role_query, fetch_all=True) or []
        
        for user in users_without_role:
            # Asignar rol de staff (2) por defecto
            update_query = "UPDATE users SET role_id = 2 WHERE id = %s"
            execute_query(update_query, (user["id"],))
            repairs.append(f"Usuario '{user['username']}' (ID: {user['id']}) asignado al rol 'staff'")
        
        # 3. Verificar y reparar categorías
        categories_query = "SELECT * FROM categories"
        categories = execute_query(categories_query, fetch_all=True) or []
        
        if not categories:
            # Crear una categoría por defecto
            insert_query = "INSERT INTO categories (nombre_categoria) VALUES ('General')"
            execute_query(insert_query)
            repairs.append("Categoría 'General' creada")
        
        # 4. Verificar y mostrar información de la base de datos
        tables_query = "SHOW TABLES"
        tables = execute_query(tables_query, fetch_all=True) or []
        
        table_counts = {}
        for table in tables:
            table_name = list(table.values())[0]
            count_query = f"SELECT COUNT(*) as count FROM {table_name}"
            count_result = execute_query(count_query, fetch_one=True)
            table_counts[table_name] = count_result["count"] if count_result else 0
        
        return {
            "status": "success",
            "message": "Base de datos verificada y reparada",
            "repairs": repairs,
            "table_counts": table_counts
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error al reparar la base de datos: {str(e)}",
            "error_type": type(e).__name__
        }