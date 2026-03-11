const { Usuario } = require('../models');
const bcrypt = require('bcrypt');
//const mailService = require('./mail.service');
const { Op } = require('sequelize');

class UsuarioService {
    //METODO PARA OBTENER TODOS LOS USUARIOS
    async getUsuarios({ nombre_completo, username, email, estado }) {
        const filter = {};
        if(nombre_completo && nombre_completo.trim() !== '') {
            filter.nombre_completo = { [Op.iLike]: `%${nombre_completo.trim()}%` };
        };
        if(username && username.trim() !== '') {
            filter.username = { [Op.iLike]: `%${username.trim()}%` };
        };
        if(email && email.trim() !== '') {
            filter.email = { [Op.iLike]: `%${email.trim()}%` };
        };
        if(estado && (estado === 'ACTIVO' || estado === 'INACTIVO')) {
            filter.estado = estado;
        };
        const usuarios = await Usuario.findAll({ where: filter, attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpiration'] } });
        return usuarios;
    };

    //METODO PARA OBTENER UN USUARIO
    async getUsuario(id) {
        if(!id) {
            throw new Error('Debe ingresar un ID');
        };
        const usuario = await Usuario.findByPk(id, { attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpiration', 'deleteRequestedAt'] } });
        if(!usuario) {
            throw new Error('No se encontro un usuario con ese ID');
        };
        return usuario;
    };

    //METODO PARA ACTUALIZAR EL PERFIL DE USUARIO
    async updateProfile(id, { nombre_completo, username, email }) {
        //Verificar ID y usuario
        if(!id) {
            throw new Error('Debe ingresar un ID');
        };
        nombre_completo = nombre_completo?.trim();
        username = username?.trim();
        email = email?.trim();
        if(!nombre_completo && !username && !email) {
            throw new Error('Ingrese al menos un campo');
        };
        const usuario = await Usuario.findByPk(id);
        if(!usuario) {
            throw new Error('No se encontro un usuario con ese ID');
        };
        //VALIDACIONES
        //Validar datos, si llega uno se valida y se actualiza
        //Actualizar nombre
        if(nombre_completo) {
            if(nombre_completo.length < 8 || nombre_completo.length > 40) {
                throw new Error('El nombre debe tener entre 8 y 40 caracteres');
            };
            usuario.nombre_completo = nombre_completo;
        };
        //Actualizar username
        if(username) {
            if(username.length < 4 || username.length > 20) {
                throw new Error('El username debe tener entre 4 y 20 caracteres');
            };
            if(!/^[A-Za-z0-9]+$/.test(username)) {
                throw new Error('El username solo puede tener letras y numeros');
            };
            const usernameMinuscula = username.trim().toLowerCase();
            const usernameExists = await Usuario.findOne({ where: { username: usernameMinuscula, id: { [Op.ne]: id } }, attributes: ['id'] });
            if(usernameExists) {
                throw new Error('Username ya registrado');
            };
            usuario.username = usernameMinuscula;
        };
        //Actualizar email
        let emailChanged = false;
        let oldEmail;
        if(email && email !== usuario.email) {
            if(!/.+\@.+\..+/.test(email)) {
                throw new Error('Formato de email invalido');
            };
            const emailMinuscula = email.toLowerCase();
            const emailExists = await Usuario.findOne({ where: { email: emailMinuscula, id: { [Op.ne]: id } }, attributes: ['id'] });
            if(emailExists) {
                throw new Error('Email ya registrado');
            };
            oldEmail = usuario.email;
            usuario.email = emailMinuscula;
            emailChanged = true;
        };
        await usuario.save();
        //Enviar solo si se cambio email y actualizo correctamente
        /*
        if(emailChanged) {
            try {
                await mailService.sendEmailChangedEmail(oldEmail, email);
            } catch (error) {
                console.error('ERROR AL ENVIAR EMAIL: ', error);
            };
        };
        */
    };

    //METODO PARA CAMBIAR CONTRASEÑA
    async changePassword(id, { actualPassword, newPassword, repeatNewPassword }) {
        //Verificar ID y usuario
        if(!id) {
            throw new Error('Debe ingresar un ID');
        };
        const usuario = await Usuario.findByPk(id);
        if(!usuario) {
            throw new Error('No se encontro un usuario con ese ID');
        };
        //Validar que lleguen datos
        newPassword = newPassword?.trim();
        if(!actualPassword || !newPassword || !repeatNewPassword) {
            throw new Error('Debe completar todos los campos');
        };
        //Verificar contraseña
        const match = await bcrypt.compare(actualPassword, usuario.password);
        if(!match) {
            throw new Error('La contraseña actual es incorrecta');
        };
        //Validar contraseña
        if(newPassword.length < 8 || newPassword.length > 20) {
            throw new Error('La contraseña debe tener entre 8 y 20 caracteres');
        };
        //Validar que coincida la nueva contraseña
        if(newPassword !== repeatNewPassword) {
            throw new Error('Las contraseñas no coinciden');
        };
        const samePassword = await bcrypt.compare(newPassword, usuario.password);
        if(samePassword) {
            throw new Error('La nueva contraseña no puede ser igual a la anterior');
        };
        //Hashear y asignar nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        usuario.password = hashedPassword;
        usuario.passwordChangedAt = new Date();
        await usuario.save();
        //Notificar cambio de contraseña
        /*
        try {
            await mailService.sendPasswordChangedEmail(usuario);
        } catch (error) {
            console.error('ERROR AL ENVIAR EMAIL', error);
        };
        */
    };

    //METODO PARA ACTUALIZAR USUARIO
    async updateUsuario(id, { nombre_completo, username, email, password, estado }) {
        //Verificar ID
        if(!id) {
            throw new Error('Debe ingresar un ID');
        };
        //Verificar usuario a modificar
        const usuario = await Usuario.findByPk(id);
        if(!usuario) {
            throw new Error('No se encontro un usuario con ese ID');
        };
        nombre_completo = nombre_completo?.trim();
        username = username?.trim();
        email = email?.trim();
        password = password?.trim();
        if(!nombre_completo && !username && !email && !password && !estado) {
            throw new Error('Ingrese al menos un campo');
        };
        //Modificar nombre solo si llega
        if(nombre_completo) {
            if(nombre_completo.length < 8 || nombre_completo.length > 40) {
                throw new Error('El nombre debe tener entre 8 y 40 caracteres');
            };
            usuario.nombre_completo = nombre_completo;
        };
        //Modificar username solo si llega
        if(username) {
            if(username.length < 4 || username.length > 20) {
                throw new Error('El username debe tener entre 4 y 20 caracteres');
            };
            if(!/^[A-Za-z0-9]+$/.test(username)) {
                throw new Error('El username solo puede tener letras y numeros');
            };
            const usernameMinuscula = username.toLowerCase();
            const usernameExists = await Usuario.findOne({ where: { username: usernameMinuscula, id: { [Op.ne]: id } }, attributes: ['id'] });
            if(usernameExists) {
                throw new Error('Username ya registrado');
            };
            usuario.username = usernameMinuscula;
        };
        //Modificar email solo si llega
        let oldEmail;
        let emailChanged = false;
        const emailMinuscula = email?.toLowerCase();
        if(emailMinuscula && emailMinuscula !== usuario.email) {
            if(!/.+\@.+\..+/.test(emailMinuscula)) {
                throw new Error('Formato de email invalido');
            };
            const emailExists = await Usuario.findOne({ where: { email: emailMinuscula, id: { [Op.ne]: id } }, attributes: ['id'] });
            if(emailExists) {
                throw new Error('Email ya registrado');
            };
            oldEmail = usuario.email;
            usuario.email = emailMinuscula;
            emailChanged = true;
        };
        //Cambiar contraseña solo si llega
        let passwordChanged = false;
        if(password) {
            if(password.length < 8 || password.length > 20) {
                throw new Error('La contraseña debe tener entre 8 y 20 caracteres');
            };
            const hashedPassword = await bcrypt.hash(password, 10);
            usuario.password = hashedPassword;
            usuario.passwordChangedAt = new Date();
            passwordChanged = true;
        };
        //Cambiar estado solo si llega y es valido
        if(estado) {
            if(estado === 'ACTIVO') {
                usuario.estado = estado;
                usuario.deleteRequestedAt = null;
            };
        };
        await usuario.save();
        /*
        if(emailChanged) {
            try {
                await mailService.sendEmailChangedEmail(oldEmail, email);
            } catch (error) {
                console.error('ERROR AL ENVIAR EMAIL: ', error);
            };
        };
        if(passwordChanged) {
            try {
                await mailService.sendPasswordChangedEmail(usuario);
            } catch (error) {
                console.error('ERROR AL ENVIAR EMAIL: ', error);
            };
        };
        */
    };

    //METODO PARA ELIMINAR UN USUARIO (logicamente)
    async deleteUsuario(idReq, idTarget) {
        //Verificar IDs
        if(!idReq || !idTarget) {
            throw new Error('IDs invalidos');
        };
        //Verificar usuario a eliminar
        const usuario = await Usuario.findByPk(idTarget);
        if(!usuario) {
            throw new Error('El usuario a eliminar no existe');
        };
        //Verificar que no se elimine a si mismo
        if(idReq.toString() === usuario._id.toString()) {
            throw new Error('No puede eliminarse a si mismo');
        };
        //Verificar que no este ya inactivo
        if(usuario.estado === 'INACTIVO') {
            throw new Error('El usuario ya se encuentra inactivo');
        };
        usuario.estado = 'INACTIVO';
        usuario.deleteRequestedAt = new Date();
        await usuario.save();
        //Notificar programacion de eliminacion de cuenta
        /*
        try {
            await mailService.sendDeletedAccountEmail(usuario);
        } catch (error) {
            console.error('ERROR AL ENVIAR EMAIL', error);
        };
        */
    };

};//USUARIOSERVICE

module.exports = new UsuarioService();