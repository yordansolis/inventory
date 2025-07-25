from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

import jwt
from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel
from database.db import execute_query
import os
from dotenv import load_dotenv
from schemas.schemas import Token, TokenData, UserResponse

# Cargar variables de entorno
load_dotenv('.env.dev')

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Router
auth_router = APIRouter()

# Configuración de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(username: str) -> Optional[dict]:
    """Obtener usuario de la base de datos"""
    # Consulta principal para obtener datos del usuario y su rol
    query = """
    SELECT u.*, r.name as role_name 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id 
    WHERE u.username = %s
    """
    user = execute_query(query, (username,), fetch_one=True)
    
    if user:
        # Consultar permisos de la tabla user_permissions
        permissions_query = """
        SELECT facturar, verVentas
        FROM user_permissions
        WHERE user_id = %s
        """
        permissions = execute_query(permissions_query, (user["id"],), fetch_one=True)
        
        if permissions:
            # Si el usuario tiene permisos personalizados, usarlos
            # Pero asegurarse que solo los administradores (role_id 1) puedan ver ventas
            user["permissions"] = {
                "facturar": bool(permissions["facturar"]),
                "verVentas": bool(permissions["verVentas"]) and user["role_id"] == 1
            }
        else:
            # Si no tiene permisos personalizados, asignar permisos según el rol
            if user["role_id"] == 1:  # Superuser - tiene todos los permisos
                user["permissions"] = {
                    "facturar": True,
                    "verVentas": True
                }
            else:
                user["permissions"] = {
                    "facturar": user["role_id"] in [1, 2],  # Superuser y staff pueden facturar
                    "verVentas": False  # Solo superuser puede ver ventas
                }
            
            # Crear un registro de permisos para este usuario
            insert_permissions_query = """
            INSERT INTO user_permissions (user_id, facturar, verVentas)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE facturar = VALUES(facturar), verVentas = VALUES(verVentas)
            """
            execute_query(
                insert_permissions_query,
                (
                    user["id"],
                    user["permissions"]["facturar"],
                    user["permissions"]["verVentas"]
                )
            )
    
    return user


def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Autenticar usuario"""
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación no proporcionado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: falta el campo 'sub'",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(username=username)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado. Por favor, inicie sesión nuevamente",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.DecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: error de decodificación",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user(username=token_data.username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_active_user(
    current_user: Annotated[dict, Depends(get_current_user)],
):
    if not current_user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# Clase para respuesta extendida del token
class TokenWithUser(Token):
    user: dict


@auth_router.post("/token", response_model=TokenWithUser)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    """Endpoint para login de usuarios"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar si el usuario está activo
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    # Preparar información del usuario para la respuesta
    user_info = {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role_id": user["role_id"],
        "is_active": user["is_active"],
        "role_name": user.get("role_name")
    }
    
    return TokenWithUser(
        access_token=access_token, 
        token_type="bearer",
        user=user_info
    )


@auth_router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: Annotated[dict, Depends(get_current_active_user)],
):
    """Obtener información del usuario actual"""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"],
        role_id=current_user["role_id"],
        role_name=current_user.get("role_name"),
        permissions=current_user.get("permissions", {"facturar": False, "verVentas": False})
    )

