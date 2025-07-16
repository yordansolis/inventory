"use client"
import React from 'react';
import {
  ShoppingCart,
  Package,
  ArrowRight,
  Tag,
  Box,
  ScrollText
} from 'lucide-react';
import { Card, Button } from '../../../../components/ui';
import Link from 'next/link';

export default function InventoryDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Organizar Inventario
          </h1>
          <p className="text-lg text-gray-600">
            Gestiona tus productos de manera eficiente
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {/* Gestión de Categorías */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6 mx-auto group-hover:bg-slate-200 transition-colors">
                <Tag className="h-8 w-8 text-slate-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Gestión de Categorías
              </h3>
              
              <p className="text-gray-600 text-center mb-6 flex-grow">
                Organiza tus productos por categorías
              </p>
              
              <Link href="/dashboard/inventario/categorias" className="block mt-auto">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 group-hover:scale-105 flex items-center justify-center gap-2"
                >
                  Gestionar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Gestionar Insumos */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6 mx-auto group-hover:bg-slate-200 transition-colors">
                <ShoppingCart className="h-8 w-8 text-slate-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Gestionar Insumos
              </h3>
              
              <p className="text-gray-600 text-center mb-6 flex-grow">
                Suministros, materiales y artículos de uso único
              </p>
              
              <Link href="/dashboard/inventario/suministro" className="block mt-auto">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 group-hover:scale-105 flex items-center justify-center gap-2"
                >
                  Gestionar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Gestión de Productos */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6 mx-auto group-hover:bg-slate-200 transition-colors">
                <Box className="h-8 w-8 text-slate-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Gestión de Productos
              </h3>
              
              <p className="text-gray-600 text-center mb-6 flex-grow">
                Administra el catálogo de productos a la venta
              </p>
              
              <Link href="/dashboard/inventario/productos" className="block mt-auto">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 group-hover:scale-105 flex items-center justify-center gap-2"
                >
                  Gestionar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

        </div>

        {/* Stats Section (Optional) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white/60 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold text-slate-600 mb-2">234</div>
            <div className="text-sm text-gray-600">Total Productos</div>
          </div>
          <div className="text-center p-6 bg-white/60 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold text-slate-600 mb-2">89%</div>
            <div className="text-sm text-gray-600">En Stock</div>
          </div>
          <div className="text-center p-6 bg-white/60 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold text-slate-600 mb-2">12</div>
            <div className="text-sm text-gray-600">Bajo Stock</div>
          </div>
        </div>
      </div>
    </div>
  );
}