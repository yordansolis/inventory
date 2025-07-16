from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from schemas.schemas import UserResponse, UserCreate, UserUpdate
from api.v1.auth_service.login import get_current_active_user
from database.db import execute_query
from passlib.context import CryptContext

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
    
    # Insertar el nuevo usuario
    insert_query = """
    INSERT INTO users (username, email, hashed_password, role_id, is_active)
    VALUES (%s, %s, %s, %s, %s)
    """
    
    execute_query(
        insert_query, 
        (user.username, user.email, hashed_password, user.role_id, True)
    )
    
    # Obtener el usuario recién creado
    get_query = """
    SELECT u.*, r.name as role_name 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = %s
    """
    
    new_user = execute_query(get_query, (user.username,), fetch_one=True)
    
    return new_user

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
    
    # Construir la consulta de actualización
    update_fields = []
    params = []
    
    if user_update.username is not None:
        # Verificar que el nombre de usuario no esté en uso
        check_username_query = "SELECT id FROM users WHERE username = %s AND id != %s"
        existing_username = execute_query(check_username_query, (user_update.username, user_id), fetch_one=True)
        
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
        
        update_fields.append("username = %s")
        params.append(user_update.username)
    
    if user_update.email is not None:
        # Verificar que el email no esté en uso
        check_email_query = "SELECT id FROM users WHERE email = %s AND id != %s"
        existing_email = execute_query(check_email_query, (user_update.email, user_id), fetch_one=True)
        
        if existing_email:
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
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron campos para actualizar"
        )
    
    # Ejecutar la actualización
    update_query = f"""
    UPDATE users
    SET {', '.join(update_fields)}
    WHERE id = %s
    """
    
    params.append(user_id)
    execute_query(update_query, params)
    
    # Obtener el usuario actualizado
    get_query = """
    SELECT u.*, r.name as role_name 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = %s
    """
    
    updated_user = execute_query(get_query, (user_id,), fetch_one=True)
    
    return updated_user

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
