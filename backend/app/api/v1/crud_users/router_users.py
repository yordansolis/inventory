from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from schemas.schemas import UserResponse, UserCreate, UserUpdate
from api.v1.auth_service.login import get_current_active_user
from database.db import execute_query
from passlib.context import CryptContext
import pymysql.cursors

router_crud_users = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Función para verificar si el usuario es superuser
async def get_current_superuser(current_user: dict = Depends(get_current_active_user)):
    if current_user.get("role_id") != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción. Se requiere rol de superusuario."
        )
    return current_user

# Obtener todos los usuarios
@router_crud_users.get("/", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Obtener todos los usuarios (solo superusuarios)
    """
    conditions = ["1=1"]
    params = []
    
    if search:
        conditions.append("(username LIKE %s OR email LIKE %s)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term])
    
    where_clause = " AND ".join(conditions)
    
    query = f"""
    SELECT u.*, r.name as role_name 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE {where_clause}
    ORDER BY u.id
    LIMIT %s OFFSET %s
    """
    
    params.extend([limit, skip])
    users = execute_query(query, params, fetch_all=True) or []
    
    return users

# Obtener un usuario por ID
@router_crud_users.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Obtener un usuario por su ID (solo superusuarios)
    """
    query = """
    SELECT u.*, r.name as role_name 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = %s
    """
    
    user = execute_query(query, (user_id,), fetch_one=True)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    return user

# Crear un nuevo usuario
@router_crud_users.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Crear un nuevo usuario (solo superusuarios)
    """
    # Verificar que el usuario no exista
    check_query = "SELECT id FROM users WHERE username = %s OR email = %s"
    existing_user = execute_query(check_query, (user.username, user.email), fetch_one=True)
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario o email ya están registrados"
        )
    
    # Hashear la contraseña
    hashed_password = pwd_context.hash(user.password)
    
    # Iniciar conexión para transacción
    connection = None
    cursor = None
    try:
        from database.db import get_db_connection
        connection = get_db_connection()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo establecer conexión con la base de datos"
            )
        
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        # Iniciar transacción
        connection.begin()
        
        # Insertar el nuevo usuario
        insert_query = """
        INSERT INTO users (username, email, hashed_password, role_id, is_active)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        cursor.execute(
            insert_query, 
            (user.username, user.email, hashed_password, user.role_id, True)
        )
        
        # Obtener el ID del usuario recién creado
        user_id = cursor.lastrowid
        
        if not user_id:
            connection.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el usuario: no se pudo obtener el ID"
            )
        
        # Establecer permisos por defecto
        permissions = {
            "facturar": True,  # Por defecto todos pueden facturar
            "verVentas": False # Por defecto nadie puede ver ventas
        }
        
        # Si se proporcionan permisos específicos, usarlos pero con restricciones
        if user.permissions:
            facturar_permission = getattr(user.permissions, 'facturar', None)
            verVentas_permission = getattr(user.permissions, 'verVentas', None)
            
            if facturar_permission is not None:
                permissions['facturar'] = facturar_permission
                
            # Solo permitir verVentas=True si el rol es 1 (superusuario)
            if verVentas_permission is not None and user.role_id == 1:
                permissions['verVentas'] = verVentas_permission
        
        # Guardar los permisos en la tabla user_permissions
        permissions_query = """
        INSERT INTO user_permissions (user_id, facturar, verVentas)
        VALUES (%s, %s, %s)
        """
        
        cursor.execute(
            permissions_query,
            (user_id, permissions['facturar'], permissions['verVentas'])
        )
        
        # Confirmar la transacción
        connection.commit()
        
        # Obtener el usuario recién creado con sus permisos
        get_query = """
        SELECT u.*, r.name as role_name, p.facturar, p.verVentas
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions p ON u.id = p.user_id
        WHERE u.id = %s
        """
        
        cursor.execute(get_query, (user_id,))
        new_user = cursor.fetchone()
        
        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el usuario: no se pudo recuperar la información"
            )
        
        # Formatear los permisos en el objeto de respuesta
        new_user['permissions'] = {
            'facturar': bool(new_user.pop('facturar', False)),
            'verVentas': bool(new_user.pop('verVentas', False))
        }
        
        return new_user
    
    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Error al crear usuario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear el usuario: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

