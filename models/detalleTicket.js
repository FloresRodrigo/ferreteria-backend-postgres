const mongoose = require('mongoose');

const { Schema } = mongoose;

const DetalleTicketSchema = new Schema({
    id_articulo: { type: Schema.Types.ObjectId, ref: 'Articulo', required:true },
    nombre_articulo: { type: String, required: true, minlength: 5, maxlength: 50 },
    precio_unitario: { type: Number, required: true, min: 0 },
    cantidad: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0}
});

DetalleTicketSchema.pre('validate', function(next) {
    if(this.precio_unitario != null && this.cantidad != null) {
        this.subtotal = this.precio_unitario * this.cantidad;
    };
    next();
});

module.exports = mongoose.models.DetalleTicket || mongoose.model('DetalleTicket', DetalleTicketSchema);