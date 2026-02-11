const mercadopagoService = require("../services/mercadopago.service");
const ticketService = require("../services/ticket.service");

const mercadopagoCtrl = {};

//METODO PARA TODO EL PROCESO DEL WEBHOOK (solo lo usa mercado pago al terminar el proceso de pago)
mercadopagoCtrl.pago = async (req, res) => {
    try {
        await mercadopagoService.procesarWebhook(req);
        return res.sendStatus(200);
    } catch (error) {
        console.error('ERROR WEBHOOK MP:', error);
        return res.sendStatus(200);
    }
};

module.exports = mercadopagoCtrl;