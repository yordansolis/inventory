import os
import pymysql
from dotenv import load_dotenv

# Cargar variables de entorno desde .env.dev
load_dotenv('.env.dev')

# Configuración de la base de datos
DATABASE_CONFIG = {
    'host': os.getenv('HOSTNAME'),
    'user': os.getenv('USERNAME'),
    'password': os.getenv('PASSWORD'),
    'port': int(os.getenv('PORT', 3306)),
    'database': os.getenv('DATABASE_NAME'),
    'charset': 'utf8mb4', # para que se guarden los cambios automaticamente
    'autocommit': True # para que se guarden los cambios automaticamente
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


def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """
    Ejecutar una consulta SQL
    """
    connection = get_db_connection()
    if not connection:
        return None
    
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
        connection.rollback()
        return None
    finally:
        cursor.close()
        connection.close()

def create_tables():
    """
    Crear las tablas necesarias para el sistema de inventario
    """
    
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
        nombre_categoria VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """
    
    # Tabla de productos
    products_table = """
    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_producto VARCHAR(200) NOT NULL,
        categoria VARCHAR(50),
        category_id INT,
        variante VARCHAR(50),
        price DECIMAL(10, 2) NOT NULL,
        id_categoria INT,   
        stock_quantity INT DEFAULT 0,
        min_stock INT DEFAULT 5,
        is_active BOOLEAN DEFAULT TRUE,
        user_id INT,  /* Usuario que creó el producto */
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    """
    
    # Tabla de proveedores
    insumos_table = """ 
            CREATE TABLE IF NOT EXISTS insumos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_insumo VARCHAR(100) NOT NULL,        
                unidad VARCHAR(20) NOT NULL,                -- Ej: gramos, litros, unidad
                cantidad_actual DECIMAL(10,2) DEFAULT 0,    -- Stock actual
                stock_minimo DECIMAL(10,2) DEFAULT 0,       -- Punto de reposición
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );"""

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
        user_id INT NOT NULL,  /* Usuario que realizó la venta */
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
    
    # Tabla de detalles de compras

    
    tables = [
        roles_table,
        users_table,
        categories_table,
        products_table,
        insumos_table,
        recipe_table,
        sales_table,
        sale_details_table,
        purchases_table,
    ]
    
    try:
        create_database_if_not_exists()
        
        for table_query in tables:
            execute_query(table_query)
        
        # Crear roles predeterminados si no existen
        create_default_roles()
        
        # Crear superusuario si no existe
        create_superuser()
            
        print("Todas las tablas han sido creadas exitosamente")
        return True
        
    except Exception as e:
        print(f"Error creando las tablas: {e}")
        return False

def create_default_roles():
    """
    Crear roles predeterminados en la base de datos
    """
    roles = [
        (1, "superuser", "Administrador con acceso total al sistema"),
        (2, "staff", "Usuario con acceso limitado al sistema"),
        (3, "viewer", "Usuario con acceso de solo lectura")
    ]
    
    for role_id, name, description in roles:
        # Verificar si el rol ya existe
        check_query = "SELECT id FROM roles WHERE id = %s"
        result = execute_query(check_query, (role_id,), fetch_one=True)
        
        if not result:
            # Crear el rol si no existe
            insert_query = """
            INSERT INTO roles (id, name, description)
            VALUES (%s, %s, %s)
            """
            execute_query(insert_query, (role_id, name, description))
            print(f"Rol '{name}' creado exitosamente")

def create_superuser():
    """
    Crear superusuario predeterminado si no existe
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Datos del superusuario
    username = "admin"
    email = "marian@example.com"
    password = "Admin123,"
    role_id = 1  # superuser
    
    # Verificar si el superusuario ya existe
    check_query = "SELECT id FROM users WHERE email = %s"
    result = execute_query(check_query, (email,), fetch_one=True)
    
    if not result:
        # Crear el superusuario si no existe
        hashed_password = pwd_context.hash(password)
        
        insert_query = """
        INSERT INTO users (username, email, hashed_password, role_id, is_active)
        VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(insert_query, (username, email, hashed_password, role_id, True))
        print(f"Superusuario '{username}' creado exitosamente")

# Inicializar la base de datos al importar el módulo
if __name__ == "__main__":
    create_tables()
