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

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """
    Ejecutar una consulta SQL
    """
    connection = get_db_connection()
    if not connection:
        print("No se pudo establecer conexión con la base de datos")
        return None
    
    cursor = None
    try:
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        cursor.execute(query, params)
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = cursor.rowcount
            
        connection.commit()
        return result
        
    except Exception as e:
        print(f"Error ejecutando consulta: {e}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        connection.rollback()
        return None
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def fix_products_table():
    """
    Verificar y corregir la estructura de la tabla products
    """
    # Verificar si la tabla products existe
    check_table_query = "SHOW TABLES LIKE 'products'"
    table_exists = execute_query(check_table_query, fetch_one=True)
    
    if not table_exists:
        print("La tabla 'products' no existe, creándola...")
        create_products_table()
        return
    
    # Verificar la estructura de la tabla
    describe_query = "DESCRIBE products"
    columns = execute_query(describe_query, fetch_all=True)
    
    print("Estructura actual de la tabla 'products':")
    for column in columns:
        print(f"- {column['Field']} ({column['Type']})")
    
    # Verificar si las columnas necesarias existen
    column_names = [column['Field'] for column in columns]
    
    # Columnas que deben existir en la tabla
    required_columns = ['nombre_producto', 'price', 'category_id', 'variante', 'user_id', 'is_active']
    
    # Verificar si falta alguna columna
    missing_columns = [col for col in required_columns if col not in column_names]
    
    if missing_columns:
        print(f"Faltan las siguientes columnas: {missing_columns}")
        print("Recreando la tabla 'products'...")
        
        # Eliminar las tablas dependientes
        execute_query("DROP TABLE IF EXISTS product_recipes;")
        execute_query("DROP TABLE IF EXISTS sale_details;")
        
        # Eliminar la tabla products
        execute_query("DROP TABLE IF EXISTS products;")
        
        # Crear la tabla products con la estructura correcta
        create_products_table()
    else:
        print("La tabla 'products' tiene la estructura correcta")

def create_products_table():
    """
    Crear la tabla products con la estructura correcta
    """
    products_table = """
    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_producto VARCHAR(200) NOT NULL,
        variante VARCHAR(50),
        price DECIMAL(10, 2) NOT NULL,
        category_id INT,
        user_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    """
    
    result = execute_query(products_table)
    if result is not None:
        print("Tabla 'products' creada exitosamente")
        
        # Recrear las tablas dependientes
        recipe_table = """
        CREATE TABLE IF NOT EXISTS product_recipes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            insumo_id INT NOT NULL,
            cantidad DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT
        )
        """
        
        sale_details_table = """
        CREATE TABLE IF NOT EXISTS sale_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sale_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
        )
        """
        
        execute_query(recipe_table)
        execute_query(sale_details_table)
        print("Tablas dependientes creadas exitosamente")
    else:
        print("Error al crear la tabla 'products'")

if __name__ == "__main__":
    fix_products_table() 