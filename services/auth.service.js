const { Usuario } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
//const crypto = require('crypto');
//const mailService = require('./mail.service');
const { OAuth2Client } = require('google-auth-library');
const { Op } = require('sequelize');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    //METODO PARA REGISTRAR
    async register({ nombre_completo, username, email, password }) {
        //VALIDACIONES
        nombre_completo = nombre_completo?.trim();
        username = username?.trim();
        email = email?.trim();
        password = password?.trim();
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
        const usernameMinuscula = username.toLowerCase();
        const emailMinuscula = email.toLowerCase();
        //Validar que no esten ocupados el username o el email
        const usernameExists = await Usuario.findOne({ where: { username: usernameMinuscula }, attributes: ['id'] });
        const emailExists = await Usuario.findOne({ where: { email: emailMinuscula }, attributes: ['id'] });
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
            username: usernameMinuscula,
            email: emailMinuscula,
            password: hashedPassword
        });
        //Envio de email de registro
        /*
        try {
            await mailService.sendWelcomeEmail(usuario);
        } catch (error) {
            console.error('ERROR AL ENVIAR EMAIL: ', error);
        };
        */
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
            where: {
                [Op.or]: [
                    { username: loginMinuscula },
                    { email: loginMinuscula }
                ]
            }
        });
        if(!usuario) {
            throw new Error('Login invalido');
        };
        //Verificar si es un usuario que fue creado con google
        if(usuario.isGoogle) {
            throw new Error('Debes iniciar sesión con Google asi puedes establecer una contraseña');
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
                usuario.deleteRequestedAt = null;
            };
        };
        //Si no pasaron 14 dias desde la eliminacion de su cuenta, esta se vuelve a activar
        //Firma del JWT con id y rol
        const token = jwt.sign(
            {
                id: usuario.id,
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

    /*
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
    */

    /*
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
    */

    //METODO PARA LOGIN CON GOOGLE
    async loginGoogle({ idToken }) {
        //Validar que este el token de google
        if(!idToken) {
            throw new Error('Token de Google requerido');
        };
        //Guargar los datos
        const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        //Guardar el nombre y el email del payload
        const { name, email } = ticket.getPayload();
        //Verificar si el email ya esta registrado en el sitio
        const emailMinuscula = email.trim().toLowerCase();
        let usuario = await Usuario.findOne({ where: { email: emailMinuscula } });
        //Si no esta registrado, este se crea
        if(!usuario) {
            //Genera un username unico en caso que dos correos choquen
            const usernameUnico = await this.generarUsernameUnico(email);
            usuario = await Usuario.create({
                nombre_completo: name,
                username: usernameUnico,
                email: emailMinuscula,
                isGoogle: true
            });
            //Enviar email al registrarse
            /*
            try {
                await mailService.sendWelcomeEmail(usuario);
            } catch (error) {
                console.error('ERROR AL ENVIAR EMAIL: ', error);
            };
            */
        };
        //Se verifica si la cuenta esta inactiva
        if(usuario.estado === 'INACTIVO') {
            const deleteMs = Date.now() - usuario.deleteRequestedAt.getTime();
            const deleteDays = deleteMs / (24 * 60 * 60 * 1000);
            if(deleteDays < 14) {
                usuario.estado = 'ACTIVO';
                usuario.deleteRequestedAt = null;
            };
        };
        //Se firma el JWT
        const token = jwt.sign(
        {
            id: usuario.id,
            rol: usuario.rol
        },
           process.env.JWT_SECRET,
           { expiresIn: process.env.JWT_EXPIRATION || '2hr' }
        );
        //Actualiza ultimo login
        usuario.lastLogin = new Date();
        await usuario.save();
        return {
            nombre_completo: usuario.nombre_completo,
            username: usuario.username,
            email: usuario.email,
            isGoogle: usuario.isGoogle,
            token: token
        };
    };

    //METODO PARA ESTABLECER CONTRASEÑA A CUENTA CREADA CON GOOGLE
    async setPasswordGoogle( id, { password }) {
        //Se valida la contraseña
        password = password?.trim();
        if(!password || password.length < 8 || password.length > 20) {
            throw new Error('Contraseña invalida');
        };
        //Se busca al usuario
        const usuario = await Usuario.findByPk(id);
        if(!usuario) {
            throw new Error('Usuario no encontrado');
        };
        //Indica si tiene contraseña establecida
        if(!usuario.isGoogle) {
            throw new Error('Este usuario no puede establecer contraseña');
        };
        //Se asigna la contraseña nueva hasheada
        const hashedPassword = await bcrypt.hash(password, 10);
        usuario.password = hashedPassword;
        usuario.passwordChangedAt = new Date();
        //Se indica que se establecio contraseña
        usuario.isGoogle = false;
        await usuario.save();
    };

    //METODO PARA GENERAR UN USERNAME
    async generarUsernameUnico(email) {
        //Se agarra solo la primera parte del email sin caracteres raros
        const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = base;
        let contador = 1;
        //Va aumentando el contador cada vez que encontremos un username ya registrado
        while(await Usuario.findOne({ where: { username: username } })) {
            username = `${ base }_${ contador }`;
            contador++;
        };
        return username;
    };

};//AUTHSERVICE

module.exports = new AuthService();