#!/usr/bin/env python3
"""
Script de prueba para verificar la creación de productos y recetas
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from database.db import execute_query, execute_insert_and_get_id

def test_product_creation():
    print("=== PRUEBA DE CREACIÓN DE PRODUCTO ===")
    
    # 1. Verificar que existe una categoría
    print("\n1. Verificando categorías...")
    categories = execute_query("SELECT * FROM categories", fetch_all=True)
    if not categories:
        print("No hay categorías. Creando una...")
        cat_id = execute_insert_and_get_id(
            "INSERT INTO categories (nombre_categoria) VALUES (%s)",
            ("Helados",)
        )
        print(f"Categoría creada con ID: {cat_id}")
        category_id = cat_id
    else:
        category_id = categories[0]['id']
        print(f"Usando categoría existente: ID={category_id}, Nombre={categories[0]['nombre_categoria']}")
    
    # 2. Crear un producto de prueba
    print("\n2. Creando producto de prueba...")
    product_query = """
    INSERT INTO products (nombre_producto, price, category_id, user_id, variante, is_active, stock_quantity, min_stock)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    product_id = execute_insert_and_get_id(
        product_query,
        ("PRODUCTO_PRUEBA", 15000.0, category_id, 1, "MEDIANO", True, -1, 0)
    )
    
    print(f"Producto creado con ID: {product_id}")
    
    # 3. Verificar que el producto existe
    print("\n3. Verificando producto creado...")
    product = execute_query(
        "SELECT * FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    print(f"Producto encontrado: {product}")
    
    # 4. Verificar si hay insumos
    print("\n4. Verificando insumos...")
    insumos = execute_query("SELECT * FROM insumos LIMIT 5", fetch_all=True)
    if not insumos:
        print("No hay insumos. Creando algunos de prueba...")
        # Crear insumos de prueba
        insumo1_id = execute_insert_and_get_id(
            """INSERT INTO insumos (nombre_insumo, unidad, cantidad_unitaria, precio_presentacion, 
               cantidad_utilizada, stock_minimo, stock_actual) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            ("Leche", "litros", 1.0, 5000.0, 0.2, 5.0, 20.0)
        )
        insumo2_id = execute_insert_and_get_id(
            """INSERT INTO insumos (nombre_insumo, unidad, cantidad_unitaria, precio_presentacion,
               cantidad_utilizada, stock_minimo, stock_actual)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            ("Azúcar", "kg", 1.0, 3000.0, 0.1, 2.0, 10.0)
        )
        print(f"Insumos creados: ID={insumo1_id}, ID={insumo2_id}")
        insumos = [
            {"id": insumo1_id, "nombre_insumo": "Leche"},
            {"id": insumo2_id, "nombre_insumo": "Azúcar"}
        ]
    else:
        print(f"Encontrados {len(insumos)} insumos:")
        for insumo in insumos[:2]:
            print(f"  - ID={insumo['id']}, Nombre={insumo['nombre_insumo']}")
    
    # 5. Crear receta para el producto
    if len(insumos) >= 2 and product_id:
        print("\n5. Creando receta para el producto...")
        
        # Primero eliminar recetas existentes
        delete_result = execute_query(
            "DELETE FROM product_recipes WHERE product_id = %s",
            (product_id,)
        )
        print(f"Recetas anteriores eliminadas: {delete_result} filas")
        
        # Insertar ingredientes
        for i, insumo in enumerate(insumos[:2]):
            result = execute_query(
                "INSERT INTO product_recipes (product_id, insumo_id, cantidad) VALUES (%s, %s, %s)",
                (product_id, insumo['id'], 0.1 * (i + 1))
            )
            print(f"Ingrediente insertado: insumo_id={insumo['id']}, cantidad={0.1 * (i + 1)}, resultado={result}")
        
        # Verificar receta
        print("\n6. Verificando receta creada...")
        recipe = execute_query(
            """SELECT pr.*, i.nombre_insumo 
               FROM product_recipes pr 
               JOIN insumos i ON pr.insumo_id = i.id 
               WHERE pr.product_id = %s""",
            (product_id,),
            fetch_all=True
        )
        print(f"Receta encontrada con {len(recipe)} ingredientes:")
        for item in recipe:
            print(f"  - {item['nombre_insumo']}: {item['cantidad']} unidades")
    
    # 7. Limpiar datos de prueba
    print("\n7. Limpiando datos de prueba...")
    if product_id:
        # Primero eliminar recetas
        execute_query("DELETE FROM product_recipes WHERE product_id = %s", (product_id,))
        # Luego eliminar producto
        execute_query("DELETE FROM products WHERE id = %s", (product_id,))
        print("Datos de prueba eliminados")
    
    print("\n=== PRUEBA COMPLETADA ===")

if __name__ == "__main__":
    test_product_creation() 