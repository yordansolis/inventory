from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional, List, Dict
from datetime import datetime, date
from database.db  import execute_query, get_db_connection
import pymysql

router_extracts = APIRouter()

class ExtractService:
    """Servicio para generar extractos de compras y ventas"""
    
    @staticmethod
    def get_monthly_purchase_extract(year: int, month: int) -> List[Dict]:
        """
        Obtiene un extracto detallado de compras por mes y año
        
        Args:
            year: Año del extracto
            month: Mes del extracto (1-12)
            
        Returns:
            Lista con todas las compras y sus detalles
        """
        try:
            query = """
            SELECT 
                p.invoice_number,
                p.invoice_date,
                p.invoice_time,
                CONCAT(p.client_name, ' (', p.client_phone, ')') AS cliente,
                u.username AS vendedor,
                pd.product_name,
                pd.product_variant,
                pd.quantity,
                pd.unit_price,
                pd.subtotal,
                p.subtotal_products,
                p.total_amount,
                p.payment_method,
                p.created_at
            FROM purchases p
            JOIN purchase_details pd ON p.id = pd.purchase_id
            LEFT JOIN users u ON p.seller_username = u.username
            WHERE YEAR(p.invoice_date) = %s
              AND MONTH(p.invoice_date) = %s
            ORDER BY p.invoice_date, p.invoice_time
            """
            
            results = execute_query(query, (year, month), fetch_all=True)
            
            # Formatear las fechas y horas para mejor legibilidad
            for row in results:
                if row['invoice_date']:
                    row['invoice_date'] = row['invoice_date'].strftime('%d/%m/%Y')
                if row['invoice_time']:
                    row['invoice_time'] = str(row['invoice_time'])
                if row['created_at']:
                    row['created_at'] = row['created_at'].strftime('%d/%m/%Y %H:%M:%S')
                
                # Asegurar que los valores numéricos sean float para JSON
                row['quantity'] = float(row['quantity'])
                row['unit_price'] = float(row['unit_price'])
                row['subtotal'] = float(row['subtotal'])
                row['subtotal_products'] = float(row['subtotal_products'])
                row['total_amount'] = float(row['total_amount'])
            
            return results
        except Exception as e:
            print(f"Error al obtener extracto mensual: {str(e)}")
            raise
    
    @staticmethod
    def get_daily_purchase_extract(target_date: date) -> List[Dict]:
        """
        Obtiene un extracto detallado de compras para una fecha específica
        
        Args:
            target_date: Fecha del extracto
            
        Returns:
            Lista con todas las compras y sus detalles para ese día
        """
        try:
            query = """
            SELECT 
                p.invoice_number,
                p.invoice_date,
                p.invoice_time,
                CONCAT(p.client_name, ' (', p.client_phone, ')') AS cliente,
                u.username AS vendedor,
                pd.product_name,
                pd.product_variant,
                pd.quantity,
                pd.unit_price,
                pd.subtotal,
                p.subtotal_products,
                p.total_amount,
                p.payment_method,
                p.created_at
            FROM purchases p
            JOIN purchase_details pd ON p.id = pd.purchase_id
            LEFT JOIN users u ON p.seller_username = u.username
            WHERE p.invoice_date = %s
            ORDER BY p.invoice_time
            """
            
            results = execute_query(query, (target_date,), fetch_all=True)
            
            # Formatear las fechas y horas para mejor legibilidad
            for row in results:
                if row['invoice_date']:
                    row['invoice_date'] = row['invoice_date'].strftime('%d/%m/%Y')
                if row['invoice_time']:
                    row['invoice_time'] = str(row['invoice_time'])
                if row['created_at']:
                    row['created_at'] = row['created_at'].strftime('%d/%m/%Y %H:%M:%S')
                
                # Asegurar que los valores numéricos sean float para JSON
                row['quantity'] = float(row['quantity'])
                row['unit_price'] = float(row['unit_price'])
                row['subtotal'] = float(row['subtotal'])
                row['subtotal_products'] = float(row['subtotal_products'])
                row['total_amount'] = float(row['total_amount'])
            
            return results
        except Exception as e:
            print(f"Error al obtener extracto diario: {str(e)}")
            raise
    
    @staticmethod
    def get_date_range_purchase_extract(start_date: date, end_date: date) -> List[Dict]:
        """
        Obtiene un extracto detallado de compras para un rango de fechas
        
        Args:
            start_date: Fecha inicial
            end_date: Fecha final
            
        Returns:
            Lista con todas las compras y sus detalles en ese rango
        """
        try:
            query = """
            SELECT 
                p.invoice_number,
                p.invoice_date,
                p.invoice_time,
                CONCAT(p.client_name, ' (', p.client_phone, ')') AS cliente,
                u.username AS vendedor,
                pd.product_name,
                pd.product_variant,
                pd.quantity,
                pd.unit_price,
                pd.subtotal,
                p.subtotal_products,
                p.total_amount,
                p.payment_method,
                p.created_at
            FROM purchases p
            JOIN purchase_details pd ON p.id = pd.purchase_id
            LEFT JOIN users u ON p.seller_username = u.username
            WHERE p.invoice_date BETWEEN %s AND %s
            ORDER BY p.invoice_date, p.invoice_time
            """
            
            results = execute_query(query, (start_date, end_date), fetch_all=True)
            
            # Formatear las fechas y horas para mejor legibilidad
            for row in results:
                if row['invoice_date']:
                    row['invoice_date'] = row['invoice_date'].strftime('%d/%m/%Y')
                if row['invoice_time']:
                    row['invoice_time'] = str(row['invoice_time'])
                if row['created_at']:
                    row['created_at'] = row['created_at'].strftime('%d/%m/%Y %H:%M:%S')
                
                # Asegurar que los valores numéricos sean float para JSON
                row['quantity'] = float(row['quantity'])
                row['unit_price'] = float(row['unit_price'])
                row['subtotal'] = float(row['subtotal'])
                row['subtotal_products'] = float(row['subtotal_products'])
                row['total_amount'] = float(row['total_amount'])
            
            return results
        except Exception as e:
            print(f"Error al obtener extracto por rango de fechas: {str(e)}")
            raise

