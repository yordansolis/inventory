# Documentación de la API de Inventario para Heladería

Esta documentación proporciona ejemplos de cómo utilizar la API del sistema de inventario para heladería utilizando Postman.

## Configuración Inicial

1. **URL Base**: `http://localhost:8000`
2. **Autenticación**: La mayoría de los endpoints requieren autenticación JWT. Después de obtener el token, configúralo en Postman:
   - En la pestaña "Authorization"
   - Selecciona "Type" -> "Bearer Token"
   - Pega tu token en el campo "Token"

## Importante: Orden de Creación de Entidades

Para evitar errores de claves foráneas, crea las entidades en este orden:

1. Categorías
2. Productos
3. Insumos
4. Recetas
5. Ventas

## Autenticación y Usuarios

### Registrar un Usuario

```
POST /api/v1/users/register
```

**Body (raw JSON):**

```json
{
  "username": "usuario_nuevo",
  "email": "usuario@ejemplo.com",
  "password": "Contraseña123,"
}
```

### Iniciar Sesión (Obtener Token)

```
POST /api/v1/users/auth/token
```

**Body (form-data):**

- username: admin
- password: Admin123,

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Ver Información del Usuario Actual

```
GET /api/v1/users/auth/me
```

**Headers:**

- Authorization: Bearer {tu_token}

## Gestión de Usuarios (Solo Superusuarios)

### Listar Todos los Usuarios

```
GET /api/v1/admin/users
```

**Parámetros de consulta opcionales:**

- skip: 0 (para paginación)
- limit: 100 (para paginación)
- search: "texto" (para buscar por nombre o email)

### Obtener un Usuario por ID

```
GET /api/v1/admin/users/1
```

### Crear un Nuevo Usuario

```
POST /api/v1/admin/users
```

**Body (raw JSON):**

```json
{
  "username": "nuevo_empleado",
  "email": "empleado@ejemplo.com",
  "password": "Contraseña123,",
  "role_id": 2,
  "permissions": {
    "facturar": true,
    "verVentas": false
  }
}
```

**Notas sobre los permisos:**

- `facturar`: Si es `true`, el usuario puede acceder al módulo de facturación
- `verVentas`: Si es `true`, el usuario puede acceder al módulo de extracto de ventas. **NOTA: Este permiso solo puede ser asignado a usuarios con role_id=1 (superusuarios)**.
- Si no se especifican permisos, se asignarán permisos predeterminados según el rol del usuario:
  - Superusuarios (role_id: 1): Tienen todos los permisos
  - Staff (role_id: 2): Por defecto pueden facturar pero no ver ventas
  - Otros roles: No tienen permisos por defecto

### Actualizar un Usuario

```
PUT /api/v1/admin/users/2
```

**Body (raw JSON):**

```json
{
  "username": "empleado_actualizado",
  "email": "actualizado@ejemplo.com",
  "role_id": 3,
  "is_active": true,
  "permissions": {
    "facturar": true,
    "verVentas": true
  }
}
```

**Notas para actualización:**

- Se pueden actualizar solo los permisos sin necesidad de modificar otros campos del usuario
- Los permisos se sobrescriben completamente en cada actualización

### Desactivar un Usuario

```
DELETE /api/v1/admin/users/3
```

**Efectos:**

- El usuario no podrá iniciar sesión
- Si intenta acceder con un token previamente emitido, será redirigido al login

### Activar un Usuario Desactivado

```
PATCH /api/v1/admin/users/3/activate
```

**Respuesta:**

```json
{
  "id": 3,
  "username": "empleado_reactivado",
  "email": "empleado@ejemplo.com",
  "role_id": 2,
  "is_active": true,
  "created_at": "2023-05-15T10:30:00",
  "role_name": "staff",
  "permissions": {
    "facturar": true,
    "verVentas": false
  }
}
```

## Gestión de Roles

### Listar Todos los Roles

```
GET /api/v1/admin/roles
```

### Obtener un Rol por ID

```
GET /api/v1/admin/roles/1
```

### Crear un Nuevo Rol (Solo Superusuarios)

```
POST /api/v1/admin/roles
```

**Body (raw JSON):**

```json
{
  "name": "gerente",
  "description": "Gerente de tienda con acceso a reportes"
}
```

### Actualizar un Rol (Solo Superusuarios)

```
PUT /api/v1/admin/roles/4
```

**Body (raw JSON):**

```json
{
  "name": "gerente_senior",
  "description": "Gerente con acceso completo a reportes y estadísticas"
}
```

### Eliminar un Rol (Solo Superusuarios)

```
DELETE /api/v1/admin/roles/4
```

## Gestión de Categorías

### Listar Todas las Categorías

```
GET /api/v1/categories
```

### Obtener una Categoría por ID

```
GET /api/v1/categories/1
```

### Crear una Nueva Categoría

```
POST /api/v1/categories
```

**Opción 1: Usando parámetros de consulta:**

- name: "Waffles" (debe ser único)

**Opción 2: Usando JSON en el cuerpo:**

```json
{
  "name": "Waffles"
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "message": "Categoría creada exitosamente"
}
```

**Posibles errores:**

- 400 Bad Request: "Ya existe una categoría con el nombre 'Waffles'"

### Actualizar una Categoría

```
PUT /api/v1/categories/1
```

**Opción 1: Usando parámetros de consulta:**

- name: "Waffles Premium" (debe ser único)

**Opción 2: Usando JSON en el cuerpo:**

