const express = require('express');
const authCtrl = require('../controllers/auth.controller');

const router = express.Router();

//Ruta para el registro
router.post('/register', authCtrl.register);
//Ruta para el login
router.post('/login', authCtrl.login);
//Ruta para recuperacion de contraseña
router.post('/forgot-password', authCtrl.forgotPassword);
//Ruta para cambiar contraseña
router.post('/reset-password', authCtrl.resetPassword);

module.exports = router;