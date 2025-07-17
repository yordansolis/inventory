
from fastapi import APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import re, os
from typing import Optional, Dict
from schemas.schemas import UserResponse, UserCreate, UserResponseToken
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from database.db import execute_query

load_dotenv('.env.dev')


register_router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class Settings:
    ALGORITHM: str = str(os.getenv("ALGORITHM", ""))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

settings = Settings()


def validate_password_strength(password: str) -> bool:
    """Validar fortaleza de contraseña"""
    if len(password) < 8:
        return False
    
    # Al menos una mayúscula, una minúscula, un número y un carácter especial
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    
    return True


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def get_password_hash(password: str) -> str:
    """Generar hash de contraseña"""
    return pwd_context.hash(password)


def get_user(username: str) -> Optional[dict]:
    """Obtener usuario de la base de datos"""
    query = "SELECT * FROM users WHERE username = %s"
    user = execute_query(query, (username,), fetch_one=True)
    return user


def get_user_by_email(email: str) -> Optional[dict]:
    """Obtener usuario por email"""
    query = "SELECT * FROM users WHERE email = %s"
    user = execute_query(query, (email,), fetch_one=True)
    return user


def create_user_in_db(user: UserCreate, hashed_password: str) -> Optional[dict]:
    """Crear usuario en la base de datos"""
    query = """
    INSERT INTO users (username, email, hashed_password, is_active)
    VALUES (%s, %s, %s, %s)
    """
    
    result = execute_query(query, (user.username, user.email, hashed_password, True))
    
    if result:
        # Obtener el usuario recién creado
        return get_user(user.username)
    
    return None


# Endpoints
@register_router.post("/", response_model=UserResponseToken, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """Registrar nuevo usuario"""
    
    # Validar que el usuario no exista
    if get_user(user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Validar que el email no esté en uso
    if get_user_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validar fortaleza de contraseña
    if not validate_password_strength(user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres y contener mayúsculas, minúsculas, números y caracteres especiales."
        )
    
    # Crear hash de contraseña
    hashed_password = get_password_hash(user.password)
    
    # Crear usuario en la base de datos
    created_user = create_user_in_db(user, hashed_password)
    
    if not created_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

    # Crear el token automáticamente
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Preparar respuesta
    user_response = {
        "id": created_user["id"],
        "username": created_user["username"],
        "email": created_user["email"],
        "is_active": created_user["is_active"],
        "created_at": created_user["created_at"]
    }
    
    # Retornar usuario creado con token
    return UserResponseToken(
        user=UserResponse(**user_response),
        access_token=access_token,
        token_type="bearer"
    )