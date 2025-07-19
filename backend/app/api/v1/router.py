from fastapi import APIRouter
from .auth_service.login import auth_router as router_login
from .auth_service.register import register_router as router_register
from .crud_users.router_users import router_crud_users as router_users
from .router_roles.router_roles import router_roles
from .services.service import router_services
from .services.domiciliary import router_domiciliary
from .services.additions import router_additions
from .services.dashboard_service import router_dashboard
from .services.statistics_service import router_statistics
from .services.extract_service import router_extracts as router_extract


router = APIRouter()



router.include_router(router_login, prefix="/auth")
router.include_router(router_register, prefix="/auth")
router.include_router(router_users, prefix="/users")
router.include_router(router_roles, prefix="/roles")
router.include_router(router_services, prefix="/services")
router.include_router(router_domiciliary, prefix="/services/domiciliary")
router.include_router(router_additions, prefix="/services/additions")
router.include_router(router_dashboard, prefix="/services/dashboard")
router.include_router(router_statistics, prefix="/services/statistics")
router.include_router(router_extract, prefix="/services/extracts")