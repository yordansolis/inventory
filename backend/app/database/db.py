import os
import pymysql
from dotenv import load_dotenv

# Cargar variables de entorno desde .env.dev
load_dotenv('.env.dev')

# Configuración de la base de datos
DATABASE_CONFIG = {
    'host': os.getenv('HOSTNAME'),
    'user': os.getenv('DB_USERNAME', 'root'),  # Cambiado de USERNAME a DB_USERNAME
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
        
    except pymysql.err.OperationalError as e:
        error_code, error_message = e.args
        print(f"Error operacional en la base de datos: [{error_code}] {error_message}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        
        # Proporcionar mensajes más descriptivos para errores comunes
        if error_code == 1054:  # Unknown column
            print(f"Columna desconocida en la consulta. Verifique el nombre de la columna.")
        elif error_code == 1064:  # Syntax error
            print(f"Error de sintaxis en la consulta SQL.")
        elif error_code == 1146:  # Table doesn't exist
            print(f"La tabla no existe. Verifique el nombre de la tabla.")
        elif error_code == 2003:  # Can't connect to MySQL server
            print(f"No se puede conectar al servidor MySQL. Verifique que el servidor esté en ejecución.")
        elif error_code == 1045:  # Access denied
            print(f"Acceso denegado. Verifique las credenciales de la base de datos.")
            
        connection.rollback()
        return None
    except pymysql.err.IntegrityError as e:
        error_code, error_message = e.args
        print(f"Error de integridad en la base de datos: [{error_code}] {error_message}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        
        # Proporcionar mensajes más descriptivos para errores comunes
        if error_code == 1062:  # Duplicate entry
            print(f"Entrada duplicada. El valor ya existe en la base de datos.")
        elif error_code == 1452:  # Foreign key constraint fails
            print(f"Error de clave foránea. El valor referenciado no existe.")
        elif error_code == 1451:  # Cannot delete or update a parent row
            print(f"No se puede eliminar o actualizar un registro padre. Hay registros dependientes.")
            
        connection.rollback()
        return None
    except pymysql.err.DataError as e:
        error_code, error_message = e.args
        print(f"Error de datos en la base de datos: [{error_code}] {error_message}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        
        # Proporcionar mensajes más descriptivos para errores comunes
        if error_code == 1264:  # Out of range value
            print(f"Valor fuera de rango para la columna.")
        elif error_code == 1366:  # Incorrect string value
            print(f"Valor de cadena incorrecto para la columna.")
            
        connection.rollback()
        return None
    except Exception as e:
        print(f"Error ejecutando consulta: {type(e).__name__}: {e}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        connection.rollback()
        return None
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def execute_insert_and_get_id(query, params=None):
    """
    Ejecutar una consulta INSERT y devolver el ID del registro insertado
    """
    connection = get_db_connection()
    if not connection:
        print("No se pudo establecer conexión con la base de datos")
        return None
    
    cursor = None
    try:
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        cursor.execute(query, params)
        
        # Obtener el número de filas afectadas
        rows_affected = cursor.rowcount
        
        if rows_affected > 0:
            # Si se insertó al menos una fila, obtener el ID
            cursor.execute("SELECT LAST_INSERT_ID() as id")
            result = cursor.fetchone()
            connection.commit()
            return result['id'] if result and result['id'] else None
        else:
            # No se insertó ninguna fila
            connection.rollback()
            return None
            
    except pymysql.err.OperationalError as e:
        error_code, error_message = e.args
        print(f"Error operacional en la base de datos: [{error_code}] {error_message}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        connection.rollback()
        return None
    except pymysql.err.IntegrityError as e:
        error_code, error_message = e.args
        print(f"Error de integridad en la base de datos: [{error_code}] {error_message}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        connection.rollback()
        return None
    except Exception as e:
        print(f"Error ejecutando INSERT: {type(e).__name__}: {e}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        connection.rollback()
        return None
    finally:
        if cursor:
            cursor.close()
        if connection:
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
    
    # Tabla de permisos de usuarios
    user_permissions_table = """
    CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        facturar BOOLEAN DEFAULT FALSE,
        verVentas BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
        price DECIMAL(10, 2) NOT NULL,
        category_id INT,
        user_id INT,
        stock_quantity INT DEFAULT 0,
        min_stock INT DEFAULT 5,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
        cantidad_por_producto DECIMAL(10,2) DEFAULT 0,
        valor_total DECIMAL(10,2) AS (valor_unitario * cantidad_utilizada) STORED,
        stock_minimo DECIMAL(10,2) DEFAULT 0,
        sitio_referencia VARCHAR(255),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
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
        user_id INT,
        total_amount DECIMAL(10, 2) NOT NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
    
    # Tabla de compras/facturas
    purchases_table = """
    CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_date DATE NOT NULL,
        invoice_time TIME NOT NULL,
        client_name VARCHAR(100) NOT NULL,
        seller_username VARCHAR(50),
        client_phone VARCHAR(20),
        has_delivery BOOLEAN DEFAULT FALSE,
        delivery_address VARCHAR(255),
        delivery_person VARCHAR(100),
        delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
        subtotal_products DECIMAL(10, 2) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        amount_paid DECIMAL(10, 2) NOT NULL,
        change_returned DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_reference VARCHAR(100),
        is_cancelled BOOLEAN DEFAULT FALSE,
        cancellation_reason VARCHAR(255),
        cancelled_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_username) REFERENCES users(username) ON DELETE SET NULL
    )
    """
    
    # Tabla de detalles de compras
    purchase_details_table = """
    CREATE TABLE IF NOT EXISTS purchase_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_id INT NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        product_variant VARCHAR(100),
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
    )
    """
    
    # Tabla de programación de camisetas
    shirt_schedule_table = """
    CREATE TABLE IF NOT EXISTS shirt_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day VARCHAR(20) NOT NULL,
        day_name VARCHAR(20) NOT NULL,
        color VARCHAR(20) NOT NULL,
        color_name VARCHAR(50) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(100) NOT NULL,
        UNIQUE KEY unique_day (day)
    )
    """
    
    # Lista de tablas en orden de dependencia
    tables = [
        roles_table,
        users_table,
        user_permissions_table,
        categories_table,
        products_table,
        insumos_table,
        recipe_table,
        sales_table,
        sale_details_table,
        purchases_table,
        purchase_details_table,
        shirt_schedule_table  # Añadimos la tabla de camisetas al final
    ]
    
    try:
        # Primero asegurarnos de que la base de datos existe
        create_database_if_not_exists()
        
        # Eliminar las tablas en orden inverso para manejar las dependencias
        drop_tables = [
            "DROP TABLE IF EXISTS shirt_schedule;",  # Añadimos la tabla de camisetas
            "DROP TABLE IF EXISTS purchase_details;",
            "DROP TABLE IF EXISTS purchases;",
            "DROP TABLE IF EXISTS sale_details;",
            "DROP TABLE IF EXISTS product_recipes;",
            "DROP TABLE IF EXISTS sales;",
            "DROP TABLE IF EXISTS products;",
            "DROP TABLE IF EXISTS insumos;",
            "DROP TABLE IF EXISTS categories;",
            "DROP TABLE IF EXISTS user_permissions;",
            "DROP TABLE IF EXISTS users;",
            "DROP TABLE IF EXISTS roles;"
        ]
        
        # Comentamos la eliminación de tablas para evitar perder datos
        # for drop_query in drop_tables:
        #     execute_query(drop_query)
        #     print(f"Tabla eliminada: {drop_query}")
        
        # Crear las tablas en el orden correcto
        for table_query in tables:
            execute_query(table_query)
            print(f"Tabla creada: {table_query[:50]}...")
        
        # Crear roles predeterminados
        create_default_roles()
        
        # Crear superusuario
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
