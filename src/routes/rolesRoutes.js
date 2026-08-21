const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
// Solo el Administrador puede gestionar roles y permisos
router.use(checkRole(['Administrador']));

router.get('/', rolesController.getRoles);
router.post('/', rolesController.createRol);
router.put('/:id', rolesController.updateRol);
router.delete('/:id', rolesController.deleteRol);

router.get('/permisos/lista', rolesController.getPermisos);
router.get('/:id/permisos', rolesController.getPermisosRol);
router.post('/:id/permisos', rolesController.assignPermisos);

module.exports = router;
