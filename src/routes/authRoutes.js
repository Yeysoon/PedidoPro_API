const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { check } = require('express-validator');
const { validateFields } = require('../middlewares/validatorMiddleware');

router.post('/login', [
    check('email', 'El correo es obligatorio y debe tener formato válido').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    validateFields
], authController.login);

module.exports = router;

