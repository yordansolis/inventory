from typing import Dict, List, Optional
from datetime import datetime, date, time
from decimal import Decimal
from database.db  import execute_query, execute_insert_and_get_id, get_db_connection
import pymysql

class PurchaseService:
    """Servicio para gestionar las compras/facturas del sistema"""
    
    @staticmethod
    def create_purchase(purchase_data: Dict) -> Dict:
        """
        Crea una nueva compra/factura con todos sus detalles
        
        Args:
            purchase_data: Diccionario con todos los datos de la compra
            
        Returns:
            Dict con la información de la compra creada
        """
        connection = get_db_connection()
        if not connection:
            raise Exception("No se pudo establecer conexión con la base de datos")
        
        cursor = None
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            connection.begin()
            
            # Validar que el vendedor existe
            seller_query = "SELECT id FROM users WHERE username = %s"
            seller = execute_query(seller_query, (purchase_data['seller_username'],), fetch_one=True)
            if not seller:
                raise ValueError(f"El vendedor '{purchase_data['seller_username']}' no existe")
            
            # Insertar la compra principal
            purchase_query = """
            INSERT INTO purchases (
                invoice_number, invoice_date, invoice_time, client_name, 
                seller_username, client_phone, has_delivery, 
                delivery_address, delivery_person, delivery_fee,
                subtotal_products, total_amount, amount_paid, 
                change_returned, payment_method, payment_reference
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            """
            
            # Convertir fecha y hora si vienen como string
            invoice_date = purchase_data['invoice_date']
            if isinstance(invoice_date, str):
                invoice_date = datetime.strptime(invoice_date, '%d/%m/%Y').date()
            
            invoice_time = purchase_data['invoice_time']
            if isinstance(invoice_time, str):
                # Manejar formato con a.m./p.m.
                invoice_time = invoice_time.replace(' a. m.', ' AM').replace(' p. m.', ' PM')
                invoice_time = datetime.strptime(invoice_time, '%I:%M:%S %p').time()
            
            cursor.execute(purchase_query, (
                purchase_data['invoice_number'],
                invoice_date,
                invoice_time,
                purchase_data['client_name'],
                purchase_data['seller_username'],
                purchase_data.get('client_phone'),
                purchase_data.get('has_delivery', False),
                purchase_data.get('delivery_address'),
                purchase_data.get('delivery_person'),
                purchase_data.get('delivery_fee', 0),
                purchase_data['subtotal_products'],
                purchase_data['total_amount'],
                purchase_data['amount_paid'],
                purchase_data['change_returned'],
                purchase_data['payment_method'],
                purchase_data.get('payment_reference')
            ))
            
            purchase_id = cursor.lastrowid
            
            # Insertar los detalles de los productos
            if 'products' in purchase_data and purchase_data['products']:
                detail_query = """
                INSERT INTO purchase_details (
                    purchase_id, product_name, product_variant, 
                    quantity, unit_price, subtotal
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """
                
                for product in purchase_data['products']:
                    cursor.execute(detail_query, (
                        purchase_id,
                        product['product_name'],
                        product.get('product_variant'),
                        product['quantity'],
                        product['unit_price'],
                        product['subtotal']
                    ))
                    
                    # Actualizar el stock si el producto existe en la tabla products
                    PurchaseService._update_product_stock(
                        cursor, 
                        product['product_name'], 
                        product.get('product_variant'),
                        product['quantity']
                    )
            
            connection.commit()
            
            # Retornar la compra creada
            return {
                'purchase_id': purchase_id,
                'invoice_number': purchase_data['invoice_number'],
                'status': 'success',
                'message': 'Compra registrada exitosamente'
            }
            
        except Exception as e:
            if connection:
                connection.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    @staticmethod
    def _update_product_stock(cursor, product_name: str, variant: Optional[str], quantity: int):
        """
        Actualiza el stock del producto después de una venta
        
        Args:
            cursor: Cursor de la base de datos
            product_name: Nombre del producto
            variant: Variante del producto (opcional)
            quantity: Cantidad vendida
        """
        # Buscar el producto
        if variant:
            query = """
            SELECT id, stock_quantity FROM products 
            WHERE nombre_producto = %s AND variante = %s AND is_active = TRUE
            """
            params = (product_name, variant)
        else:
            query = """
            SELECT id, stock_quantity FROM products 
            WHERE nombre_producto = %s AND (variante IS NULL OR variante = '') AND is_active = TRUE
            """
            params = (product_name,)
        
        cursor.execute(query, params)
        product = cursor.fetchone()
        
        if product:
            # Actualizar stock
            new_stock = max(0, product['stock_quantity'] - quantity)
            update_query = """
            UPDATE products SET stock_quantity = %s WHERE id = %s
            """
            cursor.execute(update_query, (new_stock, product['id']))
    
    @staticmethod
    def get_purchase_by_invoice(invoice_number: str) -> Optional[Dict]:
        """
        Obtiene una compra por su número de factura
        
        Args:
            invoice_number: Número de factura
            
        Returns:
            Dict con la información de la compra o None si no existe
        """
        # Obtener datos principales de la compra
        purchase_query = """
        SELECT p.*, u.email as seller_email
        FROM purchases p
        JOIN users u ON p.seller_username = u.username
        WHERE p.invoice_number = %s
        """
        
        purchase = execute_query(purchase_query, (invoice_number,), fetch_one=True)
        
        if not purchase:
            return None
        
        # Obtener detalles de los productos
        details_query = """
        SELECT * FROM purchase_details
        WHERE purchase_id = %s
        ORDER BY id
        """
        
        details = execute_query(details_query, (purchase['id'],), fetch_all=True)
        
        # Formatear respuesta
        purchase_data = dict(purchase)
        purchase_data['products'] = details if details else []
        
        # Formatear fecha y hora
        if purchase_data['invoice_date']:
            purchase_data['invoice_date'] = purchase_data['invoice_date'].strftime('%d/%m/%Y')
        if purchase_data['invoice_time']:
            purchase_data['invoice_time'] = str(purchase_data['invoice_time'])
        
        return purchase_data
    
    @staticmethod
    def get_purchases_by_date_range(start_date: date, end_date: date) -> List[Dict]:
        """
        Obtiene todas las compras en un rango de fechas
        
        Args:
            start_date: Fecha inicial
            end_date: Fecha final
            
        Returns:
            Lista de compras
        """
        query = """
        SELECT p.*, u.email as seller_email,
               COUNT(pd.id) as total_items,
               SUM(pd.quantity) as total_quantity
        FROM purchases p
        JOIN users u ON p.seller_username = u.username
        LEFT JOIN purchase_details pd ON p.id = pd.purchase_id
        WHERE p.invoice_date BETWEEN %s AND %s
        GROUP BY p.id
        ORDER BY p.invoice_date DESC, p.invoice_time DESC
        """
        
        purchases = execute_query(query, (start_date, end_date), fetch_all=True)
        
        if not purchases:
            return []
        
        # Formatear fechas
        for purchase in purchases:
            if purchase['invoice_date']:
                purchase['invoice_date'] = purchase['invoice_date'].strftime('%d/%m/%Y')
            if purchase['invoice_time']:
                purchase['invoice_time'] = str(purchase['invoice_time'])
        
        return purchases
    
    @staticmethod
    def get_sales_summary(period: str = 'today') -> Dict:
        """
        Obtiene un resumen de ventas para el período especificado
        
        Args:
            period: 'today', 'week', 'month', 'year'
            
        Returns:
            Dict con el resumen de ventas
        """
        # Determinar fechas según el período
        end_date = date.today()
        
        if period == 'today':
            start_date = end_date
        elif period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date
        
        # Query para obtener resumen
        summary_query = """
        SELECT 
            COUNT(DISTINCT p.id) as total_purchases,
            COUNT(pd.id) as total_items_sold,
            SUM(pd.quantity) as total_quantity_sold,
            SUM(p.subtotal_products) as total_products_revenue,
            SUM(p.delivery_fee) as total_delivery_revenue,
            SUM(p.total_amount) as total_revenue,
            AVG(p.total_amount) as average_purchase_value,
            COUNT(DISTINCT p.client_name) as unique_clients,
            COUNT(DISTINCT CASE WHEN p.has_delivery THEN p.id END) as deliveries_count
        FROM purchases p
        LEFT JOIN purchase_details pd ON p.id = pd.purchase_id
        WHERE p.invoice_date BETWEEN %s AND %s
        """
        
        summary = execute_query(summary_query, (start_date, end_date), fetch_one=True)
        
        # Query para métodos de pago más usados
        payment_methods_query = """
        SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
        FROM purchases
        WHERE invoice_date BETWEEN %s AND %s
        GROUP BY payment_method
        ORDER BY count DESC
        """
        
        payment_methods = execute_query(payment_methods_query, (start_date, end_date), fetch_all=True)
        
        # Query para productos más vendidos
        top_products_query = """
        SELECT 
            pd.product_name,
            pd.product_variant,
            SUM(pd.quantity) as total_quantity,
            SUM(pd.subtotal) as total_revenue,
            COUNT(DISTINCT p.id) as times_sold
        FROM purchase_details pd
        JOIN purchases p ON pd.purchase_id = p.id
        WHERE p.invoice_date BETWEEN %s AND %s
        GROUP BY pd.product_name, pd.product_variant
        ORDER BY total_quantity DESC
        LIMIT 10
        """
        
        top_products = execute_query(top_products_query, (start_date, end_date), fetch_all=True)
        
        return {
            'period': period,
            'start_date': start_date.strftime('%d/%m/%Y'),
            'end_date': end_date.strftime('%d/%m/%Y'),
            'summary': summary if summary else {},
            'payment_methods': payment_methods if payment_methods else [],
            'top_products': top_products if top_products else []
        }
    
    @staticmethod
    def cancel_purchase(invoice_number: str, reason: str) -> Dict:
        """
        Cancela una compra y restaura el stock
        
        Args:
            invoice_number: Número de factura
            reason: Razón de la cancelación
            
        Returns:
            Dict con el resultado de la operación
        """
        connection = get_db_connection()
        if not connection:
            raise Exception("No se pudo establecer conexión con la base de datos")
        
        cursor = None
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            connection.begin()
            
            # Verificar que la compra existe
            purchase_query = "SELECT id FROM purchases WHERE invoice_number = %s"
            cursor.execute(purchase_query, (invoice_number,))
            purchase = cursor.fetchone()
            
            if not purchase:
                raise ValueError(f"No se encontró la factura {invoice_number}")
            
            # Obtener detalles de los productos para restaurar stock
            details_query = """
            SELECT * FROM purchase_details WHERE purchase_id = %s
            """
            cursor.execute(details_query, (purchase['id'],))
            details = cursor.fetchall()
            
            # Restaurar stock de productos
            for detail in details:
                # Buscar el producto
                product_query = """
                SELECT id, stock_quantity FROM products 
                WHERE nombre_producto = %s 
                AND ((%s IS NULL AND variante IS NULL) OR variante = %s)
                AND is_active = TRUE
                """
                cursor.execute(product_query, (
                    detail['product_name'], 
                    detail['product_variant'],
                    detail['product_variant']
                ))
                product = cursor.fetchone()
                
                if product:
                    # Restaurar stock
                    new_stock = product['stock_quantity'] + detail['quantity']
                    update_stock_query = """
                    UPDATE products SET stock_quantity = %s WHERE id = %s
                    """
                    cursor.execute(update_stock_query, (new_stock, product['id']))
            
            # Marcar la compra como cancelada
            cancel_query = """
            UPDATE purchases 
            SET is_cancelled = TRUE, 
                cancellation_reason = %s,
                cancelled_at = NOW()
            WHERE id = %s
            """
            cursor.execute(cancel_query, (reason, purchase['id']))
            
            connection.commit()
            
            return {
                'status': 'success',
                'message': f'Factura {invoice_number} cancelada exitosamente',
                'products_restored': len(details)
            }
            
        except Exception as e:
            if connection:
                connection.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Importar timedelta para el resumen de ventas
from datetime import timedelta 