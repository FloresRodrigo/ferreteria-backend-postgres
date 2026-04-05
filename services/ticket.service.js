const UsuarioRepository = require('../repositories/usuario.repository');
const ArticuloRepository = require('../repositories/articulo.repository');
const TicketRepository = require('../repositories/ticket.repository');
const DetalleTicketRepository = require('../repositories/detalleticket.repository');
const articuloService = require('../services/articulo.service');
const pool = require('../database');
//const mailService = require('./mail.service');

class TicketService {
    //METODO PARA CREAR TICKET
    async createTicket(id, { carrito }) {
        //Verificar ID y usuario
        if(!id) {
            throw new Error('Debe ingresar un ID');
        };
        const usuario = await UsuarioRepository.findByPkNoSens(id);
        if(!usuario) {
            throw new Error('No se encontro un usuario con ese ID ');
        };
        //Verificar carrito
        if(!Array.isArray(carrito) || carrito.length === 0) {
            throw new Error('El carrito esta vacio');
        };
        //Cada item del carrito se agrega a detalles
        const detalles = [];
        let total = 0;
        for(const art of carrito) {
            //El carrito solo tendra id y cantidad para cada item
            if(!art.id || !art.cantidad || art.cantidad < 1) {
                throw new Error('Item del carrito invalido');
            };
            const articulo = await ArticuloRepository.findByPkPub(art.id);
            if(!articulo) {
                throw new Error('No se encontro articulo con el ID: '+art.id);
            };
            if(art.cantidad > articulo.stock) {
                throw new Error('Stock insuficiente de: '+articulo.nombre);
            };
            const subtotal = articulo.precio * art.cantidad;
            total = total + subtotal;
            detalles.push({
                id_articulo: articulo.id,
                nombre_articulo: articulo.nombre,
                precio_unitario: articulo.precio,
                cantidad: art.cantidad,
                subtotal: subtotal
            });
        };
        //Crear ticket con los detalles establecidos
        const ticket = await TicketRepository.create({
            id_cliente: usuario.id,
            fecha_compra: new Date(),
            total: total
        });
        for(const detalle of detalles) {
            await DetalleTicketRepository.create({
                id_ticket: ticket.id,
                ...detalle
            });
        };
        const ticketConDetalles = await TicketRepository.findByPkDet(ticket.id);
        return ticketConDetalles;
    };

    //METODO PARA PAGAR TICKET (no tiene endpoint)
    async pagarTicket(idTicket, maxRetries = 3) {
        //Verificar ID
        if(!idTicket) {
            throw new Error('ID invalido');
        };
        let intentos = 0;
        while(intentos < maxRetries) {
            const client = await pool.connect();
            try {
                //Se inicia una transaccion, si falla algo se revierte todo
                await client.query('BEGIN');
                const ticket = await TicketRepository.findByPkLock(idTicket, client);
                if(!ticket) {
                    throw new Error('No se encontro un ticket con ese ID');
                };
                //Se verifica que su estado sea pendiente
                if(ticket.estado !== 'PENDIENTE') {
                    throw new Error('El ticket ya fue pagado o esta cancelado');
                };
                const detalles = await DetalleTicketRepository.findByTicketIdLock(idTicket, client);
                //Se verifica que el ticket tenga detalles
                if(!detalles || detalles.length === 0) {
                    throw new Error('El ticket no tiene detalles');
                };
                for(const detalle of detalles) {
                    await articuloService.actualizarStockYtotal(detalle.id_articulo, detalle.cantidad, client);
                };
                await TicketRepository.pagar(idTicket, new Date(), client);
                //Si todo salio bien se hace commit a la transaccion
                await client.query('COMMIT');
                //Buscamos al usuario para poder mandar un correo
                /*
                try {
                    const usuario = await Usuario.findById(ticket.id_cliente);
                    await mailService.sendSuccessfulPayment(usuario, ticket);
                } catch (error) {
                    console.error('ERROR AL ENVIAR EMAIL: ', error);
                };
                */
                const ticketAct = await TicketRepository.findByPkDet(idTicket);
                return ticketAct;
            } catch (error) {
                //Se cancela la sesion si falla algo
                await client.query('ROLLBACK');
                //Reintentar la operacion si fallo por concurrencia con otro pago
                if(error.message.includes('deadlock') || error.message.includes('could not serialize')) {
                    intentos++;
                    continue;
                };
                throw error;
            } finally {
                client.release();
            };
        };
        throw new Error('No se pudo completar el pago. Intente nuevamente');
    };

    //METODO PARA CANCELAR TICKET
    async cancelarTicket(idTicket, idUsuario) {
        //Se valida el ticket
        if(!idTicket) {
            throw new Error('ID de ticket invalido');
        };
        const ticket = await TicketRepository.findByPk(idTicket);
        if(!ticket) {
            throw new Error('Ticket no encontrado');
        };
        //Se valida que quien lo solicita esta relacionado al ticket
        if(Number(ticket.id_cliente) !== Number(idUsuario)) { 
            throw new Error('No esta autorizado');
        };
        if(ticket.estado !== 'PENDIENTE') {
            throw new Error('Solo se puede cancelar un ticket pendiente');
        };
        const ticketAct = await TicketRepository.cancelar(idTicket);
        if(!ticketAct) {
            throw new Error('El ticket ya no se puede cancelar');
        };
        return ticketAct;
    };

    //METODO PARA OBTENER TODOS LOS TICKETS (cliente)
    async getMyTickets(id) {
        //Se valida que llego un ID de usuario
        if(!id) {
            throw new Error('Usuario invalido');
        };
        //Recupera un ticket sin los campos de cuando se creo ni actualizo
        const tickets = await TicketRepository.findAll({ id_cliente: id });
        return tickets;
    };

    //METODO PARA OBTENER TODOS LOS TICKETS (admin)
    async getTickets({ id }) {
        //Filtro para buscar por ID de usuario
        const filtro = {};
        if(id) {
            filtro.id_cliente = id;
        };
        const tickets = await TicketRepository.findAll(filtro);
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
        const ticket = await TicketRepository.findByPkDet(idTicket);
        if(!ticket) {
            throw new Error('Ticket no encontrado');
        };
        //Se valida que quien solicita el ticket sea el cliente que lo creo
        if(Number(idUsuario) !== Number(ticket.id_cliente)) {
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
        const ticket = await TicketRepository.findByPkDet(id);
        if(!ticket) {
            throw new Error('No se encontro el ticket');
        };
        return ticket;
    };

};//TICKETSERVICE

module.exports = new TicketService();