```json
{
  "name": "Waffles Premium"
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Posibles errores:**

- 400 Bad Request: "Ya existe otra categoría con el nombre 'Waffles Premium'"
- 404 Not Found: "Categoría con ID 1 no encontrada"

### Eliminar una Categoría

```
DELETE /api/v1/categories/1
```

**Headers:**

- Authorization: Bearer {tu_token}

## Gestión de Productos

### Listar Productos

```
GET /api/v1/products
```

**Parámetros de consulta opcionales:**

- category_id: 1
- search: "waffle"
- low_stock_only: true
- limit: 50
- offset: 0

### Obtener un Producto por ID

```
GET /api/v1/products/1
```

### Crear un Nuevo Producto

```
POST /api/v1/products
```

**Opción 1: Usando parámetros de consulta:**

- nombre_producto: "Waffle con fresas"
- price: 22000
- category_id: 1
- variante: "Grande" (opcional)

**Opción 2: Usando JSON en el cuerpo:**

```json
{
  "nombre_producto": "Waffle con fresas",
  "price": 22000,
  "category_id": 1,
  "variante": "Grande"
}
```

**Nota importante:** Los productos se crean automáticamente con `stock_quantity = -1`, lo que indica que están disponibles bajo demanda. Esto es ideal para una heladería donde los productos se preparan al momento. El control de inventario se realiza a través de los insumos asociados a cada producto mediante recetas.

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "message": "Producto creado exitosamente",
  "note": "Este producto está configurado como disponible bajo demanda. El control de inventario se realiza a través de los insumos."
}
```

**Posibles errores:**

- 400 Bad Request: "El nombre del producto es obligatorio"
- 400 Bad Request: "El precio del producto es obligatorio"
- 400 Bad Request: "La categoría del producto es obligatoria"
- 400 Bad Request: "Error en el formato de los datos: price debe ser un número, category_id debe ser entero"
- 400 Bad Request: "La categoría con ID X no existe. Categorías disponibles: [lista de categorías]"
- 400 Bad Request: "Error al procesar el cuerpo JSON: [detalle del error]"
- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 401 Unauthorized: "Token inválido: error de decodificación"
- 401 Unauthorized: "Usuario no encontrado"
- 500 Internal Server Error: "Error al crear el producto. No se pudo obtener el ID del producto creado."
- 500 Internal Server Error: "Error inesperado al crear el producto: [detalle del error]"

### Actualizar un Producto

```
PUT /api/v1/products/1
```

**Body (raw JSON):**

```json
{
  "nombre_producto": "Waffle con fresas y crema",
  "price": 24000,
  "category_id": 1,
  "variante": "Extra Grande",
  "stock_quantity": 15,
  "min_stock": 3
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "nombre_producto": "Waffle con fresas y crema",
  "price": 24000,
  "category_id": 1,
  "categoria_nombre": "Waffles",
  "variante": "Extra Grande",
  "stock_quantity": 15,
  "min_stock": 3,
  "is_active": true,
  "user_id": 1,
  "creado_por": "admin",
  "created_at": "2023-07-15T10:30:00",
  "updated_at": "2023-07-15T14:45:00"
}
```

**Posibles errores:**

- 400 Bad Request: "No se proporcionaron datos para actualizar"
- 400 Bad Request: "Error al procesar el cuerpo JSON: [detalle del error]"
- 400 Bad Request: "La categoría con ID X no existe. Categorías disponibles: [lista de categorías]"
- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 404 Not Found: "Producto con ID X no encontrado"
- 500 Internal Server Error: "Error al actualizar el producto"

### Eliminar un Producto

```
DELETE /api/v1/products/1
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

- Código de estado: 204 No Content (sin cuerpo de respuesta)

**Posibles errores:**

- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 404 Not Found: "Producto con ID X no encontrado"
- 500 Internal Server Error: "Error al eliminar el producto con ID X"

## Gestión de Insumos (Ingredientes)

**Campos Calculados Automáticamente:**

- `valor_unitario`: Se calcula como `precio_presentacion / cantidad_unitaria`
- `valor_total`: Se calcula como `valor_unitario * cantidad_utilizada`

Estos campos no deben incluirse en las requests de creación o actualización, ya que se calculan automáticamente por la base de datos.

### Listar Insumos

```
GET /api/v1/insumos
```

**Parámetros de consulta opcionales:**

- search: "fresa"
- low_stock_only: true

### Obtener un Insumo por ID

```
GET /api/v1/insumos/1
```

### Crear un Nuevo Insumo

```
POST /api/v1/insumos
```

**Opción 1: Usando parámetros de consulta:**

- nombre_insumo: "Fresas" (obligatorio)
- unidad: "gramos" (obligatorio)
- cantidad_unitaria: 1000 (obligatorio - cantidad total de la presentación)
- precio_presentacion: 185000 (obligatorio - precio total de la presentación)
- cantidad_utilizada: 1 (opcional, por defecto 0 - cuánto se usa por unidad del producto)
- stock_minimo: 10 (opcional, por defecto 0 - punto de reposición)
- sitio_referencia: "Proveedor ABC" (opcional - dónde se compró)

**Opción 2: Usando JSON en el cuerpo:**

```json
{
  "nombre_insumo": "Fresas",
  "unidad": "gramos",
  "cantidad_unitaria": 1000,
  "precio_presentacion": 185000,
  "cantidad_utilizada": 1,
  "stock_minimo": 10,
  "sitio_referencia": "Proveedor ABC"
}
```

**Nota:** Los campos `valor_unitario` (precio_presentacion / cantidad_unitaria) y `valor_total` (valor_unitario \* cantidad_utilizada) se calculan automáticamente y no deben incluirse en la request.

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "message": "Insumo creado exitosamente"
}
```

**Posibles errores:**

- 400 Bad Request: "El nombre del insumo es obligatorio"
- 400 Bad Request: "La unidad del insumo es obligatoria"
- 400 Bad Request: "La cantidad unitaria es obligatoria"
- 400 Bad Request: "El precio de presentación es obligatorio"
- 400 Bad Request: "Ya existe un insumo con el nombre '{nombre}'"
- 400 Bad Request: "Error en el formato de los datos: cantidad_unitaria y precio_presentacion deben ser números"
- 500 Internal Server Error: "Error al crear el insumo"

### Actualizar un Insumo

```
PUT /api/v1/insumos/1
```

**Body (raw JSON):**

```json
{
  "nombre_insumo": "Fresas frescas",
  "unidad": "gramos",
  "cantidad_unitaria": 1000,
  "precio_presentacion": 185000,
  "cantidad_utilizada": 1,
  "stock_minimo": 10,
  "sitio_referencia": "Proveedor ABC"
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "nombre_insumo": "Fresas frescas",
  "unidad": "gramos",
  "cantidad_unitaria": 1000.0,
  "precio_presentacion": 185000.0,
  "valor_unitario": 185.0,
  "cantidad_utilizada": 1.0,
  "valor_total": 185.0,
  "stock_minimo": 10.0,
  "sitio_referencia": "Proveedor ABC",
  "creado_en": "2023-07-15T10:30:00"
}
```

