from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

# Esquemas de Rol
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Esquemas de Usuario
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = 2  # Por defecto, rol de staff

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    role_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    role_name: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponseToken(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Esquemas de Categoría
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Esquemas de Proveedor
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Esquema para insumos en recetas de productos
class Insumo(BaseModel):
    nombre: str
    cantidad: float
    unidad: str

# Esquemas de Producto
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: float
    cost: float
    min_stock: int = 5
    barcode: Optional[str] = None

class ProductCreate(BaseModel):
    nombre_producto: str
    variante: Optional[str] = None
    precio_cop: float
    user_id: int
    categoria_id: int
    is_active: bool = True
    # No incluimos stock_quantity ni min_stock aquí porque se establecerán
    # automáticamente como -1 y 0 respectivamente para productos bajo demanda

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock: Optional[int] = None
    barcode: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    stock_quantity: int
    is_active: bool
    created_at: datetime
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

# Enums para movimientos de inventario
class MovementType(str, Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"

# Esquemas de Movimiento de Inventario
class InventoryMovementBase(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: int
    reason: Optional[str] = None

class InventoryMovementCreate(InventoryMovementBase):
    pass

class InventoryMovementResponse(InventoryMovementBase):
    id: int
    previous_stock: int
    new_stock: int
    user_id: Optional[int] = None
    created_at: datetime
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

# Enums para estado de compras
class PurchaseStatus(str, Enum):
    PENDING = "PENDING"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"

# Esquemas de Compra
class PurchaseBase(BaseModel):
    supplier_id: Optional[int] = None
    purchase_date: date
    notes: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    pass

class PurchaseResponse(PurchaseBase):
    id: int
    total_amount: float
    status: PurchaseStatus
    user_id: Optional[int] = None
    created_at: datetime
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True

# Esquemas de Detalle de Compra
class PurchaseDetailBase(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float

class PurchaseDetailCreate(PurchaseDetailBase):
    pass

class PurchaseDetailResponse(PurchaseDetailBase):
    id: int
    purchase_id: int
    total_cost: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

# Esquema completo de compra con detalles
class PurchaseWithDetails(PurchaseResponse):
    details: List[PurchaseDetailResponse] = []

# Esquemas para reportes y estadísticas
class InventoryStats(BaseModel):
    total_products: int
    low_stock_products: int
    total_categories: int
    total_value: float

class ProductStats(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    min_stock: int
    stock_status: str  # "normal", "low", "out"
    total_value: float

# Esquemas de autenticación
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Esquemas para filtros y búsquedas
class ProductFilter(BaseModel):
    category_id: Optional[int] = None
    low_stock_only: bool = False
    search: Optional[str] = None
    is_active: Optional[bool] = True

class MovementFilter(BaseModel):
    product_id: Optional[int] = None
    movement_type: Optional[MovementType] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None