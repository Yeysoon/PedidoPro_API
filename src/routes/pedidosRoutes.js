const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/', checkRole(['Mesero']), pedidosController.createPedido);
router.get('/mesa/:id', checkRole(['Mesero']), pedidosController.getCuentaMesa);
router.patch('/:id/cancelar', checkRole(['Mesero', 'Administrador']), pedidosController.cancelPedido);

module.exports = router;
