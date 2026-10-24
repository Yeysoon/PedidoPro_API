-- =============================================================================
-- SISTEMA GASTRONÓMICO Y DE RESTAURANTE: PEDIDOPRO
-- SCRIPT COMPLETO DE BASE DE DATOS (ESQUEMA, TABLAS, ÍNDICES, VISTAS, SPs Y DATOS INICIALES)
-- Compatible con: MySQL 8.0+ / MariaDB 10.5+ / Railway / AWS RDS / GCP Cloud SQL
-- =============================================================================

-- Usar la base de datos por defecto de Railway
USE `railway`;

-- Desactivar temporalmente validación de llaves foráneas para recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. ELIMINACIÓN DE TABLAS PREVIAS (SI EXISTEN)
-- =============================================================================
DROP TABLE IF EXISTS `Facturas_Pagos`;
DROP TABLE IF EXISTS `Metodos_Pago`;
DROP TABLE IF EXISTS `Detalle_Pedido`;
DROP TABLE IF EXISTS `Pedidos`;
DROP TABLE IF EXISTS `Estados_Pedido`;
DROP TABLE IF EXISTS `Recetas_Producto`;
DROP TABLE IF EXISTS `Ingredientes`;
DROP TABLE IF EXISTS `Productos`;
DROP TABLE IF EXISTS `Categorias_Menu`;
DROP TABLE IF EXISTS `Mesas`;
DROP TABLE IF EXISTS `Zonas_Restaurante`;
DROP TABLE IF EXISTS `Clientes`;
DROP TABLE IF EXISTS `Rol_Permisos`;
DROP TABLE IF EXISTS `Permisos`;
DROP TABLE IF EXISTS `Usuarios`;
DROP TABLE IF EXISTS `Roles`;

-- =============================================================================
-- 2. TABLAS DE AUTENTICACIÓN, ROLES Y PERMISOS
-- =============================================================================

