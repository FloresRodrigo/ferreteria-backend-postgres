const pool = require('../database');

class StatsService {
    //METODO PARA OBTENER ESTADISTICAS
    async getStats() {
        //Obtener cantidades de usuarios, tickets pagados, y articulos vendidos
        const [usuariosPg, ticketsPg, vendidosPg] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM usuarios'),
            pool.query(`SELECT COUNT(*) FROM tickets WHERE estado = 'PAGADO'`),
            pool.query(`SELECT SUM(dt.cantidad) as total
                        FROM detalle_tickets dt
                        JOIN tickets t ON dt.id_ticket = t.id
                        WHERE t.estado = 'PAGADO';`)
        ]);
        return {
            usuarios: parseInt(usuariosPg.rows[0].count),
            tickets: parseInt(ticketsPg.rows[0].count),
            vendidos: parseInt(vendidosPg.rows[0].total) || 0
        };
    };
};//STATSSERVICE

module.exports = new StatsService();