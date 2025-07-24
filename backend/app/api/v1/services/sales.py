from fastapi import  HTTPException, Depends, status, APIRouter
from typing import List, Dict, Any, Optional
from models.sales_service import SalesService
from api.v1.auth_service.login import get_current_active_user




# Router para ventas
router_sales = APIRouter()

@router_sales.post("/", status_code=status.HTTP_201_CREATED)
async def create_sale(
    items: List[Dict[str, Any]],
    payment_method: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Crear una nueva venta"""
    sale_id = SalesService.create_complete_sale(
        user_id=current_user["id"],
        items=items,
        payment_method=payment_method,
        notes=notes
    )
    
    if not sale_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la venta"
        )
    
    return {"id": sale_id, "message": "Venta creada exitosamente"}

@router_sales.get("/{sale_id}")
async def get_sale(sale_id: int):
    """Obtener una venta por su ID"""
    sale = SalesService.get_sale_by_id(sale_id)
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con ID {sale_id} no encontrada"
        )
    
    return sale

@router_sales.get("/")
async def get_sales_by_user(
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_active_user)
):
    """Obtener ventas realizadas por el usuario actual"""
    sales = SalesService.get_sales_by_user(
        user_id=current_user["id"],
        limit=limit,
        offset=offset
    )
    
    return sales