-- Tabla: Roles
CREATE TABLE `Roles` (
  `id_rol` INT NOT NULL AUTO_INCREMENT,
  `nombre_rol` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Permisos
CREATE TABLE `Permisos` (
  `id_permiso` INT NOT NULL AUTO_INCREMENT,
  `nombre_permiso` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_permiso`),
  UNIQUE KEY `uq_nombre_permiso` (`nombre_permiso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Intermedia: Rol_Permisos
CREATE TABLE `Rol_Permisos` (
  `id_rol` INT NOT NULL,
  `id_permiso` INT NOT NULL,
  PRIMARY KEY (`id_rol`, `id_permiso`),
  KEY `FK_RolPermiso_Permiso` (`id_permiso`),
  CONSTRAINT `FK_RolPermiso_Rol` FOREIGN KEY (`id_rol`) REFERENCES `Roles` (`id_rol`) ON DELETE CASCADE,
  CONSTRAINT `FK_RolPermiso_Permiso` FOREIGN KEY (`id_permiso`) REFERENCES `Permisos` (`id_permiso`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Usuarios
CREATE TABLE `Usuarios` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `id_rol` INT NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `contrasena_hash` VARCHAR(255) NOT NULL,
  `activo` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  KEY `FK_Usuarios_Roles` (`id_rol`),
  CONSTRAINT `FK_Usuarios_Roles` FOREIGN KEY (`id_rol`) REFERENCES `Roles` (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. TABLAS DE CLIENTES Y DISTRIBUCIÓN DEL SALÓN (MESAS Y ZONAS)
-- =============================================================================

-- Tabla: Clientes
CREATE TABLE `Clientes` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nit_documento` VARCHAR(20) DEFAULT NULL,
  `nombre_completo` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `uq_cliente_nit` (`nit_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Zonas_Restaurante
CREATE TABLE `Zonas_Restaurante` (
  `id_zona` INT NOT NULL AUTO_INCREMENT,
  `nombre_zona` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_zona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Mesas
CREATE TABLE `Mesas` (
  `id_mesa` INT NOT NULL AUTO_INCREMENT,
  `id_zona` INT NOT NULL,
  `numero_mesa` INT NOT NULL,
  `capacidad` INT NOT NULL DEFAULT 4,
  `estado` VARCHAR(20) DEFAULT 'Libre',
  PRIMARY KEY (`id_mesa`),
  UNIQUE KEY `uq_numero_mesa` (`numero_mesa`),
  KEY `FK_Mesas_Zonas` (`id_zona`),
  CONSTRAINT `FK_Mesas_Zonas` FOREIGN KEY (`id_zona`) REFERENCES `Zonas_Restaurante` (`id_zona`),
  CONSTRAINT `CHK_EstadoMesa` CHECK (`estado` IN ('Libre', 'Ocupada', 'Reservada', 'Mantenimiento'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. TABLAS DE MENÚ, PLATILLOS, INVENTARIO Y RECETAS
-- =============================================================================

-- Tabla: Categorias_Menu
CREATE TABLE `Categorias_Menu` (
  `id_categoria` INT NOT NULL AUTO_INCREMENT,
  `nombre_categoria` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `uq_nombre_categoria` (`nombre_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Productos (Platillos y Bebidas del Menú)
CREATE TABLE `Productos` (
  `id_producto` INT NOT NULL AUTO_INCREMENT,
  `id_categoria` INT NOT NULL,
  `nombre_producto` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `disponible` TINYINT(1) DEFAULT 1,
  `imagen_url` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_producto`),
  KEY `FK_Productos_Categorias` (`id_categoria`),
  CONSTRAINT `FK_Productos_Categorias` FOREIGN KEY (`id_categoria`) REFERENCES `Categorias_Menu` (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Ingredientes (Control de Inventario)
CREATE TABLE `Ingredientes` (
  `id_ingrediente` INT NOT NULL AUTO_INCREMENT,
  `nombre_ingrediente` VARCHAR(100) NOT NULL,
  `unidad_medida` VARCHAR(50) NOT NULL,
  `stock_actual` DECIMAL(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id_ingrediente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Recetas_Producto (Ingredientes necesarios por cada producto)
CREATE TABLE `Recetas_Producto` (
  `id_producto` INT NOT NULL,
  `id_ingrediente` INT NOT NULL,
  `cantidad_necesaria` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_producto`, `id_ingrediente`),
  KEY `FK_Receta_Ingrediente` (`id_ingrediente`),
  CONSTRAINT `FK_Receta_Producto` FOREIGN KEY (`id_producto`) REFERENCES `Productos` (`id_producto`) ON DELETE CASCADE,
  CONSTRAINT `FK_Receta_Ingrediente` FOREIGN KEY (`id_ingrediente`) REFERENCES `Ingredientes` (`id_ingrediente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. TABLAS DE PEDIDOS, COMANDAS Y DETALLES
-- =============================================================================

-- Tabla: Estados_Pedido
CREATE TABLE `Estados_Pedido` (
  `id_estado` INT NOT NULL AUTO_INCREMENT,
  `nombre_estado` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `uq_nombre_estado` (`nombre_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Pedidos
CREATE TABLE `Pedidos` (
  `id_pedido` INT NOT NULL AUTO_INCREMENT,
  `id_mesa` INT NOT NULL,
  `id_usuario_mesero` INT NOT NULL,
  `id_estado` INT NOT NULL,
  `fecha_hora_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `notas_generales` VARCHAR(255) DEFAULT NULL,
  `id_cliente` INT DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `FK_Pedidos_Mesas` (`id_mesa`),
  KEY `FK_Pedidos_Usuarios` (`id_usuario_mesero`),
  KEY `FK_Pedidos_Estados` (`id_estado`),
  KEY `idx_pedidos_fecha` (`fecha_hora_creacion`),
  CONSTRAINT `FK_Pedidos_Mesas` FOREIGN KEY (`id_mesa`) REFERENCES `Mesas` (`id_mesa`),
  CONSTRAINT `FK_Pedidos_Usuarios` FOREIGN KEY (`id_usuario_mesero`) REFERENCES `Usuarios` (`id_usuario`),
  CONSTRAINT `FK_Pedidos_Estados` FOREIGN KEY (`id_estado`) REFERENCES `Estados_Pedido` (`id_estado`),
  CONSTRAINT `FK_Pedidos_Clientes` FOREIGN KEY (`id_cliente`) REFERENCES `Clientes` (`id_cliente`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Detalle_Pedido
CREATE TABLE `Detalle_Pedido` (
  `id_detalle` INT NOT NULL AUTO_INCREMENT,
  `id_pedido` INT NOT NULL,
  `id_producto` INT NOT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario_historico` DECIMAL(10,2) NOT NULL,
  `notas_especiales` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `FK_Detalle_Pedidos` (`id_pedido`),
  KEY `FK_Detalle_Productos` (`id_producto`),
  CONSTRAINT `FK_Detalle_Pedidos` FOREIGN KEY (`id_pedido`) REFERENCES `Pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `FK_Detalle_Productos` FOREIGN KEY (`id_producto`) REFERENCES `Productos` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. TABLAS DE CAJA, FACTURACIÓN Y PAGOS
-- =============================================================================

-- Tabla: Metodos_Pago
CREATE TABLE `Metodos_Pago` (
  `id_metodo` INT NOT NULL AUTO_INCREMENT,
  `nombre_metodo` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_metodo`),
  UNIQUE KEY `uq_nombre_metodo` (`nombre_metodo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: Facturas_Pagos
CREATE TABLE `Facturas_Pagos` (
  `id_factura` INT NOT NULL AUTO_INCREMENT,
  `id_pedido` INT NOT NULL,
  `id_cliente` INT DEFAULT NULL,
  `id_usuario_cajero` INT NOT NULL,
  `id_metodo_pago` INT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `impuestos` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_pagado` DECIMAL(10,2) NOT NULL,
  `propina` DECIMAL(10,2) DEFAULT 0.00,
  `fecha_hora_pago` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_factura`),
  UNIQUE KEY `uq_factura_pedido` (`id_pedido`),
  KEY `FK_Facturas_Clientes` (`id_cliente`),
  KEY `FK_Facturas_Usuarios` (`id_usuario_cajero`),
  KEY `FK_Facturas_Metodos` (`id_metodo_pago`),
  KEY `idx_facturas_fecha` (`fecha_hora_pago`),
  CONSTRAINT `FK_Facturas_Pedidos` FOREIGN KEY (`id_pedido`) REFERENCES `Pedidos` (`id_pedido`),
  CONSTRAINT `FK_Facturas_Clientes` FOREIGN KEY (`id_cliente`) REFERENCES `Clientes` (`id_cliente`) ON DELETE SET NULL,
  CONSTRAINT `FK_Facturas_Usuarios` FOREIGN KEY (`id_usuario_cajero`) REFERENCES `Usuarios` (`id_usuario`),
  CONSTRAINT `FK_Facturas_Metodos` FOREIGN KEY (`id_metodo_pago`) REFERENCES `Metodos_Pago` (`id_metodo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reactivar validación de llaves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 7. VISTAS ANALÍTICAS Y OPERATIVAS
-- =============================================================================

-- Vista: Resumen de Pedidos Activos en Sala y Cocina
CREATE OR REPLACE VIEW `vw_pedidos_activos` AS
SELECT 
    p.id_pedido,
    p.fecha_hora_creacion,
    CONVERT_TZ(p.fecha_hora_creacion, '+00:00', '-06:00') AS fecha_hora_guatemala,
    p.notas_generales,
    m.numero_mesa,
    z.nombre_zona,
    ep.nombre_estado AS estado_pedido,
    u.nombre AS mesero,
    COALESCE(c.nombre_completo, 'Consumidor Final') AS cliente,
    COALESCE(c.nit_documento, 'C/F') AS cliente_nit,
    (SELECT SUM(dp.cantidad * dp.precio_unitario_historico) FROM Detalle_Pedido dp WHERE dp.id_pedido = p.id_pedido) AS total_pedido
FROM Pedidos p
JOIN Mesas m ON p.id_mesa = m.id_mesa
JOIN Zonas_Restaurante z ON m.id_zona = z.id_zona
JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario
LEFT JOIN Clientes c ON p.id_cliente = c.id_cliente
WHERE ep.nombre_estado NOT IN ('Cobrado', 'Cancelado');

-- Vista: Historial Completo de Facturas y Cobros
CREATE OR REPLACE VIEW `vw_historial_facturas` AS
SELECT 
    f.id_factura,
    LPAD(f.id_factura, 5, '0') AS factura_formato,
    f.id_pedido,
    f.fecha_hora_pago,
    CONVERT_TZ(f.fecha_hora_pago, '+00:00', '-06:00') AS fecha_pago_guatemala,
    DATE(CONVERT_TZ(f.fecha_hora_pago, '+00:00', '-06:00')) AS fecha_dia,
    f.subtotal,
    f.impuestos,
    f.propina,
    f.total_pagado,
    mp.nombre_metodo AS metodo_pago,
    COALESCE(c.nombre_completo, 'Consumidor Final') AS cliente,
    COALESCE(c.nit_documento, 'C/F') AS cliente_nit,
    u.nombre AS cajero,
    COALESCE(um.nombre, 'Mesero') AS mesero,
    m.numero_mesa
FROM Facturas_Pagos f
JOIN Metodos_Pago mp ON f.id_metodo_pago = mp.id_metodo
JOIN Pedidos p ON f.id_pedido = p.id_pedido
JOIN Mesas m ON p.id_mesa = m.id_mesa
JOIN Usuarios u ON f.id_usuario_cajero = u.id_usuario
LEFT JOIN Usuarios um ON p.id_usuario_mesero = um.id_usuario
LEFT JOIN Clientes c ON f.id_cliente = c.id_cliente;

-- Vista: Estado Crítico de Inventario
CREATE OR REPLACE VIEW `vw_inventario_critico` AS
SELECT 
    i.id_ingrediente,
    i.nombre_ingrediente,
    i.unidad_medida,
    i.stock_actual,
    10.00 AS stock_minimo_referencial,
    CASE 
        WHEN i.stock_actual = 0 THEN 'Agotado'
        WHEN i.stock_actual <= 10 THEN 'Stock Bajo'
        ELSE 'Óptimo'
    END AS estado_existencia,
    COUNT(rp.id_producto) AS platillos_asociados
FROM Ingredientes i
LEFT JOIN Recetas_Producto rp ON i.id_ingrediente = rp.id_ingrediente
GROUP BY i.id_ingrediente, i.nombre_ingrediente, i.unidad_medida, i.stock_actual;

-- =============================================================================
-- 8. PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES)
-- =============================================================================

DELIMITER $$

-- SP 1: Cobrar Pedido y Generar Factura
DROP PROCEDURE IF EXISTS `sp_CobrarPedido`$$
CREATE PROCEDURE `sp_CobrarPedido`(
    IN p_id_pedido INT,
    IN p_id_cliente INT,
    IN p_id_usuario_cajero INT,
    IN p_id_metodo_pago INT,
    IN p_propina DECIMAL(10,2),
    OUT p_id_factura INT
)
BEGIN
    DECLARE v_subtotal DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_impuestos DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_total DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_id_mesa INT;
    DECLARE v_id_estado_cobrado INT DEFAULT 6;

    -- Manejo de transacción
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 1. Calcular subtotal de consumo
    SELECT COALESCE(SUM(cantidad * precio_unitario_historico), 0.00)
    INTO v_subtotal
    FROM Detalle_Pedido
    WHERE id_pedido = p_id_pedido;

    SET v_impuestos = ROUND((v_subtotal / 1.12) * 0.12, 2); -- IVA 12% incluido en el consumo
    SET v_total = v_subtotal + COALESCE(p_propina, 0.00);

    -- 2. Insertar Registro de Factura
    INSERT INTO Facturas_Pagos (
        id_pedido, id_cliente, id_usuario_cajero, id_metodo_pago,
        subtotal, impuestos, total_pagado, propina, fecha_hora_pago
    ) VALUES (
        p_id_pedido, p_id_cliente, p_id_usuario_cajero, p_id_metodo_pago,
        v_subtotal, v_impuestos, v_total, COALESCE(p_propina, 0.00), NOW()
    );
    SET p_id_factura = LAST_INSERT_ID();

    -- 3. Obtener id del estado 'Cobrado'
    SELECT id_estado INTO v_id_estado_cobrado FROM Estados_Pedido WHERE nombre_estado = 'Cobrado' LIMIT 1;
    IF v_id_estado_cobrado IS NULL THEN
        SET v_id_estado_cobrado = 6;
    END IF;

    -- 4. Actualizar estado del pedido a 'Cobrado'
    UPDATE Pedidos SET id_estado = v_id_estado_cobrado WHERE id_pedido = p_id_pedido;

    -- 5. Liberar la mesa correspondiente
    SELECT id_mesa INTO v_id_mesa FROM Pedidos WHERE id_pedido = p_id_pedido LIMIT 1;
    IF v_id_mesa IS NOT NULL THEN
        UPDATE Mesas SET estado = 'Libre' WHERE id_mesa = v_id_mesa;
    END IF;

    COMMIT;
END$$

-- SP 2: Actualizar Estado de Comanda y Descontar Inventario Automáticamente
DROP PROCEDURE IF EXISTS `sp_ActualizarEstadoComanda`$$
CREATE PROCEDURE `sp_ActualizarEstadoComanda`(
    IN p_id_pedido INT,
    IN p_nuevo_estado_id INT
)
BEGIN
    DECLARE v_estado_anterior INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT id_estado INTO v_estado_anterior FROM Pedidos WHERE id_pedido = p_id_pedido;

    -- Si pasa de 'Pendiente' (1) a 'En Preparación' (>= 2), descontar ingredientes
    IF v_estado_anterior = 1 AND p_nuevo_estado_id >= 2 THEN
        UPDATE Ingredientes i
        JOIN Recetas_Producto rp ON i.id_ingrediente = rp.id_ingrediente
        JOIN Detalle_Pedido dp ON rp.id_producto = dp.id_producto
        SET i.stock_actual = GREATEST(0, i.stock_actual - (rp.cantidad_necesaria * dp.cantidad))
        WHERE dp.id_pedido = p_id_pedido;
    END IF;

    -- Actualizar estado del pedido
    UPDATE Pedidos SET id_estado = p_nuevo_estado_id WHERE id_pedido = p_id_pedido;

    COMMIT;
END$$

DELIMITER ;

-- =============================================================================
-- 9. DATOS SEMILLA E INICIALIZACIÓN (SEED DATA)
-- =============================================================================

-- Inserción de Roles
INSERT INTO `Roles` (`id_rol`, `nombre_rol`) VALUES
(1, 'Administrador'),
(2, 'Mesero'),
(3, 'Cajero'),
(4, 'Cocinero')
ON DUPLICATE KEY UPDATE nombre_rol = VALUES(nombre_rol);

-- Inserción de Estados de Pedido
INSERT INTO `Estados_Pedido` (`id_estado`, `nombre_estado`) VALUES
(1, 'Pendiente'),
(2, 'En Preparación'),
(3, 'Listo'),
(4, 'Servido'),
(5, 'Cancelado'),
(6, 'Cobrado')
ON DUPLICATE KEY UPDATE nombre_estado = VALUES(nombre_estado);

-- Inserción de Métodos de Pago
INSERT INTO `Metodos_Pago` (`id_metodo`, `nombre_metodo`) VALUES
(1, 'Efectivo'),
(2, 'Tarjeta de Crédito / Débito'),
(3, 'Transferencia Bancaria')
ON DUPLICATE KEY UPDATE nombre_metodo = VALUES(nombre_metodo);

-- Inserción de Zonas del Restaurante
INSERT INTO `Zonas_Restaurante` (`id_zona`, `nombre_zona`) VALUES
(1, 'Salón Principal'),
(2, 'Terraza'),
(3, 'Área VIP'),
(4, 'Barra')
ON DUPLICATE KEY UPDATE nombre_zona = VALUES(nombre_zona);

-- Inserción de Mesas Iniciales
INSERT INTO `Mesas` (`id_mesa`, `id_zona`, `numero_mesa`, `capacidad`, `estado`) VALUES
(1, 1, 1, 4, 'Libre'),
(2, 1, 2, 4, 'Libre'),
(3, 1, 3, 6, 'Libre'),
(4, 2, 4, 2, 'Libre'),
(5, 2, 5, 4, 'Libre'),
(6, 3, 6, 8, 'Libre'),
(7, 4, 7, 2, 'Libre'),
(8, 4, 8, 2, 'Libre')
ON DUPLICATE KEY UPDATE numero_mesa = VALUES(numero_mesa);

-- Inserción de Categorías del Menú
INSERT INTO `Categorias_Menu` (`id_categoria`, `nombre_categoria`) VALUES
(1, 'Entradas'),
(2, 'Platos Fuertes'),
(3, 'Bebidas'),
(4, 'Postres'),
(5, 'Especialidades')
ON DUPLICATE KEY UPDATE nombre_categoria = VALUES(nombre_categoria);

-- Inserción de Usuarios por Defecto (Contraseña por defecto: 'admin123' y '123456' con hash bcrypt)
INSERT INTO `Usuarios` (`id_usuario`, `id_rol`, `nombre`, `email`, `contrasena_hash`, `activo`) VALUES
(1, 1, 'Admin Principal', 'admin@pedidopro.com', '$2b$10$vN4/1X159i/U7hI10v3CjOz5dE3zPq974Z8v7hG8s8b3/N1j8wBae', 1),
(2, 2, 'Carlos Mesero', 'mesero@pedidopro.com', '$2b$10$vN4/1X159i/U7hI10v3CjOz5dE3zPq974Z8v7hG8s8b3/N1j8wBae', 1),
(3, 3, 'Ana Cajera', 'cajero@pedidopro.com', '$2b$10$vN4/1X159i/U7hI10v3CjOz5dE3zPq974Z8v7hG8s8b3/N1j8wBae', 1),
(4, 4, 'Chef Mario', 'cocina@pedidopro.com', '$2b$10$vN4/1X159i/U7hI10v3CjOz5dE3zPq974Z8v7hG8s8b3/N1j8wBae', 1)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Inserción de Cliente Inicial (Consumidor Final)
INSERT INTO `Clientes` (`id_cliente`, `nit_documento`, `nombre_completo`) VALUES
(1, 'C/F', 'Consumidor Final')
ON DUPLICATE KEY UPDATE nit_documento = VALUES(nit_documento);

-- Inserción de Insumos / Ingredientes de Inventario Base
INSERT INTO `Ingredientes` (`id_ingrediente`, `nombre_ingrediente`, `unidad_medida`, `stock_actual`) VALUES
(1, 'Carne de Res Premium (Molida)', 'Libras (lb)', 50.00),
(2, 'Pan Brioche Artesanal', 'Unidades (u)', 80.00),
(3, 'Queso Cheddar Madurado', 'Libras (lb)', 25.00),
(4, 'Pechuga de Pollo Fresca', 'Libras (lb)', 40.00),
(5, 'Tortillas de Maíz', 'Unidades (u)', 200.00),
(6, 'Tomate Roma Fresco', 'Libras (lb)', 35.00),
(7, 'Lechuga Romana', 'Unidades (u)', 30.00),
(8, 'Papas Russet para Freír', 'Libras (lb)', 60.00),
(9, 'Costillas de Cerdo Seleccionadas', 'Libras (lb)', 45.00),
(10, 'Salsa BBQ Ahumada', 'Litros (L)', 15.00),
(11, 'Café Espresso Gourmet en Grano', 'Libras (lb)', 20.00),
(12, 'Leche Entera Pasteurizada', 'Litros (L)', 30.00),
(13, 'Camarones Jumbo Limpios', 'Libras (lb)', 40.00),
(14, 'Dientes de Ajo Fresco', 'Libras (lb)', 15.00),
(15, 'Aceite de Oliva Extra Virgen', 'Litros (L)', 20.00),
(16, 'Perejil Fresco Picado', 'Libras (lb)', 10.00),
(17, 'Limón Persa Fresco', 'Libras (lb)', 35.00),
(18, 'Hierbabuena Fresca en Hoja', 'Libras (lb)', 15.00),
(19, 'Jarabe de Azúcar de Caña', 'Litros (L)', 25.00),
(20, 'Chocolate Amargo 70% Repostería', 'Libras (lb)', 30.00),
(21, 'Harina de Trigo para Bizcocho', 'Libras (lb)', 40.00),
(22, 'Helado Artesanal de Vainilla', 'Litros (L)', 20.00),
(23, 'Mantequilla sin Sal', 'Libras (lb)', 25.00)
ON DUPLICATE KEY UPDATE nombre_ingrediente = VALUES(nombre_ingrediente);

-- Inserción de Productos del Menú
INSERT INTO `Productos` (`id_producto`, `id_categoria`, `nombre_producto`, `descripcion`, `precio`, `disponible`) VALUES
(1, 2, 'Hamburguesa Gourmet Brioche', 'Carne 100% Angus 200g, queso cheddar madurado, tocino crujiente y pan brioche.', 75.00, 1),
(2, 1, 'Tacos Crujientes de Pollo (3 uds)', 'Deliciosas tortillas de maíz doradas con pollo desmenuzado, crema y guacamole.', 42.00, 1),
(3, 2, 'Costillas BBQ Horneadas', 'Costillas de cerdo marinadas por 12 horas y glaseadas con salsa BBQ ahumada.', 130.00, 1),
(4, 2, 'Camarones al Ajillo', 'Camarones salteados al vino blanco con ajo dorado y perejil fresco.', 110.00, 1),
(5, 3, 'Limonada con Hierbabuena', 'Bebida refrescante natural con limón persa y toque de menta.', 22.00, 1),
(6, 3, 'Café Capuchino Artesanal', 'Espresso doble con leche vaporizada y microespuma cremosa.', 25.00, 1),
(7, 4, 'Pastel de Chocolate Volcán', 'Bizcocho relleno de chocolate líquido caliente con helado de vainilla.', 45.00, 1)
ON DUPLICATE KEY UPDATE nombre_producto = VALUES(nombre_producto);

-- Inserción de Recetas (Vinculación de Ingredientes a Platillos)
INSERT INTO `Recetas_Producto` (`id_producto`, `id_ingrediente`, `cantidad_necesaria`) VALUES
(1, 1, 0.44), -- 200g carne
(1, 2, 1.00), -- 1 pan brioche
(1, 3, 0.10), -- queso cheddar
(1, 6, 0.15), -- tomate
(1, 7, 0.10), -- lechuga
(2, 4, 0.35), -- pollo
(2, 5, 3.00), -- 3 tortillas
(3, 9, 1.20), -- costillas
(3, 10, 0.15),-- salsa bbq
(4, 13, 0.50),-- camarones jumbo
(4, 14, 0.05),-- ajo fresco
(4, 15, 0.05),-- aceite de oliva
(4, 16, 0.02),-- perejil fresco
(5, 17, 0.25),-- limon persa
(5, 18, 0.05),-- hierbabuena fresca
(5, 19, 0.05),-- jarabe de azucar
(6, 11, 0.05),-- cafe
(6, 12, 0.20),-- leche
(7, 20, 0.25),-- chocolate amargo
(7, 21, 0.15),-- harina de trigo
(7, 22, 0.10),-- helado de vainilla
(7, 23, 0.08) -- mantequilla
ON DUPLICATE KEY UPDATE cantidad_necesaria = VALUES(cantidad_necesaria);

-- =============================================================================
-- FIN DEL SCRIPT PEDIDOPRO
-- =============================================================================
