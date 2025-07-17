-- Script para añadir las nuevas columnas a la tabla insumos

-- Añadir columna valor_unitario
ALTER TABLE insumos
ADD COLUMN IF NOT EXISTS valor_unitario DECIMAL(10,2) DEFAULT 0;

-- Añadir columna valor_unitarioxunidad
ALTER TABLE insumos
ADD COLUMN IF NOT EXISTS valor_unitarioxunidad DECIMAL(10,2) DEFAULT 0;

-- Añadir columna sitio_referencia
ALTER TABLE insumos
ADD COLUMN IF NOT EXISTS sitio_referencia VARCHAR(255); 