# Actualizar un usuario
@router_crud_users.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Actualizar un usuario (solo superusuarios)
    """
    # Verificar que el usuario exista
    check_query = "SELECT id FROM users WHERE id = %s"
    existing_user = execute_query(check_query, (user_id,), fetch_one=True)
    
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    # Iniciar conexión para transacción
    connection = None
    cursor = None
    try:
        from database.db import get_db_connection
        connection = get_db_connection()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo establecer conexión con la base de datos"
            )
        
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        # Iniciar transacción
        connection.begin()
        
        # Construir la consulta de actualización para el usuario
        update_fields = []
        params = []
        
        if user_update.username is not None:
            # Verificar que el nombre de usuario no esté en uso
            check_username_query = "SELECT id FROM users WHERE username = %s AND id != %s"
            cursor.execute(check_username_query, (user_update.username, user_id))
            existing_username = cursor.fetchone()
            
            if existing_username:
                connection.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre de usuario ya está en uso"
                )
            
            update_fields.append("username = %s")
            params.append(user_update.username)
        
        if user_update.email is not None:
            # Verificar que el email no esté en uso
            check_email_query = "SELECT id FROM users WHERE email = %s AND id != %s"
            cursor.execute(check_email_query, (user_update.email, user_id))
            existing_email = cursor.fetchone()
            
            if existing_email:
                connection.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El email ya está en uso"
                )
            
            update_fields.append("email = %s")
            params.append(user_update.email)
        
        if user_update.password is not None:
            hashed_password = pwd_context.hash(user_update.password)
            update_fields.append("hashed_password = %s")
            params.append(hashed_password)
        
        if user_update.role_id is not None:
            update_fields.append("role_id = %s")
            params.append(user_update.role_id)
        
        if user_update.is_active is not None:
            update_fields.append("is_active = %s")
            params.append(user_update.is_active)
        
        # Actualizar usuario si hay campos que actualizar
        if update_fields:
            update_query = f"""
            UPDATE users
            SET {', '.join(update_fields)}
            WHERE id = %s
            """
            
            params.append(user_id)
            cursor.execute(update_query, params)
        
        # Actualizar permisos si se proporcionaron
        if user_update.permissions:
            # Verificar si ya existe un registro de permisos
            check_permissions_query = "SELECT id FROM user_permissions WHERE user_id = %s"
            cursor.execute(check_permissions_query, (user_id,))
            existing_permissions = cursor.fetchone()
            
            # Obtener el rol actual del usuario si no se está actualizando
            check_role_query = "SELECT role_id FROM users WHERE id = %s"
            cursor.execute(check_role_query, (user_id,))
            current_user_data = cursor.fetchone()
            current_role_id = current_user_data['role_id'] if current_user_data else 0
            
            # Usar el nuevo rol si se proporcionó, o el actual si no
            updated_role_id = user_update.role_id if user_update.role_id is not None else current_role_id
            
            # Asegurarse que solo usuarios con role_id 1 (admin) pueden tener verVentas=True
            can_see_sales = user_update.permissions.get('verVentas', False) and updated_role_id == 1
            
            if existing_permissions:
                # Actualizar permisos existentes
                permissions_update_query = """
                UPDATE user_permissions
                SET facturar = %s, verVentas = %s
                WHERE user_id = %s
                """
                
                cursor.execute(
                    permissions_update_query,
                    (
                        user_update.permissions.get('facturar', False),
                        can_see_sales,
                        user_id
                    )
                )
            else:
                # Crear nuevos permisos
                permissions_insert_query = """
                INSERT INTO user_permissions (user_id, facturar, verVentas)
                VALUES (%s, %s, %s)
                """
                
                cursor.execute(
                    permissions_insert_query,
                    (
                        user_id,
                        user_update.permissions.get('facturar', False),
                        can_see_sales
                    )
                )
        
        # Confirmar la transacción
        connection.commit()
        
        # Obtener el usuario actualizado con sus permisos
        get_query = """
        SELECT u.*, r.name as role_name, p.facturar, p.verVentas
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions p ON u.id = p.user_id
        WHERE u.id = %s
        """
        
        cursor.execute(get_query, (user_id,))
        updated_user = cursor.fetchone()
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar el usuario: no se pudo recuperar la información"
            )
        
        # Formatear los permisos en el objeto de respuesta
        updated_user['permissions'] = {
            'facturar': bool(updated_user.pop('facturar', False)),
            'verVentas': bool(updated_user.pop('verVentas', False))
        }
        
        return updated_user
    
    except HTTPException:
        if connection:
            connection.rollback()
        raise
    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Error al actualizar usuario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar el usuario: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

# Eliminar un usuario (desactivar)
@router_crud_users.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: int,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Desactivar un usuario (solo superusuarios)
    """
    # Verificar que el usuario exista
    check_query = "SELECT id FROM users WHERE id = %s"
    existing_user = execute_query(check_query, (user_id,), fetch_one=True)
    
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    # No permitir eliminar al propio superusuario
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propia cuenta"
        )
    
    # Desactivar el usuario (soft delete)
    update_query = "UPDATE users SET is_active = FALSE WHERE id = %s"
    execute_query(update_query, (user_id,))
    
    # Obtener el usuario actualizado
    get_query = """
    SELECT u.*, r.name as role_name 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = %s
    """
    
    updated_user = execute_query(get_query, (user_id,), fetch_one=True)
    
    return updated_user

# Activar un usuario desactivado
@router_crud_users.patch("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Activar un usuario que ha sido desactivado (solo superusuarios)
    """
    # Verificar que el usuario exista
    check_query = "SELECT id, is_active FROM users WHERE id = %s"
    existing_user = execute_query(check_query, (user_id,), fetch_one=True)
    
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    # Verificar si el usuario ya está activo
    if existing_user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya está activo"
        )
    
    # Activar el usuario
    update_query = "UPDATE users SET is_active = TRUE WHERE id = %s"
    execute_query(update_query, (user_id,))
    
    # Obtener el usuario actualizado
    get_query = """
    SELECT u.*, r.name as role_name 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = %s
    """
    
    updated_user = execute_query(get_query, (user_id,), fetch_one=True)
    
    return updated_user
