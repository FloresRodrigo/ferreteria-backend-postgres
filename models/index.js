const Usuario = require('./usuario');
const Articulo = require('./articulo');
const Ticket = require('./ticket');
const DetalleTicket = require('./detalleTicket');

Usuario.hasMany(Ticket, { foreignKey: 'id_cliente' });

Articulo.hasMany(DetalleTicket, { foreignKey: 'id_articulo' });

Ticket.belongsTo(Usuario, { foreignKey: 'id_cliente' });
Ticket.hasMany(DetalleTicket, { foreignKey: 'id_ticket', as: 'detalles_ticket' });

DetalleTicket.belongsTo(Ticket, { foreignKey: 'id_ticket' });
DetalleTicket.belongsTo(Articulo, { foreignKey: 'id_articulo' });

module.exports = { Usuario, Articulo, Ticket, DetalleTicket };