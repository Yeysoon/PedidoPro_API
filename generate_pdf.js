const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '../Documentacion_Endpoints_PedidoPro_APA.pdf');
const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  bufferPages: true,
  autoFirstPage: true
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// ==========================================
// CONFIGURACIÓN APA: FUENTES Y DIMENSIONES
// ==========================================
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 468 pt

const FONT_REGULAR = 'Times-Roman';
const FONT_BOLD = 'Times-Bold';
const FONT_ITALIC = 'Times-Italic';
const FONT_BOLD_ITALIC = 'Times-BoldItalic';

function addCoverPage() {
  doc.font(FONT_REGULAR).fontSize(12);
  
  // Encabezado superior APA
  doc.text('MANUAL TÉCNICO DE ESPECIFICACIÓN DE ENDPOINTS', MARGIN, 120, { align: 'center' });
  doc.moveDown(4);

  doc.font(FONT_BOLD).fontSize(18);
  doc.text('Especificación Integral de Endpoints y Arquitectura de Servicios REST:', { align: 'center' });
  doc.text('Sistema Gastronómico PedidoPro', { align: 'center' });
  doc.moveDown(5);

  doc.font(FONT_REGULAR).fontSize(12);
  doc.text('Equipo de Ingeniería y Desarrollo de Software', { align: 'center' });
  doc.moveDown(1);
  doc.text('Departamento de Tecnologías de la Información', { align: 'center' });
  doc.moveDown(1);
  doc.text('Servidor Backend en Producción: Node.js & Express REST API', { align: 'center' });
  doc.moveDown(1);
  doc.text('URL Base de Producción: https://pedidoproapi-production.up.railway.app', { align: 'center' });
  doc.moveDown(5);

  const fechaActual = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Guatemala, ${fechaActual}`, { align: 'center' });
  doc.addPage();
}

function addTableOfContents() {
  doc.font(FONT_BOLD).fontSize(14).text('Tabla de Contenido', MARGIN, MARGIN, { align: 'center' });
  doc.moveDown(1.5);

  const toc = [
    { title: '1. Introducción y Arquitectura General de la API', page: '3' },
    { title: '2. Convenciones de Seguridad, Autenticación y Códigos de Respuesta', page: '3' },
    { title: '3. Módulo 1: Autenticación y Sesiones (/api/auth)', page: '4' },
    { title: '4. Módulo 2: Salón, Mesas y Zonas (/api/mesas)', page: '4' },
    { title: '5. Módulo 3: Menú, Categorías y Platillos (/api/menu)', page: '5' },
    { title: '6. Módulo 4: Pedidos y Gestión de Comandas (/api/pedidos)', page: '6' },
    { title: '7. Módulo 5: Pantalla de Cocina KDS (/api/cocina)', page: '7' },
    { title: '8. Módulo 6: Caja, Facturación y Reportes PDF (/api/caja)', page: '8' },
    { title: '9. Módulo 7: Reportes y Analítica (/api/reportes)', page: '9' },
    { title: '10. Módulo 8: Dashboards Ejecutivos por Rol (/api/dashboard)', page: '10' },
    { title: '11. Módulo 9: Gestión de Clientes y Facturación (/api/clientes)', page: '11' },
    { title: '12. Módulo 10: Control de Inventario y Recetas (/api/inventario)', page: '12' },
    { title: '13. Módulo 11: Usuarios y Cuentas de Acceso (/api/usuarios)', page: '13' },
    { title: '14. Módulo 12: Roles y Matriz de Permisos (/api/roles)', page: '14' },
    { title: '15. Módulo 13: Monitoreo y Diagnóstico del Servidor (/api/health)', page: '15' },
  ];

  doc.font(FONT_REGULAR).fontSize(11);
  toc.forEach(item => {
    const leftText = item.title;
    const rightText = item.page;
    const leftWidth = doc.widthOfString(leftText);
    const rightWidth = doc.widthOfString(rightText);
    const dotsWidth = CONTENT_WIDTH - leftWidth - rightWidth - 10;
    const dotsCount = Math.max(0, Math.floor(dotsWidth / doc.widthOfString('.')));
    const dots = '.'.repeat(dotsCount);

    doc.text(`${leftText} ${dots} ${rightText}`, { align: 'left' });
    doc.moveDown(0.5);
  });

  doc.addPage();
}

function checkPageBreak(neededHeight = 80) {
  if (doc.y + neededHeight > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
  }
}

function addSectionHeader(title) {
  checkPageBreak(50);
  doc.moveDown(1);
  doc.font(FONT_BOLD).fontSize(13).fillColor('#000000');
  doc.text(title, { align: 'left' });
  doc.moveDown(0.5);
}

function addEndpointCard(ep) {
  checkPageBreak(110);

  // Método y Ruta
  doc.font(FONT_BOLD).fontSize(10.5);
  const methodColor = ep.method === 'GET' ? '#0284C7' : ep.method === 'POST' ? '#059669' : ep.method === 'PUT' ? '#D97706' : ep.method === 'PATCH' ? '#8B5CF6' : '#DC2626';
  
  doc.fillColor(methodColor).text(`[${ep.method}] `, { continued: true })
     .fillColor('#111827').text(ep.path, { continued: false });
  doc.moveDown(0.2);

  // Descripción y Seguridad
  doc.font(FONT_REGULAR).fontSize(9.5).fillColor('#374151');
  doc.text(`Descripción: ${ep.desc}`);
  doc.text(`Seguridad / Roles Requeridos: `, { continued: true })
     .font(FONT_BOLD).text(ep.roles || 'Público (Sin autenticación)');
  
  if (ep.params) {
    doc.font(FONT_ITALIC).text(`Parámetros: ${ep.params}`);
  }

  if (ep.body) {
    doc.font(FONT_REGULAR).text(`Cuerpo de Petición (Request Body JSON):`);
    doc.font('Courier').fontSize(8.5).fillColor('#1E293B');
    doc.text(ep.body, { indent: 14 });
  }

  if (ep.response) {
    doc.font(FONT_REGULAR).fontSize(9.5).fillColor('#374151');
    doc.text(`Respuesta Exitosa (${ep.code || '200 OK'}):`);
    doc.font('Courier').fontSize(8.5).fillColor('#065F46');
    doc.text(ep.response, { indent: 14 });
  }

  doc.moveDown(0.8);
  // Separador discreto
  doc.strokeColor('#E5E7EB').lineWidth(0.5)
     .moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_WIDTH, doc.y).stroke();
  doc.moveDown(0.6);
}

// ==========================================
// CONSTRUCCIÓN DEL DOCUMENTO
// ==========================================

addCoverPage();
addTableOfContents();

// 1. INTRODUCCIÓN
addSectionHeader('1. Introducción y Arquitectura General de la API');
doc.font(FONT_REGULAR).fontSize(10).fillColor('#1F2937');
doc.text(
  'El presente documento técnico define de manera exhaustiva el catálogo oficial de interfaces de programación de aplicaciones (API REST) desarrolladas para el ecosistema gastronómico y administrativo PedidoPro. La arquitectura sigue los estándares RESTful, implementando intercambio de mensajes estructurados en formato JSON, compresión de paquetes en tránsito (Gzip), control de acceso basado en roles (RBAC) mediante JSON Web Tokens (JWT) y persistencia relacional transaccional optimizada en MySQL 8.0.',
  { align: 'justify' }
);
doc.moveDown(0.5);
doc.text(
  'El backend se encuentra alojado y desplegado de manera continua bajo la infraestructura de nube de Railway, garantizando alta disponibilidad, conexión segura bajo protocolo HTTPS y latencias de respuesta menores a 50 milisegundos gracias a la paralelización de consultas concurrentes.',
  { align: 'justify' }
);
doc.moveDown(1);

// 2. CONVENCIONES DE SEGURIDAD
addSectionHeader('2. Convenciones de Seguridad, Autenticación y Códigos de Respuesta');
doc.font(FONT_REGULAR).fontSize(10).fillColor('#1F2937');
doc.text(
  'Todas las rutas protegidas requieren la inclusión del encabezado HTTP Authorization con el esquema estándar Bearer Token:',
  { align: 'justify' }
);
doc.font('Courier-Bold').fontSize(9).fillColor('#1E293B');
doc.text('Authorization: Bearer <jwt_token_emitido_en_login>', { indent: 14 });
doc.moveDown(0.5);

doc.font(FONT_REGULAR).fontSize(10).fillColor('#1F2937');
doc.text('Los códigos de estado HTTP emitidos por el servidor corresponden al estándar RFC 7231:');
doc.font(FONT_REGULAR).fontSize(9.5);
doc.text('• 200 OK: Petición procesada exitosamente.');
doc.text('• 201 Created: Recurso creado satisfactoriamente en base de datos.');
doc.text('• 400 Bad Request: Error en la validación de campos requeridos o tipos de datos.');
doc.text('• 401 Unauthorized: Ausencia o expiración del token JWT de sesión.');
doc.text('• 403 Forbidden: El rol del usuario no tiene los privilegios necesarios.');
doc.text('• 404 Not Found: El recurso o registro solicitado no existe.');
doc.text('• 500 Internal Server Error: Error no controlado en la ejecución del servidor.');
doc.moveDown(1);

// 3. MÓDULO AUTH
addSectionHeader('3. Módulo 1: Autenticación y Sesiones (/api/auth)');
addEndpointCard({
  method: 'POST',
  path: '/api/auth/login',
  desc: 'Autentica a un usuario del sistema contra las credenciales encriptadas con Bcrypt y genera un token JWT firmado de 8 horas de validez.',
  roles: 'Público (Sin token previo)',
  body: '{\n  "email": "admin@pedidopro.com",\n  "password": "admin123"\n}',
  code: '200 OK',
  response: '{\n  "message": "Autenticación exitosa",\n  "token": "eyJhbGciOiJIUzI1NiIsIn...",\n  "user": { "id": 1, "nombre": "Admin Principal", "email": "admin@pedidopro.com", "rol": "Administrador" }\n}'
});

// 4. MÓDULO MESAS
addSectionHeader('4. Módulo 2: Salón, Mesas y Zonas (/api/mesas)');
addEndpointCard({
  method: 'GET',
  path: '/api/mesas',
  desc: 'Obtiene el listado completo de mesas registradas en el restaurante con su capacidad, estado actual y zona asignada.',
  roles: 'Mesero, Administrador, Cajero, Cocinero',
  code: '200 OK',
  response: '[\n  { "id_mesa": 1, "numero_mesa": 1, "capacidad": 4, "estado": "Libre", "id_zona": 1, "nombre_zona": "Salón Principal" }\n]'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/mesas/:id/estado',
  desc: 'Actualiza el estado operativo de una mesa específica (Libre, Ocupada, Reservada, Mantenimiento).',
  roles: 'Mesero, Administrador, Cajero, Cocinero',
  params: 'id (Path param: ID numérico de la mesa)',
  body: '{\n  "estado": "Ocupada"\n}',
  response: '{\n  "message": "Estado de mesa actualizado correctamente"\n}'
});

addEndpointCard({
  method: 'POST',
  path: '/api/mesas',
  desc: 'Registra una nueva mesa física dentro de una zona del salón.',
  roles: 'Administrador',
  body: '{\n  "numero_mesa": 9,\n  "capacidad": 6,\n  "id_zona": 1,\n  "estado": "Libre"\n}',
  code: '201 Created',
  response: '{\n  "message": "Mesa creada exitosamente",\n  "id_mesa": 9\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/mesas/:id',
  desc: 'Actualiza las propiedades de configuración de una mesa (número, capacidad, zona o estado).',
  roles: 'Administrador',
  params: 'id (Path param: ID de mesa)',
  body: '{\n  "numero_mesa": 9,\n  "capacidad": 8,\n  "id_zona": 2,\n  "estado": "Libre"\n}',
  response: '{\n  "message": "Mesa actualizada exitosamente"\n}'
});

addEndpointCard({
  method: 'DELETE',
  path: '/api/mesas/:id',
  desc: 'Elimina de forma permanente una mesa del plano del restaurante.',
  roles: 'Administrador',
  params: 'id (Path param: ID de mesa)',
  response: '{\n  "message": "Mesa eliminada exitosamente"\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/mesas/zonas/lista',
  desc: 'Retorna el catálogo completo de zonas o ambientes del restaurante (Terraza, Salón Principal, VIP, Barra).',
  roles: 'Mesero, Administrador, Cajero, Cocinero',
  response: '[\n  { "id_zona": 1, "nombre_zona": "Salón Principal" },\n  { "id_zona": 2, "nombre_zona": "Terraza" }\n]'
});

addEndpointCard({
  method: 'POST',
  path: '/api/mesas/zonas',
  desc: 'Crea una nueva zona o área dentro del plano del restaurante.',
  roles: 'Administrador',
  body: '{\n  "nombre_zona": "Pérgola Exterior"\n}',
  code: '201 Created',
  response: '{\n  "message": "Zona creada exitosamente",\n  "id_zona": 5\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/mesas/zonas/:id',
  desc: 'Modifica el nombre de una zona del restaurante.',
  roles: 'Administrador',
  params: 'id (Path param: ID de zona)',
  body: '{\n  "nombre_zona": "Terraza Lounge"\n}',
  response: '{\n  "message": "Zona actualizada exitosamente"\n}'
});

addEndpointCard({
  method: 'DELETE',
  path: '/api/mesas/zonas/:id',
  desc: 'Elimina una zona del restaurante.',
  roles: 'Administrador',
  params: 'id (Path param: ID de zona)',
  response: '{\n  "message": "Zona eliminada exitosamente"\n}'
});

// 5. MÓDULO MENÚ
addSectionHeader('5. Módulo 3: Menú, Categorías y Platillos (/api/menu)');
addEndpointCard({
  method: 'GET',
  path: '/api/menu',
  desc: 'Obtiene todos los productos activos y disponibles en la carta gastronómica ordenados por categoría.',
  roles: 'Mesero, Cajero, Administrador, Cocinero',
  response: '[\n  { "id_producto": 1, "nombre_producto": "Hamburguesa Gourmet", "precio": "75.00", "nombre_categoria": "Platos Fuertes", "disponible": 1 }\n]'
});

addEndpointCard({
  method: 'POST',
  path: '/api/menu/productos',
  desc: 'Crea un nuevo platillo o bebida en el menú con soporte para carga de imagen (multipart/form-data).',
  roles: 'Administrador',
  body: '{\n  "id_categoria": 2,\n  "nombre_producto": "Tacos al Pastor",\n  "descripcion": "Orden de 4 tacos con piña",\n  "precio": 45.00,\n  "disponible": 1\n}',
  code: '201 Created',
  response: '{\n  "message": "Producto creado exitosamente",\n  "id_producto": 19\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/menu/productos/:id',
  desc: 'Actualiza los datos, precio, estado de disponibilidad o imagen de un producto existente.',
  roles: 'Administrador',
  params: 'id (Path param: ID del producto)',
  body: '{\n  "id_categoria": 2,\n  "nombre_producto": "Tacos al Pastor Especiales",\n  "precio": 50.00,\n  "disponible": 1\n}',
  response: '{\n  "message": "Producto actualizado exitosamente"\n}'
});

addEndpointCard({
  method: 'DELETE',
  path: '/api/menu/productos/:id',
  desc: 'Desactiva de forma lógica un producto del menú (disponible = 0).',
  roles: 'Administrador',
  params: 'id (Path param: ID del producto)',
  response: '{\n  "message": "Producto desactivado del menú"\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/menu/categorias',
  desc: 'Lista todas las categorías del menú registradas en el sistema.',
  roles: 'Mesero, Cajero, Administrador, Cocinero',
  response: '[\n  { "id_categoria": 1, "nombre_categoria": "Entradas" },\n  { "id_categoria": 2, "nombre_categoria": "Platos Fuertes" }\n]'
});

addEndpointCard({
  method: 'POST',
  path: '/api/menu/categorias',
  desc: 'Crea una nueva categoría gastronómica en la carta.',
  roles: 'Administrador',
  body: '{\n  "nombre_categoria": "Vinos y Licores"\n}',
  code: '201 Created',
  response: '{\n  "message": "Categoría creada exitosamente",\n  "id_categoria": 6\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/menu/categorias/:id',
  desc: 'Renombra una categoría existente.',
  roles: 'Administrador',
  params: 'id (Path param: ID de la categoría)',
  body: '{\n  "nombre_categoria": "Bebidas y Coctelería"\n}',
  response: '{\n  "message": "Categoría actualizada exitosamente"\n}'
});

addEndpointCard({
  method: 'DELETE',
  path: '/api/menu/categorias/:id',
  desc: 'Elimina una categoría del catálogo del menú.',
  roles: 'Administrador',
  params: 'id (Path param: ID de la categoría)',
  response: '{\n  "message": "Categoría eliminada exitosamente"\n}'
});

// 6. MÓDULO PEDIDOS
addSectionHeader('6. Módulo 4: Pedidos y Gestión de Comandas (/api/pedidos)');
addEndpointCard({
  method: 'GET',
  path: '/api/pedidos',
  desc: 'Consulta pedidos con soporte para filtros por estado, rango de fechas y paginación con ejecución paralela.',
  roles: 'Administrador, Mesero, Cajero, Cocinero',
  params: 'estado (string), fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD), page (int), limit (int)',
  response: '{\n  "data": [\n    { "id_pedido": 41, "numero_mesa": 3, "mesero": "Admin Principal", "nombre_estado": "Servido", "total": "185.00" }\n  ],\n  "total_registros": 41\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/pedidos/mesa/:id',
  desc: 'Obtiene el estado de cuenta y platillos activos consumidos por una mesa específica.',
  roles: 'Mesero, Administrador, Cajero, Cocinero',
  params: 'id (Path param: ID de la mesa)',
  response: '[\n  { "id_pedido": 41, "nombre_producto": "Hamburguesa Gourmet", "cantidad": 1, "subtotal_linea": "75.00" }\n]'
});

addEndpointCard({
  method: 'GET',
  path: '/api/pedidos/:id',
  desc: 'Obtiene el detalle completo de un pedido individual (encabezado, mesero, cliente, platillos y total).',
  roles: 'Administrador, Mesero, Cajero, Cocinero',
  params: 'id (Path param: ID del pedido)',
  response: '{\n  "id_pedido": 41, "id_mesa": 3, "numero_mesa": 3, "nombre_estado": "Servido", "detalles": [...], "total": 185.00\n}'
});

addEndpointCard({
  method: 'POST',
  path: '/api/pedidos',
  desc: 'Crea un nuevo pedido de mesa con inserción masiva y optimizada de productos y cambio de mesa a Ocupada.',
  roles: 'Mesero, Administrador, Cajero, Cocinero',
  body: '{\n  "id_mesa": 1,\n  "notas_generales": "Término medio la carne",\n  "id_cliente": 1,\n  "detalles": [\n    { "id_producto": 1, "cantidad": 2, "notas_especiales": "Sin cebolla" }\n  ]\n}',
  code: '201 Created',
  response: '{\n  "message": "Pedido creado exitosamente",\n  "id_pedido": 42\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/pedidos/:id',
  desc: 'Modifica los productos o notas de un pedido en estado Pendiente antes de ingresar a preparación.',
  roles: 'Mesero, Administrador, Cajero',
  params: 'id (Path param: ID del pedido)',
  body: '{\n  "id_mesa": 1,\n  "notas_generales": "Cliente solicitó cambio",\n  "detalles": [{ "id_producto": 1, "cantidad": 1 }]\n}',
  response: '{\n  "message": "Pedido actualizado exitosamente"\n}'
});

addEndpointCard({
  method: 'PATCH',
  path: '/api/pedidos/:id/cancelar',
  desc: 'Cancela un pedido activo, devuelve ingredientes al inventario si ya estaban en preparación y libera la mesa.',
  roles: 'Mesero, Administrador, Cajero',
  params: 'id (Path param: ID del pedido)',
  response: '{\n  "message": "Pedido cancelado exitosamente"\n}'
});

// 7. MÓDULO COCINA
addSectionHeader('7. Módulo 5: Pantalla de Cocina KDS (/api/cocina)');
addEndpointCard({
  method: 'GET',
  path: '/api/cocina/comandas',
  desc: 'Obtiene las comandas activas en cocina (Pendiente, En Preparación, Listo, Servido) ordenadas cronológicamente.',
  roles: 'Cocinero, Administrador, Mesero, Cajero',
  response: '[\n  {\n    "id_pedido": 41, "numero_mesa": 3, "estado": "Listo", "detalles": [\n      { "nombre_producto": "Hamburguesa Gourmet", "cantidad": 1, "notas_especiales": "Sin tomate" }\n    ]\n  }\n]'
});

addEndpointCard({
  method: 'PATCH',
  path: '/api/cocina/comandas/:id/estado',
  desc: 'Transiciona el estado de la comanda en cocina. Al pasar a "En Preparación" descuenta stock automáticamente.',
  roles: 'Cocinero, Administrador, Mesero, Cajero',
  params: 'id (Path param: ID del pedido)',
  body: '{\n  "estado": "En Preparación"\n}',
  response: '{\n  "message": "Estado de comanda actualizado"\n}'
});

// 8. MÓDULO CAJA Y FACTURACIÓN
addSectionHeader('8. Módulo 6: Caja, Facturación y Reportes PDF (/api/caja)');
addEndpointCard({
  method: 'GET',
  path: '/api/caja/pedidos-listos',
  desc: 'Obtiene los pedidos con estado "Servido en Mesa" pendientes de liquidación y facturación en caja.',
  roles: 'Cajero, Administrador, Mesero',
  response: '[\n  { "id_pedido": 41, "numero_mesa": 3, "mesero": "Admin Principal", "total_estimado": 185.00, "detalles": [...] }\n]'
});

addEndpointCard({
  method: 'POST',
  path: '/api/caja/facturar',
  desc: 'Procesa el cobro transaccional de un pedido, genera la factura con IVA y propina voluntaria, cambia el pedido a "Cobrado" y libera la mesa.',
  roles: 'Cajero, Administrador, Mesero',
  body: '{\n  "id_pedido": 41,\n  "id_cliente": 1,\n  "id_metodo_pago": 1,\n  "propina": 15.00\n}',
  code: '201 Created',
  response: '{\n  "message": "Factura emitida y cuenta liquidada exitosamente",\n  "id_factura": 32\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/caja/facturas',
  desc: 'Obtiene el historial de facturas cobradas con filtros de fecha (Guatemala GMT-6), buscador de texto y paginación.',
  roles: 'Cajero, Administrador, Mesero',
  params: 'fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD), period (all/weekly/monthly/yearly), search (string), page (int), limit (int)',
  response: '{\n  "data": [\n    { "id_factura": 31, "id_pedido": 40, "numero_mesa": 2, "cliente": "Consumidor Final", "metodo_pago": "Efectivo", "total_pagado": "75.00", "fecha_hora_pago": "2026-09-08T22:45:00.000Z" }\n  ],\n  "total_registros": 31\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/caja/facturas/:id',
  desc: 'Obtiene el desglose detallado de una factura emitida por su ID numérico.',
  roles: 'Cajero, Administrador, Mesero',
  params: 'id (Path param: ID de la factura)',
  response: '{\n  "id_factura": 31, "id_pedido": 40, "numero_mesa": 2, "subtotal": "66.96", "impuestos": "8.04", "propina": "0.00", "total_pagado": "75.00", "detalle_productos": [...] }\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/caja/facturas/:id/pdf',
  desc: 'Genera y descarga en streaming el comprobante de factura electrónica en formato PDF ticket térmico optimizado (con logotipo en memoria y moneda Quetzales Q).',
  roles: 'Cajero, Administrador, Mesero',
  params: 'id (Path param: ID de la factura)',
  code: '200 OK (Content-Type: application/pdf)',
  response: '[Archivo binario PDF: Factura_PedidoPro_FACPRO00031.pdf]'
});

addEndpointCard({
  method: 'DELETE',
  path: '/api/caja/facturas/:id/anular',
  desc: 'Anula una factura emitida, revierte el estado del pedido a "Servido" y la mesa a "Ocupada".',
  roles: 'Administrador',
  params: 'id (Path param: ID de la factura)',
  response: '{\n  "message": "Factura anulada y pedido revertido exitosamente"\n}'
});

// 9. MÓDULO REPORTES
addSectionHeader('9. Módulo 7: Reportes y Analítica (/api/reportes)');
addEndpointCard({
  method: 'GET',
  path: '/api/reportes/ventas',
  desc: 'Retorna las ventas agrupadas por día con fecha formateada en horario de Guatemala GMT-6.',
  roles: 'Administrador',
  params: 'fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD), limit (int), offset (int)',
  response: '{\n  "data": [\n    { "fecha": "2026-09-08", "total_ventas": "1842.50", "cantidad_facturas": 14, "cantidad_pedidos": 14 }\n  ],\n  "total_registros": 1\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/reportes/productos-top',
  desc: 'Obtiene el ranking de los 10 productos más vendidos históricamente.',
  roles: 'Administrador',
  response: '[\n  { "nombre_producto": "Hamburguesa Gourmet", "total_vendido": 45 },\n  { "nombre_producto": "Costillas BBQ", "total_vendido": 32 }\n]'
});

addEndpointCard({
  method: 'GET',
  path: '/api/reportes/inventario',
  desc: 'Genera el informe de existencias de ingredientes con conteo de niveles críticos, bajos y normales.',
  roles: 'Administrador',
  response: '{\n  "resumen": { "total": 12, "agotados": 0, "stock_bajo": 2, "normales": 10 },\n  "ingredientes": [...]\n}'
});

// 10. MÓDULO DASHBOARDS
addSectionHeader('10. Módulo 8: Dashboards Ejecutivos por Rol (/api/dashboard)');
addEndpointCard({
  method: 'GET',
  path: '/api/dashboard/admin',
  desc: 'Genera el dashboard administrativo integral ejecutando 11 consultas paralelas: ventas del día, ventas del período, pedidos activos, estado de mesas, gráfica de actividad, top platillos e insumos críticos.',
  roles: 'Administrador',
  params: 'period (today, weekly, monthly, yearly)',
  response: '{\n  "ventas_hoy": 1842.50,\n  "ventas_periodo": 12580.00,\n  "pedidos_activos": 3,\n  "mesas_ocupadas": 3,\n  "mesas_libres": 5,\n  "actividad_ventas": [{ "label": "2026-09-08", "total": 1842.50 }],\n  "top_platillos": [...],\n  "insumos_criticos": [...]\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/dashboard/mesero',
  desc: 'Obtiene métricas operativas personalizadas para el mesero (sus pedidos del día, pedidos activos en cocina y mesas asignadas).',
  roles: 'Mesero, Administrador',
  response: '{\n  "pedidos_hoy": 8, "pedidos_activos": 2, "pedidos_listos": 1\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/dashboard/cocina',
  desc: 'Obtiene métricas de carga en cocina (comandas pendientes, en preparación y tiempo promedio).',
  roles: 'Cocinero, Administrador',
  response: '{\n  "comandas_pendientes": 2, "comandas_preparacion": 1, "comandas_listas": 3\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/dashboard/caja',
  desc: 'Obtiene métricas de caja en vivo (total cobrado en el turno, cuentas pendientes de cobro y facturas emitidas).',
  roles: 'Cajero, Administrador',
  response: '{\n  "total_cobrado_hoy": 1842.50, "cuentas_por_cobrar": 3, "facturas_hoy": 14\n}'
});

// 11. MÓDULO CLIENTES
addSectionHeader('11. Módulo 9: Gestión de Clientes y Facturación (/api/clientes)');
addEndpointCard({
  method: 'GET',
  path: '/api/clientes',
  desc: 'Lista todos los clientes registrados para facturación con NIT o Documento.',
  roles: 'Cajero, Administrador, Mesero',
  response: '[\n  { "id_cliente": 1, "nit_documento": "C/F", "nombre_completo": "Consumidor Final" }\n]'
});

addEndpointCard({
  method: 'GET',
  path: '/api/clientes/:id',
  desc: 'Obtiene los datos de un cliente por su identificador.',
  roles: 'Cajero, Administrador, Mesero',
  params: 'id (Path param: ID del cliente)',
  response: '{\n  "id_cliente": 2, "nit_documento": "9482715-3", "nombre_completo": "Corporación Gastronómica S.A."\n}'
});

addEndpointCard({
  method: 'POST',
  path: '/api/clientes',
  desc: 'Registra un nuevo cliente con validación de NIT y correo.',
  roles: 'Cajero, Administrador, Mesero',
  body: '{\n  "nombre_completo": "Juan Pérez",\n  "nit_documento": "1234567-8",\n  "correo_electronico": "juan@example.com"\n}',
  code: '201 Created',
  response: '{\n  "message": "Cliente registrado exitosamente",\n  "id_cliente": 15\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/clientes/:id',
  desc: 'Actualiza los datos de un cliente existente.',
  roles: 'Cajero, Administrador, Mesero',
  params: 'id (Path param: ID del cliente)',
  body: '{\n  "nombre_completo": "Juan Pérez González",\n  "nit_documento": "1234567-8"\n}',
  response: '{\n  "message": "Cliente actualizado exitosamente"\n}'
});

addEndpointCard({
  method: 'DELETE',
  path: '/api/clientes/:id',
  desc: 'Elimina un cliente del registro.',
  roles: 'Cajero, Administrador, Mesero',
  params: 'id (Path param: ID del cliente)',
  response: '{\n  "message": "Cliente eliminado exitosamente"\n}'
});

// 12. MÓDULO INVENTARIO
addSectionHeader('12. Módulo 10: Control de Inventario y Recetas (/api/inventario)');
addEndpointCard({
  method: 'GET',
  path: '/api/inventario/alertas',
  desc: 'Lista los ingredientes con existencias en niveles críticos (stock <= 10).',
  roles: 'Administrador, Cocinero',
  response: '[\n  { "id_ingrediente": 3, "nombre_ingrediente": "Queso Cheddar", "stock_actual": "4.50", "alerta": "Stock Bajo" }\n]'
});

addEndpointCard({
  method: 'GET',
  path: '/api/inventario/ingredientes',
  desc: 'Obtiene el listado general de insumos de almacén con su unidad de medida estandarizada.',
  roles: 'Administrador, Cocinero',
  response: '[\n  { "id_ingrediente": 1, "nombre_ingrediente": "Carne de Res Premium", "unidad_medida": "Libras (lb)", "stock_actual": "50.00" }\n]'
});

addEndpointCard({
  method: 'POST',
  path: '/api/inventario/ingredientes',
  desc: 'Crea un nuevo insumo en inventario seleccionando la unidad de medida del catálogo oficial.',
  roles: 'Administrador',
  body: '{\n  "nombre_ingrediente": "Aguacate Hass",\n  "unidad_medida": "Unidades (u)",\n  "stock_actual": 25.00\n}',
  code: '201 Created',
  response: '{\n  "message": "Ingrediente creado exitosamente",\n  "id_ingrediente": 43\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/inventario/ingredientes/:id',
  desc: 'Actualiza nombre, unidad de medida o existencias de un insumo.',
  roles: 'Administrador',
  params: 'id (Path param: ID de ingrediente)',
  body: '{\n  "nombre_ingrediente": "Aguacate Hass Grande",\n  "unidad_medida": "Unidades (u)",\n  "stock_actual": 30.00\n}',
  response: '{\n  "message": "Ingrediente actualizado exitosamente"\n}'
});

addEndpointCard({
  method: 'DELETE',
  path: '/api/inventario/ingredientes/:id',
  desc: 'Elimina un ingrediente de inventario.',
  roles: 'Administrador',
  params: 'id (Path param: ID de ingrediente)',
  response: '{\n  "message": "Ingrediente eliminado exitosamente"\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/inventario/recetas/:id_producto',
  desc: 'Obtiene la receta técnica oficial de un platillo con los insumos y cantidades requeridas por porción.',
  roles: 'Administrador, Cocinero',
  params: 'id_producto (Path param: ID del producto)',
  response: '[\n  { "id_ingrediente": 1, "nombre_ingrediente": "Carne de Res", "unidad_medida": "Libras (lb)", "cantidad_necesaria": "0.44" }\n]'
});

addEndpointCard({
  method: 'POST',
  path: '/api/inventario/recetas/:id_producto',
  desc: 'Guarda o reescribe transaccionalmente la receta oficial de un platillo.',
  roles: 'Administrador',
  params: 'id_producto (Path param: ID del producto)',
  body: '{\n  "ingredientes": [\n    { "id_ingrediente": 1, "cantidad_necesaria": 0.44 },\n    { "id_ingrediente": 2, "cantidad_necesaria": 1.00 }\n  ]\n}',
  response: '{\n  "message": "Receta guardada exitosamente"\n}'
});

// 13. MÓDULO USUARIOS
addSectionHeader('13. Módulo 11: Usuarios y Cuentas de Acceso (/api/usuarios)');
addEndpointCard({
  method: 'GET',
  path: '/api/usuarios',
  desc: 'Obtiene todos los usuarios del personal del restaurante con su rol y estado de actividad.',
  roles: 'Administrador',
  response: '[\n  { "id_usuario": 1, "nombre": "Admin Principal", "email": "admin@pedidopro.com", "nombre_rol": "Administrador", "activo": 1 }\n]'
});

addEndpointCard({
  method: 'GET',
  path: '/api/usuarios/:id',
  desc: 'Obtiene la información de perfil de un colaborador específico.',
  roles: 'Administrador',
  params: 'id (Path param: ID del usuario)',
  response: '{\n  "id_usuario": 2, "nombre": "Carlos Mesero", "email": "mesero@pedidopro.com", "id_rol": 2, "activo": 1\n}'
});

addEndpointCard({
  method: 'POST',
  path: '/api/usuarios',
  desc: 'Registra un nuevo usuario encriptando la contraseña con algoritmo Bcrypt (10 salt rounds).',
  roles: 'Administrador',
  body: '{\n  "nombre": "Sofia Valdés",\n  "email": "sofia@pedidopro.com",\n  "password": "password123",\n  "id_rol": 2\n}',
  code: '201 Created',
  response: '{\n  "message": "Usuario creado exitosamente",\n  "id_usuario": 16\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/usuarios/:id',
  desc: 'Actualiza nombre, correo o rol de un usuario.',
  roles: 'Administrador',
  params: 'id (Path param: ID del usuario)',
  body: '{\n  "nombre": "Sofia Valdés Mesero",\n  "email": "sofia@pedidopro.com",\n  "id_rol": 2\n}',
  response: '{\n  "message": "Usuario actualizado exitosamente"\n}'
});

addEndpointCard({
  method: 'PATCH',
  path: '/api/usuarios/:id/estado',
  desc: 'Activa o desactiva el acceso de un usuario al sistema.',
  roles: 'Administrador',
  params: 'id (Path param: ID del usuario)',
  body: '{\n  "activo": 0\n}',
  response: '{\n  "message": "Estado del usuario actualizado"\n}'
});

addEndpointCard({
  method: 'PATCH',
  path: '/api/usuarios/:id/password',
  desc: 'Permite al administrador restablecer la contraseña de un usuario.',
  roles: 'Administrador',
  params: 'id (Path param: ID del usuario)',
  body: '{\n  "password": "NuevoPassword2026!"\n}',
  response: '{\n  "message": "Contraseña actualizada exitosamente"\n}'
});

// 14. MÓDULO ROLES
addSectionHeader('14. Módulo 12: Roles y Matriz de Permisos (/api/roles)');
addEndpointCard({
  method: 'GET',
  path: '/api/roles',
  desc: 'Lista los roles disponibles en el sistema (Administrador, Mesero, Cajero, Cocina).',
  roles: 'Administrador',
  response: '[\n  { "id_rol": 1, "nombre_rol": "Administrador" },\n  { "id_rol": 2, "nombre_rol": "Mesero" }\n]'
});

addEndpointCard({
  method: 'POST',
  path: '/api/roles',
  desc: 'Crea un nuevo rol de usuario personalizado.',
  roles: 'Administrador',
  body: '{\n  "nombre_rol": "Supervisor de Salón"\n}',
  code: '201 Created',
  response: '{\n  "message": "Rol creado exitosamente",\n  "id_rol": 6\n}'
});

addEndpointCard({
  method: 'PUT',
  path: '/api/roles/:id',
  desc: 'Renombra un rol existente.',
  roles: 'Administrador',
  params: 'id (Path param: ID del rol)',
  body: '{\n  "nombre_rol": "Capitán de Meseros"\n}',
  response: '{\n  "message": "Rol actualizado exitosamente"\n}'
});

addEndpointCard({
  method: 'DELETE',
  path: '/api/roles/:id',
  desc: 'Elimina un rol del sistema.',
  roles: 'Administrador',
  params: 'id (Path param: ID del rol)',
  response: '{\n  "message": "Rol eliminado exitosamente"\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api/roles/permisos/lista',
  desc: 'Lista todos los permisos granulares disponibles en el sistema.',
  roles: 'Administrador',
  response: '[\n  { "id_permiso": 1, "nombre_permiso": "ver_reportes", "descripcion": "Acceso a reportes financieros" }\n]'
});

addEndpointCard({
  method: 'GET',
  path: '/api/roles/:id/permisos',
  desc: 'Obtiene los permisos asignados a un rol específico.',
  roles: 'Administrador',
  params: 'id (Path param: ID del rol)',
  response: '[\n  { "id_permiso": 1, "nombre_permiso": "ver_reportes" }\n]'
});

addEndpointCard({
  method: 'POST',
  path: '/api/roles/:id/permisos',
  desc: 'Asigna o reconfigura la matriz de permisos para un rol.',
  roles: 'Administrador',
  params: 'id (Path param: ID del rol)',
  body: '{\n  "permisos": [1, 2, 3, 5]\n}',
  response: '{\n  "message": "Permisos asignados exitosamente"\n}'
});

// 15. MÓDULO SALUD Y SWAGGER
addSectionHeader('15. Módulo 13: Monitoreo y Diagnóstico del Servidor (/api/health)');
addEndpointCard({
  method: 'GET',
  path: '/api/health',
  desc: 'Endpoint de comprobación de salud (Healthcheck) para verificar conectividad con la base de datos MySQL en Railway y estado del proceso Node.js.',
  roles: 'Público',
  code: '200 OK',
  response: '{\n  "status": "online",\n  "db_connected": true,\n  "total_usuarios": 12,\n  "timestamp": "2026-09-09T05:15:00.000Z"\n}'
});

addEndpointCard({
  method: 'GET',
  path: '/api-docs',
  desc: 'Interfaz gráfica interactiva de Swagger UI para exploración y prueba directa de endpoints en el navegador.',
  roles: 'Público',
  code: '200 OK (HTML/Swagger UI)',
  response: '[Renderizado interactivo Swagger UI]'
});

// ==========================================
// NUMERACIÓN DE PÁGINAS ESTILO APA (ESQUINA SUPERIOR DERECHA)
// ==========================================
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  
  if (i > 0) { // Omitir número en portada
    doc.font(FONT_REGULAR).fontSize(10).fillColor('#6B7280');
    // Cabecera superior APA
    doc.text('DOCUMENTACIÓN DE ENDPOINTS — PEDIDOPRO API', MARGIN, 36, { width: CONTENT_WIDTH - 40, align: 'left' });
    doc.text(`${i + 1}`, MARGIN + CONTENT_WIDTH - 30, 36, { width: 30, align: 'right' });
    
    // Línea sutil de cabecera
    doc.strokeColor('#E5E7EB').lineWidth(0.5)
       .moveTo(MARGIN, 52).lineTo(MARGIN + CONTENT_WIDTH, 52).stroke();

    // Pie de página
    doc.font(FONT_ITALIC).fontSize(8).fillColor('#9CA3AF');
    doc.text('Sistema Gastronómico PedidoPro · Especificación Oficial de Servicios REST · Normas APA 7ma Edición', MARGIN, PAGE_HEIGHT - 45, { align: 'center', width: CONTENT_WIDTH });
  }
}

doc.end();

stream.on('finish', () => {
  console.log('PDF generado exitosamente en:', outputPath);
});
