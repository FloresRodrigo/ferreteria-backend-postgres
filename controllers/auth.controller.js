const authService = require('../services/auth.service');
const { success, failed } = require('../helpers/response.helper');

const authCtrl = {};

//METODO DE REGISTRO
authCtrl.register = async (req, res) => {
    try {
        const usuario = await authService.register(req.body);
        return success(res, 'Usuario creado exitosamente', usuario);
    } catch (error) {
        console.error('ERROR EN EL REGISTRO: ', error);
        return failed(res, error.message);
    };
};

//METODO DE LOGIN
authCtrl.login = async (req, res) => {
    try {
        const usuario = await authService.login(req.body);
        return success(res, 'Login exitoso', usuario);
    } catch (error) {
        console.error('ERROR EN EL LOGIN: ', error);
        return failed(res, error.message);
    };
};

/*
//METODO DE RECUPERACION DE CONTRASEÑA
authCtrl.forgotPassword = async (req, res) => {
    try {
        await authService.forgotPassword(req.body);
        return success(res, 'Se envio un correo para recuperar la contraseña');
    } catch (error) {
        console.error('ERROR EN RECUPERACION DE CONTRASEÑA: ', error);
        return failed(res, error.message);
    };
};
*/

/*
//METODO DE REINICIO DE CONTRASEÑA
authCtrl.resetPassword = async (req, res) => {
    try {
        await authService.resetPassword(req.query, req.body);
        return success(res, 'Contraseña actualizada correctamente');
    } catch (error) {
        console.error('ERROR EN REINICIO DE CONTRASEÑA: ', error);
        return failed(res, error.message);
    }
};
*/

//METODO DE LOGIN CON GOOGLE
authCtrl.loginGoogle = async (req, res) => {
    try {
        const usuario = await authService.loginGoogle(req.body);
        return success(res, 'Login exitoso', usuario);
    } catch (error) {
        console.error('ERROR EN EL LOGIN: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA ESTABLECER CONTRASEÑA A CUENTA CREADA CON GOOGLE
authCtrl.setPasswordGoogle = async (req, res) => {
    try {
        await authService.setPasswordGoogle(req.user.id, req.body);
        return success(res, 'Contraseña establecida correctamente');
    } catch (error) {
        console.error('ERROR AL ESTABLECER CONTRASEÑA: ', error);
        return failed(res, error.message);
    }
};

module.exports = authCtrl;