# Endpoints para extractos
@router_extracts.get("/monthly/{year}/{month}")
async def get_monthly_extract(
    year: int = Path(..., description="Año del extracto"),
    month: int = Path(..., description="Mes del extracto (1-12)")
):
    """
    Obtiene un extracto detallado de compras por mes y año
    """
    try:
        if month < 1 or month > 12:
            raise HTTPException(
                status_code=400,
                detail="El mes debe estar entre 1 y 12"
            )
            
        extract_data = ExtractService.get_monthly_purchase_extract(year, month)
        
        # Obtener nombre del mes
        month_name = datetime(year, month, 1).strftime('%B').capitalize()
        
        return {
            "year": year,
            "month": month,
            "month_name": month_name,
            "total_records": len(extract_data),
            "data": extract_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el extracto mensual: {str(e)}"
        )

@router_extracts.get("/daily/{date}")
async def get_daily_extract(
    date: date = Path(..., description="Fecha del extracto (YYYY-MM-DD)")
):
    """
    Obtiene un extracto detallado de compras para una fecha específica
    """
    try:
        extract_data = ExtractService.get_daily_purchase_extract(date)
        
        return {
            "date": date.strftime('%d/%m/%Y'),
            "total_records": len(extract_data),
            "data": extract_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el extracto diario: {str(e)}"
        )

@router_extracts.get("/range")
async def get_date_range_extract(
    start_date: date = Query(..., description="Fecha inicial (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Fecha final (YYYY-MM-DD)")
):
    """
    Obtiene un extracto detallado de compras para un rango de fechas
    """
    try:
        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="La fecha inicial debe ser anterior o igual a la fecha final"
            )
            
        extract_data = ExtractService.get_date_range_purchase_extract(start_date, end_date)
        
        return {
            "start_date": start_date.strftime('%d/%m/%Y'),
            "end_date": end_date.strftime('%d/%m/%Y'),
            "total_records": len(extract_data),
            "data": extract_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el extracto por rango de fechas: {str(e)}"
        ) 