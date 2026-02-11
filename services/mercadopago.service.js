const client = require('../configs/mercadopago.config');
const { Preference, Payment } = require('mercadopago');
const ticketService = require('./ticket.service');

class MercadoPagoService {
    //METODO PARA CREAR LA PREFERENCIA DE MERCADO PAGO
    async crearPreference(ticket) {
        const preference = new Preference(client);
        //Se crea la preferencia
        const response = await preference.create({
            //Body completo
            body: {
                //Que aparecera en el detalle
                items: [
                    {
                        title: `Ticket #${ticket.nro_ticket}`,
                        quantity: 1,
                        unit_price: Number(ticket.total),
                        currency_id: 'ARS'
                    }
                ],
                //URLs a donde redirigira dependiendo del resultado (ya estan implementadas)
                back_urls: {
                    success: `${ process.env.FRONT_URL }/pago/exitoso`,
                    failure: `${ process.env.FRONT_URL }/pago/fallido`,
                    pending: `${ process.env.FRONT_URL }/pago/pendiente`
                },
                //Si el resultado es success retornara aprobado
                auto_return: 'approved',
                //Se guarda el id del ticket con el que se inicio el proceso
                external_reference: ticket._id.toString(),
                //URL a donde mandara la notificacion
                notification_url: process.env.MP_URL
            }
        });
        //Devuelve el link para iniciar el proceso de pago
        return response.init_point;
    };

    //METODO PARA PROCESAR EL WEBHOOK
    async procesarWebhook(req) {
        //Se ignoran las merchant orders, solo interesan pagos 
        if(req.body?.topic === 'merchant_order' || req.query?.topic === 'merchant_order') {
            return;
        };
        //Guarda el paymentId de todas las formas que este puede llegar
        const paymentId = req.body?.data?.id ||
        (req.body?.topic === 'payment' && req.body?.resource) ||
        (req.query?.topic === 'payment' && req.query?.id) ||
        req.query?.['data.id'];
        if(!paymentId) {
            return;
        };
        const payment = new Payment(client);
        let pago;
        try {
            //Guarda el pago que corresponda con el ID brindado
            pago = await payment.get({ id: paymentId });
        } catch {
            return;
        };
        //Se verifica que llega y que su estado sea aprobado
        if(!pago || pago.status !== 'approved') {
            return;
        };
        //Se recupera el id del ticket
        const ticketId = pago.external_reference;
        if(!ticketId) {
            return;
        };
        //Se busca el ticket con su id y se verifica que este pendiente
        const ticket = await ticketService.getTicket(ticketId);
        if(!ticket || ticket.estado !== 'PENDIENTE'){
            return;
        };
        //Se inicia el proceso de pago, se marca como pagado y se actualizan stocks
        await ticketService.pagarTicket(ticketId);
    };

};//MERCADOPAGOSERVICE

module.exports = new MercadoPagoService();