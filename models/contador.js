const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContadorSchema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0, min: 0}
});

module.exports = mongoose.models.Contador || mongoose.model('Contador', ContadorSchema);