**Nota:** Los campos `valor_unitario` y `valor_total` se calculan automáticamente y aparecen en la respuesta, pero no deben incluirse en la request de actualización.

**Posibles errores:**

- 400 Bad Request: "No se proporcionaron datos para actualizar"
- 400 Bad Request: "Error al procesar el cuerpo JSON: [detalle del error]"

- 400 Bad Request: "El stock mínimo debe ser un número"
- 400 Bad Request: "La cantidad unitaria debe ser un número"
- 400 Bad Request: "El precio de presentación debe ser un número"
- 400 Bad Request: "La cantidad utilizada debe ser un número"
- 400 Bad Request: "No se pueden actualizar los campos calculados: valor_unitario, valor_total"
- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 404 Not Found: "Insumo con ID X no encontrado"
- 500 Internal Server Error: "Error al actualizar el insumo"

### Eliminar un Insumo

```
DELETE /api/v1/insumos/1
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

- Código de estado: 204 No Content (sin cuerpo de respuesta)

**Posibles errores:**

- 400 Bad Request: "No se puede eliminar el insumo porque está siendo utilizado en X recetas"
- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 404 Not Found: "Insumo con ID X no encontrado"
- 500 Internal Server Error: "Error al eliminar el insumo con ID X"

## Gestión de Adiciones (Toppings y Complementos)

### Listar Adiciones

```
GET /api/v1/services/adiciones
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
[
  {
    "id": 101,
    "nombre": "CREMA CHANTILLY",
    "tipo": "TOPPING",
    "precio": 500,
    "stock": 50,
    "minimo": 10,
    "estado": "bien"
  },
  {
    "id": 102,
    "nombre": "AREQUIPE",
    "tipo": "TOPPING",
    "precio": 800,
    "stock": 30,
    "minimo": 5,
    "estado": "bien"
  }
]
```

### Obtener una Adición por ID

```
GET /api/v1/services/adiciones/101
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 101,
  "nombre": "CREMA CHANTILLY",
  "tipo": "TOPPING",
  "precio": 500,
  "stock": 50,
  "minimo": 10,
  "estado": "bien"
}
```

**Posibles errores:**

- 404 Not Found: "Adición con ID 101 no encontrada"
- 500 Internal Server Error: "Error al obtener la adición: [detalle del error]"

### Crear una Nueva Adición

```
POST /api/v1/services/adiciones
```

**Body (raw JSON):**

```json
{
  "nombre": "CREMA CHANTILLY",
  "tipo": "TOPPING",
  "precio": 500,
  "stock": 50,
  "minimo": 10,
  "estado": "bien"
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 101,
  "nombre": "CREMA CHANTILLY",
  "tipo": "TOPPING",
  "precio": 500,
  "stock": 50,
  "minimo": 10,
  "estado": "bien"
}
```

**Posibles errores:**

- 400 Bad Request: "Ya existe una adición con el nombre CREMA CHANTILLY"
- 500 Internal Server Error: "Error al crear la adición: [detalle del error]"

### Actualizar una Adición

```
PUT /api/v1/services/adiciones/101
```

**Body (raw JSON):**

```json
{
  "nombre": "CREMA CHANTILLY EXTRA",
  "tipo": "TOPPING",
  "precio": 600,
  "stock": 45,
  "minimo": 15,
  "estado": "bien"
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 101,
  "nombre": "CREMA CHANTILLY EXTRA",
  "tipo": "TOPPING",
  "precio": 600,
  "stock": 45,
  "minimo": 15,
  "estado": "bien"
}
```

**Posibles errores:**

- 404 Not Found: "Adición con ID 101 no encontrada"
- 400 Bad Request: "Ya existe otra adición con el nombre CREMA CHANTILLY EXTRA"
- 500 Internal Server Error: "Error al actualizar la adición: [detalle del error]"

### Eliminar una Adición

```
DELETE /api/v1/services/adiciones/101
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "message": "Adición con ID 101 eliminada exitosamente"
}
```

**Posibles errores:**

- 404 Not Found: "Adición con ID 101 no encontrada"
- 500 Internal Server Error: "Error al eliminar la adición: [detalle del error]"

### Cargar Datos Iniciales de Adiciones

```
POST /api/v1/services/adiciones/seed
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "message": "Datos iniciales de adiciones insertados correctamente"
}
```

**Posibles errores:**

- 500 Internal Server Error: "Error al insertar datos iniciales: [detalle del error]"

## Gestión de Recetas

### Añadir Receta a un Producto

```
POST /api/v1/products/1/recipe
```

**Body (raw JSON):**

```json
{
  "ingredients": [
    {
      "insumo_id": 1,
      "cantidad": 100
    },
    {
      "insumo_id": 2,
      "cantidad": 1
    },
    {
      "insumo_id": 3,
      "cantidad": 1
    }
  ]
}
```

### Obtener Receta de un Producto

```
GET /api/v1/products/1/recipe
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
[
  {
    "id": 1,
    "product_id": 1,
    "insumo_id": 1,
    "cantidad": 100.0,
    "created_at": "2023-07-15T10:30:00",
    "updated_at": "2023-07-15T10:30:00",
    "nombre_insumo": "Fresas frescas",
    "unidad": "gramos"
  },
  {
    "id": 2,
    "product_id": 1,
    "insumo_id": 2,
    "cantidad": 50.0,
    "created_at": "2023-07-15T10:30:00",
    "updated_at": "2023-07-15T10:30:00",
    "nombre_insumo": "Harina de trigo",
    "unidad": "gramos"
  }
]
```

**Posibles errores:**

- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 404 Not Found: "Producto con ID X no encontrado"
- 500 Internal Server Error: "Error al obtener la receta del producto"

## Gestión de Ventas

### Crear una Nueva Venta

```
POST /api/v1/sales
```

**Body (raw JSON):**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 22000
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 15000
    }
  ],
  "payment_method": "efectivo",
  "notes": "Cliente frecuente"
}
```

