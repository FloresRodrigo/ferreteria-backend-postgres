const Usuario = require('../models/usuario');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailService = require('./mail.service');

class AuthService {
    //METODO PARA REGISTRAR
    async register({ nombre_completo, username, email, password }) {
        //VALIDACIONES
        //Validar que lleguen datos
        if(!nombre_completo || !username || !email || !password) {
            throw new Error('Datos invalidos'); 
        };
        //Validar longitudes
        if(nombre_completo.length < 8 || nombre_completo.length > 40) {
            throw new Error('El nombre debe tener entre 8 y 40 caracteres');
        };
        //Validar username
        if(username.length < 4 || username.length > 20) {
            throw new Error('El username debe tener entre 4 y 20 caracteres');
        };
        if(!/^[A-Za-z0-9]+$/.test(username)) {
            throw new Error('El username solo puede tener letras y numeros');
        };
        //Validar contraseña
        if(password.length < 8 || password.length > 20) {
            throw new Error('La contraseña debe tener entre 8 y 20 caracteres');
        };
        //Validar email
        if(!/.+\@.+\..+/.test(email)) {
            throw new Error('Formato de email invalido');
        };
        //Validar que no esten ocupados el username o el email
        const usernameExists = await Usuario.findOne({ username: username });
        const emailExists = await Usuario.findOne({ email: email });
        if(usernameExists) {
            throw new Error('Username ya registrado');
        };
        if(emailExists) {
            throw new Error('Email ya registrado');
        };
        //Crear usuario con contraseña hasheada
        const hashedPassword = await bcrypt.hash(password, 10);
        const usuario = await Usuario.create({
            nombre_completo: nombre_completo,
            username: username,
            email: email,
            password: hashedPassword
        });
        //Envio de email de registro
        try {
            await mailService.sendWelcomeEmail(usuario);
        } catch (error) {
            console.error('ERROR AL ENVIAR EMAIL: ', error);
        };
        return {
            nombre_completo: usuario.nombre_completo,
            username: usuario.username,
            email: usuario.email
        };
    };

    //METODO PARA LOGIN
    async login({ login, password }) {
        //Validar que lleguen datos
        if(!login || !password) {
            throw new Error('Datos invalidos');
        };
        //Para que no sea case sensitive al hacer login
        const loginMinuscula = login.trim().toLowerCase();
        //Buscar usuario por username o email
        const usuario = await Usuario.findOne({
            $or: [
                { username: loginMinuscula },
                { email: loginMinuscula }
            ]
        });
        if(!usuario) {
            throw new Error('Login invalido');
        };
        //Verificar password
        const match = await bcrypt.compare(password, usuario.password);
        if(!match) {
            throw new Error('La contraseña es incorrecta');
        };
        //Se verifica si la cuenta esta inactiva
        if(usuario.estado === 'INACTIVO') {
            const deleteMs = Date.now() - usuario.deleteRequestedAt.getTime();
            const deleteDays = deleteMs / (24 * 60 * 60 * 1000);
            if(deleteDays < 14) {
                usuario.estado = 'ACTIVO';
                usuario.deleteRequestedAt = undefined;
            };
        };
        //Si no pasaron 14 dias desde la eliminacion de su cuenta, esta se vuelve a activar
        //Firma del JWT con id y rol
        const token = jwt.sign(
            {
                id: usuario._id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '2hr' }
        );
        usuario.lastLogin = new Date();
        await usuario.save();
        return {
            nombre_completo: usuario.nombre_completo,
            username: usuario.username,
            email: usuario.email,
            token: token
        };
    };

    //METODO PARA RECUPERACION DE CONTRASEÑA
    async forgotPassword({ email }) {
        //Validar que lleguen datos
        if(!email) {
            throw new Error('Se necesita un email');
        };
        //Busqueda de usuario
        const usuario = await Usuario.findOne({ email: email });
        if(!usuario) {
            return;
        };
        //Creacion de token y token hasheado
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        usuario.resetPasswordToken = resetTokenHash;
        usuario.resetPasswordExpiration = Date.now() + 15 * 60 * 1000;
        await usuario.save();
        //Envio de email con token
        try {
            await mailService.sendResetPasswordEmail(usuario, resetToken);
        } catch (error) {
            console.error('ERROR AL ENVIAR EMAIL: ', error);
        };
    };

    //METODO PARA REINICIO DE CONTRASEÑA
    async resetPassword({ token },{ password }) {
        //Validar que lleguen datos
        if(!token || !password) {
            throw new Error('Datos invalidos');
        };
        //Validar contraseña
        if(password.length < 8 || password.length > 20) {
            throw new Error('La contraseña debe tener entre 8 y 20 caracteres');
        };
        //Hashear el token recibido
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        //Se compara el token recibido hasheado con el guardado y fecha de expiracion
        const usuario = await Usuario.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpiration: { $gt: Date.now() }
        });
        if(!usuario) {
            throw new Error('Token invalido o expirado');
        };
        //Se hashea la nueva contraseña y se desvincula al usuario del token y expiracion
        const hashedPassword = await bcrypt.hash(password, 10);
        usuario.password = hashedPassword;
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpiration = undefined;
        //Agregamos la fecha en que cambio su contraseña
        usuario.passwordChangedAt = new Date();
        await usuario.save();
        //Envio de email de restablecimiento de contraseña
        try {
            await mailService.sendPasswordChangedEmail(usuario);
        } catch (error) {
            console.error('ERROR AL ENVIAR EMAIL', error);
        };
    };

};//AUTHSERVICE

module.exports = new AuthService();