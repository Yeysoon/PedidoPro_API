const express = require('express');
const router = express.Router();
const cocinaController = require('../controllers/cocinaController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/comandas', checkRole(['Cocinero', 'Administrador']), cocinaController.getComandas);
router.patch('/comandas/:id/estado', checkRole(['Cocinero', 'Administrador']), cocinaController.updateEstado);

module.exports = router;
