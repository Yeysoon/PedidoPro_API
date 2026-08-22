const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
// Acceso para Administrador y Cocinero (para ver ingredientes)
router.use(checkRole(['Administrador', 'Cocinero']));

// Alertas de stock bajo
router.get('/alertas', inventarioController.getAlertas);

// Ingredientes
router.get('/ingredientes', inventarioController.getIngredientes);
router.post('/ingredientes', checkRole(['Administrador']), inventarioController.createIngrediente);
router.put('/ingredientes/:id', checkRole(['Administrador']), inventarioController.updateIngrediente);
router.delete('/ingredientes/:id', checkRole(['Administrador']), inventarioController.deleteIngrediente);

// Recetas
router.get('/recetas/:id_producto', inventarioController.getReceta);
router.post('/recetas/:id_producto', checkRole(['Administrador']), inventarioController.saveReceta);

module.exports = router;

