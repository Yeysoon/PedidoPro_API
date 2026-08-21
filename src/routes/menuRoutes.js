const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', checkRole(['Mesero', 'Cajero', 'Administrador']), menuController.getMenu);

// Rutas de Productos (Admin)
router.post('/productos', checkRole(['Administrador']), menuController.createProducto);
router.put('/productos/:id', checkRole(['Administrador']), menuController.updateProducto);
router.delete('/productos/:id', checkRole(['Administrador']), menuController.deleteProducto);

// Rutas de Categorías (Admin)
router.get('/categorias', checkRole(['Mesero', 'Cajero', 'Administrador']), menuController.getCategorias);
router.post('/categorias', checkRole(['Administrador']), menuController.createCategoria);
router.put('/categorias/:id', checkRole(['Administrador']), menuController.updateCategoria);
router.delete('/categorias/:id', checkRole(['Administrador']), menuController.deleteCategoria);

module.exports = router;
