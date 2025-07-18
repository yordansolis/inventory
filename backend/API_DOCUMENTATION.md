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
