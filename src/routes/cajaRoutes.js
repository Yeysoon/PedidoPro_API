const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/pedidos-listos', checkRole(['Cajero']), cajaController.getPedidosListos);
router.post('/facturar', checkRole(['Cajero']), cajaController.facturar);
router.delete('/facturas/:id/anular', checkRole(['Administrador']), cajaController.anularFactura);

module.exports = router;
