const dashboardModel = require('../models/dashboardModel');

const getAdminDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'monthly';
        const stats = await dashboardModel.getAdminStats(period);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error al obtener dashboard admin:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const getMeseroDashboard = async (req, res) => {
    try {
        const id_usuario = req.user.id;
        const period = req.query.period || 'monthly';
        const stats = await dashboardModel.getMeseroStats(id_usuario, period);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error al obtener dashboard mesero:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const getCocinaDashboard = async (req, res) => {
    try {
        const stats = await dashboardModel.getCocinaStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error al obtener dashboard cocina:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const getCajaDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'monthly';
        const stats = await dashboardModel.getCajaStats(period);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error al obtener dashboard caja:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = {
    getAdminDashboard,
    getMeseroDashboard,
    getCocinaDashboard,
    getCajaDashboard
};
