from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1.router import router_user
from database.db import create_tables
import os
from dotenv import load_dotenv

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

# Crear rutas para productos
from fastapi import APIRouter, Depends, HTTPException, status
from models.product_service import ProductService
from models.insumo_service import InsumoService
from typing import List, Dict, Any, Optional
from api.v1.auth_service.login import get_current_active_user

# Router para productos
router_products = APIRouter()

@router_products.post("/", status_code=status.HTTP_201_CREATED)
async def create_product(
    nombre_producto: str,
    price: float,
    category_id: int,
    variante: Optional[str] = None,
    stock_quantity: int = 0,
    min_stock: int = 5,
    current_user: dict = Depends(get_current_active_user)
):
    """Crear un nuevo producto"""
    product_id = ProductService.create_product(
        nombre_producto=nombre_producto,
        price=price,
        category_id=category_id,
        user_id=current_user["id"],
        variante=variante,
        stock_quantity=stock_quantity,
        min_stock=min_stock
    )
    
    if not product_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el producto"
        )
    
    return {"id": product_id, "message": "Producto creado exitosamente"}

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

# Router para insumos
router_insumos = APIRouter()

@router_insumos.post("/", status_code=status.HTTP_201_CREATED)
async def create_insumo(
    nombre_insumo: str,
    unidad: str,
    cantidad_actual: float = 0,
    stock_minimo: float = 0
):
    """Crear un nuevo insumo"""
    insumo_id = InsumoService.create_insumo(
        nombre_insumo=nombre_insumo,
        unidad=unidad,
        cantidad_actual=cantidad_actual,
        stock_minimo=stock_minimo
    )
    
    if not insumo_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el insumo"
        )
    
    return {"id": insumo_id, "message": "Insumo creado exitosamente"}

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
from models.sales_service import SalesService

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