### Obtener una Venta por ID

```
GET /api/v1/sales/1
```

### Obtener Ventas del Usuario Actual

```
GET /api/v1/sales
```

## Gestión de Ventas

### Crear una Nueva Venta

```
POST /api/v1/sales
```

**Body (raw JSON):**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 22000
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 15000
    }
  ],
  "payment_method": "efectivo",
  "notes": "Cliente frecuente"
}
```

### Obtener una Venta por ID

```
GET /api/v1/sales/1
```

### Obtener Ventas del Usuario Actual

```
GET /api/v1/sales
```

## Gestión de Compras/Facturas

### Crear una Nueva Compra/Factura

```
POST /api/v1/services/purchases
```

**Body (raw JSON):**

```json
{
  "invoice_number": "1752824978017",
  "invoice_date": "18/7/2025",
  "invoice_time": "2:49:38 a. m.",
  "client_name": "lei",
  "seller_username": "admin",
  "client_phone": "3113634658",
  "has_delivery": true,
  "delivery_address": "Cra 5# 35-33 barrio cristorey",
  "delivery_person": "Mena",
  "delivery_fee": 3000,
  "subtotal_products": 22000,
  "total_amount": 25000,
  "amount_paid": 100000,
  "change_returned": 75000,
  "payment_method": "Transferencia",
  "payment_reference": "576874939002",
  "products": [
    {
      "product_name": "FRESAS",
      "product_variant": "FRESAS CON HELADO",
      "quantity": 1,
      "unit_price": 22000,
      "subtotal": 22000
    }
  ]
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "purchase_id": 1,
  "invoice_number": "1752824978017",
  "status": "success",
  "message": "Compra registrada exitosamente"
}
```

**Posibles errores:**

- 400 Bad Request: "El vendedor 'username' no existe"
- 400 Bad Request: "El número de factura es obligatorio"
- 400 Bad Request: "La fecha de factura es obligatoria"
- 400 Bad Request: "El formato de fecha es incorrecto. Use dd/mm/yyyy"
- 500 Internal Server Error: "Error al crear la compra: [detalle del error]"

### Obtener una Compra por Número de Factura

```
GET /api/v1/services/purchases/1752824978017
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "invoice_number": "1752824978017",
  "invoice_date": "18/07/2025",
  "invoice_time": "02:49:38",
  "client_name": "lei",
  "seller_username": "admin",
  "seller_email": "marian@example.com",
  "client_phone": "3113634658",
  "has_delivery": true,
  "delivery_address": "Cra 5# 35-33 barrio cristorey",
  "delivery_person": "Mena",
  "delivery_fee": 3000.0,
  "subtotal_products": 22000.0,
  "total_amount": 25000.0,
  "amount_paid": 100000.0,
  "change_returned": 75000.0,
  "payment_method": "Transferencia",
  "payment_reference": "576874939002",
  "is_cancelled": false,
  "created_at": "2023-08-15T10:30:00",
  "products": [
    {
      "id": 1,
      "purchase_id": 1,
      "product_name": "FRESAS",
      "product_variant": "FRESAS CON HELADO",
      "quantity": 1,
      "unit_price": 22000.0,
      "subtotal": 22000.0,
      "created_at": "2023-08-15T10:30:00"
    }
  ]
}
```

### Obtener Compras por Rango de Fechas

```
GET /api/v1/services/purchases?start_date=2023-08-01&end_date=2023-08-15
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "start_date": "01/08/2023",
  "end_date": "15/08/2023",
  "total_purchases": 1,
  "purchases": [
    {
      "id": 1,
      "invoice_number": "1752824978017",
      "invoice_date": "18/07/2025",
      "invoice_time": "02:49:38",
      "client_name": "lei",
      "seller_username": "admin",
      "seller_email": "marian@example.com",
      "total_items": 1,
      "total_quantity": 1,
      "total_amount": 25000.0
    }
  ]
}
```

### Obtener Resumen de Ventas por Período

```
GET /api/v1/services/purchases/summary/today
```

**Períodos disponibles:** `today`, `week`, `month`, `year`

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "period": "today",
  "start_date": "15/08/2023",
  "end_date": "15/08/2023",
  "summary": {
    "total_purchases": 1,
    "total_items_sold": 1,
    "total_quantity_sold": 1,
    "total_products_revenue": 22000.0,
    "total_delivery_revenue": 3000.0,
    "total_revenue": 25000.0,
    "average_purchase_value": 25000.0,
    "unique_clients": 1,
    "deliveries_count": 1
  },
  "payment_methods": [
    {
      "payment_method": "Transferencia",
      "count": 1,
      "total": 25000.0
    }
  ],
  "top_products": [
    {
      "product_name": "FRESAS",
      "product_variant": "FRESAS CON HELADO",
      "total_quantity": 1,
      "total_revenue": 22000.0,
      "times_sold": 1
    }
  ]
}
```

### Cancelar una Compra

```
DELETE /api/v1/services/purchases/1752824978017?reason=Cliente%20canceló%20el%20pedido
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "status": "success",
  "message": "Factura 1752824978017 cancelada exitosamente",
  "products_restored": 1
}
```

**Posibles errores:**

- 404 Not Found: "No se encontró la factura 1752824978017"
- 400 Bad Request: "La razón de cancelación es obligatoria"
- 500 Internal Server Error: "Error al cancelar la compra: [detalle del error]"

## Flujo de Trabajo Típico

1. **Iniciar sesión como superusuario**:

   ```
   POST /api/v1/users/auth/token
   ```

   - username: admin
   - password: Admin123,

2. **Crear categorías**:

   ```
   POST /api/v1/categories
   ```

   - name: "Waffles"

3. **Crear productos**:

   ```
   POST /api/v1/products
   ```

   - nombre_producto: "Waffle con fresas"
   - price: 22000
   - category_id: 1

