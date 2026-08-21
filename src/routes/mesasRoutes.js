const express = require('express');
const router = express.Router();
const mesasController = require('../controllers/mesasController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', checkRole(['Mesero', 'Administrador']), mesasController.getMesas);
router.put('/:id/estado', checkRole(['Mesero', 'Administrador']), mesasController.updateEstado);

// CRUD de Mesas (Solo Admin)
router.post('/', checkRole(['Administrador']), mesasController.createMesa);
router.put('/:id', checkRole(['Administrador']), mesasController.updateMesa);
router.delete('/:id', checkRole(['Administrador']), mesasController.deleteMesa);

// CRUD de Zonas (Admin)
router.get('/zonas/lista', checkRole(['Mesero', 'Administrador']), mesasController.getZonas);
router.post('/zonas', checkRole(['Administrador']), mesasController.createZona);
router.put('/zonas/:id', checkRole(['Administrador']), mesasController.updateZona);
router.delete('/zonas/:id', checkRole(['Administrador']), mesasController.deleteZona);

module.exports = router;
