const reportesModel = require('../models/reportesModel');

const getVentas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, page, limit } = req.query;

        if (page && limit) {
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            const { data, total_registros } = await reportesModel.getVentasTotales(fechaInicio, fechaFin, limitNum, offset);
            const total_paginas = Math.ceil(total_registros / limitNum);

            return res.json({
                data,
                meta: {
                    total_registros,
                    total_paginas,
                    pagina_actual: pageNum,
                    limite_por_pagina: limitNum
                }
            });
        }

        const { data } = await reportesModel.getVentasTotales(fechaInicio, fechaFin);
        res.json(data);
    } catch (error) {
        console.error('Error al obtener reporte de ventas:', error);
        res.status(500).json({ message: 'Error del servidor al obtener reporte' });
    }
};

const getProductosTop = async (req, res) => {
    try {
        const productos = await reportesModel.getProductosMasVendidos();
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos más vendidos:', error);
        res.status(500).json({ message: 'Error del servidor al obtener reporte' });
    }
};


const getReporteInventario = async (req, res) => {
    try {
        const reporte = await reportesModel.getReporteInventario();
        res.json(reporte);
    } catch (error) {
        console.error('Error al obtener reporte de inventario:', error);
        res.status(500).json({ message: 'Error al obtener reporte de inventario' });
    }
};
module.exports = {
    getVentas,
    getProductosTop,
    getReporteInventario
};