4. **Crear insumos**:

   ```
   POST /api/v1/insumos
   ```

   - nombre_insumo: "Fresas"
   - unidad: "gramos"
   - cantidad_unitaria: 1000
   - precio_presentacion: 8000
   - cantidad_utilizada: 50 (opcional)
   - stock_minimo: 100 (opcional)
   - sitio_referencia: "Mercado Central" (opcional)

5. **Añadir recetas a los productos**:

   ```
   POST /api/v1/products/1/recipe
   ```

6. **Registrar ventas**:
   ```
   POST /api/v1/sales
   ```

## Notas Importantes

- Los endpoints de administración (`/api/v1/admin/...`) solo son accesibles para usuarios con rol de superusuario.
- Al crear una venta, el sistema automáticamente:
  - Descuenta el stock del producto vendido
  - Incrementa la cantidad utilizada de los insumos según la receta del producto
  - Registra qué usuario realizó la venta
- La cantidad utilizada de insumos (`cantidad_utilizada`) se incrementa cada vez que se vende un producto, permitiendo:
  - Seguimiento del consumo real de insumos
  - Cálculo automático del valor total utilizado (`valor_total = valor_unitario * cantidad_utilizada`)
  - Planificación de compras basada en el consumo histórico
- El superusuario predeterminado tiene las siguientes credenciales:
  - Username: admin
  - Email: marian@example.com
  - Password: Admin123,

## Guía de Uso del Sistema

Esta guía explica paso a paso cómo utilizar el sistema de inventario, especialmente la relación entre productos e insumos.

### 1. Configuración Inicial

#### 1.1 Iniciar sesión

- Acceder con las credenciales de superusuario (admin/Admin123,) o con tu usuario asignado
- Navegar al dashboard principal

#### 1.2 Crear categorías

- Ir a **Inventario > Categorías**
- Crear categorías para organizar los productos (ej: "Waffles", "Bebidas", "Postres")
- Esto permitirá clasificar los productos para una mejor organización

### 2. Gestión de Insumos

#### 2.1 Crear insumos

- Ir a **Inventario > Suministro**
- Crear los insumos con la siguiente información:
  - **Nombre del insumo**: Identificador único (ej: "Harina de trigo")
  - **Unidad**: Unidad de medida (ej: "gramos", "litros", "unidades")
  - **Cantidad unitaria**: Cantidad en la presentación que compras (ej: 1000 si compras 1kg)
  - **Precio presentación**: Precio de compra de esa presentación (ej: 5000)
  - **Stock mínimo**: Nivel mínimo antes de necesitar reabastecimiento (ej: 500)
  - **Sitio referencia**: Opcional, proveedor o lugar de compra

#### 2.2 Monitorear insumos

- El sistema calculará automáticamente:
  - **Valor unitario**: Precio presentación ÷ Cantidad unitaria
  - **Valor total**: Valor unitario × Cantidad utilizada
- Revisar periódicamente para identificar insumos con bajo stock

### 3. Gestión de Productos

#### 3.1 Crear productos

- Ir a **Inventario > Productos**
- Crear productos con la siguiente información:
  - **Nombre del producto**: Identificador único (ej: "Waffle con fresas")
  - **Variante**: Opcional, para variaciones del mismo producto
  - **Precio**: Precio de venta al público
  - **Categoría**: Seleccionar de las categorías creadas previamente

**Nota importante:** Los productos se crean automáticamente como "disponibles bajo demanda" (`stock_quantity = -1`), lo que significa que:

- No hay un límite de stock para estos productos
- Se pueden vender siempre que haya insumos disponibles
- El sistema controla el inventario a través de los insumos, no de los productos terminados
- Este modelo es ideal para una heladería donde los productos se preparan al momento

#### 3.2 Crear recetas

- Ir a **Inventario > Recetas**
- Para cada producto:
  - Seleccionar el producto
  - Añadir los insumos necesarios uno por uno
  - Especificar la cantidad de cada insumo que se utiliza
  - Guardar la receta

**Importante:** Las recetas son fundamentales en este sistema, ya que:

- Definen qué insumos se consumen al vender un producto
- Permiten calcular el costo real de cada producto
- Controlan el inventario a través de los insumos utilizados

### 4. Registro de Ventas

#### 4.1 Crear una venta

- Ir a **Factura** o **Ventas**
- Seleccionar los productos a vender
- Indicar la cantidad de cada producto
- Completar la información de pago
- Finalizar la venta

#### 4.2 Efectos automáticos

Al registrar una venta, el sistema automáticamente:

- **No descuenta stock de productos** (ya que están configurados como disponibles bajo demanda)
- **Sí incrementa la cantidad utilizada de cada insumo** según la receta
- Actualiza el valor total utilizado de cada insumo
- Alerta si algún insumo cae por debajo de su nivel mínimo

Este comportamiento es ideal para una heladería, donde:

- Los productos se preparan al momento según demanda
- Lo importante es controlar el inventario de insumos, no de productos terminados
- Se necesita saber cuándo reabastecer ingredientes, no productos

### 5. Monitoreo y Análisis

#### 5.1 Verificar consumo de insumos

- Ir a **Inventario > Consumo**
- Revisar qué insumos se están utilizando más
- Analizar el valor total utilizado para controlar costos

#### 5.2 Alertas de stock

- El dashboard mostrará alertas cuando un insumo esté por debajo del stock mínimo
- Usar esta información para planificar compras

#### 5.3 Estadísticas

- Revisar las estadísticas de ventas y consumo
- Identificar productos más vendidos y su impacto en el inventario

### 6. Flujo Completo de Ejemplo

1. **Crear insumos**: "Fresas" (unidad: gramos, cantidad unitaria: 1000, precio: 8000)
2. **Crear categoría**: "Postres"
3. **Crear producto**: "Waffle con fresas" (precio: 22000, categoría: Postres)
   - El producto se crea con `stock_quantity = -1` (disponible bajo demanda)
4. **Crear receta**: Asignar 100g de fresas al producto "Waffle con fresas" mediante una llamada separada a la API de recetas
5. **Registrar venta**: Vender 2 "Waffle con fresas"
6. **Verificar**:
   - El stock del producto no cambia (sigue siendo -1)
   - La cantidad utilizada de "Fresas" habrá aumentado en 200g
   - El sistema alerta si el stock de fresas cae por debajo del mínimo

