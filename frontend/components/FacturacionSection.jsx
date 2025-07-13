"use client";

import React, { useState, useMemo } from "react";

import {
  ShoppingCart,
  Package,
  BarChart3,
  Truck,
  TestTube,
  Plus,
  Eye,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  Home,
  DollarSign,
  TrendingUp,
  Menu,
  X,
  Search,
  Star,
} from "lucide-react";

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
  {
    id: 2,
    nombre: "BOLA DE HELADO DE FRESA",
    tipo: "HELADO",
    precio: 1500,
    stock: 8,
    minimo: 5,
    estado: "bien",
  },
  {
    id: 3,
    nombre: "BOLA DE ESPUMA",
    tipo: "ESPUMA",
    precio: 5000,
    stock: 3,
    minimo: 10,
    estado: "bajo",
  },
  {
    id: 4,
    nombre: "MINI PANCAKES",
    tipo: "PANCAKES",
    precio: 1000,
    stock: 100,
    minimo: 10,
    estado: "bien",
  },
  {
    id: 5,
    nombre: "MINI DONAS X12",
    tipo: "DONAS",
    precio: 3000,
    stock: 300,
    minimo: 10,
    estado: "bien",
  },
  {
    id: 6,
    nombre: "MALTEADA DE VAINILLA",
    tipo: "MALTEADA",
    precio: 4000,
    stock: 15,
    minimo: 5,
    estado: "bien",
  },
  {
    id: 7,
    nombre: "WAFFLE TRADICIONAL",
    tipo: "WAFFLE",
    precio: 3500,
    stock: 20,
    minimo: 5,
    estado: "bien",
  },
];

// Nuevos datos para adiciones
const adicionesDisponibles = [
  {
    id: 101,
    nombre: "CREMA CHANTILLY",
    tipo: "TOPPING",
    precio: 500,
    stock: 50,
    minimo: 10,
    estado: "bien",
  },
  {
    id: 102,
    nombre: "AREQUIPE",
    tipo: "TOPPING",
    precio: 800,
    stock: 30,
    minimo: 5,
    estado: "bien",
  },
  {
    id: 103,
    nombre: "CHISPAS DE CHOCOLATE",
    tipo: "TOPPING",
    precio: 300,
    stock: 100,
    minimo: 20,
    estado: "bien",
  },
  {
    id: 104,
    nombre: "FRESAS NATURALES",
    tipo: "FRUTA",
    precio: 1000,
    stock: 15,
    minimo: 5,
    estado: "bien",
  },
  {
    id: 105,
    nombre: "BANANO",
    tipo: "FRUTA",
    precio: 700,
    stock: 25,
    minimo: 10,
    estado: "bien",
  },
  {
    id: 106,
    nombre: "SALSA DE CHOCOLATE",
    tipo: "SALSA",
    precio: 600,
    stock: 40,
    minimo: 10,
    estado: "bien",
  },
  {
    id: 107,
    nombre: "SALSA DE FRESA",
    tipo: "SALSA",
    precio: 600,
    stock: 35,
    minimo: 10,
    estado: "bien",
  },
  {
    id: 108,
    nombre: "GRANOLA",
    tipo: "CEREAL",
    precio: 400,
    stock: 60,
    minimo: 15,
    estado: "bien",
  },
];

// Componente Card personalizado (Mantener si es reusable fuera de FacturacionSection, sino mover tambien)
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
  >
    {children}
  </div>
);

