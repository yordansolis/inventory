"use client";

import React from "react";

import FacturacionSection from "../../../../components/FacturacionSection";

export default function InventoryDashboard() {

  // Datos de ejemplo basados en tu estructura
  const productosVendibles = [
    {
      id: 1,
      nombre: "BOLA DE HELADO DE VAINILLA",
      tipo: "HELADO",
      precio: 1000,
      stock: 25,
      minimo: 10,
      estado: "bien",
    },
    { id: 2, nombre: "BOLA DE HELADO DE FRESA", tipo: "HELADO", precio: 1500, stock: 8, minimo: 5, estado: "bien" },
    { id: 3, nombre: "BOLA DE ESPUMA", tipo: "ESPUMA", precio: 5000, stock: 3, minimo: 10, estado: "bajo" },
    { id: 4, nombre: "MINI PANCAKES", tipo: "PANCAKES", precio: 1000, stock: 100, minimo: 10, estado: "bien" },
    { id: 5, nombre: "MINI DONAS X12", tipo: "DONAS", precio: 3000, stock: 300, minimo: 10, estado: "bien" },
    { id: 6, nombre: "MALTEADA DE VAINILLA", tipo: "MALTEADA", precio: 4000, stock: 15, minimo: 5, estado: "bien" },
    { id: 7, nombre: "WAFFLE TRADICIONAL", tipo: "WAFFLE", precio: 3500, stock: 20, minimo: 5, estado: "bien" },
  ];

  const productosConsumibles = [
    { id: 201, nombre: "VASOS X 16", cantidad: 50, minimo: 10, estado: "bien" },
    { id: 202, nombre: "VASOS X 6", cantidad: 100, minimo: 10, estado: "bien" },
    { id: 203, nombre: "PAQUETE DE SERVILLETAS X 50", cantidad: 6, minimo: 7, estado: "bajo" },
    { id: 204, nombre: "PAQUETES DE FRESAS", cantidad: 2, minimo: 5, estado: "bajo" },
  ];

  return (
    <>
      <FacturacionSection
        productosVendibles={productosVendibles}
        productosConsumibles={productosConsumibles}
      />
    </>
  );
}