Este flujo demuestra cómo el sistema mantiene actualizado el inventario de insumos automáticamente basado en las ventas realizadas, sin preocuparse por el stock de productos terminados, lo cual es ideal para un negocio como una heladería donde los productos se preparan al momento.

## Estadísticas de la Aplicación

Esta sección describe cómo utilizar los endpoints de estadísticas para obtener información detallada sobre ventas, productos y métricas de servicio.

### Obtener Estadísticas Generales

```
GET /api/v1/services/statistics
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "total_products": 1,
  "monthly_sales": {
    "count": 4,
    "revenue": 83000.0
  },
  "weekly_sales": [
    {
      "date": "19/07/2025",
      "count": 2,
      "revenue": 43000.0,
      "ticket_promedio": 21500.0
    },
    {
      "date": "18/07/2025",
      "count": 2,
      "revenue": 40000.0,
      "ticket_promedio": 20000.0
    }
  ],
  "top_products": [
    {
      "product_name": "WAFFLESS - FRESAS CON HELADO",
      "product_variant": "FRESAS CON HELADO",
      "quantity_sold": 4,
      "revenue": 80000.0,
      "numero_ordenes": 4
    }
  ]
}
```

### Obtener Estadísticas de Ventas por Tiempo

```
GET /api/v1/services/statistics/ventas-por-tiempo/{time_range}
```

**Parámetros de ruta:**

- time_range: Rango de tiempo para las estadísticas. Valores permitidos: "day", "week", "month", "year"

**Headers:**

- Authorization: Bearer {tu_token}

**Ejemplo (Ventas por día):**

```
GET /api/v1/services/statistics/ventas-por-tiempo/day
```

**Respuesta:**

```json
{
  "ventas_por_dia": [
    {
      "fecha": "19/07/2025",
      "total_ventas": 2,
      "ingresos": 43000.0,
      "ticket_promedio": 21500.0
    },
    {
      "fecha": "18/07/2025",
      "total_ventas": 2,
      "ingresos": 40000.0,
      "ticket_promedio": 20000.0
    }
  ]
}
```

**Ejemplo (Ventas por mes):**

```
GET /api/v1/services/statistics/ventas-por-tiempo/month
```

**Respuesta:**

```json
{
  "ventas_por_mes": [
    {
      "año": 2025,
      "mes": 7,
      "total_ventas": 4,
      "ingresos": 83000.0,
      "ingresos_domicilio": 3000.0
    }
  ]
}
```

**Ejemplo (Ventas por semana):**

```
GET /api/v1/services/statistics/ventas-por-tiempo/week
```

**Respuesta:**

```json
{
  "ventas_por_semana": [
    {
      "semana": 202529,
      "inicio_semana": "14/07/2025",
      "fin_semana": "19/07/2025",
      "total_ventas": 4,
      "ingresos": 83000.0
    }
  ]
}
```

**Ejemplo (Ventas por año):**

```
GET /api/v1/services/statistics/ventas-por-tiempo/year
```

**Respuesta:**

```json
{
  "ventas_por_año": [
    {
      "año": 2025,
      "total_ventas": 4,
      "ingresos": 83000.0,
      "ticket_promedio": 20750.0,
      "ingresos_domicilio": 3000.0
    }
  ]
}
```

### Obtener Productos Más Vendidos

```
GET /api/v1/services/statistics/productos-top
```

**Parámetros de consulta opcionales:**

- start_date: Fecha inicial para el filtro (YYYY-MM-DD)
- end_date: Fecha final para el filtro (YYYY-MM-DD)

**Headers:**

- Authorization: Bearer {tu_token}

**Ejemplo:**

```
GET /api/v1/services/statistics/productos-top?start_date=2025-07-01&end_date=2025-07-31
```

**Respuesta:**

```json
{
  "productos_mas_vendidos": [
    {
      "producto": "WAFFLESS - FRESAS CON HELADO",
      "variante": "FRESAS CON HELADO",
      "cantidad_vendida": 4,
      "ingresos": 80000.0,
      "numero_ordenes": 4
    }
  ],
  "periodo": {
    "fecha_inicio": "01/07/2025",
    "fecha_fin": "31/07/2025"
  }
}
```

### Obtener Métricas de Entrega y Servicio

```
GET /api/v1/services/statistics/metricas-entrega
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "domicilios_vs_directa": [
    {
      "tipo": "Venta directa",
      "total_ordenes": 3,
      "ingresos_total": 60000.0,
      "ticket_promedio": 20000.0,
      "total_domicilios": 0.0
    },
    {
      "tipo": "Domicilio",
      "total_ordenes": 1,
      "ingresos_total": 23000.0,
      "ticket_promedio": 23000.0,
      "total_domicilios": 3000.0
    }
  ],
  "metodos_pago": [
    {
      "metodo_pago": "efectivo",
      "cantidad_transacciones": 3,
      "valor_total": 60000.0,
      "valor_promedio": 20000.0
    },
    {
      "metodo_pago": "transferencia",
      "cantidad_transacciones": 1,
      "valor_total": 23000.0,
      "valor_promedio": 23000.0
    }
  ]
}
```

## Uso de las Estadísticas en el Frontend

Los endpoints de estadísticas son especialmente útiles para:

1. **Dashboards y paneles de control**:

   - Mostrar gráficos de ventas diarias, semanales o mensuales
   - Visualizar tendencias de ingresos a lo largo del tiempo
   - Destacar productos más vendidos

2. **Análisis de negocio**:

   - Comparar ventas entre diferentes períodos
   - Identificar qué productos generan más ingresos
   - Analizar la efectividad de los domicilios vs ventas directas

3. **Toma de decisiones**:
   - Determinar qué productos promocionar basado en su popularidad
   - Optimizar el inventario según patrones de venta
   - Evaluar qué métodos de pago son más utilizados

### Ejemplo de Integración en React

