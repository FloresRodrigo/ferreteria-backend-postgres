const Usuario = require('../models/usuario');
const Articulo = require('../models/articulo');
const articuloService = require('../services/articulo.service');
const Ticket= require('../models/ticket');
const mongoose = require('mongoose');
//const mailService = require('./mail.service');

class TicketService {
    //METODO PARA CREAR TICKET
    async createTicket(id, { carrito }) {
        //Verificar ID y usuario
        if(!id) {
            throw new Error('Debe ingresar un ID');
        };
        const usuario = await Usuario.findById(id);
        if(!usuario) {
            throw new Error('No se encontro un usuario con ese ID ');
        };
        //Verificar carrito
        if(!Array.isArray(carrito) || carrito.length === 0) {
            throw new Error('El carrito esta vacio');
        };
        //Cada item del carrito se agrega a detalles
        const detalles = [];
        for(const art of carrito) {
            //El carrito solo tendra id y cantidad para cada item
            if(!art.id || !art.cantidad || art.cantidad < 1) {
                throw new Error('Item del carrito invalido');
            };
            const articulo = await Articulo.findById(art.id);
            if(!articulo) {
                throw new Error('No se encontro articulo con el ID: '+art.id);
            };
            if(art.cantidad > articulo.stock) {
                throw new Error('Stock insuficiente de: '+articulo.nombre);
            };
            detalles.push({
                id_articulo: articulo._id,
                nombre_articulo: articulo.nombre,
                precio_unitario: articulo.precio,
                cantidad: art.cantidad
            });
        };
        //Crear ticket con los detalles establecidos
        const ticket = await Ticket.create({
            id_cliente: usuario._id,
            fecha_compra: new Date(),
            detalles_ticket: detalles
        });
        return ticket;
    };

    //METODO PARA PAGAR TICKET (no tiene endpoint)
    async pagarTicket(idTicket, maxRetries = 3) {
        let intentos = 0;
        while(intentos < maxRetries) {
            //Se inicia una sesion se mongoose, si falla algo se revierte todo
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                //Verificar ID y ticket
                if(!idTicket) {
                    throw new Error('ID invalido');
                };
                const ticket = await Ticket.findById(idTicket).session(session);
                if(!ticket) {
                    throw new Error('No se encontro un ticket con ese ID');
                };
                //Se verifica que su estado sea pendiente
                if(ticket.estado !== 'PENDIENTE') {
                    throw new Error('El ticket ya fue pagado o esta cancelado');
                };
                //Se verifica que el ticket tenga detalles
                if(!ticket.detalles_ticket || ticket.detalles_ticket.length === 0) {
                    throw new Error('El ticket no tiene detalles');
                };
                for(const detalle of ticket.detalles_ticket) {
                    await articuloService.actualizarStockYtotal(detalle.id_articulo, detalle.cantidad, session);
                };
                ticket.estado = 'PAGADO';
                ticket.fecha_compra = new Date();
                await ticket.save({ session });
                //Si todo salio bien se marca la session como finalizada
                await session.commitTransaction();
                session.endSession();
                //Buscamos al usuario para poder mandar un correo
                /*
                try {
                    const usuario = await Usuario.findById(ticket.id_cliente);
                    await mailService.sendSuccessfulPayment(usuario, ticket);
                } catch (error) {
                    console.error('ERROR AL ENVIAR EMAIL: ', error);
                };
                */
                return ticket;
            } catch (error) {
                //Se cancela la sesion si falla algo
                await session.abortTransaction();
                session.endSession();
                //Reintentar la operacion si fallo por concurrencia con otro pago
                if(error.code === 112 || error.message.includes('WriteConflict')) {
                    intentos++;
                    continue;
                };
                throw error;
            }
        }
        throw new Error('No se pudo completar el pago. Intente nuevamente');
    };

    //METODO PARA CANCELAR TICKET
    async cancelarTicket(idTicket, idUsuario) {
        //Se valida el ticket
        if(!idTicket) {
            throw new Error('ID de ticket invalido');
        };
        const ticket = await Ticket.findById(idTicket);
        if(!ticket) {
            throw new Error('Ticket no encontrado');
        };
        //Se valida que quien lo solicita esta relacionado al ticket
        if(ticket.id_cliente.toString() !== idUsuario.toString()) { 
            throw new Error('No esta autorizado');
        };
        if(ticket.estado !== 'PENDIENTE') {
            throw new Error('Solo se puede cancelar un ticket pendiente');
        };
        ticket.estado = 'CANCELADO';
        await ticket.save();
        return ticket;
    };

    //METODO PARA OBTENER TODOS LOS TICKETS (cliente)
    async getMyTickets(id) {
        //Se valida que llego un ID de usuario
        if(!id) {
            throw new Error('Usuario invalido');
        };
        //Recupera un ticket sin los campos de cuando se creo ni actualizo
        const tickets = await Ticket.find({ id_cliente: id }).select('-createdAt -updatedAt').sort({ createdAt: -1 });
        return tickets;
    };

    //METODO PARA OBTENER TODOS LOS TICKETS (admin)
    async getTickets({ id }) {
        //Filtro para buscar por ID de usuario
        const filter = {};
        if(id) {
            filter.id_cliente = id;
        };
        const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
        return tickets;
    };

    //METODO PARA OBTENER UN TICKET (cliente)
    async getMyTicket(idUsuario, idTicket) {
        //Se valida que lleguen ID de usuario y ticket
        if(!idUsuario) {
            throw new Error('Usuario invalido');
        };
        if(!idTicket) {
            throw new Error('Ingrese el ID del ticket a buscar');
        };
        const ticket = await Ticket.findById(idTicket);
        if(!ticket) {
            throw new Error('Ticket no encontrado');
        };
        //Se valida que quien solicita el ticket sea el cliente que lo creo
        if(idUsuario.toString() !== ticket.id_cliente.toString()) {
            throw new Error('No autorizado');
        };
        return ticket;
    };

    //METODO PARA OBTENER UN TICKET (admin)
    async getTicket(id) {
        //Validar ticket
        if(!id) {
            throw new Error('ID invalido');
        };
        const ticket = await Ticket.findById(id);
        if(!ticket) {
            throw new Error('No se encontro el ticket');
        };
        return ticket;
    };

};//TICKETSERVICE

module.exports = new TicketService();