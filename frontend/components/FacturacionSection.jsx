"use client";

import React, { useState, useMemo, useEffect } from "react";

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
  CheckCircle,
} from "lucide-react";

import { Card, Badge, Button } from "./ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import ItemListDisplay from "./ItemListDisplay";

// Verificar que React está disponible
console.log("React disponible:", typeof React);
console.log("useState disponible:", typeof useState);
console.log("useEffect disponible:", typeof useEffect);
console.log("useMemo disponible:", typeof useMemo);

export default function FacturacionSection({ productosVendibles, productosConsumibles, onFacturaCreada }) {
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
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  // Estado para notificación de éxito
  const [notificacionExito, setNotificacionExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  // Nuevos estados para domiciliarios
  const [domiciliarios, setDomiciliarios] = useState([]);
  const [domiciliarioSeleccionado, setDomiciliarioSeleccionado] = useState(null);
  const [errorDomiciliarios, setErrorDomiciliarios] = useState(null);

  // Efecto para cargar domiciliarios cuando se habilita domicilio
  useEffect(() => {
    const fetchDomiciliarios = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000';
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.error("No se encontró token de autenticación");
          setErrorDomiciliarios("No autenticado");
          return;
        }
        
        const response = await fetch(`${apiUrl}/api/v1/services/domiciliarios`, {
          headers: {
            'Authorization': `bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener domiciliarios');
        }
        
        const data = await response.json();
        setDomiciliarios(data);
      } catch (error) {
        console.error("Error al cargar domiciliarios:", error);
        setErrorDomiciliarios(error.message);
      }
    };

    // Solo cargar domiciliarios si el domicilio está habilitado
    if (domicilio) {
      fetchDomiciliarios();
    }
  }, [domicilio]);

  // Efecto para establecer automáticamente la tarifa del domiciliario seleccionado
  useEffect(() => {
    if (domiciliarioSeleccionado) {
      const domiciliario = domiciliarios.find(d => d.id === domiciliarioSeleccionado);
      if (domiciliario) {
        setTarifaDomicilio(domiciliario.tarifa);
        setDisplayTarifaDomicilio(formatPrice(domiciliario.tarifa));
        setNombreDomiciliario(domiciliario.nombre);
      }
    } else {
      // Reset domicilio-related fields when no domiciliario is selected
      setTarifaDomicilio(0);
      setDisplayTarifaDomicilio("");
      setNombreDomiciliario("");
    }
  }, [domiciliarioSeleccionado, domiciliarios]);

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

  // Console log to debug product data
  useEffect(() => {
    console.log("ProductosVendibles recibidos:", productosVendibles);
    console.log("ProductosConsumibles recibidos:", productosConsumibles);
    console.log("Tipo de productosVendibles:", typeof productosVendibles);
    console.log("¿Es array productosVendibles?:", Array.isArray(productosVendibles));
  }, [productosVendibles, productosConsumibles]);

  // Función de prueba simple
  const testFunction = () => {
    console.log("TEST: Función de prueba ejecutada correctamente");
    alert("Función de prueba funciona!");
  };

  // Test para agregar al carrito
  const testAgregarCarrito = () => {
    console.log("TEST: Agregando producto de prueba al carrito");
    const productoTest = {
      id: 999,
      nombre: "PRODUCTO DE PRUEBA",
      precio: 1000,
      stock: 10,
      tipo: "TEST"
    };
    setCarrito([...carrito, { ...productoTest, cantidad: 1 }]);
    console.log("TEST: Carrito después de agregar:", [...carrito, { ...productoTest, cantidad: 1 }]);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filtrar productos según búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto) return productosVendibles || [];
    return (productosVendibles || []).filter(
      (producto) =>
        producto.nombre
          .toLowerCase()
          .includes(busquedaProducto.toLowerCase()) ||
        producto.tipo.toLowerCase().includes(busquedaProducto.toLowerCase())
    );
  }, [busquedaProducto, productosVendibles]);

  // Filtrar adiciones según búsqueda
  const adicionesFiltradas = useMemo(() => {
    // Use an empty array since we don't have adicionesDisponibles
    return [];
  }, [busquedaProducto]);

  // Funciones para facturación
  const agregarAlCarrito = (producto) => {
    console.log("Intentando agregar al carrito:", producto);
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
    console.log("Carrito después de agregar:", [...carrito, { ...producto, cantidad: 1 }]);
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
    // No limpiar el campo vendedor para que persista después de generar una factura
    // setVendedor("");
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
    
    // Resetear estados de domiciliarios
    setDomiciliarioSeleccionado(null);
    setNombreDomiciliario("");
    setTarifaDomicilio(0);
    setDisplayTarifaDomicilio("");
    setErrorDomiciliarios(null);
  };

  const validarFormulario = () => {
    const errores = [];
    console.log("Validando formulario...");
    console.log("Carrito:", carrito);
    console.log("Adiciones:", adicionesCarrito);
    console.log("Cliente:", cliente);
    console.log("Domicilio:", domicilio, "Dirección:", direccion);
    console.log("Teléfono:", telefono);
    console.log("Monto pagado:", montoPagado, "Total:", calcularTotal + (domicilio ? tarifaDomicilio : 0));

    if (carrito.length === 0 && adicionesCarrito.length === 0) {
      errores.push("Debe agregar al menos un producto o adición al carrito");
    }

    if (!cliente.trim()) {
      errores.push("El nombre del cliente es obligatorio");
    }

    if (domicilio) {
      if (!direccion.trim()) {
        errores.push("La dirección es obligatoria para domicilios");
      }

      if (!domiciliarioSeleccionado) {
        errores.push("Debe seleccionar un domiciliario");
      }
    }

    // Validación de teléfono más flexible
    if (telefono && telefono.trim() !== "" && !/^\d{7,10}$/.test(telefono.replace(/\s/g, ""))) {
      errores.push("El teléfono debe tener entre 7 y 10 dígitos");
    }

    // Solo validamos el monto pagado si hay productos en el carrito
    // y si no es efectivo (para permitir pago exacto después)
    if ((carrito.length > 0 || adicionesCarrito.length > 0) && metodoPago !== "efectivo") {
      const totalAPagar = calcularTotal + (domicilio ? tarifaDomicilio : 0);
      if (montoPagado < totalAPagar) {
        errores.push(`El monto pagado (${formatPrice(montoPagado)}) no puede ser menor al total de la factura (${formatPrice(totalAPagar)})`);
      }
    }

    console.log("Errores de validación:", errores);
    return errores;
  };

  const procesarFactura = () => {
    console.log("Intentando procesar factura");
    const errores = validarFormulario();

    if (errores.length > 0) {
      alert("Errores en el formulario:\n" + errores.join("\n"));
      return;
    }

    // Si el monto pagado es 0 y es efectivo, establecer automáticamente el monto como el total
    if (montoPagado === 0 && metodoPago === "efectivo") {
      setMontoPagado(calcularTotal + (domicilio ? tarifaDomicilio : 0));
      setDisplayMontoPagado(formatPrice(calcularTotal + (domicilio ? tarifaDomicilio : 0)));
    }

    // Abrir el diálogo de confirmación
    setAlertDialogOpen(true);
  };

  const confirmarProcesarFactura = () => {
    // Asegurarse de que el monto pagado esté establecido correctamente
    let montoFinal = montoPagado;
    if (montoFinal === 0 && metodoPago === "efectivo") {
      montoFinal = calcularTotal + (domicilio ? tarifaDomicilio : 0);
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
      montoPagado: montoFinal,
      cambioDevuelto: montoFinal - (calcularTotal + (domicilio ? tarifaDomicilio : 0)),
    };

    // Enviar la factura al backend
    enviarFacturaAlBackend(factura);

    setUltimaFactura(factura);
    setMostrarFactura(true);
    setAlertDialogOpen(false);
  };

  // Función para enviar la factura al backend
  const enviarFacturaAlBackend = async (factura) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error("No se encontró token de autenticación");
        alert("Error: No se encontró token de autenticación. Por favor, inicie sesión nuevamente.");
        return;
      }
      
      const headers = {
        'Authorization': `bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Preparar los datos para el backend
      // Formato para /api/v1/services/purchases
      const purchaseData = {
        invoice_number: factura.id,
        invoice_date: new Date().toLocaleDateString('en-US', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/(\d+)\/(\d+)\/(\d+)/, '$2/$1/$3'),
        invoice_time: new Date().toLocaleTimeString('en-US'),
        client_name: factura.cliente,
        seller_username: factura.vendedor,
        client_phone: factura.telefono || "",
        has_delivery: factura.domicilio,
        delivery_address: factura.direccion || "",
        delivery_person: factura.nombreDomiciliario || "",
        delivery_fee: factura.tarifaDomicilio || 0,
        subtotal_products: factura.subtotal,
        total_amount: factura.total + (factura.domicilio ? factura.tarifaDomicilio : 0),
        amount_paid: factura.montoPagado,
        change_returned: factura.cambioDevuelto,
        payment_method: factura.metodoPago,
        payment_reference: factura.cuentaReferencia || "",
        products: factura.productos.map(item => ({
          product_name: item.nombre,
          product_variant: item.variante || "",
          quantity: item.cantidad,
          unit_price: item.precio,
          subtotal: item.cantidad * item.precio
        }))
      };
      
      console.log("Intentando enviar factura al backend...");
      console.log("Datos de la factura:", purchaseData);
      
      try {
        const purchaseResponse = await fetch(`${apiUrl}/api/v1/services/purchases`, {
          method: 'POST',
          headers,
          body: JSON.stringify(purchaseData)
        });
        
        if (purchaseResponse.ok) {
          const responseData = await purchaseResponse.json();
          console.log("Factura guardada exitosamente como compra:", responseData);
          
          // Actualizar el ID de la factura con el ID generado por el backend
          if (responseData && responseData.purchase_id) {
            setUltimaFactura(prev => ({
              ...prev,
              id: responseData.purchase_id
            }));
            // Mostrar notificación de éxito
            setMensajeExito(`Factura #${responseData.purchase_id} generada con éxito`);
            setNotificacionExito(true);
          }
          
          // Limpiar el formulario después de un envío exitoso
          limpiarFormulario();
          return;
        } else {
          // Manejar errores del backend
          const errorData = await purchaseResponse.json().catch(() => ({}));
          console.error("Error del backend:", purchaseResponse.status, errorData);
          
          // Si es error 400, probablemente es validación de insumos
          if (purchaseResponse.status === 400 && errorData.detail) {
            // El backend envía el mensaje de error detallado
            alert(errorData.detail);
            return;
          }
          
          // Si el error no es de validación, intentar con el endpoint de ventas
          console.warn("No se pudo guardar como compra, intentando como venta...");
          throw new Error("No se pudo guardar como compra");
        }
      } catch (purchaseError) {
        console.warn("Error al intentar guardar como compra:", purchaseError);
        
        // Formato alternativo para /api/v1/sales
        const salesData = {
          items: factura.productos.map(item => ({
            product_id: item.id,
            quantity: item.cantidad,
            unit_price: item.precio
          })),
          payment_method: factura.metodoPago,
          notes: `Cliente: ${factura.cliente}${factura.domicilio ? `, Domicilio: ${factura.direccion}` : ''}`
        };
        
        // Intentar con el endpoint de ventas
        const salesResponse = await fetch(`${apiUrl}/api/v1/sales`, {
          method: 'POST',
          headers,
          body: JSON.stringify(salesData)
        });
        
        if (!salesResponse.ok) {
          const errorData = await salesResponse.json().catch(() => ({}));
          console.error("Error al enviar factura como venta:", salesResponse.status, errorData);
          alert(`Error al guardar la factura en el sistema: ${salesResponse.status}`);
          return;
        }
        
        const responseData = await salesResponse.json();
        console.log("Factura guardada exitosamente como venta:", responseData);
        
        // Actualizar el ID de la factura con el ID generado por el backend
        if (responseData && responseData.id) {
          setUltimaFactura(prev => ({
            ...prev,
            id: responseData.id
          }));
          // Mostrar notificación de éxito
          setMensajeExito(`Factura #${responseData.id} generada con éxito`);
          setNotificacionExito(true);
        }
        
        // Limpiar el formulario después de un envío exitoso
        limpiarFormulario();
      }
      
    } catch (error) {
      console.error("Error al procesar la factura:", error);
      alert("Error al procesar la factura: " + error.message);
    }
  };

  // Obtener el nombre de usuario al cargar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Primero intentamos obtener el nombre de usuario del localStorage
          const username = localStorage.getItem('username') || '';
          if (username) {
            setVendedor(username);
          }
          
          // Luego intentamos obtener más información del usuario desde la API
          const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000';
          const token = localStorage.getItem('authToken');
          
          if (token) {
            const headers = {
              'Authorization': `bearer ${token}`,
              'Content-Type': 'application/json'
            };
            
            const response = await fetch(`${apiUrl}/api/v1/users/auth/me`, {
              method: 'GET',
              headers
            });
            
            if (response.ok) {
              const userData = await response.json();
              // Si hay un nombre completo disponible, lo usamos
              if (userData && userData.full_name) {
                setVendedor(userData.full_name);
              } else if (userData && userData.username && userData.username !== username) {
                setVendedor(userData.username);
              }
            }
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
        }
      }
    };

    fetchUserData();
  }, [onFacturaCreada]); // Añadimos onFacturaCreada como dependencia para que se ejecute cuando cambie

  // Función para cerrar la factura y recargar la página
  const cerrarFacturaYRecargar = () => {
    setMostrarFactura(false);
    // Mostrar notificación de éxito con el número de factura
    if (ultimaFactura && ultimaFactura.id) {
      setMensajeExito(`Factura #${ultimaFactura.id} generada con éxito`);
      setNotificacionExito(true);
    }
    
    // Si el vendedor está vacío, intentar obtenerlo de nuevo
    if (!vendedor) {
      const fetchUserData = async () => {
        if (typeof window !== 'undefined') {
          try {
            // Primero intentamos obtener el nombre de usuario del localStorage
            const username = localStorage.getItem('username') || '';
            if (username) {
              setVendedor(username);
            }
            
            // Luego intentamos obtener más información del usuario desde la API
            const apiUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000';
            const token = localStorage.getItem('authToken');
            
            if (token) {
              const headers = {
                'Authorization': `bearer ${token}`,
                'Content-Type': 'application/json'
              };
              
              const response = await fetch(`${apiUrl}/api/v1/users/auth/me`, {
                method: 'GET',
                headers
              });
              
              if (response.ok) {
                const userData = await response.json();
                // Si hay un nombre completo disponible, lo usamos
                if (userData && userData.full_name) {
                  setVendedor(userData.full_name);
                } else if (userData && userData.username && userData.username !== username) {
                  setVendedor(userData.username);
                }
              }
            }
          } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
          }
        }
      };
      
      fetchUserData();
    }
    
    // Llamar a la función onFacturaCreada si existe
    if (typeof onFacturaCreada === 'function') {
      // Pequeño retraso para permitir que la notificación se muestre primero
      setTimeout(() => {
        onFacturaCreada();
      }, 300);
    }
  };

  return (
    <div>
      {/* Notificación de éxito */}
      {notificacionExito && (
        <div className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>{mensajeExito}</span>
          <button 
            onClick={() => setNotificacionExito(false)} 
            className="ml-4 text-green-700 hover:text-green-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sección de depuración - TEMPORAL */}
      {/* <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <h3 className="text-lg font-bold text-yellow-800 mb-2">🔧 DEPURACIÓN - TEMPORAL</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          <button 
            onClick={testFunction}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Función Simple
          </button>
          <button 
            onClick={testAgregarCarrito}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Agregar Carrito
          </button>
          <button 
            onClick={() => console.log("TEST: Estado actual del carrito:", carrito)}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Ver Carrito en Console
          </button>
        </div>
        <div className="text-sm text-yellow-700">
          <p>Productos disponibles: {productosVendibles?.length || 0}</p>
          <p>Items en carrito: {carrito.length}</p>
          <p>Cliente: "{cliente}"</p>
        </div>
      </div> */}

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
              className="flex-1 cursor-pointer"
            >
              <Package className="h-4 w-4 mr-2" />
              Productos ({productosFiltrados.length})
            </Button>
            <Button
              variant={mostrarAdiciones ? "default" : "info"}
              onClick={() => setMostrarAdiciones(true)}
              className="flex-1 cursor-pointer"
            >
              <Star className="h-4 w-4 mr-2" />
              Adiciones ({adicionesFiltradas.length})
            </Button>
          </div>
          {/* Input de búsqueda para productos y adiciones */}
          <div className="mb-4">
            <label htmlFor="search" className="sr-only">
              Buscar productos o adiciones
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar productos o adiciones..."
              />
            </div>
          </div>
          {/* Productos o Adiciones Disponibles */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {mostrarAdiciones
                ? "Adiciones Disponibles"
                : "Productos Disponibles"}
            </h2>
            
            {/* Lista simplificada para depuración */}
            {/* <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Lista Simplificada (DEPURACIÓN):</h4>
              {(productosFiltrados || []).map((producto, index) => (
                <div key={producto.id || index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{producto.nombre}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      Stock: {producto.stock + 1} | Precio: {formatPrice(producto.precio)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      console.log("SIMPLE: Clic en agregar producto:", producto);
                      agregarAlCarrito(producto);
                    }}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 cursor-pointer"
                  >
                    + Agregar Simple
                  </button>
                </div>
              ))}
              {(!productosFiltrados || productosFiltrados.length === 0) && (
                <p className="text-gray-500 text-center py-4">No hay productos disponibles</p>
              )}
            </div> */}

            {/* Componente original */}
            <ItemListDisplay
              items={mostrarAdiciones ? adicionesFiltradas : productosFiltrados}
              onAddItem={mostrarAdiciones ? agregarAdicion : agregarAlCarrito}
              formatPrice={formatPrice}
              badgeVariant={mostrarAdiciones ? "purple" : "info"}
            />
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
                  Vendedor <span className="text-xs text-gray-500">(Tu nombre de usuario)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vendedor}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Nombre del vendedor"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
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
                    <select
                      value={domiciliarioSeleccionado || ""}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        setDomiciliarioSeleccionado(selectedValue ? parseInt(selectedValue) : "");
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar Domiciliario</option>
                      {domiciliarios.map((domiciliario) => (
                        <option key={domiciliario.id} value={domiciliario.id}>
                          {domiciliario.nombre} - Tel: {domiciliario.telefono}
                        </option>
                      ))}
                    </select>
                    {errorDomiciliarios && (
                      <p className="text-xs text-red-500 mt-1">
                        <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                        {errorDomiciliarios === "No autenticado" 
                          ? "Por favor, inicie sesión nuevamente" 
                          : "No se pudieron cargar los domiciliarios"}
                      </p>
                    )}
                    {domiciliarios.length === 0 && domicilio && !errorDomiciliarios && (
                      <p className="text-xs text-yellow-600 mt-1">
                        <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                        Cargando domiciliarios...
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarifa Domicilio
                    </label>
                    <input
                      type="text"
                      value={displayTarifaDomicilio}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                      placeholder="Tarifa automática"
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
          <div className="flex space-x-4 ">
            {/* Botón de prueba simplificado */}
            {/* <button
              onClick={() => {
                console.log("SIMPLE: Intentando procesar factura simple");
                console.log("SIMPLE: Carrito actual:", carrito);
                console.log("SIMPLE: Cliente actual:", cliente);
                if (carrito.length === 0) {
                  alert("No hay productos en el carrito");
                  return;
                }
                if (!cliente.trim()) {
                  alert("Falta el nombre del cliente");
                  return;
                }
                alert("Factura simple procesada correctamente!");
              }}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={carrito.length === 0}
            >
              🧪 Procesar Simple
            </button> */}

            <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
              <Button
                onClick={procesarFactura}
                className="flex-1 
                cursor-pointer
                bg-blue-600
                 text-white rounded hover:bg-blue-700"

                disabled={carrito.length === 0 && adicionesCarrito.length === 0}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Procesar Factura
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar factura?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción procesará la factura actual. ¿Está seguro de continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmarProcesarFactura}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                <h2 className="text-2xl font-bold text-gray-900">Factura #{ultimaFactura.id}</h2>
                <button
                  onClick={cerrarFacturaYRecargar}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-lg">Dulce Vida</h3>
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
                <Button variant="danger" onClick={cerrarFacturaYRecargar}>
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