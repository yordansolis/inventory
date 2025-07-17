import os
import pymysql
from dotenv import load_dotenv

# Cargar variables de entorno desde .env.dev
load_dotenv('.env.dev')

# Configuración de la base de datos
DATABASE_CONFIG = {
    'host': os.getenv('HOSTNAME', 'localhost'),
    'user': os.getenv('DB_USERNAME', 'root'),
    'password': os.getenv('PASSWORD', ''),
    'port': int(os.getenv('PORT', 3306)),
    'database': os.getenv('DATABASE_NAME', 'inventory'),
    'charset': 'utf8mb4',
    'autocommit': True
}

def execute_query(connection, query):
    """
    Ejecutar una consulta SQL
    """
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(query)
        print(f"Consulta ejecutada con éxito: {query}")
        return True
    except Exception as e:
        print(f"Error ejecutando consulta: {e}")
        print(f"Query: {query}")
        return False
    finally:
        if cursor:
            cursor.close()

def update_insumos_table():
    """
    Añadir las nuevas columnas a la tabla insumos existente
    """
    try:
        # Conectar a la base de datos
        print("Conectando a la base de datos...")
        connection = pymysql.connect(**DATABASE_CONFIG)
        print("Conexión exitosa")
        
        # Añadir columna valor_unitario
        add_valor_unitario_query = """
        ALTER TABLE insumos
        ADD COLUMN valor_unitario DECIMAL(10,2) DEFAULT 0
        """
        
        try:
            execute_query(connection, add_valor_unitario_query)
            print("Columna 'valor_unitario' añadida correctamente")
        except Exception as e:
            print(f"Error al añadir columna 'valor_unitario': {e}")
        
        # Añadir columna valor_unitarioxunidad
        add_valor_unitarioxunidad_query = """
        ALTER TABLE insumos
        ADD COLUMN valor_unitarioxunidad DECIMAL(10,2) DEFAULT 0
        """
        
        try:
            execute_query(connection, add_valor_unitarioxunidad_query)
            print("Columna 'valor_unitarioxunidad' añadida correctamente")
        except Exception as e:
            print(f"Error al añadir columna 'valor_unitarioxunidad': {e}")
        
        # Añadir columna sitio_referencia
        add_sitio_referencia_query = """
        ALTER TABLE insumos
        ADD COLUMN sitio_referencia VARCHAR(255)
        """
        
        try:
            execute_query(connection, add_sitio_referencia_query)
            print("Columna 'sitio_referencia' añadida correctamente")
        except Exception as e:
            print(f"Error al añadir columna 'sitio_referencia': {e}")
        
        print("Actualización de la tabla insumos completada")
        
        # Cerrar conexión
        connection.close()
        print("Conexión cerrada")
        
        return True
    except Exception as e:
        print(f"Error general: {e}")
        return False

if __name__ == "__main__":
    update_insumos_table() 