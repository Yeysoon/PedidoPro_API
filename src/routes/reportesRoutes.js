const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Solo el Administrador debería tener acceso a los reportes
router.get('/ventas', checkRole(['Administrador']), reportesController.getVentas);
router.get('/productos-top', checkRole(['Administrador']), reportesController.getProductosTop);
router.get('/inventario', checkRole(['Administrador']), reportesController.getReporteInventario);

module.exports = router;

