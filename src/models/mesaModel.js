const db = require('../config/db');

const getAllMesas = async () => {
    const query = `
        SELECT m.id_mesa, m.numero_mesa, m.capacidad, m.estado, m.id_zona, z.nombre_zona
        FROM Mesas m
        JOIN Zonas_Restaurante z ON m.id_zona = z.id_zona
    `;
    const [rows] = await db.execute(query);
    return rows;
};

const updateMesaEstado = async (id_mesa, estado) => {
    const query = `UPDATE Mesas SET estado = ? WHERE id_mesa = ?`;
    const [result] = await db.execute(query, [estado, id_mesa]);
    return result;
};

const createMesa = async (mesa) => {
    const { id_zona, numero_mesa, capacidad, estado } = mesa;
    const query = `INSERT INTO Mesas (id_zona, numero_mesa, capacidad, estado) VALUES (?, ?, ?, ?)`;
    const [result] = await db.execute(query, [id_zona, numero_mesa, capacidad, estado || 'Libre']);
    return result.insertId;
};

const updateMesa = async (id, mesa) => {
    const { id_zona, numero_mesa, capacidad, estado } = mesa;
    if (estado) {
        const query = `UPDATE Mesas SET id_zona = ?, numero_mesa = ?, capacidad = ?, estado = ? WHERE id_mesa = ?`;
        const [result] = await db.execute(query, [id_zona, numero_mesa, capacidad, estado, id]);
        return result;
    }
    const query = `UPDATE Mesas SET id_zona = ?, numero_mesa = ?, capacidad = ? WHERE id_mesa = ?`;
    const [result] = await db.execute(query, [id_zona, numero_mesa, capacidad, id]);
    return result;
};

const deleteMesa = async (id) => {
    const query = `DELETE FROM Mesas WHERE id_mesa = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

// Zonas_Restaurante
const getAllZonas = async () => {
    const query = `SELECT * FROM Zonas_Restaurante`;
    let [rows] = await db.execute(query);
    if (!rows || rows.length === 0) {
        const defaults = ['Salón Principal', 'Terraza', 'Área VIP', 'Barra'];
        for (const nombre of defaults) {
            await db.execute(`INSERT IGNORE INTO Zonas_Restaurante (nombre_zona) VALUES (?)`, [nombre]);
        }
        const [seeded] = await db.execute(query);
        return seeded;
    }
    return rows;
};

const createZona = async (nombre_zona) => {
    const query = `INSERT INTO Zonas_Restaurante (nombre_zona) VALUES (?)`;
    const [result] = await db.execute(query, [nombre_zona]);
    return result.insertId;
};

const updateZona = async (id, nombre_zona) => {
    const query = `UPDATE Zonas_Restaurante SET nombre_zona = ? WHERE id_zona = ?`;
    const [result] = await db.execute(query, [nombre_zona, id]);
    return result;
};

const deleteZona = async (id) => {
    const query = `DELETE FROM Zonas_Restaurante WHERE id_zona = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

module.exports = {
    getAllMesas,
    updateMesaEstado,
    createMesa,
    updateMesa,
    deleteMesa,
    getAllZonas,
    createZona,
    updateZona,
    deleteZona
};
