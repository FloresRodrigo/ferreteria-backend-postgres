/*
const transporter = require('../configs/mail.config');

//Plantillas para mandar mails
class MailService {
    //Registro exitoso
    async sendWelcomeEmail(usuario) {
        await transporter.sendMail({
            from: `"Ferreteria" <${process.env.NODEMAIL_USER}>`,
            to: usuario.email,
            subject: 'Bienvenido a Ferreteria',
            html: `
                <h2>¡Bienvenido ${usuario.nombre_completo}!</h2>
                <p>Su cuenta fue creada exitosamente.</p>
                <p>Ya puede iniciar sesion y comenzar a comprar.</p>
            `
        });
    };

    //Solicitud de recuperacion de contraseña
    async sendResetPasswordEmail(usuario, resetToken) {
        await transporter.sendMail({
            from: `"Ferreteria" <${process.env.NODEMAIL_USER}>`,
            to: usuario.email,
            subject: 'Recuperacion de contraseña',
            html: `
                <p>Solicito recuperar su contraseña.</p>
                <p>Ingrese al siguiente link para iniciar el proceso.</p>
                <h2>${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}</h2>
                <p>Este codigo es de un solo uso y deja de ser valido en 15 minutos.</p>
            `
        });
    };

    //Cambio de contraseña exitoso
    async sendPasswordChangedEmail(usuario) {
        await transporter.sendMail({
            from: `"Ferreteria" <${process.env.NODEMAIL_USER}>`,
            to: usuario.email,
            subject: 'Contraseña restablecida',
            html: `
                <p>Su contraseña fue restablecida correctamente.</p>
                <p>Si no fue usted quien solicito el cambio, contactenos inmediatamente.</p>
            `
        });
    };

    //Actualizacion de email
    async sendEmailChangedEmail(oldEmail, newEmail) {
        await transporter.sendMail({
            from: `"Ferreteria" <${process.env.NODEMAIL_USER}>`,
            to: oldEmail,
            subject: 'Correo cambiado',
            html: `
                <p>Su correo fue modificado de <b>${oldEmail}</b> a <b>${newEmail}</b></p>
                <p>Si no fue usted quien solicito el cambio, contactenos inmediatamente.</p>
            `
        });
    };

    //Eliminacion de cuenta
    async sendDeletedAccountEmail(usuario) {
        await transporter.sendMail({
            from: `"Ferreteria" <${process.env.NODEMAIL_USER}>`,
            to: usuario.email,
            subject: 'Cuenta para eliminacion',
            html: `
                <p>Solicitaste la eliminacion de tu cuenta</p>
                <p>Si no inicias sesion en 14 dias, tu cuenta sera eliminada de forma definitiva</p>
                <p>Si inicias sesion antes de este periodo, esta volvera a ser activada</p>
            `
        });
    };

    //Compra confirmada
    async sendSuccessfulPayment(usuario, ticket) {
        await transporter.sendMail({
            from: `"Ferreteria" <${process.env.NODEMAIL_USER}>`,
            to: usuario.email,
            subject: `Compra confirmada - Ticket: #${ticket.nro_ticket}`,
            html: `
                <h2>Gracias por tu compra</h2>
                <p>Tu pago fue confirmado exitosamente</p>
                <p><strong>Ticket:</strong> #${ticket.nro_ticket}</p>
                <p><strong>Total:</strong> $${ticket.total}</p>
            `
        });
    };

};//MAILSERVICE

module.exports = new MailService();
*/