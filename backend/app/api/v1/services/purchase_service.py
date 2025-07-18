from typing import Dict, List, Optional
from datetime import datetime, date, time, timedelta
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
            
            # PRIMERO: Validar disponibilidad de insumos para todos los productos
            if 'products' in purchase_data and purchase_data['products']:
                print(f"Validando disponibilidad de insumos para {len(purchase_data['products'])} productos...")
                validation_result = PurchaseService._validate_insumos_availability(
                    cursor, 
                    purchase_data['products']
                )
                
                if not validation_result['is_valid']:
                    error_messages = []
                    for error in validation_result['errors']:
                        error_messages.append(
                            f"Producto '{error['product_name']}': Falta {error['insumo_name']} "
                            f"(necesario: {error['required']:.2f} {error['unit']}, "
                            f"disponible: {error['available']:.2f} {error['unit']})"
                        )
                    
                    error_text = "No hay suficientes insumos para completar la venta:\n" + "\n".join(error_messages)
                    print(f"ERROR DE VALIDACIÓN: {error_text}")
                    raise ValueError(error_text)
            
            # Si la validación pasa, iniciar transacción
            print("Validación de insumos exitosa, iniciando transacción...")
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
    def _validate_insumos_availability(cursor, products: List[Dict]) -> Dict:
        """
        Valida que haya suficientes insumos disponibles para todos los productos
        
        Args:
            cursor: Cursor de la base de datos
            products: Lista de productos a vender
            
        Returns:
            Dict con 'is_valid' (bool) y 'errors' (lista de errores),
        """
        errors = []
        insumos_needed = {}  # Diccionario para acumular necesidades totales por insumo
        
        # Primero, calcular cuánto se necesita de cada insumo
        for product in products:
            db_product = None
            
            # Buscar el producto en la base de datos - Método 1: Búsqueda exacta
            if product.get('product_variant'):
                query = """
                SELECT id, nombre_producto, variante FROM products 
                WHERE nombre_producto = %s AND variante = %s AND is_active = TRUE
                """
                params = (product['product_name'], product['product_variant'])
                cursor.execute(query, params)
                db_product = cursor.fetchone()
            else:
                # Buscar sin variante
                query = """
                SELECT id, nombre_producto, variante FROM products 
                WHERE nombre_producto = %s AND (variante IS NULL OR variante = '') AND is_active = TRUE
                """
                params = (product['product_name'],)
                cursor.execute(query, params)
                db_product = cursor.fetchone()
            
            # Método 2: Si no encontró, intentar separar por " - " 
            if not db_product and ' - ' in product['product_name']:
                parts = product['product_name'].split(' - ', 1)
                if len(parts) == 2:
                    nombre_base = parts[0].strip()
                    variante_base = parts[1].strip()
                    
                    query = """
                    SELECT id, nombre_producto, variante FROM products 
                    WHERE nombre_producto = %s AND variante = %s AND is_active = TRUE
                    """
                    cursor.execute(query, (nombre_base, variante_base))
                    db_product = cursor.fetchone()
                    
                    if db_product:
                        print(f"Producto encontrado separando '{product['product_name']}' en '{nombre_base}' + '{variante_base}'")
            
            # Método 3: Búsqueda más flexible usando LIKE
            if not db_product:
                query = """
                SELECT id, nombre_producto, variante FROM products 
                WHERE CONCAT(nombre_producto, IFNULL(CONCAT(' - ', variante), '')) = %s AND is_active = TRUE
                """
                cursor.execute(query, (product['product_name'],))
                db_product = cursor.fetchone()
                
                if db_product:
                    print(f"Producto encontrado con búsqueda flexible: {db_product}")
            
            if not db_product:
                # Si no encuentra el producto después de todos los intentos, agregar error
                print(f"ERROR: No se encontró el producto '{product['product_name']}' con variante '{product.get('product_variant', 'NULL')}'")
                errors.append({
                    'product_name': product['product_name'],
                    'insumo_name': 'Producto no encontrado',
                    'unit': 'N/A',
                    'required': 0,
                    'available': 0
                })
                continue
                
            print(f"Producto encontrado: ID={db_product['id']}, nombre='{db_product['nombre_producto']}', variante='{db_product.get('variante', 'NULL')}')")
                
            # Obtener la receta del producto
            recipe_query = """
            SELECT pr.insumo_id, pr.cantidad, i.nombre_insumo, i.unidad,
                   i.cantidad_unitaria, i.cantidad_utilizada,
                   (i.cantidad_unitaria - i.cantidad_utilizada) as disponible
            FROM product_recipes pr
            JOIN insumos i ON pr.insumo_id = i.id
            WHERE pr.product_id = %s
            """
            cursor.execute(recipe_query, (db_product['id'],))
            recipe_items = cursor.fetchall()
            
            # Si el producto no tiene receta, no necesita insumos
            if not recipe_items:
                print(f"Advertencia: El producto '{product['product_name']}' no tiene receta definida")
                continue
                
            # Acumular necesidades por insumo
            for item in recipe_items:
                insumo_id = item['insumo_id']
                needed = float(item['cantidad']) * float(product['quantity'])
                disponible = float(item['disponible'])
                
                if insumo_id not in insumos_needed:
                    insumos_needed[insumo_id] = {
                        'nombre': item['nombre_insumo'],
                        'unidad': item['unidad'],
                        'disponible': disponible,
                        'necesario': 0,
                        'product_name': product['product_name']
                    }
                
                insumos_needed[insumo_id]['necesario'] += needed
        
        # Verificar si hay suficientes insumos
        for insumo_id, data in insumos_needed.items():
            if data['necesario'] > data['disponible']:
                errors.append({
                    'insumo_id': insumo_id,
                    'insumo_name': data['nombre'],
                    'unit': data['unidad'],
                    'required': data['necesario'],
                    'available': data['disponible'],
                    'product_name': data['product_name']
                })
        
        # Debug para verificar
        print(f"Validación de insumos: {'EXITOSA' if len(errors) == 0 else 'FALLIDA'}")
        if errors:
            print(f"Errores encontrados: {len(errors)}")
            for error in errors:
                print(f"- {error['product_name']}: Falta {error['insumo_name']} (necesario: {error['required']:.2f} {error['unit']}, disponible: {error['available']:.2f} {error['unit']})")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors
        }
    
    @staticmethod
    def _update_product_stock(cursor, product_name: str, variant: Optional[str], quantity: int):
        """
        Actualiza el stock del producto y los insumos después de una venta
        
        Args:
            cursor: Cursor de la base de datos
            product_name: Nombre del producto
            variant: Variante del producto (opcional)
            quantity: Cantidad vendida
        """
        product = None
        
        # Buscar el producto - Método 1: Búsqueda exacta
        if variant:
            query = """
            SELECT id, stock_quantity FROM products 
            WHERE nombre_producto = %s AND variante = %s AND is_active = TRUE
            """
            cursor.execute(query, (product_name, variant))
            product = cursor.fetchone()
        else:
            query = """
            SELECT id, stock_quantity FROM products 
            WHERE nombre_producto = %s AND (variante IS NULL OR variante = '') AND is_active = TRUE
            """
            cursor.execute(query, (product_name,))
            product = cursor.fetchone()
        
        # Método 2: Si no encontró, intentar separar por " - " 
        if not product and ' - ' in product_name:
            parts = product_name.split(' - ', 1)
            if len(parts) == 2:
                nombre_base = parts[0].strip()
                variante_base = parts[1].strip()
                
                query = """
                SELECT id, stock_quantity FROM products 
                WHERE nombre_producto = %s AND variante = %s AND is_active = TRUE
                """
                cursor.execute(query, (nombre_base, variante_base))
                product = cursor.fetchone()
        
        # Método 3: Búsqueda más flexible
        if not product:
            query = """
            SELECT id, stock_quantity FROM products 
            WHERE CONCAT(nombre_producto, IFNULL(CONCAT(' - ', variante), '')) = %s AND is_active = TRUE
            """
            cursor.execute(query, (product_name,))
            product = cursor.fetchone()
        
        if product:
            # Si el producto tiene stock_quantity = -1, es bajo demanda y no se actualiza
            if product['stock_quantity'] >= 0:
                # Actualizar stock del producto
                new_stock = max(0, product['stock_quantity'] - quantity)
                update_query = """
                UPDATE products SET stock_quantity = %s WHERE id = %s
                """
                cursor.execute(update_query, (new_stock, product['id']))
            
            # Actualizar los insumos según la receta del producto
            PurchaseService._update_insumos_from_recipe(cursor, product['id'], quantity)
    
    @staticmethod
    def _update_insumos_from_recipe(cursor, product_id: int, quantity_sold: int):
        """
        Actualiza la cantidad utilizada de insumos basado en la receta del producto vendido
        
        Args:
            cursor: Cursor de la base de datos
            product_id: ID del producto vendido
            quantity_sold: Cantidad vendida del producto
        """
        # Obtener la receta del producto
        recipe_query = """
        SELECT pr.insumo_id, pr.cantidad, i.nombre_insumo, i.cantidad_utilizada
        FROM product_recipes pr
        JOIN insumos i ON pr.insumo_id = i.id
        WHERE pr.product_id = %s
        """
        cursor.execute(recipe_query, (product_id,))
        recipe_items = cursor.fetchall()
        
        if recipe_items:
            print(f"Actualizando insumos para producto ID {product_id}, cantidad vendida: {quantity_sold}")
            
            # Actualizar la cantidad utilizada de cada insumo
            for item in recipe_items:
                insumo_id = item['insumo_id']
                cantidad_actual = float(item['cantidad_utilizada'])
                total_quantity_to_add = float(item['cantidad']) * float(quantity_sold)
                nueva_cantidad = cantidad_actual + total_quantity_to_add
                
                # Actualizar cantidad_utilizada del insumo
                update_insumo_query = """
                UPDATE insumos 
                SET cantidad_utilizada = %s
                WHERE id = %s
                """
                cursor.execute(update_insumo_query, (nueva_cantidad, insumo_id))
                
                print(f"Insumo '{item['nombre_insumo']}' (ID: {insumo_id}): "
                      f"Cantidad anterior: {cantidad_actual}, "
                      f"Incremento: +{total_quantity_to_add}, "
                      f"Nueva cantidad: {nueva_cantidad}")
                
                # Verificar que se actualizó correctamente
                verify_query = "SELECT cantidad_utilizada FROM insumos WHERE id = %s"
                cursor.execute(verify_query, (insumo_id,))
                verify_result = cursor.fetchone()
                if verify_result:
                    print(f"Verificación: Insumo {insumo_id} ahora tiene cantidad_utilizada = {verify_result['cantidad_utilizada']}")
        else:
            print(f"Advertencia: El producto ID {product_id} no tiene receta definida")
    
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
                product = None
                
                # Buscar el producto - Método 1: Búsqueda exacta
                if detail['product_variant']:
                    product_query = """
                    SELECT id, stock_quantity FROM products 
                    WHERE nombre_producto = %s AND variante = %s AND is_active = TRUE
                    """
                    cursor.execute(product_query, (detail['product_name'], detail['product_variant']))
                    product = cursor.fetchone()
                else:
                    product_query = """
                    SELECT id, stock_quantity FROM products 
                    WHERE nombre_producto = %s AND (variante IS NULL OR variante = '') AND is_active = TRUE
                    """
                    cursor.execute(product_query, (detail['product_name'],))
                    product = cursor.fetchone()
                
                # Método 2: Si no encontró, intentar separar por " - " 
                if not product and ' - ' in detail['product_name']:
                    parts = detail['product_name'].split(' - ', 1)
                    if len(parts) == 2:
                        nombre_base = parts[0].strip()
                        variante_base = parts[1].strip()
                        
                        product_query = """
                        SELECT id, stock_quantity FROM products 
                        WHERE nombre_producto = %s AND variante = %s AND is_active = TRUE
                        """
                        cursor.execute(product_query, (nombre_base, variante_base))
                        product = cursor.fetchone()
                
                # Método 3: Búsqueda más flexible
                if not product:
                    product_query = """
                    SELECT id, stock_quantity FROM products 
                    WHERE CONCAT(nombre_producto, IFNULL(CONCAT(' - ', variante), '')) = %s AND is_active = TRUE
                    """
                    cursor.execute(product_query, (detail['product_name'],))
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
    
    @staticmethod
    def get_inventory_status() -> Dict:
        """
        Obtiene el estado actual del inventario de insumos
        
        Returns:
            Dict con el estado de los insumos
        """
        # Query para obtener insumos con bajo stock
        low_stock_query = """
        SELECT 
            id,
            nombre_insumo,
            unidad,
            cantidad_unitaria,
            cantidad_utilizada,
            (cantidad_unitaria - cantidad_utilizada) as cantidad_disponible,
            stock_minimo,
            valor_unitario,
            valor_total,
            CASE 
                WHEN (cantidad_unitaria - cantidad_utilizada) <= stock_minimo THEN 'BAJO'
                WHEN (cantidad_unitaria - cantidad_utilizada) <= stock_minimo * 2 THEN 'MEDIO'
                ELSE 'NORMAL'
            END as estado_stock
        FROM insumos
        ORDER BY estado_stock ASC, cantidad_disponible ASC
        """
        
        insumos = execute_query(low_stock_query, fetch_all=True)
        
        # Calcular estadísticas
        total_insumos = len(insumos) if insumos else 0
        insumos_bajo_stock = sum(1 for i in insumos if i['estado_stock'] == 'BAJO') if insumos else 0
        valor_total_inventario = sum(i['valor_total'] for i in insumos) if insumos else 0
        
        return {
            'total_insumos': total_insumos,
            'insumos_bajo_stock': insumos_bajo_stock,
            'valor_total_inventario': float(valor_total_inventario),
            'insumos': insumos if insumos else []
        }
    
    @staticmethod
    def get_sales_by_product(start_date: date, end_date: date) -> List[Dict]:
        """
        Obtiene las ventas agrupadas por producto en un rango de fechas
        
        Args:
            start_date: Fecha inicial
            end_date: Fecha final
            
        Returns:
            Lista de productos con sus ventas
        """
        query = """
        SELECT 
            pd.product_name,
            pd.product_variant,
            COUNT(DISTINCT p.id) as numero_ventas,
            SUM(pd.quantity) as cantidad_total,
            SUM(pd.subtotal) as ingreso_total,
            AVG(pd.unit_price) as precio_promedio,
            MIN(p.invoice_date) as primera_venta,
            MAX(p.invoice_date) as ultima_venta
        FROM purchase_details pd
        JOIN purchases p ON pd.purchase_id = p.id
        WHERE p.invoice_date BETWEEN %s AND %s
        AND p.is_cancelled = FALSE
        GROUP BY pd.product_name, pd.product_variant
        ORDER BY ingreso_total DESC
        """
        
        return execute_query(query, (start_date, end_date), fetch_all=True) or []
    
    @staticmethod
    def get_insumos_consumption_report(start_date: date, end_date: date) -> List[Dict]:
        """
        Obtiene un reporte del consumo de insumos en un período
        
        Args:
            start_date: Fecha inicial
            end_date: Fecha final
            
        Returns:
            Lista de insumos con su consumo
        """
        # Esta query es más compleja porque necesitamos rastrear el consumo a través de las ventas
        query = """
        SELECT 
            i.id,
            i.nombre_insumo,
            i.unidad,
            i.cantidad_utilizada as cantidad_total_utilizada,
            i.valor_unitario,
            i.valor_total as valor_total_consumido,
            COUNT(DISTINCT p.id) as productos_que_lo_usan
        FROM insumos i
        LEFT JOIN product_recipes pr ON i.id = pr.insumo_id
        LEFT JOIN products p ON pr.product_id = p.id
        WHERE i.cantidad_utilizada > 0
        GROUP BY i.id
        ORDER BY i.valor_total DESC
        """
        
        return execute_query(query, fetch_all=True) or [] 