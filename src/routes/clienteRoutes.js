const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
// Cajeros y Administradores gestionan clientes
router.use(checkRole(['Cajero', 'Administrador']));

const { check } = require('express-validator');
const { validateFields } = require('../middlewares/validatorMiddleware');

router.get('/', clienteController.getClientes);
router.get('/:id', clienteController.getCliente);

router.post('/', [
    check('nombre_completo', 'El nombre completo es obligatorio').not().isEmpty(),
    check('correo_electronico', 'Si proporciona correo, debe ser válido').optional({ checkFalsy: true }).isEmail(),
    validateFields
], clienteController.createCliente);

router.put('/:id', [
    check('nombre_completo', 'El nombre completo es obligatorio').not().isEmpty(),
    check('correo_electronico', 'Si proporciona correo, debe ser válido').optional({ checkFalsy: true }).isEmail(),
    validateFields
], clienteController.updateCliente);

router.delete('/:id', clienteController.deleteCliente);

module.exports = router;
