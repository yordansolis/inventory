import os
import sys
import pymysql
from dotenv import load_dotenv

# Agregar el directorio del proyecto al path para poder importar los módulos
sys.path.append('.')

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

def create_database_if_not_exists():
    """
    Crear la base de datos si no existe
    """
    try:
        # Conectar sin especificar la base de datos
        temp_config = DATABASE_CONFIG.copy()
        database_name = temp_config.pop('database')
        
        connection = pymysql.connect(**temp_config)
        cursor = connection.cursor()
        
        # Crear la base de datos si no existe
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name}")
        print(f"Base de datos '{database_name}' verificada/creada exitosamente")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error creando la base de datos: {e}")

def execute_query(query, params=None):
    """
    Ejecutar una consulta SQL
    """
    connection = get_db_connection()
    if not connection:
        print("No se pudo establecer conexión con la base de datos")
        return None
    
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        connection.commit()
        return True
    except Exception as e:
        print(f"Error ejecutando consulta: {e}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        connection.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def repair_database():
    """
    Reparar todas las tablas de la base de datos
    """
    # Crear la base de datos si no existe
    create_database_if_not_exists()
    
    # Crear las tablas
    # Tabla de roles
    roles_table = """
    CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    
    # Tabla de usuarios 
    users_table = """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        role_id INT DEFAULT 2,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
    )
    """
    
    # Tabla de categorías
    categories_table = """
    CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_categoria VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """
    
    # Tabla de productos
    products_table = """
    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_producto VARCHAR(200) NOT NULL,
        variante VARCHAR(50),
        precio_cop DECIMAL(10, 2) NOT NULL,
        categoria_id INT,
        user_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    """
    
    # Tabla de proveedores
    suppliers_table = """
    CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """
    
    # Tabla de insumos
    insumos_table = """ 
    CREATE TABLE IF NOT EXISTS insumos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_insumo VARCHAR(100) UNIQUE NOT NULL,
        unidad VARCHAR(20) NOT NULL,
        cantidad_unitaria DECIMAL(10,2) NOT NULL,
        precio_presentacion DECIMAL(10,2) NOT NULL,
        valor_unitario DECIMAL(10,2) AS (precio_presentacion / cantidad_unitaria) STORED,
        cantidad_utilizada DECIMAL(10,2) DEFAULT 0,
        valor_total DECIMAL(10,2) AS (valor_unitario * cantidad_utilizada) STORED,
        stock_minimo DECIMAL(10,2) DEFAULT 0,
        sitio_referencia VARCHAR(255),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    # Tabla de recetas de productos
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

    # Tabla de ventas
    sales_table = """
    CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    )
    """

    # Tabla de detalles de ventas
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
    
    # Tabla de compras/suministros
    purchases_table = """
    CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT,
        total_amount DECIMAL(12, 2) NOT NULL,
        purchase_date DATE NOT NULL,
        status ENUM('PENDING', 'RECEIVED', 'CANCELLED') DEFAULT 'PENDING',
        notes TEXT,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    """
    
    tables = [
        roles_table,
        users_table,
        categories_table,
        suppliers_table,
        products_table,
        insumos_table,
        recipe_table,
        sales_table,
        sale_details_table,
        purchases_table,
    ]
    
    # Crear las tablas
    for table_query in tables:
        print(f"Ejecutando: {table_query[:50]}...")
        if execute_query(table_query):
            print("Tabla creada/verificada exitosamente")
        else:
            print("Error al crear/verificar la tabla")
    
    print("Proceso de reparación de la base de datos completado")

if __name__ == "__main__":
    repair_database() 