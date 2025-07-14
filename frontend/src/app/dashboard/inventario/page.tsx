

"use client"
import React from 'react';
import {
  ShoppingCart,
  Package
} from 'lucide-react';
import { Card, Button } from '../../../../components/ui'; // Corrected import path

interface VendibleProduct {
  id: number;
  nombre: string;
  tipo: string;
  precio: number;
  stock: number;
  minimo: number;
  estado: string;
}

interface ConsumableProduct {
  id: number;
  nombre: string;
  cantidad: number;
  minimo: number;
  estado: string;
}

export default function InventoryDashboard() {

  // Datos de ejemplo basados en tu estructura
  const productosVendibles = [
    { id: 1, nombre: 'BOLA DE HELADO DE VAINILLA', tipo: 'HELADO', precio: 1000, stock: 25, minimo: 10, estado: 'bien' },
    { id: 2, nombre: 'BOLA DE HELADO DE FRESA', tipo: 'HELADO', precio: 1500, stock: 8, minimo: 5, estado: 'bien' },
    { id: 3, nombre: 'BOLA DE ESPUMA', tipo: 'ESPUMA', precio: 5000, stock: 3, minimo: 10, estado: 'bajo' },
    { id: 4, nombre: 'MINI PANCAKES', tipo: 'PANCAKES', precio: 1000, stock: 100, minimo: 10, estado: 'bien' },
    { id: 5, nombre: 'MINI DONAS X12', tipo: 'DONAS', precio: 3000, stock: 300, minimo: 10, estado: 'bien' },
  ];

  const productosConsumibles = [
    { id: 101, nombre: 'VASOS X 16', cantidad: 50, minimo: 10, estado: 'bien' },
    { id: 102, nombre: 'VASOS X 6', cantidad: 100, minimo: 10, estado: 'bien' },
    { id: 103, nombre: 'PAQUETE DE SERVILLETAS X 50', cantidad: 6, minimo: 7, estado: 'bajo' },
    { id: 104, nombre: 'PAQUETES DE FRESAS', cantidad: 2, minimo: 5, estado: 'bajo' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Organizar Inventario</h2>
      <div className="flex space-x-4">
        <Button variant="default" size="lg" className="min-w-[200px] py-4">
          <Package className="h-5 w-5 mr-2" />
          Productos No Consumibles
        </Button>
        <Button variant="default" size="lg" className="min-w-[200px] py-4">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Productos Consumibles
        </Button>
      </div>
    </div>
  );
}