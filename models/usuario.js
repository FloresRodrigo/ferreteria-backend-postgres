const mongoose = require('mongoose');

const { Schema } = mongoose;
const roles = ['ADMIN', 'CLIENTE'];
const estados = ['ACTIVO', 'INACTIVO'];

const UsuarioSchema = new Schema({
    nombre_completo: { type: String, required: true, minlength: 8, maxlength: 40 },
    username: { type: String, required: true, unique: true, minlength: 4, maxlength: 20},
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    password: { type: String, required: true, minlength: 8, maxlength: 40},
    rol: {
        type: String,
        enum: roles,
        default: 'CLIENTE'
    },
    estado: {
        type: String,
        enum: estados,
        default: 'ACTIVO'
    }
}, { timestamps: true });

module.exports = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);