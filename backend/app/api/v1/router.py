from fastapi import APIRouter
from .auth_service.register import register_router
from .auth_service.login import auth_router

router_user = APIRouter()

router_user.include_router(register_router, prefix="/register")
router_user.include_router(auth_router, prefix="/auth")