from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from schemas.schemas import RoleResponse, RoleCreate, RoleBase
from api.v1.auth_service.login import get_current_active_user
from api.v1.crud_users.router_users import get_current_superuser
from database.db import execute_query

router_roles = APIRouter()

# Obtener todos los roles
@router_roles.get("/", response_model=List[RoleResponse])
async def get_all_roles(current_user: dict = Depends(get_current_active_user)):
    """
    Obtener todos los roles (cualquier usuario autenticado)
    """
    query = """
    SELECT * FROM roles
    ORDER BY id
    """
    
    roles = execute_query(query, fetch_all=True) or []
    
    return roles

# Obtener un rol por ID
@router_roles.get("/{role_id}", response_model=RoleResponse)
async def get_role_by_id(
    role_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Obtener un rol por su ID (cualquier usuario autenticado)
    """
    query = "SELECT * FROM roles WHERE id = %s"
    
    role = execute_query(query, (role_id,), fetch_one=True)
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rol con ID {role_id} no encontrado"
        )
    
    return role

# Crear un nuevo rol
@router_roles.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role: RoleCreate,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Crear un nuevo rol (solo superusuarios)
    """
    # Verificar que el rol no exista
    check_query = "SELECT id FROM roles WHERE name = %s"
    existing_role = execute_query(check_query, (role.name,), fetch_one=True)
    
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un rol con el nombre '{role.name}'"
        )
    
    # Insertar el nuevo rol
    insert_query = """
    INSERT INTO roles (name, description)
    VALUES (%s, %s)
    """
    
    execute_query(insert_query, (role.name, role.description))
    
    # Obtener el rol recién creado
    get_query = "SELECT * FROM roles WHERE name = %s"
    
    new_role = execute_query(get_query, (role.name,), fetch_one=True)
    
    return new_role

# Actualizar un rol
@router_roles.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_update: RoleBase,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Actualizar un rol (solo superusuarios)
    """
    # Verificar que el rol exista
    check_query = "SELECT id FROM roles WHERE id = %s"
    existing_role = execute_query(check_query, (role_id,), fetch_one=True)
    
    if not existing_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rol con ID {role_id} no encontrado"
        )
    
    # No permitir modificar los roles predefinidos (1, 2, 3)
    if role_id in [1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden modificar los roles predefinidos del sistema"
        )
    
    # Verificar que el nombre no esté en uso
    check_name_query = "SELECT id FROM roles WHERE name = %s AND id != %s"
    existing_name = execute_query(check_name_query, (role_update.name, role_id), fetch_one=True)
    
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un rol con el nombre '{role_update.name}'"
        )
    
    # Actualizar el rol
    update_query = """
    UPDATE roles
    SET name = %s, description = %s
    WHERE id = %s
    """
    
    execute_query(update_query, (role_update.name, role_update.description, role_id))
    
    # Obtener el rol actualizado
    get_query = "SELECT * FROM roles WHERE id = %s"
    
    updated_role = execute_query(get_query, (role_id,), fetch_one=True)
    
    return updated_role

# Eliminar un rol
@router_roles.delete("/{role_id}", response_model=RoleResponse)
async def delete_role(
    role_id: int,
    current_user: dict = Depends(get_current_superuser)
):
    """
    Eliminar un rol (solo superusuarios)
    """
    # Verificar que el rol exista
    check_query = "SELECT id FROM roles WHERE id = %s"
    existing_role = execute_query(check_query, (role_id,), fetch_one=True)
    
    if not existing_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rol con ID {role_id} no encontrado"
        )
    
    # No permitir eliminar los roles predefinidos (1, 2, 3)
    if role_id in [1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden eliminar los roles predefinidos del sistema"
        )
    
    # Verificar si hay usuarios con este rol
    check_users_query = "SELECT COUNT(*) as count FROM users WHERE role_id = %s"
    users_count = execute_query(check_users_query, (role_id,), fetch_one=True)
    
    if users_count and users_count['count'] > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar el rol porque hay {users_count['count']} usuarios asignados a él"
        )
    
    # Guardar el rol antes de eliminarlo
    get_query = "SELECT * FROM roles WHERE id = %s"
    role = execute_query(get_query, (role_id,), fetch_one=True)
    
    # Eliminar el rol
    delete_query = "DELETE FROM roles WHERE id = %s"
    execute_query(delete_query, (role_id,))
    
    return role
