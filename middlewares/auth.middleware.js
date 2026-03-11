const jwt = require('jsonwebtoken');
const { failed } = require('../helpers/response.helper');
const { Usuario } = require('../models');

async function authMiddleware(req, res, next) {
    //Se verifica si existe authorization
    const authHeader = req.headers.authorization;
    if(!authHeader) {
        return failed(res, 'No hay token presente');
    };
    //Se conserva la parte Token de "Bearer Token"
    const token = authHeader.split(' ')[1];
    if(!token) {
        return failed(res, 'Token invalido');
    };
    try {
        //Se verifica el token recibido, este tiene id y rol
        const userInfo = jwt.verify(token, process.env.JWT_SECRET);
        const usuario = await Usuario.findByPk(userInfo.id);
        if(!usuario) {
            return failed(res, 'El usuario no existe');
        };
        //Verificar que el token no haya sido creado antes de cambiar de contraseña
        if(usuario.passwordChangedAt) {
            const passwordChangedAtTime = Math.floor(usuario.passwordChangedAt.getTime() / 1000);
            if(userInfo.iat < passwordChangedAtTime) {
                return failed(res, 'Sesión invalida, la contraseña fue cambiada');
            };
        };
        req.user = userInfo;
        next();
    } catch (error) {
        return failed(res, 'Token invalido o expirado');
    };
};

module.exports = authMiddleware;