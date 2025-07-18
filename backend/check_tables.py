import os
import pymysql
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('app/.env.dev')

# Configuración de la base de datos
DATABASE_CONFIG = {
    'host': os.getenv('HOSTNAME', 'localhost'),
    'user': os.getenv('USERNAME', 'root'),
    'password': os.getenv('PASSWORD', 'root123'),
    'port': int(os.getenv('PORT', 3306)),
    'database': os.getenv('DATABASE_NAME', 'inventory'),
    'charset': 'utf8mb4',
    'autocommit': True
}

def get_db_connection():
    """
    Crear y retornar una conexión a la base de datos MySQL
    """
    try:
        connection = pymysql.connect(**DATABASE_CONFIG)
        return connection
    except Exception as e:
        print(f"Error conectando a la base de datos: {e}")
        return None

def check_tables():
    """
    Verificar si las tablas existen en la base de datos
    """
    connection = get_db_connection()
    if not connection:
        print("No se pudo establecer conexión con la base de datos")
        return
    
    cursor = connection.cursor()
    
    # Obtener el nombre de la base de datos
    cursor.execute("SELECT DATABASE()")
    database_name = cursor.fetchone()[0]
    print(f"Base de datos actual: {database_name}")
    
    # Listar todas las tablas
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    print("Tablas existentes:")
    for table in tables:
        print(f"- {table[0]}")
    
    # Verificar si la tabla products existe
    cursor.execute("SHOW TABLES LIKE 'products'")
    if cursor.fetchone():
        print("\nLa tabla 'products' existe")
        
        # Mostrar la estructura de la tabla
        cursor.execute("DESCRIBE products")
        columns = cursor.fetchall()
        print("\nEstructura de la tabla 'products':")
        for column in columns:
            print(f"- {column[0]} ({column[1]})")
    else:
        print("\nLa tabla 'products' NO existe")
    
    cursor.close()
    connection.close()

if __name__ == "__main__":
    check_tables() 