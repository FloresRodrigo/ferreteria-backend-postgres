const express = require('express');
const authCtrl = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

//Ruta para el registro
router.post('/register', authCtrl.register);
//Ruta para el login
router.post('/login', authCtrl.login);
/*
//Ruta para recuperacion de contraseña
router.post('/forgot-password', authCtrl.forgotPassword);
//Ruta para cambiar contraseña
router.post('/reset-password', authCtrl.resetPassword);
*/
//Ruta para el login con google
router.post('/login-google', authCtrl.loginGoogle);
//Ruta para establecer contraseña a cuenta creada con google
router.post('/set-password-google', authMiddleware, authCtrl.setPasswordGoogle);

module.exports = router;