```jsx
import { useEffect, useState } from "react";
import axios from "axios";

function EstadisticasPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8000/api/v1/services/statistics",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        setError("Error al cargar estadísticas");
        setLoading(false);
        console.error(err);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Cargando estadísticas...</div>;
  if (error) return <div>{error}</div>;
  if (!stats) return <div>No hay datos disponibles</div>;

  return (
    <div className="stats-panel">
      <h2>Estadísticas de Ventas</h2>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Ventas del Mes</h3>
          <p className="stat-value">{stats.monthly_sales.count}</p>
          <p className="stat-label">
            Total: ${stats.monthly_sales.revenue.toLocaleString()}
          </p>
        </div>

        <div className="stat-card">
          <h3>Productos Activos</h3>
          <p className="stat-value">{stats.total_products}</p>
        </div>
      </div>

      <h3>Ventas Recientes</h3>
      <div className="sales-chart">
        {/* Aquí podrías integrar una librería de gráficos como Chart.js o Recharts */}
        {stats.weekly_sales.map((day) => (
          <div
            key={day.date}
            className="chart-bar"
            style={{ height: `${day.revenue / 1000}px` }}
          >
            <span className="bar-value">${day.revenue.toLocaleString()}</span>
            <span className="bar-label">{day.date}</span>
          </div>
        ))}
      </div>

      <h3>Productos Más Vendidos</h3>
      <ul className="top-products">
        {stats.top_products.map((product, index) => (
          <li key={index} className="product-item">
            <span className="product-name">{product.product_name}</span>
            <span className="product-quantity">
              {product.quantity_sold} unidades
            </span>
            <span className="product-revenue">
              ${product.revenue.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EstadisticasPanel;
```

Este ejemplo muestra cómo podrías consumir los datos de estadísticas en un componente React para crear un panel de control básico.

## Extractos de Ventas

Esta sección describe cómo utilizar los endpoints de extractos para obtener información detallada sobre las compras y ventas realizadas.

### Obtener Extracto Mensual de Compras

```
GET /api/v1/services/extracts/monthly/{year}/{month}
```

**Parámetros de ruta:**

- year: Año del extracto (ej: 2025)
- month: Mes del extracto (1-12)

**Headers:**

- Authorization: Bearer {tu_token}

**Ejemplo:**

```
GET /api/v1/services/extracts/monthly/2025/7
```

**Respuesta:**

```json
{
  "year": 2025,
  "month": 7,
  "month_name": "Julio",
  "total_records": 2,
  "data": [
    {
      "invoice_number": "1752824978017",
      "invoice_date": "18/07/2025",
      "invoice_time": "02:49:38",
      "cliente": "lei (3113634658)",
      "vendedor": "admin",
      "product_name": "FRESAS",
      "product_variant": "FRESAS CON HELADO",
      "quantity": 1,
      "unit_price": 22000,
      "subtotal": 22000,
      "subtotal_products": 22000,
      "total_amount": 25000,
      "payment_method": "Transferencia",
      "created_at": "15/08/2023 10:30:00"
    },
    {
      "invoice_number": "1752824978018",
      "invoice_date": "19/07/2025",
      "invoice_time": "15:30:22",
      "cliente": "Carlos (3001234567)",
      "vendedor": "admin",
      "product_name": "WAFFLESS",
      "product_variant": "CHOCOLATE",
      "quantity": 2,
      "unit_price": 18000,
      "subtotal": 36000,
      "subtotal_products": 36000,
      "total_amount": 36000,
      "payment_method": "Efectivo",
      "created_at": "15/08/2023 16:45:00"
    }
  ]
}
```

### Obtener Extracto Diario de Compras

```
GET /api/v1/services/extracts/daily/{date}
```

**Parámetros de ruta:**

- date: Fecha del extracto en formato YYYY-MM-DD

**Headers:**

- Authorization: Bearer {tu_token}

**Ejemplo:**

```
GET /api/v1/services/extracts/daily/2025-07-18
```

**Respuesta:**

```json
{
  "date": "18/07/2025",
  "total_records": 1,
  "data": [
    {
      "invoice_number": "1752824978017",
      "invoice_date": "18/07/2025",
      "invoice_time": "02:49:38",
      "cliente": "lei (3113634658)",
      "vendedor": "admin",
      "product_name": "FRESAS",
      "product_variant": "FRESAS CON HELADO",
      "quantity": 1,
      "unit_price": 22000,
      "subtotal": 22000,
      "subtotal_products": 22000,
      "total_amount": 25000,
      "payment_method": "Transferencia",
      "created_at": "15/08/2023 10:30:00"
    }
  ]
}
```

### Obtener Extracto por Rango de Fechas

```
GET /api/v1/services/extracts/range?start_date={start_date}&end_date={end_date}
```

**Parámetros de consulta:**

- start_date: Fecha inicial del rango en formato YYYY-MM-DD
- end_date: Fecha final del rango en formato YYYY-MM-DD

**Headers:**

- Authorization: Bearer {tu_token}

**Ejemplo:**

```
GET /api/v1/services/extracts/range?start_date=2025-07-15&end_date=2025-07-20
```

**Respuesta:**

```json
{
  "start_date": "15/07/2025",
  "end_date": "20/07/2025",
  "total_records": 2,
  "data": [
    {
      "invoice_number": "1752824978017",
      "invoice_date": "18/07/2025",
      "invoice_time": "02:49:38",
      "cliente": "lei (3113634658)",
      "vendedor": "admin",
      "product_name": "FRESAS",
      "product_variant": "FRESAS CON HELADO",
      "quantity": 1,
      "unit_price": 22000,
      "subtotal": 22000,
      "subtotal_products": 22000,
      "total_amount": 25000,
      "payment_method": "Transferencia",
      "created_at": "15/08/2023 10:30:00"
    },
    {
      "invoice_number": "1752824978018",
      "invoice_date": "19/07/2025",
      "invoice_time": "15:30:22",
      "cliente": "Carlos (3001234567)",
      "vendedor": "admin",
      "product_name": "WAFFLESS",
      "product_variant": "CHOCOLATE",
      "quantity": 2,
      "unit_price": 18000,
      "subtotal": 36000,
      "subtotal_products": 36000,
      "total_amount": 36000,
      "payment_method": "Efectivo",
      "created_at": "15/08/2023 16:45:00"
    }
  ]
}
```

