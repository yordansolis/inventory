# inventory

SELECT \* FROM inventory.insumos;

-- 🔁 ¿Y si quiero saber qué productos están por agotarse?
WITH stock_por_producto AS (
SELECT
p.id AS producto_id,
p.nombre_producto,
FLOOR(MIN(i.cantidad_unitaria / pr.cantidad)) AS stock_disponible,
p.min_stock
FROM products p
JOIN product_recipes pr ON p.id = pr.product_id
JOIN insumos i ON pr.insumo_id = i.id
GROUP BY p.id, p.nombre_producto
)
SELECT \*
FROM stock_por_producto
WHERE stock_disponible <= min_stock;

-- ✅ Consulta SQL para calcular stock disponible por producto
-- ✅ Stock disponible por producto (cuántas unidades se pueden hacer con los insumos disponibles).

SELECT
p.id AS producto_id,
p.nombre_producto,
FLOOR(MIN(i.cantidad_unitaria / pr.cantidad)) AS stock_disponible
FROM products p
JOIN product_recipes pr ON p.id = pr.product_id
JOIN insumos i ON pr.insumo_id = i.id
GROUP BY p.id, p.nombre_producto;

#

-- Ejemplo para el producto FRESAS:
-- Requiere:
-- 1 Sticke (hay 1000) → 1000 / 1 = 1000
-- 1 FRESAS CON CREMA (hay 50) → 50 / 1 = 50
-- 3 SAL LIMÓN (hay 1000) → 1000 / 3 ≈ 333
-- El mínimo de esos es 50 → Puedes producir 50 FRESAS CON HELADO.
