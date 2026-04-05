const pool = require('../database');

class TicketRepository {
    //Crear un ticket
    async create({ id_cliente, fecha_compra, total }) {
        const result = await pool.query(`
            INSERT INTO tickets (id_cliente, fecha_compra, total)
            VALUES ($1, $2, $3)
            RETURNING id;`,
            [id_cliente, fecha_compra, total]);
        return result.rows[0];
    };

    //Recuperar un ticket con sus detalles
    async findByPkDet(id) {
        const result = await pool.query(`
            SELECT t.*, json_agg(dt) AS detalles_ticket FROM tickets t
            JOIN detalle_tickets dt
            ON dt.id_ticket = t.id
            WHERE t.id = $1
            GROUP BY t.id;`,
            [id]);
        return result.rows[0];
    };

    //Recupera un ticket, tiene lock
    async findByPkLock(id, client) {
        const result = await client.query(`
            SELECT estado FROM tickets
            WHERE id = $1
            FOR UPDATE;`,
            [id]);
        return result.rows[0];
    };

    //Pagar un ticket
    async pagar(id, fecha, client) {
        await client.query(`
            UPDATE tickets
            SET estado = 'PAGADO', fecha_compra = $2
            WHERE id = $1;`,
            [id, fecha]);
        return;
    };

    //Recupera un ticket, solo devuelve id_cliente y estado
    async findByPk(id) {
        const result = await pool.query(`
            SELECT id_cliente, estado FROM tickets
            WHERE id = $1`,
            [id]);
        return result.rows[0];
    };

    //Cancela un ticket
    async cancelar(id) {
        const result = await pool.query(`
            UPDATE tickets
            SET estado = 'CANCELADO'
            WHERE id = $1 AND estado = 'PENDIENTE'
            RETURNING *;`,
            [id]);
        return result.rows[0];
    };

    //Recupera los tickets del id proporcionado
    async findAll({ id_cliente }) {
        let condicion = [];
        let valor = [];
        if(id_cliente) {
            condicion.push(`t.id_cliente = $1`);
            valor.push(id_cliente);
        };
        const where = condicion.length > 0 ? `WHERE ${condicion}` : '';
        const query = `
            SELECT t.*, json_agg(dt) AS detalles_ticket FROM tickets t
            JOIN detalle_tickets dt
            ON dt.id_ticket = t.id
            ${where}
            GROUP BY t.id
            ORDER BY t."createdAt" DESC;`
        const result = await pool.query(query, valor);
        return result.rows;
    };

};//TICKETREPOSITORY

module.exports = new TicketRepository();