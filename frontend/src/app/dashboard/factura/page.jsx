"use client";

import React, { useState, useEffect } from "react";
import FacturacionSection from "../../../../components/FacturacionSection";
import { getAuthHeaders } from "../../utils/auth";

export default function InventoryDashboard() {
  const [productosVendibles, setProductosVendibles] = useState([]);
  const [productosConsumibles, setProductosConsumibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try different ports based on the README.md
        const possiblePorts = [8000, 8081, 8089, 8052];
        let productsData = [];
        let insumosData = [];
        let apiUrl = '';
        let productsResponse = null;
        let insumosResponse = null;
        let success = false;
        
        // First try the environment variable
        apiUrl = process.env.NEXT_PUBLIC_BACKEND;
        if (apiUrl) {
          console.log("Trying API URL from env:", apiUrl);
          const headers = getAuthHeaders();
          
          try {
            productsResponse = await fetch(`${apiUrl}/api/v1/products`, {
              method: 'GET',
              headers
            });
            
            if (productsResponse.ok) {
              productsData = await productsResponse.json();
              
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
            console.warn("Failed with env URL:", e);
          }
        }
        
        // If env variable didn't work, try the different ports
        if (!success) {
          for (const port of possiblePorts) {
            apiUrl = `http://localhost:${port}`;
            console.log(`Trying API URL: ${apiUrl}`);
            
            const headers = getAuthHeaders();
            
            try {
              productsResponse = await fetch(`${apiUrl}/api/v1/products`, {
                method: 'GET',
                headers
              });
              
              console.log(`Port ${port} products status:`, productsResponse.status);
              
              if (productsResponse.ok) {
                productsData = await productsResponse.json();
                
                insumosResponse = await fetch(`${apiUrl}/api/v1/insumos`, {
                  method: 'GET',
                  headers
                });
                
                console.log(`Port ${port} insumos status:`, insumosResponse.status);
                
                if (insumosResponse.ok) {
                  insumosData = await insumosResponse.json();
                  success = true;
                  break; // Found a working port
                }
              }
            } catch (e) {
              console.warn(`Failed with port ${port}:`, e);
            }
          }
        }
        
        if (!success) {
          throw new Error('No se pudo conectar a la API en ninguno de los puertos probados');
        }
        
        console.log("Products data:", productsData);
        console.log("Insumos data:", insumosData);
        
        // Use default data if the API returns an empty array
        if (!productsData || productsData.length === 0) {
          console.warn("No products found in API response, using default data");
          setProductosVendibles([
            {
              id: 1,
              nombre: "WAFFLE CON FRESAS",
              tipo: "WAFFLES",
              precio: 22000,
              stock: "Bajo demanda",
              minimo: 0,
              estado: "bien",
            },
            {
              id: 2,
              nombre: "BOLA DE HELADO DE VAINILLA",
              tipo: "HELADOS",
              precio: 5000,
              stock: "Bajo demanda",
              minimo: 0,
              estado: "bien",
            }
          ]);
        } else {
          // Transform products data to match the expected format
          const formattedProducts = productsData.map(product => ({
            id: product.id,
            nombre: product.nombre_producto,
            tipo: product.categoria_nombre || "Sin categoría",
            precio: product.price,
            stock: product.stock_quantity === -1 ? "Bajo demanda" : product.stock_quantity,
            minimo: product.min_stock || 0,
            estado: product.stock_quantity === -1 ? "bien" : 
                   (product.stock_quantity < product.min_stock ? "bajo" : "bien"),
            variante: product.variante || ""
          }));
          
          setProductosVendibles(formattedProducts);
        }
        
        // Use default data if the API returns an empty array
        if (!insumosData || insumosData.length === 0) {
          console.warn("No insumos found in API response, using default data");
          setProductosConsumibles([
            { id: 201, nombre: "FRESAS", cantidad: 1000, minimo: 100, estado: "bien", unidad: "gramos" },
            { id: 202, nombre: "HARINA", cantidad: 5000, minimo: 1000, estado: "bien", unidad: "gramos" }
          ]);
        } else {
          // Transform insumos data to match the expected format
          const formattedInsumos = insumosData.map(insumo => ({
            id: insumo.id,
            nombre: insumo.nombre_insumo,
            cantidad: insumo.cantidad_utilizada || 0,
            minimo: insumo.stock_minimo || 0,
            estado: (insumo.cantidad_utilizada < insumo.stock_minimo) ? "bajo" : "bien",
            unidad: insumo.unidad
          }));
          
          setProductosConsumibles(formattedInsumos);
        }
        
        setDebug({
          apiUrl,
          productsStatus: productsResponse?.status,
          insumosStatus: insumosResponse?.status,
          productCount: productsData?.length || 0,
          insumoCount: insumosData?.length || 0
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
        setLoading(false);
        
        // Provide fallback data in case of error
        setProductosVendibles([
          {
            id: 1,
            nombre: "WAFFLE CON FRESAS (FALLBACK)",
            tipo: "WAFFLES",
            precio: 22000,
            stock: "Bajo demanda",
            minimo: 0,
            estado: "bien",
          }
        ]);
        
        setProductosConsumibles([
          { id: 201, nombre: "FRESAS (FALLBACK)", cantidad: 1000, minimo: 100, estado: "bien", unidad: "gramos" }
        ]);
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
          <pre className="text-xs mt-2 overflow-auto max-h-40">Debug: {JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}
      <FacturacionSection
        productosVendibles={productosVendibles}
        productosConsumibles={productosConsumibles}
      />
    </>
  );
}
