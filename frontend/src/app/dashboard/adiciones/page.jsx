"use client"
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, AlertCircle, Package, DollarSign, Home, BarChart3, Truck, TestTube, ShoppingCart, AlertTriangle, Eye } from 'lucide-react';
import { Card, Badge, Button } from '../../../../components/ui'; // Adjust path as needed
import FacturacionSection from "../../../../components/FacturacionSection";

const AdicionesManager = () => {
  const [adiciones, setAdiciones] = useState([
    { id: 101, nombre: "CREMA CHANTILLY", tipo: "TOPPING", precio: 500, stock: 50, minimo: 10, estado: "bien" },
    { id: 102, nombre: "AREQUIPE", tipo: "TOPPING", precio: 800, stock: 30, minimo: 5, estado: "bien" },
    { id: 103, nombre: "CHISPAS DE CHOCOLATE", tipo: "TOPPING", precio: 300, stock: 100, minimo: 20, estado: "bien" },
    { id: 104, nombre: "FRESAS NATURALES", tipo: "FRUTA", precio: 1000, stock: 15, minimo: 5, estado: "bien" },
    { id: 105, nombre: "BANANO", tipo: "FRUTA", precio: 700, stock: 25, minimo: 10, estado: "bien" },
    { id: 106, nombre: "SALSA DE CHOCOLATE", tipo: "SALSA", precio: 600, stock: 40, minimo: 10, estado: "bien" },
    { id: 107, nombre: "SALSA DE FRESA", tipo: "SALSA", precio: 600, stock: 35, minimo: 10, estado: "bien" },
    { id: 108, nombre: "GRANOLA", tipo: "CEREAL", precio: 400, stock: 60, minimo: 15, estado: "bien" },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', tipo: 'TOPPING', precio: 0, stock: 0, minimo: 0, estado: 'bien'
  });

  const [activeSection, setActiveSection] = useState("adicciones"); // Set initial active section to 'adicciones'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tipos = ['TOPPING', 'FRUTA', 'SALSA', 'CEREAL'];
  const estados = ['bien', 'bajo', 'agotado'];

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "facturar", label: "Facturar", icon: DollarSign },
    { id: "inventario", label: "Inventario", icon: Package },
    { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
    { id: "domicilios", label: "Domicilios", icon: Truck },
    { id: "ingredientes", label: "Ingredientes", icon: TestTube },
    { id: "adicciones", label: "Adiciones", icon: Plus },
  ];

  const handleEdit = (adicion) => {
    setEditingId(adicion.id);
    setFormData({ ...adicion });
  };

  const handleSave = () => {
    if (editingId) {
      setAdiciones(prev => prev.map(item => 
        item.id === editingId ? { ...formData, id: editingId } : item
      ));
      setEditingId(null);
    } else {
      const newId = Math.max(...adiciones.map(a => a.id)) + 1;
      setAdiciones(prev => [...prev, { ...formData, id: newId }]);
      setShowAddForm(false);
    }
    setFormData({ nombre: '', tipo: 'TOPPING', precio: 0, stock: 0, minimo: 0, estado: 'bien' });
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta adición?')) {
      setAdiciones(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ nombre: '', tipo: 'TOPPING', precio: 0, stock: 0, minimo: 0, estado: 'bien' });
  };

  const getStatusClass = (stock, minimo) => {
    if (stock === 0) return 'status-danger';
    if (stock <= minimo) return 'status-warning';
    return 'status-success';
  };

  const getStatusText = (stock, minimo) => {
    if (stock === 0) return 'Agotado';
    if (stock <= minimo) return 'Stock Bajo';
    return 'Disponible';
  };

  // Dummy data for other sections - will be replaced by actual components
  const productosVendibles = [
    { id: 1, nombre: "Helado de Vainilla", estado: "bien", stock: 20 },
    { id: 2, nombre: "Barquillo", estado: "bajo", stock: 5 },
  ];
  const productosConsumibles = [
    { id: 10, nombre: "Azúcar", estado: "bien", stock: 50, quantity: 50, minimo: 10 },
    { id: 11, nombre: "Leche", estado: "bajo", stock: 3, quantity: 3, minimo: 5 },
  ];
  const ventasRecientes = [
    { id: 1, cliente: "Juan Pérez", producto: "Helado Grande", total: 15000, domicilio: true, vendedor: "Ana G." },
    { id: 2, cliente: "María López", producto: "Malteada Pequeña", total: 8000, domicilio: false, vendedor: "Luis P." },
  ];

  const formatPrice = (price) => {
    return price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      background: '#fafafa',
      color: '#171717',
      lineHeight: '1.6',
      minHeight: '100vh'
    },
    header: {
      marginBottom: '48px',
      textAlign: 'center'
    },
    headerTitle: {
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#000',
      marginBottom: '8px',
      letterSpacing: '-0.025em'
    },
    headerSubtitle: {
      fontSize: '1.125rem',
      color: '#666',
      fontWeight: '400'
    },
    section: {
      marginBottom: '64px'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#000',
      marginBottom: '24px',
      letterSpacing: '-0.025em'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    },
    metricCard: {
      background: '#fff',
      border: '1px solid #e5e5e5',
      borderRadius: '8px',
      padding: '24px',
      transition: 'border-color 0.2s ease',
      cursor: 'pointer'
    },
    metricValue: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#000',
      marginBottom: '4px',
      letterSpacing: '-0.025em'
    },
    metricLabel: {
      fontSize: '0.875rem',
      color: '#666',
      fontWeight: '400'
    },
    button: {
      background: '#000',
      color: '#fff',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    buttonSecondary: {
      background: '#fff',
      color: '#000',
      border: '1px solid #e5e5e5',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'border-color 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    buttonDanger: {
      background: '#dc2626',
      color: '#fff',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    formContainer: {
      background: '#fff',
      border: '1px solid #e5e5e5',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '32px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '16px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #e5e5e5',
      borderRadius: '8px',
      fontSize: '0.875rem',
      background: '#fff',
      color: '#171717',
      outline: 'none',
      transition: 'border-color 0.2s ease'
    },
    tableContainer: {
      background: '#fff',
      border: '1px solid #e5e5e5',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '32px',
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      background: '#fafafa',
      padding: '16px',
      textAlign: 'left',
      fontWeight: '500',
      color: '#666',
      borderBottom: '1px solid #e5e5e5',
      fontSize: '0.875rem'
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #f5f5f5',
      color: '#171717',
      fontSize: '0.875rem'
    },
    status: {
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.025em'
    },
    statusSuccess: {
      background: '#f0f9ff',
      color: '#0284c7',
      border: '1px solid #bae6fd'
    },
    statusWarning: {
      background: '#fffbeb',
      color: '#d97706',
      border: '1px solid #fed7aa'
    },
    statusDanger: {
      background: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    },
    price: {
      fontWeight: '600',
      color: '#000',
      fontVariantNumeric: 'tabular-nums'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px'
    },
    iconButton: {
      background: 'none',
      border: '1px solid #e5e5e5',
      padding: '8px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'border-color 0.2s ease, background 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  return (
    <div className="flex relative">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}
      >
        <div className="py-6">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "bg-gray-100 text-gray-900 border-r-2 border-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <IconComponent className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        {activeSection === "dashboard" && (
          <div>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600">Resumen general de tu negocio</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Productos Vendibles
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {productosVendibles.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Stock Bajo
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {
                        [
                          ...productosVendibles,
                          ...productosConsumibles,
                        ].filter((p) => p.estado === "bajo").length
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Domicilios
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {ventasRecientes.filter((v) => v.domicilio).length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Truck className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Ventas Recientes
                </h2>
                <Button size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver todas
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domicilio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendedor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ventasRecientes.map((venta) => (
                      <tr key={venta.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{venta.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {venta.cliente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {venta.producto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatPrice(venta.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {venta.domicilio ? (
                            <Badge variant="info">Sí</Badge>
                          ) : (
                            <Badge variant="default">No</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {venta.vendedor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Alertas de Stock Bajo
                </h2>
                <Badge variant="danger" size="lg">
                  {
                    [
                      ...productosVendibles,
                      ...productosConsumibles,
                    ].filter((p) => p.estado === "bajo").length
                  }{" "}
                  productos
                </Badge>
              </div>
              <div className="space-y-3">
                {[...productosVendibles, ...productosConsumibles]
                  .filter((p) => p.estado === "bajo")
                  .map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {producto.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          Stock: {producto.stock || producto.quantity} | Mínimo:{" "}
                          {producto.minimo}
                        </p>
                      </div>
                      <Button variant="danger" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Reabastecer
                      </Button>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {activeSection === "facturar" && <FacturacionSection />}

        {activeSection === "adicciones" && (
          <div style={styles.container}> {/* The existing AdicionesManager content */}
            {/* Header */}
            <div style={styles.header}>
              <h1 style={styles.headerTitle}>Gestión de Adiciones</h1>
              <p style={styles.headerSubtitle}>Administra los ingredientes y toppings disponibles</p>
            </div>

            {/* Metrics */}
            <div style={styles.section}>
              <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                  <div style={styles.metricValue}>{adiciones.length}</div>
                  <div style={styles.metricLabel}>Total Adiciones</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricValue}>
                    {adiciones.filter(a => a.stock <= a.minimo && a.stock > 0).length}
                  </div>
                  <div style={styles.metricLabel}>Stock Bajo</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricValue}>
                    ${adiciones.reduce((sum, a) => sum + (a.precio * a.stock), 0).toLocaleString('es-CO')}
                  </div>
                  <div style={styles.metricLabel}>Valor Total Stock</div>
                </div>
              </div>
            </div>

            {/* Add Button */}
            <div style={{ marginBottom: '32px' }}>
              <button
                style={styles.button}
                onClick={() => setShowAddForm(true)}
                onMouseEnter={(e) => e.target.style.background = '#333'}
                onMouseLeave={(e) => e.target.style.background = '#000'}
              >
                <Plus size={16} />
                Agregar Nueva Adición
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div style={styles.formContainer}>
                <h3 style={styles.sectionTitle}>Nueva Adición</h3>
                <div style={styles.formGrid}>
                  <div>
                    <label htmlFor="nombre" style={{ ...styles.metricLabel, marginBottom: '4px', display: 'block' }}>Nombre</label>
                    <input
                      style={styles.input}
                      id="nombre"
                      type="text"
                      placeholder="Nombre de la adición"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="tipo" style={{ ...styles.metricLabel, marginBottom: '4px', display: 'block' }}>Tipo</label>
                    <select
                      style={styles.input}
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    >
                      {tipos.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="precio" style={{ ...styles.metricLabel, marginBottom: '4px', display: 'block' }}>Precio</label>
                    <input
                      style={styles.input}
                      id="precio"
                      type="text" // Changed to text to allow decimal input easily
                      placeholder="Precio (ej. 1500.50)"
                      value={formData.precio === 0 ? '' : formData.precio}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) { // Allows empty string or valid decimal number
                          setFormData({...formData, precio: parseFloat(value) || 0});
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="stock" style={{ ...styles.metricLabel, marginBottom: '4px', display: 'block' }}>Stock</label>
                    <input
                      style={styles.input}
                      id="stock"
                      type="number"
                      placeholder="Cantidad en stock"
                      value={formData.stock === 0 ? '' : formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label htmlFor="minimo" style={{ ...styles.metricLabel, marginBottom: '4px', display: 'block' }}>Mínimo</label>
                    <input
                      style={styles.input}
                      id="minimo"
                      type="number"
                      placeholder="Stock mínimo"
                      value={formData.minimo === 0 ? '' : formData.minimo}
                      onChange={(e) => setFormData({...formData, minimo: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label htmlFor="estado" style={{ ...styles.metricLabel, marginBottom: '4px', display: 'block' }}>Estado</label>
                    <select
                      style={styles.input}
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    >
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={styles.button}
                    onClick={handleSave}
                    onMouseEnter={(e) => e.target.style.background = '#333'}
                    onMouseLeave={(e) => e.target.style.background = '#000'}
                  >
                    <Save size={16} />
                    Guardar
                  </button>
                  <button
                    style={styles.buttonSecondary}
                    onClick={handleCancel}
                    onMouseEnter={(e) => e.target.style.borderColor = '#000'}
                    onMouseLeave={(e) => e.target.style.borderColor = '#e5e5e5'}
                  >
                    <X size={16} />
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nombre</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Precio</th>
                    <th style={styles.th}>Stock</th>
                    <th style={styles.th}>Mínimo</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {adiciones.map((adicion) => (
                    <tr key={adicion.id} style={{ cursor: 'pointer' }}>
                      <td style={styles.td}>
                        {editingId === adicion.id ? (
                          <input
                            style={styles.input}
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                          />
                        ) : (
                          <span style={{ fontWeight: '500' }}>{adicion.nombre}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {editingId === adicion.id ? (
                          <select
                            style={styles.input}
                            value={formData.tipo}
                            onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                          >
                            {tipos.map(tipo => (
                              <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ ...styles.status, ...styles.statusSuccess }}>
                            {adicion.tipo}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {editingId === adicion.id ? (
                          <input
                            style={styles.input}
                            type="text" // Changed to text to allow decimal input easily
                            placeholder="Precio (ej. 1500.50)"
                            value={formData.precio === 0 ? '' : formData.precio}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*\.?\d*$/.test(value)) { // Allows empty string or valid decimal number
                                setFormData({...formData, precio: parseFloat(value) || 0});
                              }
                            }}
                          />
                        ) : (
                          <span style={styles.price}>${adicion.precio.toLocaleString('es-CO')}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {editingId === adicion.id ? (
                          <input
                            style={styles.input}
                            type="number"
                            placeholder="Cantidad en stock"
                            value={formData.stock === 0 ? '' : formData.stock}
                            onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                          />
                        ) : (
                          <span>{adicion.stock}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {editingId === adicion.id ? (
                          <input
                            style={styles.input}
                            type="number"
                            placeholder="Stock mínimo"
                            value={formData.minimo === 0 ? '' : formData.minimo}
                            onChange={(e) => setFormData({...formData, minimo: parseInt(e.target.value) || 0})}
                          />
                        ) : (
                          <span>{adicion.minimo}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {editingId === adicion.id ? (
                          <select
                            style={styles.input}
                            value={formData.estado}
                            onChange={(e) => setFormData({...formData, estado: e.target.value})}
                          >
                            {estados.map(estado => (
                              <option key={estado} value={estado}>{estado}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{
                            ...styles.status,
                            ...(getStatusClass(adicion.stock, adicion.minimo) === 'status-success' ? styles.statusSuccess :
                                getStatusClass(adicion.stock, adicion.minimo) === 'status-warning' ? styles.statusWarning :
                                styles.statusDanger)
                          }}>
                            {getStatusText(adicion.stock, adicion.minimo)}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {editingId === adicion.id ? (
                          <div style={styles.actionButtons}>
                            <button
                              style={styles.iconButton}
                              onClick={handleSave}
                              onMouseEnter={(e) => e.target.style.borderColor = '#000'}
                              onMouseLeave={(e) => e.target.style.borderColor = '#e5e5e5'}
                            >
                              <Save size={16} />
                            </button>
                            <button
                              style={styles.iconButton}
                              onClick={handleCancel}
                              onMouseEnter={(e) => e.target.style.borderColor = '#000'}
                              onMouseLeave={(e) => e.target.style.borderColor = '#e5e5e5'}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={styles.actionButtons}>
                            <button
                              style={styles.iconButton}
                              onClick={() => handleEdit(adicion)}
                              onMouseEnter={(e) => e.target.style.borderColor = '#000'}
                              onMouseLeave={(e) => e.target.style.borderColor = '#e5e5e5'}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              style={styles.iconButton}
                              onClick={() => handleDelete(adicion.id)}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = '#dc2626';
                                e.target.style.background = '#fef2f2';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor = '#e5e5e5';
                                e.target.style.background = 'none';
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Placeholder for other sections */}
        {activeSection !== "dashboard" && activeSection !== "facturar" && activeSection !== "adicciones" && (
          <div className="text-center py-12">
            <div className="mb-4">
              {React.createElement(
                menuItems.find((item) => item.id === activeSection)?.icon ||
                  Home,
                {
                  className: "h-12 w-12 text-gray-400 mx-auto mb-4",
                }
              )}
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {menuItems.find((item) => item.id === activeSection)?.label}
            </h2>
            <p className="text-gray-600">
              Esta sección está en desarrollo...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdicionesManager;