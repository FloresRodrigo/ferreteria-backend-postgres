require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { mongoose } = require('./database');

const app = express();

app.use(express.json());
app.use(cors({origin: process.env.CORS_ORIGIN}));

app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/usuario', require('./routes/usuario.route'));
app.use('/api/articulo', require('./routes/articulo.route'));
app.use('/api/ticket', require('./routes/ticket.route'));
app.use('/api/mercadopago', require('./routes/mercadopago.route'));
app.use('/api/stats', require('./routes/stats.route'));

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
    console.log('Servidor iniciado en puerto', app.get('port'));
});