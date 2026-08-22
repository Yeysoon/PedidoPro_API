const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
// Todas estas rutas son exclusivas del Administrador
router.use(checkRole(['Administrador']));

router.get('/', usuarioController.getUsuarios);
router.get('/:id', usuarioController.getUsuario);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.patch('/:id/estado', usuarioController.toggleUser);
router.patch('/:id/password', usuarioController.changePassword);

module.exports = router;

