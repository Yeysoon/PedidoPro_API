const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const pdfController = require('../controllers/pdfController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/pedidos-listos', checkRole(['Cajero', 'Administrador', 'Mesero']), cajaController.getPedidosListos);
router.post('/facturar', checkRole(['Cajero', 'Administrador', 'Mesero']), cajaController.facturar);
router.get('/facturas', checkRole(['Cajero', 'Administrador', 'Mesero']), cajaController.getFacturas);
router.get('/facturas/:id', checkRole(['Cajero', 'Administrador', 'Mesero']), cajaController.getFacturaById);
router.get('/facturas/:id/pdf', checkRole(['Cajero', 'Administrador', 'Mesero']), pdfController.getFacturaPDF);
router.delete('/facturas/:id/anular', checkRole(['Administrador']), cajaController.anularFactura);

module.exports = router;


