const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', checkRole(['Administrador', 'Mesero', 'Cajero', 'Cocinero']), pedidosController.getPedidos);
router.get('/mesa/:id', checkRole(['Mesero', 'Administrador', 'Cajero', 'Cocinero']), pedidosController.getCuentaMesa);
router.get('/:id', checkRole(['Administrador', 'Mesero', 'Cajero', 'Cocinero']), pedidosController.getPedido);
router.post('/', checkRole(['Mesero', 'Administrador', 'Cajero', 'Cocinero']), pedidosController.createPedido);
router.patch('/:id/cancelar', checkRole(['Mesero', 'Administrador', 'Cajero']), pedidosController.cancelPedido);

module.exports = router;

