from app.database.db import execute_query

def update_insumos_table():
    """
    Añadir las nuevas columnas a la tabla insumos existente
    """
    try:
        # Verificar si las columnas ya existen
        check_columns_query = """
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'insumos' 
        AND COLUMN_NAME IN ('valor_unitario', 'valor_unitarioxunidad', 'sitio_referencia', 'cantidad_por_producto')
        """
        
        existing_columns = execute_query(check_columns_query, fetch_all=True) or []
        existing_column_names = [col['COLUMN_NAME'] for col in existing_columns]
        
        # Añadir columna valor_unitario si no existe
        if 'valor_unitario' not in existing_column_names:
            add_valor_unitario_query = """
            ALTER TABLE insumos
            ADD COLUMN valor_unitario DECIMAL(10,2) DEFAULT 0
            """
            execute_query(add_valor_unitario_query)
            print("Columna 'valor_unitario' añadida correctamente")
        else:
            print("La columna 'valor_unitario' ya existe")
        
        # Añadir columna valor_unitarioxunidad si no existe
        if 'valor_unitarioxunidad' not in existing_column_names:
            add_valor_unitarioxunidad_query = """
            ALTER TABLE insumos
            ADD COLUMN valor_unitarioxunidad DECIMAL(10,2) DEFAULT 0
            """
            execute_query(add_valor_unitarioxunidad_query)
            print("Columna 'valor_unitarioxunidad' añadida correctamente")
        else:
            print("La columna 'valor_unitarioxunidad' ya existe")
        
        # Añadir columna sitio_referencia si no existe
        if 'sitio_referencia' not in existing_column_names:
            add_sitio_referencia_query = """
            ALTER TABLE insumos
            ADD COLUMN sitio_referencia VARCHAR(255)
            """
            execute_query(add_sitio_referencia_query)
            print("Columna 'sitio_referencia' añadida correctamente")
        else:
            print("La columna 'sitio_referencia' ya existe")
            
        # Añadir columna cantidad_por_producto si no existe
        if 'cantidad_por_producto' not in existing_column_names:
            add_cantidad_por_producto_query = """
            ALTER TABLE insumos
            ADD COLUMN cantidad_por_producto DECIMAL(10,2) DEFAULT 0
            """
            execute_query(add_cantidad_por_producto_query)
            print("Columna 'cantidad_por_producto' añadida correctamente")
        else:
            print("La columna 'cantidad_por_producto' ya existe")
        
        print("Actualización de la tabla insumos completada")
        return True
    except Exception as e:
        print(f"Error actualizando la tabla insumos: {e}")
        return False

if __name__ == "__main__":
    update_insumos_table() 