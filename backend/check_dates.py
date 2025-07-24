import sys
import os

# Añadir el directorio actual al path para poder importar los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.db import get_db_connection

def check_dates():
    try:
        conn = get_db_connection()
        if not conn:
            print("No se pudo conectar a la base de datos")
            return
        
        cursor = conn.cursor()
        
        # Ver las fechas en la tabla
        cursor.execute("SELECT invoice_date FROM purchases LIMIT 10")
        results = cursor.fetchall()
        print("Primeras 10 fechas en la tabla purchases:")
        for row in results:
            print(row)
        
        # Contar registros con fecha vacía
        cursor.execute("SELECT COUNT(*) FROM purchases WHERE invoice_date = '' OR invoice_date IS NULL")
        empty_count = cursor.fetchone()
        print(f"Registros con fecha vacía: {empty_count}")
        
        # Contar registros totales
        cursor.execute("SELECT COUNT(*) FROM purchases")
        total_count = cursor.fetchone()
        print(f"Total de registros: {total_count}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_dates() 