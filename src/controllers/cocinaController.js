const cocinaModel = require('../models/cocinaModel');

const getComandas = async (req, res) => {
    try {
        const comandas = await cocinaModel.getComandasPendientes();
        res.json(comandas);
    } catch (error) {
        console.error('Error al obtener comandas:', error);
        res.status(500).json({ message: 'Error del servidor al obtener comandas' });
    }
};

const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        let { estado, id_estado, nuevo_estado } = req.body || {};
        const rolUsuario = req.user?.rol || 'Administrador';

        // 1. Resolver id numérico o estado string
        let numId = null;
        if (id_estado !== undefined && id_estado !== null && !isNaN(Number(id_estado))) {
            numId = Number(id_estado);
        } else if (nuevo_estado !== undefined && nuevo_estado !== null && !isNaN(Number(nuevo_estado))) {
            numId = Number(nuevo_estado);
        } else if (estado !== undefined && estado !== null && !isNaN(Number(estado))) {
            numId = Number(estado);
        }

        const mapIds = {
            1: 'Pendiente',
            2: 'En Preparación',
            3: 'Listo',
            4: 'Servido'
        };

        if (numId && mapIds[numId]) {
            estado = mapIds[numId];
        }

        // 2. Normalizar strings con acentos o variantes
        if (typeof estado === 'string') {
            const lower = estado.trim().toLowerCase();
            if (lower.includes('pendiente')) estado = 'Pendiente';
            else if (lower.includes('prepar')) estado = 'En Preparación';
            else if (lower.includes('listo')) estado = 'Listo';
            else if (lower.includes('servid') || lower.includes('mesa')) estado = 'Servido';
        }

        const validEstados = ['Pendiente', 'En Preparación', 'Listo', 'Servido'];
        if (!validEstados.includes(estado)) {
            console.warn(`[Cocina API] Estado no válido recibido:`, req.body);
            return res.status(400).json({ message: `Estado inválido para cocina: "${estado || id_estado || 'indefinido'}"` });
        }

        // 3. Validaciones de Rol
        if (rolUsuario === 'Cocinero') {
            const estadosPermitidosCocinero = ['Pendiente', 'En Preparación', 'Listo'];
            if (!estadosPermitidosCocinero.includes(estado)) {
                return res.status(403).json({
                    message: 'El Cocinero solo puede gestionar pedidos en: Pendientes por iniciar, Preparándose y Listo para servir.'
                });
            }
        } else if (rolUsuario === 'Mesero') {
            const estadosPermitidosMesero = ['Listo', 'Servido'];
            if (!estadosPermitidosMesero.includes(estado)) {
                return res.status(403).json({
                    message: 'El Mesero solo puede gestionar pedidos en: Listo para servir y Servido en Mesa.'
                });
            }
        }

        const result = await cocinaModel.updateEstadoComanda(id, estado);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        res.json({ message: 'Estado de la comanda actualizado exitosamente', estado });
    } catch (error) {
        console.error('Error al actualizar estado de comanda:', error);
        res.status(500).json({ message: error.message || 'Error del servidor al actualizar estado' });
    }
};

module.exports = {
    getComandas,
    updateEstado
};
