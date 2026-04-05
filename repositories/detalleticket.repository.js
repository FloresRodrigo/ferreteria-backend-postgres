const pool = require('../database');

class DetalleTicketRepository {
    //Crear un detalle de ticket
    async create({ id_ticket, id_articulo, nombre_articulo, precio_unitario, cantidad, subtotal }) {
        await pool.query(`
            INSERT INTO detalle_tickets (id_ticket, id_articulo, nombre_articulo, precio_unitario, cantidad, subtotal)
            VALUES ($1, $2, $3, $4, $5, $6);`,
            [id_ticket, id_articulo, nombre_articulo, precio_unitario, cantidad, subtotal]);
        return;
    };

    //Recupera los detalles de un ticket, tiene lock
    async findByTicketIdLock(id, client) {
        const result = await client.query(`
            SELECT * FROM detalle_tickets
            WHERE id_ticket = $1
            FOR UPDATE;`,
            [id]);
        return result.rows;
    };

};//DETALLETICKETREPOSITORY

module.exports = new DetalleTicketRepository();