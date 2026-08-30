const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/pedidos-listos', checkRole(['Cajero', 'Administrador']), cajaController.getPedidosListos);
router.post('/facturar', checkRole(['Cajero']), cajaController.facturar);
router.get('/facturas', checkRole(['Cajero', 'Administrador']), cajaController.getFacturas);
router.get('/facturas/:id', checkRole(['Cajero', 'Administrador']), cajaController.getFacturaById);
router.get('/facturas/:id/pdf', checkRole(['Cajero', 'Administrador']), cajaController.getFacturaPDF);
router.delete('/facturas/:id/anular', checkRole(['Administrador']), cajaController.anularFactura);

module.exports = router;


