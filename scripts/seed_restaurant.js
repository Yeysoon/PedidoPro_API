const db = require('../src/config/db');

async function seedData() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    console.log('[1/4] Limpiando tablas de pedidos, facturas y detalles...');
    await conn.execute('DELETE FROM Facturas_Pagos');
    await conn.execute('DELETE FROM Detalle_Pedido');
    await conn.execute('DELETE FROM Pedidos');
    await conn.execute("UPDATE Mesas SET estado = 'Libre'");

    console.log('[2/4] Limpiando y creando nuevo inventario generoso...');
    await conn.execute('DELETE FROM Recetas_Producto');
    await conn.execute('DELETE FROM Ingredientes');
    await conn.execute('ALTER TABLE Ingredientes AUTO_INCREMENT = 1');

    const insumos = [
      // Carnes y Mariscos
      ['Lomo de Res de Primera', 'Libra', 50.00],
      ['Pechuga de Pollo Fresca', 'Libra', 60.00],
      ['Camarones Jumbo', 'Libra', 40.00],
      ['Carne Molida de Res', 'Libra', 45.00],
      ['Tocino Ahumado', 'Libra', 30.00],
      ['Costilla de Cerdo BBQ', 'Libra', 35.00],
      // Lácteos y Huevos
      ['Queso Mozarella Rallado', 'kg', 35.00],
      ['Queso Cheddar en Rodajas', 'Rodaja', 90.00],
      ['Crema Pura de Vaca', 'Litro', 30.00],
      ['Leche Entera', 'Litro', 45.00],
      ['Mantequilla con Sal', 'Libra', 25.00],
      ['Huevos Frescos de Granja', 'Unidad', 150.00],
      // Vegetales y Frutas
      ['Zanahoria Fresca', 'Libra', 40.00],
      ['Aguacates Hass', 'Unidad', 80.00],
      ['Tomate Manzano', 'Libra', 50.00],
      ['Cebolla Morada', 'Libra', 35.00],
      ['Lechuga Romana', 'Unidad', 35.00],
      ['Papas Russet', 'Libra', 80.00],
      ['Limones Jugosos', 'Unidad', 120.00],
      ['Fresas Frescas', 'Libra', 30.00],
      ['Plátanos Maduros', 'Unidad', 50.00],
      ['Dientes de Ajo', 'Unidad', 90.00],
      ['Cilantro y Hierbas Frescas', 'Manojo', 35.00],
      // Panadería y Abarrotes
      ['Pan Brioche para Hamburguesa', 'Unidad', 70.00],
      ['Pasta Fettuccine', 'Libra', 35.00],
      ['Arroz Blanco de Grano Largo', 'Libra', 60.00],
      ['Frijoles Negros Volteados', 'Libra', 45.00],
      ['Tortillas de Maíz', 'Unidad', 180.00],
      ['Harina de Trigo', 'Libra', 40.00],
      ['Azúcar Morena', 'Libra', 45.00],
      ['Café en Grano Tostado', 'Libra', 30.00],
      ['Chocolate Amargo 70%', 'Libra', 20.00],
      ['Jarabe de Vainilla', 'Botella', 18.00],
      ['Aceite de Oliva Extra Virgen', 'Litro', 25.00],
      ['Salsa de Tomate Casera', 'Litro', 35.00],
      ['Salsa Verde Tradicional', 'Litro', 30.00],
      ['Salsa BBQ Ahumada', 'Litro', 25.00],
      // Bebidas terminadas
      ['Gaseosa en Lata Variada', 'Lata', 120.00],
      ['Cerveza Nacional Artesanal', 'Botella', 80.00],
      ['Agua Pura Embotellada', 'Botella', 90.00]
    ];

    const ingMap = {};
    for (const [nombre, unidad, stock] of insumos) {
      const [res] = await conn.execute(
        'INSERT INTO Ingredientes (nombre_ingrediente, unidad_medida, stock_actual) VALUES (?, ?, ?)',
        [nombre, unidad, stock]
      );
      ingMap[nombre] = res.insertId;
    }
    console.log(`✅ ${Object.keys(ingMap).length} insumos de inventario creados con éxito.`);

    console.log('[3/4] Creando catálogo de platillos...');
    await conn.execute('DELETE FROM Productos');
    await conn.execute('ALTER TABLE Productos AUTO_INCREMENT = 1');

    const productos = [
      // Platos Fuertes (Cat 1)
      { nombre: 'Lomo en Salsa Verde', desc: 'Corte de lomo tierno bañado en salsa verde artesanal con arroz y aguacate.', precio: 125.00, cat: 1,
        receta: [['Lomo de Res de Primera', 1.0], ['Salsa Verde Tradicional', 0.25], ['Aguacates Hass', 1.0], ['Arroz Blanco de Grano Largo', 0.5]] },
      { nombre: 'Hamburguesa Gourmet Brioche', desc: 'Carne 100% de res, queso cheddar derretido, tocino crujiente, vegetales frescos y papas.', precio: 75.00, cat: 1,
        receta: [['Carne Molida de Res', 0.5], ['Pan Brioche para Hamburguesa', 1.0], ['Queso Cheddar en Rodajas', 2.0], ['Tocino Ahumado', 0.2], ['Lechuga Romana', 0.25], ['Tomate Manzano', 0.25], ['Papas Russet', 0.5]] },
      { nombre: 'Pechuga de Pollo con Vegetales', desc: 'Pechuga a la plancha sazonada con mantequilla, zanahorias glaseadas y arroz blanco.', precio: 65.00, cat: 1,
        receta: [['Pechuga de Pollo Fresca', 1.0], ['Zanahoria Fresca', 0.5], ['Mantequilla con Sal', 0.1], ['Arroz Blanco de Grano Largo', 0.5]] },
      { nombre: 'Fettuccine Alfredo con Pollo', desc: 'Pasta fettuccine en salsa cremosa de queso mozarella y mantequilla con pollo en tiras.', precio: 85.00, cat: 1,
        receta: [['Pasta Fettuccine', 0.5], ['Pechuga de Pollo Fresca', 0.5], ['Crema Pura de Vaca', 0.25], ['Queso Mozarella Rallado', 0.2], ['Mantequilla con Sal', 0.1]] },
      { nombre: 'Camarones al Ajillo', desc: 'Camarones jumbo salteados en ajo dorado, aceite de oliva virgen extra y arroz.', precio: 110.00, cat: 1,
        receta: [['Camarones Jumbo', 0.8], ['Dientes de Ajo', 4.0], ['Aceite de Oliva Extra Virgen', 0.1], ['Arroz Blanco de Grano Largo', 0.5], ['Aguacates Hass', 1.0]] },
      { nombre: 'Costillas BBQ Horneadas', desc: 'Costillas tiernas glaseadas en salsa barbacoa ahumada servidas con papas fritas rústicas.', precio: 130.00, cat: 1,
        receta: [['Costilla de Cerdo BBQ', 1.2], ['Salsa BBQ Ahumada', 0.3], ['Papas Russet', 0.8]] },

      // Entradas (Cat 4)
      { nombre: 'Guacamole Tradicional con Totopos', desc: 'Aguacates frescos triturados con cebolla morada, tomate, cilantro y limón.', precio: 45.00, cat: 4,
        receta: [['Aguacates Hass', 2.0], ['Cebolla Morada', 0.2], ['Tomate Manzano', 0.25], ['Limones Jugosos', 2.0], ['Cilantro y Hierbas Frescas', 0.2]] },
      { nombre: 'Papas Rústicas con Queso y Tocino', desc: 'Papas doradas cubiertas con queso cheddar fundido y trocitos de tocino.', precio: 40.00, cat: 4,
        receta: [['Papas Russet', 1.0], ['Queso Cheddar en Rodajas', 2.0], ['Tocino Ahumado', 0.25]] },
      { nombre: 'Dedos de Mozarella Empanizados', desc: 'Crujientes barras de mozarella servidas con dip de salsa de tomate casera.', precio: 48.00, cat: 4,
        receta: [['Queso Mozarella Rallado', 0.3], ['Harina de Trigo', 0.2], ['Huevos Frescos de Granja', 1.0], ['Salsa de Tomate Casera', 0.15]] },
      { nombre: 'Tacos Crujientes de Pollo (3 uds)', desc: 'Tortillas de maíz rellenas de pollo deshebrado, crema pura y lechuga fresca.', precio: 42.00, cat: 4,
        receta: [['Pechuga de Pollo Fresca', 0.4], ['Tortillas de Maíz', 3.0], ['Crema Pura de Vaca', 0.1], ['Lechuga Romana', 0.2]] },

      // Postres (Cat 3)
      { nombre: 'Volcán de Chocolate Fundido', desc: 'Pastel tibio de chocolate 70% con centro líquido y fresas frescas.', precio: 45.00, cat: 3,
        receta: [['Chocolate Amargo 70%', 0.3], ['Harina de Trigo', 0.15], ['Huevos Frescos de Granja', 2.0], ['Mantequilla con Sal', 0.15], ['Fresas Frescas', 0.3], ['Azúcar Morena', 0.2]] },
      { nombre: 'Cheesecake Casero de Fresa', desc: 'Base crujiente con suave crema de queso y mermelada artesanal de fresa.', precio: 38.00, cat: 3,
        receta: [['Queso Mozarella Rallado', 0.25], ['Crema Pura de Vaca', 0.2], ['Fresas Frescas', 0.4], ['Azúcar Morena', 0.2], ['Jarabe de Vainilla', 0.05]] },
      { nombre: 'Plátanos en Gloria con Crema', desc: 'Plátanos maduros fritos acompañados de crema fresca y azúcar morena.', precio: 28.00, cat: 3,
        receta: [['Plátanos Maduros', 2.0], ['Crema Pura de Vaca', 0.15], ['Azúcar Morena', 0.1]] },

      // Bebidas (Cat 2)
      { nombre: 'Limonada con Fresa Natural', desc: 'Bebida refrescante de limón criollo exprimido al momento con fresas naturales.', precio: 25.00, cat: 2,
        receta: [['Limones Jugosos', 3.0], ['Fresas Frescas', 0.25], ['Azúcar Morena', 0.15], ['Agua Pura Embotellada', 1.0]] },
      { nombre: 'Café Americano Gourmet', desc: 'Café de altura recién molido con notas achocolatadas.', precio: 20.00, cat: 2,
        receta: [['Café en Grano Tostado', 0.1], ['Azúcar Morena', 0.05], ['Agua Pura Embotellada', 0.5]] },
      { nombre: 'Gaseosa en Lata', desc: 'Gaseosa helada a elección.', precio: 15.00, cat: 2,
        receta: [['Gaseosa en Lata Variada', 1.0]] },
      { nombre: 'Cerveza Artesanal Nacional', desc: 'Cerveza rubia bien fría de producción nacional.', precio: 30.00, cat: 2,
        receta: [['Cerveza Nacional Artesanal', 1.0]] }
    ];

    console.log('[4/4] Insertando productos y vinculando recetas oficiales...');
    for (const prod of productos) {
      const [pRes] = await conn.execute(
        'INSERT INTO Productos (id_categoria, nombre_producto, descripcion, precio, disponible) VALUES (?, ?, ?, ?, 1)',
        [prod.cat, prod.nombre, prod.desc, prod.precio]
      );
      const prodId = pRes.insertId;

      for (const [nomIng, cant] of prod.receta) {
        const ingId = ingMap[nomIng];
        if (ingId) {
          await conn.execute(
            'INSERT INTO Recetas_Producto (id_producto, id_ingrediente, cantidad_necesaria) VALUES (?, ?, ?)',
            [prodId, ingId, cant]
          );
        } else {
          console.warn('⚠️ Ingrediente no encontrado:', nomIng);
        }
      }
    }

    await conn.commit();
    console.log('🎉 Base de datos restaurada y poblada con éxito!');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error durante el seed:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedData();
