const express = require('express');
const router = express.Router();
const cocinaController = require('../controllers/cocinaController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/comandas', checkRole(['Cocinero']), cocinaController.getComandas);
router.patch('/comandas/:id/estado', checkRole(['Cocinero']), cocinaController.updateEstado);

module.exports = router;
