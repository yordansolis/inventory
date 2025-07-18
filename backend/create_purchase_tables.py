#!/usr/bin/env python3

from app.database.db import execute_query, create_database_if_not_exists

def create_purchase_tables():
    """
    Script para crear las tablas de compras
    """
    
    # Asegurarnos de que la base de datos existe
    create_database_if_not_exists()
    
    # Tabla de compras/facturas
    purchases_table = """
    CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_date DATE NOT NULL,
        invoice_time TIME NOT NULL,
        client_name VARCHAR(100) NOT NULL,
        seller_username VARCHAR(50) NOT NULL,
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
        FOREIGN KEY (seller_username) REFERENCES users(username) ON DELETE RESTRICT
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
    
    try:
        # Crear tabla de compras
        result = execute_query(purchases_table)
        print(f"Tabla 'purchases' creada exitosamente")
        
        # Crear tabla de detalles
        result = execute_query(purchase_details_table)
        print(f"Tabla 'purchase_details' creada exitosamente")
        
        print("\n✅ Todas las tablas de compras han sido creadas exitosamente")
        
    except Exception as e:
        print(f"❌ Error creando las tablas: {e}")

if __name__ == "__main__":
    create_purchase_tables() 