## Uso de los Extractos en el Frontend

Los endpoints de extractos son especialmente útiles para:

1. **Reportes detallados**:

   - Generar informes de ventas por día, mes o período personalizado
   - Exportar datos para análisis financiero
   - Auditar transacciones históricas

2. **Análisis de clientes**:

   - Ver historial de compras de clientes específicos
   - Identificar patrones de compra

3. **Gestión administrativa**:
   - Conciliar ventas diarias
   - Verificar comisiones de vendedores
   - Generar informes para contabilidad

### Ejemplo de Integración en React

```jsx
import { useEffect, useState } from "react";
import axios from "axios";

function ExtractoVentas() {
  const [extractData, setExtractData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    const fetchExtract = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8000/api/v1/services/extracts/monthly/${year}/${month}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setExtractData(response.data.data);
        setLoading(false);
      } catch (err) {
        setError("Error al cargar el extracto de ventas");
        setLoading(false);
        console.error(err);
      }
    };

    fetchExtract();
  }, [year, month]);

  // Resto del componente...
}
```

## Gestión de Domiciliarios

### Listar Todos los Domiciliarios

```
GET /api/v1/services/domiciliarios
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
[
  {
    "id": 1,
    "nombre": "Juan Pérez",
    "telefono": "3001234567",
    "tarifa": 5000
  },
  {
    "id": 2,
    "nombre": "Ana García",
    "telefono": "3109876543",
    "tarifa": 6000
  },
  {
    "id": 3,
    "nombre": "Pedro López",
    "telefono": "3205551234",
    "tarifa": 4500
  }
]
```

**Posibles errores:**

- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 500 Internal Server Error: "Error al obtener los domiciliarios: [detalle del error]"

### Obtener un Domiciliario por ID

```
GET /api/v1/services/domiciliarios/1
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "telefono": "3001234567",
  "tarifa": 5000
}
```

**Posibles errores:**

- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 404 Not Found: "Domiciliario con ID 1 no encontrado"
- 500 Internal Server Error: "Error al obtener el domiciliario: [detalle del error]"

### Crear un Nuevo Domiciliario

```
POST /api/v1/services/domiciliarios
```

**Body (raw JSON):**

```json
{
  "nombre": "Juan Pérez",
  "telefono": "3001234567",
  "tarifa": 5000
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "telefono": "3001234567",
  "tarifa": 5000
}
```

**Posibles errores:**

- 400 Bad Request: "Ya existe un domiciliario con el teléfono 3001234567"
- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 500 Internal Server Error: "Error al crear el domiciliario: [detalle del error]"

### Actualizar un Domiciliario

```
PUT /api/v1/services/domiciliarios/1
```

**Body (raw JSON):**

```json
{
  "nombre": "Juan Pablo Pérez",
  "telefono": "3001234567",
  "tarifa": 5500
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "nombre": "Juan Pablo Pérez",
  "telefono": "3001234567",
  "tarifa": 5500
}
```

**Posibles errores:**

- 400 Bad Request: "Ya existe otro domiciliario con el teléfono 3001234567"
- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 404 Not Found: "Domiciliario con ID 1 no encontrado"
- 500 Internal Server Error: "Error al actualizar el domiciliario: [detalle del error]"

### Eliminar un Domiciliario

```
DELETE /api/v1/services/domiciliarios/1
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "message": "Domiciliario con ID 1 eliminado exitosamente"
}
```

**Posibles errores:**

- 401 Unauthorized: "Token de autenticación no proporcionado"
- 401 Unauthorized: "Token expirado. Por favor, inicie sesión nuevamente"
- 404 Not Found: "Domiciliario con ID 1 no encontrado"
- 500 Internal Server Error: "Error al eliminar el domiciliario: [detalle del error]"

## Generación de Reportes PDF

Esta sección describe cómo generar reportes en formato PDF a partir de los datos de ventas y extractos.

### Generar Reporte de Ventas en PDF

```
POST /api/v1/services/pdf/generate-report
```

Este endpoint recibe los datos de un reporte consolidado y un extracto detallado para generar un documento PDF.

**Headers:**

- Authorization: Bearer {tu_token}

**Body (raw JSON):**

El cuerpo de la solicitud debe contener tres claves principales: `report_data`, `extract_data`, y `period`.

```json
{
  "report_data": {
    "total_ventas": 83000.0,
    "cantidad_ventas": 4,
    "ticket_promedio": 20750.0,
    "cantidad_domicilios": 1,
    "metodos_pago": [
      {
        "payment_method": "efectivo",
        "count": 3,
        "total": 60000.0
      },
      {
        "payment_method": "transferencia",
        "count": 1,
        "total": 23000.0
      }
    ],
    "productos_top": [
      {
        "producto": "WAFFLESS - FRESAS CON HELADO",
        "variante": "FRESAS CON HELADO",
        "quantity_sold": 4,
        "numero_ordenes": 4,
        "revenue": 80000.0
      }
    ]
  },
  "extract_data": [
    {
      "invoice_number": "1752824978017",
      "invoice_date": "18/07/2025",
      "invoice_time": "02:49:38",
      "cliente": "lei (3113634658)",
      "vendedor": "admin",
      "product_name": "FRESAS",
      "product_variant": "FRESAS CON HELADO",
      "quantity": 1,
      "unit_price": 22000,
      "subtotal": 22000,
      "total_amount": 25000,
      "payment_method": "Transferencia"
    }
  ],
  "period": "Reporte Mensual: Julio 2025"
}
```

**Respuesta Exitosa:**

- **Código de estado:** 200 OK
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="reporte_ventas_YYYYMMDD_HHMMSS.pdf"`
- El cuerpo de la respuesta es el archivo PDF binario.

**Posibles errores:**

- 400 Bad Request: Si los datos en el cuerpo de la solicitud no son válidos (ej: campos faltantes, tipos de datos incorrectos).
- 401 Unauthorized: Si el token de autenticación no es válido o no se proporciona.
- 500 Internal Server Error: Si ocurre un error inesperado durante la generación del PDF.
