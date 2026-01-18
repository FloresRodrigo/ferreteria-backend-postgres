const mongoose = require('mongoose');

const { Schema } = mongoose;
const estados = ['ACTIVO', 'INACTIVO'];

const ArticuloSchema = new Schema({
    nombre: { type: String, required: true, minlength: 8, maxlength: 40},
    descripcion: { type: String, required: true, minlength: 10, maxlength: 200},
    imagen: { type: String, required: true },
    precio: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    total_vendido: { type: Number, default: 0 },
    estado: {
        type: String,
        enum: estados,
        default: 'ACTIVO'
    }
}, { timestamps: true });

module.exports = mongoose.models.Articulo || mongoose.model('Articulo', ArticuloSchema);