const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/admin', checkRole(['Administrador']), dashboardController.getAdminDashboard);
router.get('/mesero', checkRole(['Mesero', 'Administrador']), dashboardController.getMeseroDashboard);
router.get('/cocina', checkRole(['Cocinero', 'Administrador']), dashboardController.getCocinaDashboard);
router.get('/caja', checkRole(['Cajero', 'Administrador']), dashboardController.getCajaDashboard);

module.exports = router;
