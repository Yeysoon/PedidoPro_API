const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', checkRole(['Administrador', 'Mesero']), pedidosController.getPedidos);
router.get('/mesa/:id', checkRole(['Mesero', 'Administrador']), pedidosController.getCuentaMesa);
router.get('/:id', checkRole(['Administrador', 'Mesero']), pedidosController.getPedido);
router.post('/', checkRole(['Mesero', 'Administrador']), pedidosController.createPedido);
router.patch('/:id/cancelar', checkRole(['Mesero', 'Administrador']), pedidosController.cancelPedido);

module.exports = router;