// Componente Badge personalizado (Mantener si es reusable fuera de FacturacionSection, sino mover tambien)
const Badge = ({ children, variant = "default", size = "default" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    info: "bg-blue-100 text-blue-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
  };

  const sizes = {
    default: "px-2 py-1 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};

// Componente Button personalizado (Mantener si es reusable fuera de FacturacionSection, sino mover tambien)
const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const variants = {
    default: "bg-gray-900 text-white hover:bg-gray-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    info: "bg-blue-600 text-white hover:bg-blue-700",
  };

  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function FacturacionSection() {
  // Estados para facturación
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [domicilio, setDomicilio] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [descuento, setDescuento] = useState(0);
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [ultimaFactura, setUltimaFactura] = useState(null);

  // Nuevos estados para la búsqueda y filtros
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [mostrarAdiciones, setMostrarAdiciones] = useState(false);
  const [adicionesCarrito, setAdicionesCarrito] = useState([]);

  // Nuevos estados para la factura detallada
  const [montoPagado, setMontoPagado] = useState(0);
  const [displayMontoPagado, setDisplayMontoPagado] = useState("");
  const [cuentaReferencia, setCuentaReferencia] = useState("");
  const [nombreDomiciliario, setNombreDomiciliario] = useState("");
  const [tarifaDomicilio, setTarifaDomicilio] = useState(0);
  const [displayTarifaDomicilio, setDisplayTarifaDomicilio] = useState("");

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filtrar productos según búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto) return productosVendibles;
    return productosVendibles.filter(
      (producto) =>
        producto.nombre
          .toLowerCase()
          .includes(busquedaProducto.toLowerCase()) ||
        producto.tipo.toLowerCase().includes(busquedaProducto.toLowerCase())
    );
  }, [busquedaProducto]);

  // Filtrar adiciones según búsqueda
  const adicionesFiltradas = useMemo(() => {
    if (!busquedaProducto) return adicionesDisponibles;
    return adicionesDisponibles.filter(
      (adicion) =>
        adicion.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        adicion.tipo.toLowerCase().includes(busquedaProducto.toLowerCase())
    );
  }, [busquedaProducto]);

  // Funciones para facturación
  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find((item) => item.id === producto.id);
    if (itemExistente) {
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const agregarAdicion = (adicion) => {
    const adicionExistente = adicionesCarrito.find(
      (item) => item.id === adicion.id
    );
    if (adicionExistente) {
      setAdicionesCarrito(
        adicionesCarrito.map((item) =>
          item.id === adicion.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setAdicionesCarrito([...adicionesCarrito, { ...adicion, cantidad: 1 }]);
    }
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter((item) => item.id !== id));
    } else {
      setCarrito(
        carrito.map((item) =>
          item.id === id ? { ...item, cantidad: nuevaCantidad } : item
        )
      );
    }
  };

  const actualizarCantidadAdicion = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setAdicionesCarrito(adicionesCarrito.filter((item) => item.id !== id));
    } else {
      setAdicionesCarrito(
        adicionesCarrito.map((item) =>
          item.id === id ? { ...item, cantidad: nuevaCantidad } : item
        )
      );
    }
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  const eliminarAdicion = (id) => {
    setAdicionesCarrito(adicionesCarrito.filter((item) => item.id !== id));
  };

  const subtotalProductos = useMemo(() => {
    return carrito.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0
    );
  }, [carrito]);

  const subtotalAdiciones = useMemo(() => {
    return adicionesCarrito.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0
    );
  }, [adicionesCarrito]);

  const calcularSubtotal = useMemo(() => {
    return subtotalProductos + subtotalAdiciones;
  }, [subtotalProductos, subtotalAdiciones]);

  const calcularDescuentoMonto = useMemo(() => {
    return (calcularSubtotal * descuento) / 100;
  }, [calcularSubtotal, descuento]);

  const calcularTotal = useMemo(() => {
    return calcularSubtotal - calcularDescuentoMonto;
  }, [calcularSubtotal, calcularDescuentoMonto]);

  const limpiarFormulario = () => {
    setCarrito([]);
    setAdicionesCarrito([]);
    setCliente("");
    setVendedor("");
    setDomicilio(false);
    setDireccion("");
    setTelefono("");
    setMetodoPago("efectivo");
    setDescuento(0);
    setBusquedaProducto("");
    setMostrarAdiciones(false);
    setMontoPagado(0);
    setDisplayMontoPagado("");
    setCuentaReferencia("");
    setNombreDomiciliario("");
    setTarifaDomicilio(0);
    setDisplayTarifaDomicilio("");
  };

  const validarFormulario = () => {
    const errores = [];

    if (carrito.length === 0 && adicionesCarrito.length === 0) {
      errores.push("Debe agregar al menos un producto o adición al carrito");
    }

    if (!cliente.trim()) {
      errores.push("El nombre del cliente es obligatorio");
    }

    if (!vendedor.trim()) {
      errores.push("El nombre del vendedor es obligatorio");
    }

    if (domicilio && !direccion.trim()) {
      errores.push("La dirección es obligatoria para domicilios");
    }

    if (telefono && !/^\d{10}$/.test(telefono.replace(/\s/g, ""))) {
      errores.push("El teléfono debe tener 10 dígitos");
    }

    if (montoPagado < (calcularTotal + (domicilio ? tarifaDomicilio : 0))) {
      errores.push("El monto pagado no puede ser menor al total de la factura");
    }

    return errores;
  };

  const procesarFactura = () => {
    const errores = validarFormulario();

    if (errores.length > 0) {
      alert("Errores en el formulario:\n" + errores.join("\n"));
      return;
    }

    const factura = {
      id: Date.now().toString(),
      fecha: new Date().toLocaleDateString("es-CO"),
      hora: new Date().toLocaleTimeString("es-CO"),
      cliente,
      vendedor,
      productos: carrito.map((item) => ({
        ...item,
        unidad: "unidad", // Asumiendo que la unidad es 'unidad' por defecto
        pUnitario: item.precio,
      })),
      adiciones: adicionesCarrito.map((item) => ({
        ...item,
        unidad: "unidad", // Asumiendo que la unidad es 'unidad' por defecto
        pUnitario: item.precio,
      })),
      subtotal: calcularSubtotal,
      descuento: descuento,
      descuentoMonto: calcularDescuentoMonto,
      total: calcularTotal,
      domicilio,
      direccion: domicilio ? direccion : "",
      telefono,
      metodoPago,
      cuentaReferencia: metodoPago !== "efectivo" ? cuentaReferencia : "",
      nombreDomiciliario: domicilio ? nombreDomiciliario : "",
      tarifaDomicilio: domicilio ? tarifaDomicilio : 0,
      montoPagado: montoPagado,
      cambioDevuelto: montoPagado - (calcularTotal + (domicilio ? tarifaDomicilio : 0)),
    };

    setUltimaFactura(factura);
    setMostrarFactura(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Facturar</h1>
        <p className="text-gray-600">Crear nueva factura de venta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado izquierdo - Productos */}
        <div className="space-y-6">
          {/* Carrito */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Carrito de Compras
            </h2>
            {carrito.length === 0 && adicionesCarrito.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay productos en el carrito
              </p>
            ) : (
              <div className="space-y-3">
                {/* Productos */}
                {carrito.map((item) => (
                  <div
                    key={`producto-${item.id}`}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.precio)} c/u
                      </p>
                      <Badge variant="info" size="sm">
                        PRODUCTO
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          actualizarCantidad(item.id, item.cantidad - 1)
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          actualizarCantidad(item.id, item.cantidad + 1)
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        disabled={item.cantidad >= item.stock}
                      >
                        +
                      </button>
                      <button
                        onClick={() => eliminarDelCarrito(item.id)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Adiciones */}
                {adicionesCarrito.map((item) => (
                  <div
                    key={`adicion-${item.id}`}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.precio)} c/u
                      </p>
                      <Badge variant="purple" size="sm">
                        ADICIÓN
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          actualizarCantidadAdicion(item.id, item.cantidad - 1)
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          actualizarCantidadAdicion(item.id, item.cantidad + 1)
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        disabled={item.cantidad >= item.stock}
                      >
                        +
                      </button>
                      <button
                        onClick={() => eliminarAdicion(item.id)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Resumen del carrito */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(calcularSubtotal)}</span>
                  </div>
                  {descuento > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento ({descuento}%):</span>
                      <span>-{formatPrice(calcularDescuentoMonto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(calcularTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Botones de filtro */}
          <div className="flex space-x-4">
            <Button
              variant={!mostrarAdiciones ? "default" : "info"}
              onClick={() => setMostrarAdiciones(false)}
              className="flex-1"
            >
              <Package className="h-4 w-4 mr-2" />
              Productos ({productosFiltrados.length})
            </Button>
            <Button
              variant={mostrarAdiciones ? "default" : "info"}
              onClick={() => setMostrarAdiciones(true)}
              className="flex-1"
            >
              <Star className="h-4 w-4 mr-2" />
              Adiciones ({adicionesFiltradas.length})
            </Button>
          </div>
          {/* Productos o Adiciones Disponibles */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {mostrarAdiciones
                ? "Adiciones Disponibles"
                : "Productos Disponibles"}
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {!mostrarAdiciones ? (
                // Mostrar productos filtrados
                productosFiltrados.length > 0 ? (
                  productosFiltrados.map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {producto.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatPrice(producto.precio)} | Stock:{" "}
                          {producto.stock}
                        </p>
                        <Badge
                          variant={
                            producto.estado === "bajo" ? "warning" : "success"
                          }
                        >
                          {producto.tipo}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => agregarAlCarrito(producto)}
                        disabled={producto.stock <= 0}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No se encontraron productos con ese criterio de búsqueda
                  </p>
                )
              ) : // Mostrar adiciones filtradas
              adicionesFiltradas.length > 0 ? (
                adicionesFiltradas.map((adicion) => (
                  <div
                    key={adicion.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {adicion.nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(adicion.precio)} | Stock:{" "}
                        {adicion.stock}
                      </p>
                      <Badge
                        variant={
                          adicion.estado === "bajo" ? "warning" : "purple"
                        }
                      >
                        {adicion.tipo}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => agregarAdicion(adicion)}
                      disabled={adicion.stock <= 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No se encontraron adiciones con ese criterio de búsqueda
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Lado derecho - Información de la Venta y Botones de acción */}
        <div className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información de la Venta
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendedor *
                </label>
                <input
                  type="text"
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del vendedor"
                />
              </div>

              <div>

              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="domicilio"
                  checked={domicilio}
                  onChange={(e) => setDomicilio(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="domicilio"
                  className="text-sm font-medium text-gray-700"
                >
                  ¿Es domicilio?
                </label>
              </div>

              {domicilio && (
                <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de entrega
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección completa"
                  />
                </div>
                <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono
                              </label>
                              <input
                                type="tel"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Teléfono del cliente"
                              />
                </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="nequi">Nequi</option>
                </select>
              </div>

              {metodoPago !== "efectivo" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuenta/Referencia
                  </label>
                  <input
                    type="text"
                    value={cuentaReferencia}
                    onChange={(e) => setCuentaReferencia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Número de cuenta o referencia"
                  />
                </div>
              )}

              {domicilio && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Domiciliario
                    </label>
                    <input
                      type="text"
                      value={nombreDomiciliario}
                      onChange={(e) =>
                        setNombreDomiciliario(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre del domiciliario"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarifa Domicilio
                    </label>
                    <input
                      type="text"
                      value={displayTarifaDomicilio}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                        const numericValue = parseFloat(rawValue) || 0;
                        setTarifaDomicilio(numericValue);
                        setDisplayTarifaDomicilio(rawValue);
                      }}
                      onFocus={(e) => {
                        if (tarifaDomicilio === 0) {
                          setDisplayTarifaDomicilio("");
                        } else {
                          setDisplayTarifaDomicilio(tarifaDomicilio.toString());
                        }
                      }}
                      onBlur={(e) => {
                        const numericValue = parseFloat(e.target.value) || 0;
                        setTarifaDomicilio(numericValue);
                        if (numericValue === 0) {
                          setDisplayTarifaDomicilio("");
                        } else {
                          setDisplayTarifaDomicilio(formatPrice(numericValue));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Pagado *
                </label>
                <input
                  type="text"
                  value={displayMontoPagado}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                    const numericValue = parseFloat(rawValue) || 0;
                    setMontoPagado(numericValue);
                    setDisplayMontoPagado(rawValue);
                  }}
                  onFocus={(e) => {
                    if (montoPagado === 0) {
                      setDisplayMontoPagado("");
                    } else {
                      setDisplayMontoPagado(montoPagado.toString());
                    }
                  }}
                  onBlur={(e) => {
                    const numericValue = parseFloat(e.target.value) || 0;
                    setMontoPagado(numericValue);
                    if (numericValue === 0) {
                      setDisplayMontoPagado("");
                    } else {
                      setDisplayMontoPagado(formatPrice(numericValue));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={descuento}
                  onChange={(e) =>
                    setDescuento(
                      Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div> */}
            </div>
          </Card>

          {/* Botones de acción */}
          <div className="flex space-x-4">
            <Button
              onClick={procesarFactura}
              className="flex-1"
              disabled={carrito.length === 0 && adicionesCarrito.length === 0}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Procesar Factura
            </Button>
            <Button variant="danger" onClick={limpiarFormulario}>
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Factura */}
      {mostrarFactura && ultimaFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Factura</h2>
                <button
                  onClick={() => setMostrarFactura(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-lg">Sistema de Inventario</h3>
                  <p className="text-gray-600">Factura de Venta</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Factura #:</strong> {ultimaFactura.id}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {ultimaFactura.fecha}
                    </p>
                    <p>
                      <strong>Hora:</strong> {ultimaFactura.hora}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Cliente:</strong> {ultimaFactura.cliente}
                    </p>
                    <p>
                      <strong>Vendedor:</strong> {ultimaFactura.vendedor}
                    </p>
                    <p>
                      <strong>Teléfono:</strong>{" "}
                      {ultimaFactura.telefono || "N/A"}
                    </p>
                  </div>
                </div>

                {ultimaFactura.domicilio && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p>
                      <strong>Domicilio:</strong> Sí
                    </p>
                    <p>
                      <strong>Dirección:</strong> {ultimaFactura.direccion}
                    </p>
                    <p>
                      <strong>Nombre Domiciliario:</strong>{" "}
                      {ultimaFactura.nombreDomiciliario || "N/A"}
                    </p>
                    <p>
                      <strong>Tarifa Domicilio:</strong>{" "}
                      {formatPrice(ultimaFactura.tarifaDomicilio)}
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Productos:</h4>
                  <table className="min-w-full divide-y divide-gray-200 mb-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cant
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidad
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          P. Unitario
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        ...ultimaFactura.productos,
                        ...ultimaFactura.adiciones,
                      ].map((item) => (
                        <tr key={item.id}>
                          <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.nombre}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                            {item.cantidad}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                            {item.unidad}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(item.pUnitario)}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatPrice(item.cantidad * item.pUnitario)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal Productos/Adiciones:</span>
                    <span>{formatPrice(ultimaFactura.subtotal)}</span>
                  </div>
                  {ultimaFactura.descuento > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({ultimaFactura.descuento}%):</span>
                      <span>
                        -{formatPrice(ultimaFactura.descuentoMonto)}
                      </span>
                    </div>
                  )}
                  {ultimaFactura.domicilio && ultimaFactura.tarifaDomicilio > 0 && (
                    <div className="flex justify-between">
                      <span>Tarifa Domicilio:</span>
                      <span>{formatPrice(ultimaFactura.tarifaDomicilio)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total a Pagar:</span>
                    <span>
                      {formatPrice(
                        ultimaFactura.total +
                          (ultimaFactura.domicilio
                            ? ultimaFactura.tarifaDomicilio
                            : 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monto Pagado:</span>
                    <span>{formatPrice(ultimaFactura.montoPagado)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cambio Devuelto:</span>
                    <span>{formatPrice(ultimaFactura.cambioDevuelto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Método de Pago:</span>
                    <span className="capitalize">
                      {ultimaFactura.metodoPago}
                    </span>
                  </div>
                  {ultimaFactura.cuentaReferencia && (
                    <div className="flex justify-between">
                      <span>Cuenta/Referencia:</span>
                      <span>{ultimaFactura.cuentaReferencia}</span>
                    </div>
                  )}
                </div>

                <div className="text-center text-gray-500 text-xs mt-6">
                  <p>¡Gracias por su compra!</p>
                  <p>Esta factura fue generada electrónicamente</p>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <Button onClick={() => window.print()} className="flex-1">
                  Imprimir
                </Button>
                <Button variant="danger" onClick={() => setMostrarFactura(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 