from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import create_tables
from dotenv import load_dotenv
# Incluir el router de estadísticas
# Incluir rutas de gestión de usuarios y roles
# Incluir las rutas de la API
from api.v1.router import router as router_user
from api.v1.services.service import router_services
from api.v1.services.statistics_service import router_statistics
from api.v1.crud_users.router_users import router_crud_users
from api.v1.router_roles.router_roles import router_roles
from api.v1.services.categories import router_categories
from api.v1.services.products import router_products
from api.v1.services.insumos import router_insumos
from api.v1.services.recipes import router_recipes
from api.v1.services.sales import router_sales

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



# Ruta raíz de la API para verificar que la API está funcionando
@app.get("/")
def read_root():
    return {"message": "¡Bienvenido a la API de Inventario de Heladería!"}



# INCLUIMOS LOS MICRO SERVICIOS 


app.include_router(router_user, prefix="/api/v1/users", tags=["usuarios"])


app.include_router(router_services, prefix="/api/v1/services", tags=["services"])

app.include_router(router_statistics, prefix="/api/v1/services/statistics", tags=["statistics"])


app.include_router(router_crud_users, prefix="/api/v1/admin/users", tags=["admin-usuarios"])


app.include_router(router_roles, prefix="/api/v1/admin/roles", tags=["admin-roles"])


app.include_router(router_categories, prefix="/api/v1/categories", tags=["categorías"])

app.include_router(router_products, prefix="/api/v1/products", tags=["productos"])


app.include_router(router_insumos, prefix="/api/v1/insumos", tags=["insumos"])


app.include_router(router_recipes, prefix="/api/v1/recipes", tags=["recetas"])


app.include_router(router_sales, prefix="/api/v1/sales", tags=["ventas"])


