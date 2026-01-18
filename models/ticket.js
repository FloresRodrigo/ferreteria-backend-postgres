const mongoose = require('mongoose');
const DetalleTicket = require('./detalleTicket');
const Contador = require('./contador');

const { Schema } = mongoose;
const estados = ['PENDIENTE', 'PAGADO', 'CANCELADO'];

const TicketSchema = new Schema({
    nro_ticket: { type: Number, required: true, min: 0 },
    id_cliente: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha_compra: { type: Date },
    total: { type: Number, required: true, min: 0 },
    estado: {
        type: String,
        enum: estados,
        default: 'PENDIENTE'
    },
    detalles_ticket: [{ type: DetalleTicket.Schema }]
}, { timestamps: true });

TicketSchema.pre('validate', function(next) {
    if(this.detalles_ticket && this.detalles_ticket.length > 0) {
        this.total = this.detalles_ticket.reduce((total, detalle) => {
            return total + (detalle.subtotal || 0);
        }, 0);
    } else {
        this.total = 0;
    };
    next();
});

TicketSchema.pre('validate', async function(next) {
    if(this.isNew) {
        try {
            const contador = await Contador.findByIdAndUpdate(
                'ticket',
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.nro_ticket = contador.seq;
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);