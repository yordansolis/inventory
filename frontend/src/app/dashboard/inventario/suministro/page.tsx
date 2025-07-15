'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react'; // Assuming this icon is relevant for statistics

export default function SuministroPage() {
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Suministro
      </h2>
      <p className="text-gray-600">
        Esta sección está en desarrollo...
      </p>
    </div>
  );
}
