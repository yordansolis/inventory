# Documentación de la API de Inventario para Heladería

Esta documentación proporciona ejemplos de cómo utilizar la API del sistema de inventario para heladería utilizando Postman.

## Configuración Inicial

1. **URL Base**: `http://localhost:8000`
2. **Autenticación**: La mayoría de los endpoints requieren autenticación JWT. Después de obtener el token, configúralo en Postman:
   - En la pestaña "Authorization"
   - Selecciona "Type" -> "Bearer Token"
   - Pega tu token en el campo "Token"

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

**Body (raw JSON):**

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

**Body (raw JSON):**

```json
{
  "nombre_insumo": "Fresas",
  "unidad": "gramos",
  "cantidad_actual": 1000,
  "stock_minimo": 500
}
```

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

2. **Crear categorías y productos**:

   ```
   POST /api/v1/products
   ```

3. **Crear insumos**:

   ```
   POST /api/v1/insumos
   ```

4. **Añadir recetas a los productos**:

   ```
   POST /api/v1/products/1/recipe
   ```

5. **Registrar ventas**:
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
