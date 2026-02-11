const ticketService = require('../services/ticket.service')
const { success, failed } = require('../helpers/response.helper');
const mercadopagoService = require('../services/mercadopago.service');

const ticketCtrl = {};

//METODO PARA CREAR TICKET
ticketCtrl.createTicket = async (req, res) => {
    try {
        const ticket = await ticketService.createTicket(req.user.id, req.body);
        return success(res, 'Ticket creado exitosamente', ticket);
    } catch (error) {
        console.error('ERROR AL CREAR TICKET: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA CANCELAR EL TICKET (solamente el usuario puede)
ticketCtrl.cancelarTicket = async (req, res) => {
    try {
        const ticket = await ticketService.cancelarTicket(req.params.id, req.user.id);
        return success(res, 'Ticket cancelado exitosamente', ticket);
    } catch (error) {
        console.error('ERROR AL CANCELAR TICKET: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA OBTENER TODOS LOS TICKETS (cliente)
ticketCtrl.getMyTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getMyTickets(req.user.id);
        return success(res, 'Tickets obtenidos', tickets);
    } catch (error) {
        console.error('ERROR AL OBTENER LOS TICKETS: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA OBTENER TODOS LOS TICKETS (admin)
ticketCtrl.getTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getTickets(req.query);
        return success(res, 'Tickets obtenidos', tickets);
    } catch (error) {
        console.error('ERROR AL OBTENER LOS TICKETS: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA OBTENER UN TICKET (cliente)
ticketCtrl.getMyTicket = async (req, res) => {
    try {
        const ticket = await ticketService.getMyTicket(req.user.id, req.params.id);
        return success(res, 'Ticket obtenido', ticket);
    } catch (error) {
        console.error('ERROR AL OBTENER TICKET: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA OBTENER UN TICKET (admin)
ticketCtrl.getTicket = async (req, res) => {
    try {
        const ticket = await ticketService.getTicket(req.params.id);
        return success(res, 'Ticket obtenido', ticket);
    } catch (error) {
        console.error('ERROR AL OBTENER TICKET: ', error);
        return failed(res, error.message);
    }
};

//METODO PARA PAGAR UN TICKET (con mercado pago, es el metodo que usaran los clientes, crea el link para ir al proceso de pago)
ticketCtrl.pagarTicket = async (req, res) => {
    try {
        const ticket = await ticketService.getMyTicket(req.user.id, req.params.id);
        if(ticket.estado !== 'PENDIENTE') {
            return failed(res, `El ticket ya esta ${ticket.estado}`);
        };
        const preference = await mercadopagoService.crearPreference(ticket);
        return success(res, 'Preferencia de pago creada', preference);
    } catch (error) {
        console.error('ERROR AL PAGAR TICKET: ', error);
        return failed(res, error.message);
    };
};

module.exports = ticketCtrl;