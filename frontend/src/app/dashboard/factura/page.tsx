"use client";

import React, { useState, useEffect } from "react";
import FacturacionSection from "../../../../components/FacturacionSection";
import { getAuthHeaders } from "../../utils/auth";

// Define types for our data
interface ProductoVendible {
  id: number;
  nombre: string;
  tipo: string;
  precio: number;
  stock: number | string;
  stockCalculado?: number;
  minimo: number;
  estado: string;
  variante?: string;
}

interface ProductoConsumible {
  id: number;
  nombre: string;
  cantidad: number;
  minimo: number;
  estado: string;
  unidad: string;
}

export default function InventoryDashboard() {
  const [productosVendibles, setProductosVendibles] = useState<ProductoVendible[]>([]);
  const [productosConsumibles, setProductosConsumibles] = useState<ProductoConsumible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try different ports based on the README.md
        const possiblePorts = [8000, 8081, 8089, 8052];
        let stockData = null;
        let insumosData: any[] = [];
        let apiUrl = '';
        let stockResponse = null;
        let insumosResponse = null;
        let success = false;
        
        // First try the environment variable
        const envApiUrl = process.env.NEXT_PUBLIC_BACKEND;
        if (envApiUrl) {
          apiUrl = envApiUrl;
          const headers = getAuthHeaders();
          
          try {
            // Fetch stock data from the new endpoint
            stockResponse = await fetch(`${apiUrl}/api/v1/services/stock`, {
              method: 'GET',
              headers
            });
            
            if (stockResponse.ok) {
              const stockResult = await stockResponse.json();
              stockData = stockResult.productos || [];
              
              insumosResponse = await fetch(`${apiUrl}/api/v1/insumos`, {
                method: 'GET',
                headers
              });
              
              if (insumosResponse.ok) {
                insumosData = await insumosResponse.json();
                success = true;
              }
            }
          } catch (e) {
            // Silent catch
          }
        }
        
        // If env variable didn't work, try the different ports
        if (!success) {
          for (const port of possiblePorts) {
            apiUrl = `http://localhost:${port}`;
            
            const headers = getAuthHeaders();
            
            try {
              // Fetch stock data from the new endpoint
              stockResponse = await fetch(`${apiUrl}/api/v1/services/stock`, {
                method: 'GET',
                headers
              });
              
              if (stockResponse.ok) {
                const stockResult = await stockResponse.json();
                stockData = stockResult.productos || [];
                
                insumosResponse = await fetch(`${apiUrl}/api/v1/insumos`, {
                  method: 'GET',
                  headers
                });
                
                if (insumosResponse.ok) {
                  insumosData = await insumosResponse.json();
                  success = true;
                  break; // Found a working port
                }
              }
            } catch (e) {
              // Silent catch
            }
          }
        }
        
        if (!success) {
          throw new Error('No se pudo conectar a la API en ninguno de los puertos probados');
        }
        
        // Process stock data
        if (!stockData || stockData.length === 0) {
          setProductosVendibles([]);
        } else {
          // Transform stock data to match the expected format
          const formattedProducts = stockData.map((product: any) => ({
            id: product.producto_id,
            nombre: product.nombre_producto + (product.variante ? ` - ${product.variante}` : ''),
            tipo: product.categoria_nombre || "Sin categoría",
            precio: product.precio,
            stock: product.stock_disponible,
            stockCalculado: product.stock_disponible, // Nueva propiedad para mostrar el stock calculado
            minimo: 0,
            estado: product.stock_disponible === 0 ? "agotado" : 
                   (product.stock_disponible <= 5 ? "bajo" : "bien"),
            variante: product.variante || ""
          }));
          
          setProductosVendibles(formattedProducts);
        }
        
        // Process insumos data
        if (!insumosData || insumosData.length === 0) {
          setProductosConsumibles([]);
        } else {
          // Transform insumos data to match the expected format
          const formattedInsumos = insumosData.map((insumo: any) => ({
            id: insumo.id,
            nombre: insumo.nombre_insumo,
            cantidad: insumo.cantidad_unitaria || 0,
            minimo: insumo.stock_minimo || 0,
            estado: (insumo.cantidad_unitaria < insumo.stock_minimo) ? "bajo" : "bien",
            unidad: insumo.unidad
          }));
          
          setProductosConsumibles(formattedInsumos);
        }
        
        setLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error desconocido');
        setLoading(false);
        
        // No fallback data, just set empty arrays
        setProductosVendibles([]);
        setProductosConsumibles([]);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando datos...</div>;
  }

  return (
    <>
      {error && (
        <div className="text-red-500 p-4 mb-4 bg-red-50 rounded">
          Error: {error}
        </div>
      )}
      <FacturacionSection
        productosVendibles={productosVendibles}
        productosConsumibles={productosConsumibles}
      />
    </>
  );
}
