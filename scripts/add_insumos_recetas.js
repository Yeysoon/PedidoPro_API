const db = require('../src/config/db');

async function run() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    console.log('[1/3] Insertando nuevos insumos en Inventario...');

    const nuevosIngredientes = [
      ['Camarones Jumbo Limpios', 'Libras (lb)', 40.00],
      ['Dientes de Ajo Fresco', 'Libras (lb)', 15.00],
      ['Aceite de Oliva Extra Virgen', 'Litros (L)', 20.00],
      ['Perejil Fresco Picado', 'Libras (lb)', 10.00],
      ['Limón Persa Fresco', 'Libras (lb)', 35.00],
      ['Hierbabuena Fresca en Hoja', 'Libras (lb)', 15.00],
      ['Jarabe de Azúcar de Caña', 'Litros (L)', 25.00],
      ['Chocolate Amargo 70% Repostería', 'Libras (lb)', 30.00],
      ['Harina de Trigo para Bizcocho', 'Libras (lb)', 40.00],
      ['Helado Artesanal de Vainilla', 'Litros (L)', 20.00],
      ['Mantequilla sin Sal', 'Libras (lb)', 25.00]
    ];

    for (const [nom, unidad, stock] of nuevosIngredientes) {
      await conn.execute(
        "INSERT INTO Ingredientes (nombre_ingrediente, unidad_medida, stock_actual) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE nombre_ingrediente = VALUES(nombre_ingrediente)",
        [nom, unidad, stock]
      );
    }

    console.log('[2/3] Mapeando productos e ingredientes...');
    const [ingRows] = await conn.execute("SELECT id_ingrediente, nombre_ingrediente FROM Ingredientes");
    const ingMap = {};
    ingRows.forEach(r => { ingMap[r.nombre_ingrediente] = r.id_ingrediente; });

    const [prodRows] = await conn.execute("SELECT id_producto, nombre_producto FROM Productos");
    const prodMap = {};
    prodRows.forEach(r => { prodMap[r.nombre_producto.toLowerCase().trim()] = r.id_producto; });

    console.log('[3/3] Vinculando recetas a Camarones al Ajillo, Limonada y Pastel...');
    const recetas = [
      {
        nombre: 'camarones al ajillo',
        items: [
          ['Camarones Jumbo Limpios', 0.50],
          ['Dientes de Ajo Fresco', 0.05],
          ['Aceite de Oliva Extra Virgen', 0.05],
          ['Perejil Fresco Picado', 0.02]
        ]
      },
      {
        nombre: 'limonada con hierbabuena',
        items: [
          ['Limón Persa Fresco', 0.25],
          ['Hierbabuena Fresca en Hoja', 0.05],
          ['Jarabe de Azúcar de Caña', 0.05]
        ]
      },
      {
        nombre: 'pastel de chocolate volcán',
        items: [
          ['Chocolate Amargo 70% Repostería', 0.25],
          ['Harina de Trigo para Bizcocho', 0.15],
          ['Helado Artesanal de Vainilla', 0.10],
          ['Mantequilla sin Sal', 0.08]
        ]
      }
    ];

    for (const rec of recetas) {
      let idProd = prodMap[rec.nombre];
      if (!idProd) {
        const matchKey = Object.keys(prodMap).find(k => k.includes(rec.nombre.slice(0, 10)));
        if (matchKey) idProd = prodMap[matchKey];
      }
      if (idProd) {
        for (const [nomIng, cant] of rec.items) {
          const idIng = ingMap[nomIng];
          if (idIng) {
            await conn.execute(
              "INSERT INTO Recetas_Producto (id_producto, id_ingrediente, cantidad_necesaria) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cantidad_necesaria = VALUES(cantidad_necesaria)",
              [idProd, idIng, cant]
            );
          }
        }
      }
    }

    await conn.commit();
    console.log('✅ Insumos y recetas vinculados exitosamente a la base de datos.');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error al agregar insumos y recetas:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
