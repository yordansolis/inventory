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
POST
```

**Body (raw JSON):**

```json
{
  "username": "nuevo_empleado",
  "email": "empleado@ejemplo.com",
  "password": "Contraseña123,",
  "role_id": 2
}
```

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
  "is_active": true
}
```

### Desactivar un Usuario

```
DELETE /api/v1/admin/users/3
```

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
  "role_name": "staff"
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
- stock_quantity: 10 (opcional, por defecto 0)
- min_stock: 5 (opcional, por defecto 5)

**Opción 2: Usando JSON en el cuerpo:**

```json
{
  "nombre_producto": "Waffle con fresas",
  "price": 22000,
  "category_id": 1,
  "variante": "Grande",
  "stock_quantity": 10,
  "min_stock": 5
}
```

**Headers:**

- Authorization: Bearer {tu_token}

**Respuesta:**

```json
{
  "id": 1,
  "message": "Producto creado exitosamente"
}
```

**Posibles errores:**

- 400 Bad Request: "El nombre del producto es obligatorio"
- 400 Bad Request: "El precio del producto es obligatorio"
- 400 Bad Request: "La categoría del producto es obligatoria"
- 400 Bad Request: "Error en el formato de los datos: price debe ser un número, category_id, stock_quantity y min_stock deben ser enteros"
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

- nombre_insumo: "Fresas"
- unidad: "gramos"
- cantidad_actual: 1000 (opcional, por defecto 0)
- stock_minimo: 500 (opcional, por defecto 0)
- valor_unitario: 8000 (opcional, por defecto 0)
- valor_unitarioxunidad: 8 (opcional, por defecto 0)
- sitio_referencia: "Proveedor ABC" (opcional)

**Opción 2: Usando JSON en el cuerpo:**

```json
{
  "nombre_insumo": "Fresas",
  "unidad": "gramos",
  "cantidad_actual": 1000,
  "stock_minimo": 500,
  "valor_unitario": 8000,
  "valor_unitarioxunidad": 8,
  "sitio_referencia": "Proveedor ABC"
}
```

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
  "cantidad_actual": 1500,
  "stock_minimo": 300,
  "valor_unitario": 8000,
  "valor_unitarioxunidad": 8,
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
  "cantidad_actual": 1500.0,
  "stock_minimo": 300.0,
  "valor_unitario": 8000.0,
  "valor_unitarioxunidad": 8.0,
  "sitio_referencia": "Proveedor ABC",
  "creado_en": "2023-07-15T10:30:00"
}
```

**Posibles errores:**

- 400 Bad Request: "No se proporcionaron datos para actualizar"
- 400 Bad Request: "Error al procesar el cuerpo JSON: [detalle del error]"
- 400 Bad Request: "La cantidad actual debe ser un número"
- 400 Bad Request: "El stock mínimo debe ser un número"
- 400 Bad Request: "El valor unitario debe ser un número"
- 400 Bad Request: "El valor unitario por unidad debe ser un número"
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
  - Descuenta el stock de los ingredientes según la receta
  - Registra qué usuario realizó la venta
- El superusuario predeterminado tiene las siguientes credenciales:
  - Username: admin
  - Email: marian@example.com
  - Password: Admin123,
