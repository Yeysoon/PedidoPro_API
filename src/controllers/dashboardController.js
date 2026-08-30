const dashboardModel = require('../models/dashboardModel');

const getAdminDashboard = async (req, res) => {
    try {
        const stats = await dashboardModel.getAdminStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error al obtener dashboard admin:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const getMeseroDashboard = async (req, res) => {
    try {
        const id_usuario = req.user.id;
        const stats = await dashboardModel.getMeseroStats(id_usuario);
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
        const stats = await dashboardModel.getCajaStats();
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
